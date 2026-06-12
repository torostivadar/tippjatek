import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { matches } from '@/src/db/schema';
import { and, eq, not, inArray } from 'drizzle-orm';
import { syncMatchesAndScore } from '@/src/lib/matchService';

export async function GET(req: NextRequest) {
  try {
    // 1. Log request source.
    const authHeader = req.headers.get('Authorization') || '';
    const cronSecret = process.env.CRON_SECRET || '';
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    console.log(`Cron route triggered (Source: ${isCron ? 'Vercel Cron' : 'On-Demand Public Client'}).`);

    // 2. Fetch all unfinished matches from our database.
    const unfinishedMatches = await db
      .select()
      .from(matches)
      .where(not(eq(matches.status, 'FINISHED')));

    const now = new Date();
    
    // Filter matches that meet the strict target window (célfotó) criteria
    const matchesToSync = unfinishedMatches.filter(match => {
      const startMs = new Date(match.start_time).getTime();
      const minutesSinceStart = (now.getTime() - startMs) / (60 * 1000);

      // Rule 1: Must be at least 120 minutes since kickoff (regular play + halftime + cooling breaks + extra time buffer)
      if (minutesSinceStart < 120) {
        return false;
      }

      // Rule 2: If status in DB is LIVE (extra time / penalties started), wait until 160 minutes since kickoff
      if (match.status === 'LIVE' && minutesSinceStart < 160) {
        return false;
      }

      // Rule 3: 1-minute throttle lock (prevents concurrent clicks from spawning multiple API calls)
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      if (match.last_sync_attempt && new Date(match.last_sync_attempt) > oneMinuteAgo) {
        console.log(`[Sync Gatekeeper] Match #${match.id} (${match.team_a}-${match.team_b}) was recently sync-attempted (less than 1 minute ago). Throttling.`);
        return false;
      }

      return true;
    });

    console.log(`Cron check: found ${matchesToSync.length} matches in the active target sync window.`);

    // 3. Limit-saving optimization:
    // If there are no matches in their target sync window, exit immediately without calling the external API.
    if (matchesToSync.length === 0) {
      console.log('No matches in target sync window. Skipping external API call.');
      return NextResponse.json({ 
        success: true, 
        message: 'No matches in target sync window. API-Football sync skipped to save quota.' 
      });
    }

    // 4. Update the throttle lock timestamp for target matches before calling the external API
    const matchIds = matchesToSync.map(m => m.id);
    await db
      .update(matches)
      .set({ last_sync_attempt: now })
      .where(inArray(matches.id, matchIds));

    // 5. Run the API-Football sync for the target matches only
    console.log(`Matches to sync: [${matchesToSync.map(m => `${m.team_a}-${m.team_b} (${m.id})`).join(', ')}]. Syncing with API-Football...`);
    const result = await syncMatchesAndScore(matchIds);

    return NextResponse.json({ 
      success: true, 
      message: 'Sync completed successfully.', 
      result 
    });

  } catch (err: any) {
    console.error('Cron job error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
