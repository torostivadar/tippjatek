import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { matches } from '@/src/db/schema';
import { and, eq, not, lte, gte, or } from 'drizzle-orm';
import { syncMatchesAndScore } from '@/src/lib/matchService';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate the request (Vercel Cron Header or secret query param)
    const authHeader = req.headers.get('Authorization') || '';
    const cronSecret = process.env.CRON_SECRET || '';
    
    const url = new URL(req.url);
    const querySecret = url.searchParams.get('secret') || '';

    const isCronSecretValid = cronSecret && authHeader === `Bearer ${cronSecret}`;
    const isQuerySecretValid = cronSecret && querySecret === cronSecret;
    const isDev = process.env.NODE_ENV === 'development';

    if (!isCronSecretValid && !isQuerySecretValid && !isDev) {
      console.warn('Unauthorized cron trigger attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

      // Rule 1: Must be at least 105 minutes since kickoff
      if (minutesSinceStart < 105) {
        return false;
      }

      // Rule 2 & 3: If status in DB is LIVE (we already checked at 105 mins and it was in progress/extra time),
      // we must wait until at least 160 minutes since kickoff.
      if (match.status === 'LIVE' && minutesSinceStart < 160) {
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

    // 4. Run the API-Football sync for the target matches only
    console.log(`Matches to sync: [${matchesToSync.map(m => `${m.team_a}-${m.team_b} (${m.id})`).join(', ')}]. Syncing with API-Football...`);
    const result = await syncMatchesAndScore(matchesToSync.map(m => m.id));

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
