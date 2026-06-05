import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { profiles, eliminatedTeams } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/src/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Fetch profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 3. Check if user is actually in crossroads state
    if (!profile.favorite_team || profile.has_transferred) {
      return NextResponse.json({ error: 'User is not in crossroads state' }, { status: 400 });
    }

    const [eliminatedCheck] = await db
      .select()
      .from(eliminatedTeams)
      .where(eq(eliminatedTeams.team_name, profile.favorite_team))
      .limit(1);

    if (!eliminatedCheck) {
      return NextResponse.json({ error: 'User favorite team is not eliminated' }, { status: 400 });
    }

    // 4. Parse choice parameters
    const { option, newFavoriteTeam } = await req.json();

    if (option === 'A') {
      if (!newFavoriteTeam) {
        return NextResponse.json({ error: 'New favorite team is required for Option A' }, { status: 400 });
      }

      // Check if newFavoriteTeam is already eliminated
      const [newEliminatedCheck] = await db
        .select()
        .from(eliminatedTeams)
        .where(eq(eliminatedTeams.team_name, newFavoriteTeam))
        .limit(1);

      if (newEliminatedCheck) {
        return NextResponse.json({ error: 'The selected team is already eliminated' }, { status: 400 });
      }

      // Update user profile
      await db
        .update(profiles)
        .set({
          favorite_team: newFavoriteTeam,
          has_transferred: true,
          points: profile.points - 30
        })
        .where(eq(profiles.id, user.id));

      return NextResponse.json({ success: true, option: 'A', newFavoriteTeam, pointsAdjusted: -30 });
    } else if (option === 'B') {
      // Update user profile
      await db
        .update(profiles)
        .set({
          has_transferred: true,
          points: profile.points + 30
        })
        .where(eq(profiles.id, user.id));

      return NextResponse.json({ success: true, option: 'B', pointsAdjusted: 30 });
    } else {
      return NextResponse.json({ error: 'Invalid option selected' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Crossroads API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
