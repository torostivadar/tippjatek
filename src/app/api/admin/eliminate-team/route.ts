import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { eliminatedTeams } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/src/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const list = await db.select().from(eliminatedTeams);
    return NextResponse.json({ success: true, teams: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate admin
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || user.email !== 'tools.claudius@gmail.com') {
      return NextResponse.json({ error: 'Forbidden: only admin can manage eliminated teams' }, { status: 403 });
    }

    const { teamName, action } = await req.json();
    if (!teamName || !action) {
      return NextResponse.json({ error: 'Missing parameters: teamName and action are required' }, { status: 400 });
    }

    if (action === 'eliminate') {
      await db
        .insert(eliminatedTeams)
        .values({ team_name: teamName })
        .onConflictDoNothing();
      console.log(`Admin eliminated team: ${teamName}`);
    } else if (action === 'restore') {
      await db
        .delete(eliminatedTeams)
        .where(eq(eliminatedTeams.team_name, teamName));
      console.log(`Admin restored eliminated team: ${teamName}`);
    } else {
      return NextResponse.json({ error: 'Invalid action: must be eliminate or restore' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin eliminate-team error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
