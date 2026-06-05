import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { matches } from '@/src/db/schema';
import { sql } from 'drizzle-orm';
import { generateMatchAIData } from '@/src/lib/geminiService';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin endpoint to manually trigger AI data regeneration for a single match.
 * POST /api/admin/update-ai
 * Body: { matchId: string }
 * Auth: Bearer token (Supabase JWT)
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user || user.email !== 'tools.claudius@gmail.com') {
      return NextResponse.json({ error: 'Forbidden – admin only' }, { status: 403 });
    }

    // 2. Get matchId from body
    const body = await req.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    // 3. Fetch the match
    const [match] = await db
      .select()
      .from(matches)
      .where(sql`${matches.id} = ${matchId}`)
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // 4. Check for TBD teams
    const isTBD =
      match.team_a.includes('/') ||
      match.team_a.includes('helyezettje') ||
      match.team_a.startsWith('W-') ||
      match.team_a.startsWith('L-');

    if (isTBD) {
      return NextResponse.json(
        { error: 'Cannot generate AI data for matches with TBD teams' },
        { status: 400 }
      );
    }

    // 5. Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    // 6. Generate AI data
    console.log(`Admin AI refresh for match #${matchId}: ${match.team_a} vs ${match.team_b}`);
    const aiData = await generateMatchAIData(match.team_a, match.team_b);

    // 7. Save to database
    await db
      .update(matches)
      .set({
        ai_data: aiData as any,
        last_ai_updated: new Date(),
      })
      .where(sql`${matches.id} = ${matchId}`);

    console.log(`✓ Admin AI data saved for match #${matchId}`);

    return NextResponse.json({
      success: true,
      message: `AI data regenerated for match #${matchId}`,
      ai_data: aiData,
    });

  } catch (err: any) {
    console.error('Admin AI update error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
