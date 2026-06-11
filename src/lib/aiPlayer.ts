import { db } from '@/src/db';
import { predictions } from '@/src/db/schema';
import { eq, and } from 'drizzle-orm';
import type { MatchStats } from '@/src/types';

// Static UUID for our AI player (Claudius)
export const AI_USER_ID = 'c1a0d105-a1a1-4321-b2b2-c1a0d105c1a0';

/**
 * Calculates a realistic predicted score based on attack/defense stats,
 * team temperature, and win/draw/loss probabilities.
 */
export function calculateScoreFromStats(stats: MatchStats): { scoreA: number, scoreB: number } {
  const { winA, draw, winB, attackA, defenseA, attackB, defenseB } = stats.prediction;
  const tempA = stats.teamA.temp;
  const tempB = stats.teamB.temp;

  let expA = 1.35 * (attackA / defenseB) * (tempA / 50);
  let expB = 1.35 * (attackB / defenseA) * (tempB / 50);

  const maxProb = Math.max(winA, draw, winB);
  
  let scoreA = 0;
  let scoreB = 0;

  if (maxProb === draw) {
    const base = Math.round((expA + expB) / 2);
    const goals = Math.min(Math.max(base, 0), 3);
    scoreA = goals;
    scoreB = goals;
  } else if (maxProb === winA) {
    scoreA = Math.round(expA);
    scoreB = Math.round(expB);
    if (scoreA <= scoreB) {
      scoreA = scoreB + 1;
    }
    scoreA = Math.min(Math.max(scoreA, 1), 5);
    scoreB = Math.min(Math.max(scoreB, 0), 4);
  } else {
    scoreA = Math.round(expA);
    scoreB = Math.round(expB);
    if (scoreB <= scoreA) {
      scoreB = scoreA + 1;
    }
    scoreB = Math.min(Math.max(scoreB, 1), 5);
    scoreA = Math.min(Math.max(scoreA, 0), 4);
  }

  return { scoreA, scoreB };
}

/**
 * Inserts or updates the AI player's prediction in the database for the given match.
 */
export async function updateAiPlayerPrediction(matchId: string, aiData: MatchStats) {
  try {
    const { scoreA, scoreB } = calculateScoreFromStats(aiData);

    // Check if prediction already exists for this match and AI user
    const existing = await db
      .select()
      .from(predictions)
      .where(
        and(
          eq(predictions.match_id, matchId),
          eq(predictions.user_id, AI_USER_ID)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(predictions)
        .set({
          predicted_a: scoreA,
          predicted_b: scoreB,
          updated_at: new Date()
        })
        .where(eq(predictions.id, existing[0].id));
      console.log(`[AI Player] Updated prediction for match #${matchId}: ${scoreA} - ${scoreB}`);
    } else {
      await db
        .insert(predictions)
        .values({
          match_id: matchId,
          user_id: AI_USER_ID,
          predicted_a: scoreA,
          predicted_b: scoreB,
        });
      console.log(`[AI Player] Created prediction for match #${matchId}: ${scoreA} - ${scoreB}`);
    }
  } catch (err: any) {
    console.error(`[AI Player] Error updating prediction for match #${matchId}:`, err.message || err);
  }
}
