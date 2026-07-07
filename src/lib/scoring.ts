import { db } from '@/src/db';
import { matches, predictions, profiles, eliminatedTeams } from '@/src/db/schema';
import { eq, or } from 'drizzle-orm';

export async function scoreMatch(
  matchId: string,
  scoreA: number | null,
  scoreB: number | null,
  status: 'NOT_STARTED' | 'LIVE' | 'FINISHED',
  loserTeamName?: string
) {
  console.log(`Scoring match ${matchId}: score=${scoreA}:${scoreB}, status=${status}, loser=${loserTeamName}`);

  const finalScoreA = status === 'NOT_STARTED' ? null : (scoreA !== null ? Number(scoreA) : null);
  const finalScoreB = status === 'NOT_STARTED' ? null : (scoreB !== null ? Number(scoreB) : null);

  // 1. Update the match in the database
  await db
    .update(matches)
    .set({
      score_a: finalScoreA,
      score_b: finalScoreB,
      status: status,
    })
    .where(eq(matches.id, matchId));

  // 2. Fetch the match record
  const [matchRecord] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  // 3. Handle scoring calculations based on status
  if (status === 'FINISHED' && finalScoreA !== null && finalScoreB !== null) {
    const actA = finalScoreA;
    const actB = finalScoreB;

    if (matchRecord) {
      const isKnockout = ['Legjobb 32', 'Nyolcaddöntő', 'Negyeddöntő', 'Elődöntő', 'Bronzmérkőzés', 'Döntő'].includes(matchRecord.group);
      
      // Determine team elimination
      if (isKnockout) {
        let eliminated: string | undefined = loserTeamName;
        
        // If not explicitly provided, try to determine from scores (only if not a draw)
        if (!eliminated && actA !== actB) {
          eliminated = actA < actB ? matchRecord.team_a : matchRecord.team_b;
        }

        if (eliminated) {
          await db
            .insert(eliminatedTeams)
            .values({ team_name: eliminated })
            .onConflictDoNothing();
          console.log(`Knockout loser automatically eliminated: ${eliminated}`);

          // Determine the winner of the knockout match
          const winner = eliminated === matchRecord.team_a ? matchRecord.team_b : matchRecord.team_a;
          
          // Propagate the results to the next round of the tournament tree
          await propagateKnockoutResult(matchId, winner, eliminated);
        }
      }
    }

    // Fetch all predictions for this match
    const matchPredictions = await db
      .select()
      .from(predictions)
      .where(eq(predictions.match_id, matchId));

    // Optimize: Fetch all profiles once to avoid N+1 queries in the loop below
    const allProfiles = await db.select().from(profiles);
    const profileMap = new Map(allProfiles.map(p => [p.id, p]));

    // Fetch all eliminated teams to get their elimination dates
    const allEliminated = await db.select().from(eliminatedTeams);
    const eliminatedMap = new Map(allEliminated.map(e => [e.team_name, e.eliminated_at]));

    const predictionUpdates = matchPredictions.map(async (pred) => {
      const profile = profileMap.get(pred.user_id);
      if (!profile) return;

      const pA = pred.predicted_a;
      const pB = pred.predicted_b;
      const exact = actA === pA && actB === pB;
      const outcome = (actA > actB && pA > pB) || (actA < actB && pA < pB) || (actA === actB && pA === pB);
      const banker = pred.is_tuti;

      // Determine what the user's favorite team was at the time of the match
      let activeFavoriteTeam: string | null = profile.favorite_team;
      
      if (profile.has_transferred && profile.original_favorite_team) {
        const originalTeamEliminatedAt = eliminatedMap.get(profile.original_favorite_team);
        if (originalTeamEliminatedAt && matchRecord) {
          const matchTime = new Date(matchRecord.start_time).getTime();
          const elimTime = new Date(originalTeamEliminatedAt).getTime();
          
          if (matchTime < elimTime) {
            activeFavoriteTeam = profile.original_favorite_team;
          }
        }
      }

      const isFavTeamPlaying = matchRecord && activeFavoriteTeam && 
        (matchRecord.team_a === activeFavoriteTeam || matchRecord.team_b === activeFavoriteTeam);

      let earned = 0;
      if (banker) {
        if (exact) {
          earned = 100;
        } else if (outcome) {
          earned = 20;
        } else {
          earned = -30;
        }
      } else {
        if (exact) {
          earned = 50;
        } else if (outcome) {
          earned = 30;
        } else {
          earned = 0;
        }

        // Double points for Favorite team if not banker (TUTI)
        if (isFavTeamPlaying) {
          earned = earned * 2;
        }
      }

      // Save earned points on the prediction
      await db
        .update(predictions)
        .set({ points_earned: earned })
        .where(eq(predictions.id, pred.id));
    });

    await Promise.all(predictionUpdates);
  } else {
    // If NOT finished (NOT_STARTED or LIVE), reset points_earned on predictions to null
    await db
      .update(predictions)
      .set({ points_earned: null })
      .where(eq(predictions.match_id, matchId));

    // Remove teams from eliminated list if it was a knockout match
    if (matchRecord) {
      const isKnockout = ['Legjobb 32', 'Nyolcaddöntő', 'Negyeddöntő', 'Elődöntő', 'Bronzmérkőzés', 'Döntő'].includes(matchRecord.group);
      if (isKnockout) {
        await db
          .delete(eliminatedTeams)
          .where(
            or(
              eq(eliminatedTeams.team_name, matchRecord.team_a),
              eq(eliminatedTeams.team_name, matchRecord.team_b)
            )
          );
        console.log(`Knockout match reverted: removed ${matchRecord.team_a} and ${matchRecord.team_b} from eliminatedTeams`);

        // Revert the next match in the tournament tree back to placeholders
        await revertKnockoutResult(matchId);
      }
    }
  }

  // 4. Recalculate profiles' total points, correct scores, and correct outcomes
  // Optimize: Fetch all profiles, matches, and predictions in memory to avoid N+1 queries (1000+ DB queries)
  const allProfiles = await db.select().from(profiles);
  const allMatches = await db.select().from(matches);
  const allPredictions = await db.select().from(predictions);
  const allEliminated = await db.select().from(eliminatedTeams);

  const matchMap = new Map(allMatches.map(m => [m.id, m]));
  const eliminatedSet = new Set(allEliminated.map(e => e.team_name));
  const predictionsByUser = new Map<string, typeof allPredictions>();
  for (const p of allPredictions) {
    if (!predictionsByUser.has(p.user_id)) {
      predictionsByUser.set(p.user_id, []);
    }
    predictionsByUser.get(p.user_id)!.push(p);
  }

  const finalMatchId = '104';
  const finalMatch = matchMap.get(finalMatchId);
  
  const profileUpdates = allProfiles.map(async (prof) => {
    const userPredictions = predictionsByUser.get(prof.id) || [];

    let totalPoints = prof.crossroads_bonus || 0;
    let teli = 0;
    let kim = 0;

    for (const p of userPredictions) {
      if (p.points_earned !== null) {
        totalPoints += p.points_earned;
        
        const m = matchMap.get(p.match_id);
        if (m && m.status === 'FINISHED' && m.score_a !== null && m.score_b !== null) {
          const mA = m.score_a;
          const mB = m.score_b;
          if (mA === p.predicted_a && mB === p.predicted_b) {
            teli += 1;
          } else if ((mA > mB && p.predicted_a > p.predicted_b) || (mA < mB && p.predicted_a < p.predicted_b) || (mA === mB && p.predicted_a === p.predicted_b)) {
            kim += 1;
          }
        }
      }
    }

    // Add World Cup Champion prediction bonus (+150 points) if final match is finished
    if (finalMatch && finalMatch.status === 'FINISHED' && finalMatch.score_a !== null && finalMatch.score_b !== null) {
      let champion = finalMatch.score_a > finalMatch.score_b ? finalMatch.team_a : finalMatch.team_b;
      
      // If the final ended in a draw, the champion is the one NOT in eliminated_teams (since the loser is eliminated)
      if (finalMatch.score_a === finalMatch.score_b) {
        if (eliminatedSet.has(finalMatch.team_a)) {
          champion = finalMatch.team_b;
        } else if (eliminatedSet.has(finalMatch.team_b)) {
          champion = finalMatch.team_a;
        }
      }

      if (prof.champion_prediction === champion) {
        totalPoints += 150;
      }
    }

    // Save profile statistics
    await db
      .update(profiles)
      .set({
        points: totalPoints,
        correct_scores: teli,
        correct_outcomes: kim
      })
      .where(eq(profiles.id, prof.id));
  });

  await Promise.all(profileUpdates);
}

