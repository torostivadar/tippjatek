import { db } from '@/src/db';
import { matches, predictions, profiles, eliminatedTeams } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function scoreMatch(
  matchId: string,
  scoreA: number | null,
  scoreB: number | null,
  status: 'NOT_STARTED' | 'LIVE' | 'FINISHED',
  loserTeamName?: string
) {
  console.log(`Scoring match ${matchId}: score=${scoreA}:${scoreB}, status=${status}, loser=${loserTeamName}`);

  // 1. Update the match in the database
  await db
    .update(matches)
    .set({
      score_a: scoreA !== null ? Number(scoreA) : null,
      score_b: scoreB !== null ? Number(scoreB) : null,
      status: status,
    })
    .where(eq(matches.id, matchId));

  // 2. If finished, run scoring calculations
  if (status === 'FINISHED' && scoreA !== null && scoreB !== null) {
    const actA = Number(scoreA);
    const actB = Number(scoreB);

    // Fetch the match record to get the group
    const [matchRecord] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

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
        }
      }
    }

    // Fetch all predictions for this match
    const matchPredictions = await db
      .select()
      .from(predictions)
      .where(eq(predictions.match_id, matchId));

    for (const pred of matchPredictions) {
      // Fetch prediction owner's profile to check their favorite team
      const [profile] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, pred.user_id))
        .limit(1);

      if (!profile) continue;

      const pA = pred.predicted_a;
      const pB = pred.predicted_b;
      const exact = actA === pA && actB === pB;
      const outcome = (actA > actB && pA > pB) || (actA < actB && pA < pB) || (actA === actB && pA === pB);
      const banker = pred.is_tuti;

      const isFavTeamPlaying = matchRecord && profile.favorite_team && 
        (matchRecord.team_a === profile.favorite_team || matchRecord.team_b === profile.favorite_team);

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
    }

    // 3. Recalculate profiles' total points, correct scores, and correct outcomes
    const allProfiles = await db.select().from(profiles);
    
    for (const prof of allProfiles) {
      const userPredictions = await db
        .select()
        .from(predictions)
        .where(eq(predictions.user_id, prof.id));

      let totalPoints = 0;
      let teli = 0;
      let kim = 0;

      for (const p of userPredictions) {
        if (p.points_earned !== null) {
          totalPoints += p.points_earned;
          
          const [m] = await db.select().from(matches).where(eq(matches.id, p.match_id)).limit(1);
          if (m && m.score_a !== null && m.score_b !== null) {
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
      const finalMatchId = '104';
      const [finalMatch] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, finalMatchId))
        .limit(1);

      if (finalMatch && finalMatch.status === 'FINISHED' && finalMatch.score_a !== null && finalMatch.score_b !== null) {
        const champion = finalMatch.score_a > finalMatch.score_b ? finalMatch.team_a : finalMatch.team_b;
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
    }
  }
}
