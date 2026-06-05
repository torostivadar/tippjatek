import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/lib/supabase';
import { scoreMatch } from '@/src/lib/scoring';

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

    // 3. Perform scoring using the shared service
    await scoreMatch(
      matchId,
      scoreA !== null ? Number(scoreA) : null,
      scoreB !== null ? Number(scoreB) : null,
      status
    );

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Admin score-match error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