// Tournament Knockout Flow mapping
const KNOCKOUT_FLOW = {
  // Round of 32 -> Round of 16
  '73': { nextMatchId: '89', slot: 'team_a' as const },
  '76': { nextMatchId: '89', slot: 'team_b' as const },
  '75': { nextMatchId: '90', slot: 'team_a' as const },
  '78': { nextMatchId: '90', slot: 'team_b' as const },
  '74': { nextMatchId: '91', slot: 'team_a' as const },
  '77': { nextMatchId: '91', slot: 'team_b' as const },
  '79': { nextMatchId: '92', slot: 'team_a' as const },
  '80': { nextMatchId: '92', slot: 'team_b' as const },
  '81': { nextMatchId: '94', slot: 'team_a' as const },
  '82': { nextMatchId: '94', slot: 'team_b' as const },
  '84': { nextMatchId: '93', slot: 'team_a' as const },
  '83': { nextMatchId: '93', slot: 'team_b' as const },
  '85': { nextMatchId: '96', slot: 'team_a' as const },
  '86': { nextMatchId: '95', slot: 'team_b' as const },
  '87': { nextMatchId: '95', slot: 'team_a' as const },
  '88': { nextMatchId: '96', slot: 'team_b' as const },

  // Round of 16 -> Quarter-finals
  '89': { nextMatchId: '97', slot: 'team_a' as const },
  '90': { nextMatchId: '97', slot: 'team_b' as const },
  '91': { nextMatchId: '98', slot: 'team_a' as const },
  '92': { nextMatchId: '98', slot: 'team_b' as const },
  '93': { nextMatchId: '99', slot: 'team_a' as const },
  '94': { nextMatchId: '99', slot: 'team_b' as const },
  '95': { nextMatchId: '100', slot: 'team_a' as const },
  '96': { nextMatchId: '100', slot: 'team_b' as const },

  // Quarter-finals -> Semi-finals
  '97': { nextMatchId: '101', slot: 'team_a' as const },
  '98': { nextMatchId: '101', slot: 'team_b' as const },
  '99': { nextMatchId: '102', slot: 'team_a' as const },
  '100': { nextMatchId: '102', slot: 'team_b' as const },
};

