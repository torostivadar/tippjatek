import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { matches, predictions, profiles, eliminatedTeams } from '@/src/db/schema';
import { supabase } from '@/src/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate request using Supabase auth header
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 });
    }

    // 2. Fetch all data in memory
    const allProfiles = await db.select().from(profiles);
    const allMatches = await db.select().from(matches);
    const allPredictions = await db.select().from(predictions);
    const allEliminated = await db.select().from(eliminatedTeams);

    // Sort finished matches by start_time
    const finishedMatches = allMatches
      .filter(m => m.status === 'FINISHED' && m.score_a !== null && m.score_b !== null)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const eliminatedMap = new Map(allEliminated.map(e => [e.team_name, e.eliminated_at]));

    // Start accumulators for all players with their crossroads_bonus
    const currentPoints = new Map<string, number>();
    for (const prof of allProfiles) {
      currentPoints.set(prof.id, prof.crossroads_bonus || 0);
    }

    // Step 0: Initial state (start of tournament)
    const historyData: any[] = [];
    const step0: any = {
      matchIndex: 0,
      matchId: '0',
      matchName: 'Kezdet'
    };
    for (const prof of allProfiles) {
      step0[prof.username] = prof.crossroads_bonus || 0;
    }
    historyData.push(step0);

    // Step 1..N: Accumulate points match-by-match
    for (let i = 0; i < finishedMatches.length; i++) {
      const match = finishedMatches[i];
      const actA = match.score_a!;
      const actB = match.score_b!;
      const matchPredictions = allPredictions.filter(p => p.match_id === match.id);

      for (const prof of allProfiles) {
        const pred = matchPredictions.find(p => p.user_id === prof.id);
        if (!pred) continue; // No prediction, no points added

        const pA = pred.predicted_a;
        const pB = pred.predicted_b;
        const exact = actA === pA && actB === pB;
        const outcome = (actA > actB && pA > pB) || (actA < actB && pA < pB) || (actA === actB && pA === pB);
        const banker = pred.is_tuti;

        // Determine active favorite team at match time
        let activeFavoriteTeam: string | null = prof.favorite_team;
        if (prof.has_transferred && prof.original_favorite_team) {
          const elimAt = eliminatedMap.get(prof.original_favorite_team);
          if (elimAt) {
            const matchTime = new Date(match.start_time).getTime();
            const elimTime = new Date(elimAt).getTime();
            if (matchTime < elimTime) {
              activeFavoriteTeam = prof.original_favorite_team;
            }
          }
        }

        const isFavTeamPlaying = activeFavoriteTeam && 
          (match.team_a === activeFavoriteTeam || match.team_b === activeFavoriteTeam);

        let earned = 0;
        if (banker) {
          if (exact) earned = 100;
          else if (outcome) earned = 20;
          else earned = -30;
        } else {
          if (exact) earned = 50;
          else if (outcome) earned = 30;
          else earned = 0;

          if (isFavTeamPlaying) {
            earned = earned * 2;
          }
        }

        const currentVal = currentPoints.get(prof.id) || 0;
        currentPoints.set(prof.id, currentVal + earned);
      }

      // Record this match's points state
      const step: any = {
        matchIndex: i + 1,
        matchId: match.id,
        matchName: `${match.team_a.substring(0, 3).toUpperCase()} - ${match.team_b.substring(0, 3).toUpperCase()}`
      };
      for (const prof of allProfiles) {
        step[prof.username] = currentPoints.get(prof.id) || 0;
      }
      historyData.push(step);
    }

    const playerUsernames = allProfiles
      .filter(p => p.username !== 'akos.zsolt.nagy') // Skip completely inactive tester if needed, or leave it
      .map(p => p.username);

    return NextResponse.json({
      success: true,
      history: historyData,
      players: playerUsernames,
      totalMatchesCount: allMatches.length // Usually 104
    });

  } catch (err: any) {
    console.error('History API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
