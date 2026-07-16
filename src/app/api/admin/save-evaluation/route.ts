import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { profiles } from '@/src/db/schema';
import { supabase } from '@/src/lib/supabase';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
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

    // Verify it is the administrator's email
    if (user.email !== 'tools.claudius@gmail.com') {
      return NextResponse.json({ error: 'Forbidden: only admin can save evaluations' }, { status: 403 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { userId, evaluation, published } = body;

    if (!userId || typeof evaluation !== 'string' || typeof published !== 'boolean') {
      return NextResponse.json({ error: 'Bad Request: missing required fields' }, { status: 400 });
    }

    // 3. Update profile in database
    await db.update(profiles)
      .set({ 
        evaluation, 
        evaluation_published: published 
      })
      .where(eq(profiles.id, userId));

    console.log(`Saved evaluation for user ${userId}. Published: ${published}`);

    return NextResponse.json({
      success: true,
      userId,
      evaluation,
      published
    });

  } catch (err: any) {
    console.error('API save-evaluation error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
