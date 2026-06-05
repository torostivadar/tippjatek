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

    // 2. Check if we have active/running matches in our database.
    // A match is active if:
    // - Its status is not FINISHED
    // - AND (it is currently LIVE OR it started in the last 12 hours)
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const activeMatches = await db
      .select()
      .from(matches)
      .where(
        and(
          not(eq(matches.status, 'FINISHED')),
          or(
            eq(matches.status, 'LIVE'),
            and(
              lte(matches.start_time, now),
              gte(matches.start_time, twelveHoursAgo)
            )
          )
        )
      );

    console.log(`Cron check: found ${activeMatches.length} active/recent matches in the database.`);

    // 3. Limit-saving optimization:
    // If there are no active matches in progress or recently started, exit immediately without calling the external API.
    if (activeMatches.length === 0) {
      console.log('No active matches. Skipping external API call to save daily quota.');
      return NextResponse.json({ 
        success: true, 
        message: 'No active matches. API-Football sync skipped to save quota.' 
      });
    }

    // 4. Run the API-Football sync and scoring logic
    console.log(`Active matches found: [${activeMatches.map(m => `${m.team_a}-${m.team_b} (${m.id})`).join(', ')}]. Syncing with API-Football...`);
    const result = await syncMatchesAndScore();

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
