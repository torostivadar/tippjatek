import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const key = process.env.API_FOOTBALL_KEY || '';
  return NextResponse.json({
    length: key.length,
    startsWith: key.substring(0, 4),
    endsWith: key.substring(key.length - 4),
    isEmpty: key.length === 0,
    hasQuotes: key.startsWith('"') && key.endsWith('"'),
  });
}
