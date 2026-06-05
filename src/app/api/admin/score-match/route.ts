import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { matches, predictions, profiles, eliminatedTeams } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import { supabase } from '@/src/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the request using Supabase auth header
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 });
    }

    // Verify it is the administrator's email
    if (user.email !== 'tools.claudius@gmail.com') {
      return NextResponse.json({ error: 'Forbidden: only admin can score matches' }, { status: 403 });
    }

    // 2. Parse request parameters
    const { matchId, scoreA, scoreB, status } = await req.json();

    if (!matchId || status === undefined) {
      return NextResponse.json({ error: 'Missing parameters: matchId and status are required' }, { status: 400 });
    }

    console.log(`Admin update match: ${matchId}, score: ${scoreA}:${scoreB}, status: ${status}`);

    // 3. Update the match in the database
    await db
      .update(matches)
      .set({
        score_a: scoreA !== null ? Number(scoreA) : null,
        score_b: scoreB !== null ? Number(scoreB) : null,
        status: status,
      })
      .where(eq(matches.id, matchId));

    if (status === 'FINISHED' && scoreA !== null && scoreB !== null) {
      const actA = Number(scoreA);
      const actB = Number(scoreB);

      // Check if it's a knockout match, and add the loser to eliminated_teams
      const [matchRecord] = await db
        .select()
        .from(matches)
        .where(eq(matches.id, matchId))
        .limit(1);

      if (matchRecord) {
        const isKnockout = ['Legjobb 32', 'Nyolcaddöntő', 'Negyeddöntő', 'Elődöntő', 'Bronzmérkőzés', 'Döntő'].includes(matchRecord.group);
        if (isKnockout) {
          const loser = actA < actB ? matchRecord.team_a : matchRecord.team_b;
          await db
            .insert(eliminatedTeams)
            .values({ team_name: loser })
            .onConflictDoNothing();
          console.log(`Knockout loser automatically eliminated: ${loser}`);
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

        // Check if favorite team plays in this match
        const [matchRecord] = await db
          .select()
          .from(matches)
          .where(eq(matches.id, matchId))
          .limit(1);

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

      // 5. Recalculate profiles' total points, correct scores, and correct outcomes
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
            
            // Increment statistics based on prediction correctness
            const m = await db.select().from(matches).where(eq(matches.id, p.match_id)).limit(1);
            if (m[0] && m[0].score_a !== null && m[0].score_b !== null) {
              const mA = m[0].score_a;
              const mB = m[0].score_b;
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

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Admin score-match error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