async function propagateKnockoutResult(matchId: string, winner: string, loser: string) {
  console.log(`Propagating knockout result for Match #${matchId}: Winner=${winner}, Loser=${loser}`);

  const flow = KNOCKOUT_FLOW[matchId as keyof typeof KNOCKOUT_FLOW];
  if (flow) {
    await db
      .update(matches)
      .set({ [flow.slot]: winner })
      .where(eq(matches.id, flow.nextMatchId));
    console.log(`Propagated Winner (${winner}) of Match #${matchId} to Match #${flow.nextMatchId} (${flow.slot})`);
  }

  // Semi-finals feed BOTH Final (#104) and 3rd Place (#103)
  if (matchId === '101') {
    await db.update(matches).set({ team_a: winner }).where(eq(matches.id, '104'));
    await db.update(matches).set({ team_a: loser }).where(eq(matches.id, '103'));
    console.log(`Propagated SF Match #101 Winner (${winner}) to Final (#104) and Loser (${loser}) to 3rd Place (#103)`);
  } else if (matchId === '102') {
    await db.update(matches).set({ team_b: winner }).where(eq(matches.id, '104'));
    await db.update(matches).set({ team_b: loser }).where(eq(matches.id, '103'));
    console.log(`Propagated SF Match #102 Winner (${winner}) to Final (#104) and Loser (${loser}) to 3rd Place (#103)`);
  }
}

async function revertKnockoutResult(matchId: string) {
  console.log(`Reverting knockout results for Match #${matchId}`);

  const flow = KNOCKOUT_FLOW[matchId as keyof typeof KNOCKOUT_FLOW];
  if (flow) {
    const placeholder = `W-${matchId}`;
    await db
      .update(matches)
      .set({ [flow.slot]: placeholder })
      .where(eq(matches.id, flow.nextMatchId));
    console.log(`Reverted Match #${flow.nextMatchId} (${flow.slot}) back to placeholder ${placeholder}`);
  }

  if (matchId === '101') {
    await db.update(matches).set({ team_a: 'W-101' }).where(eq(matches.id, '104'));
    await db.update(matches).set({ team_a: 'L-101' }).where(eq(matches.id, '103'));
    console.log(`Reverted Match #104 team_a to W-101 and Match #103 team_a to L-101`);
  } else if (matchId === '102') {
    await db.update(matches).set({ team_b: 'W-102' }).where(eq(matches.id, '104'));
    await db.update(matches).set({ team_b: 'L-102' }).where(eq(matches.id, '103'));
    console.log(`Reverted Match #104 team_b to W-102 and Match #103 team_b to L-102`);
  }
}

