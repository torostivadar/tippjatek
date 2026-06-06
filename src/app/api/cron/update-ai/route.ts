import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { matches, teams as teamsTable } from '@/src/db/schema';
import { and, gte, lte, sql } from 'drizzle-orm';
import { generateMatchAIData } from '@/src/lib/geminiService';

/**
 * Daily Cron Job: /api/cron/update-ai
 * Schedule: 0 9 * * * (09:00 UTC = 11:00 CEST)
 * 
 * Fetches all matches starting in the next 72 hours and generates
 * AI analysis data for each using Gemini with Google Search grounding.
 * Results are cached in the matches.ai_data JSONB column.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verify cron secret (Vercel sends this automatically)
    const authHeader = req.headers.get('Authorization') || '';
    const cronSecret = process.env.CRON_SECRET || '';
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
    console.log(`AI Cron triggered (Source: ${isCron ? 'Vercel Cron' : 'On-Demand'}).`);

    // 2. Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // 3. Find matches starting in the next 72 hours
    const now = new Date();
    const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const upcomingMatches = await db
      .select()
      .from(matches)
      .where(
        and(
          gte(matches.start_time, now),
          lte(matches.start_time, in72h)
        )
      );

    // Filter out TBD matches (placeholder names for knockout stage)
    const validMatches = upcomingMatches.filter(m => {
      const isTBD =
        m.team_a.includes('/') ||
        m.team_a.includes('helyezettje') ||
        m.team_a.startsWith('W-') ||
        m.team_a.startsWith('L-');
      return !isTBD;
    });

    console.log(`Found ${validMatches.length} valid upcoming matches (next 72h) for AI analysis.`);

    if (validMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming matches in the next 72 hours. AI update skipped.',
        updated: 0,
      });
    }

    // 4. Generate AI data for each match
    let updatedCount = 0;
    const errors: string[] = [];

    for (const match of validMatches) {
      try {
        console.log(`Generating AI data for match #${match.id}: ${match.team_a} vs ${match.team_b}...`);
        
        const aiData = await generateMatchAIData(match.team_a, match.team_b);

        // Save to database
        await db
          .update(matches)
          .set({
            ai_data: aiData as any,
            last_ai_updated: new Date(),
          })
          .where(sql`${matches.id} = ${match.id}`);

        console.log(`✓ AI data saved for match #${match.id}`);
        updatedCount++;

        // Small delay between API calls to be respectful
        if (validMatches.indexOf(match) < validMatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (err: any) {
        console.error(`✗ Error generating AI data for match #${match.id}:`, err.message);
        errors.push(`Match #${match.id}: ${err.message}`);
      }
    }

    // 5. Update teams table with new averages and stats
    if (updatedCount > 0) {
      console.log('Recalculating team averages and updating teams table...');
      try {
        const allMatches = await db.select().from(matches);
        
        // Find valid teams in database
        const teamNames = new Set<string>();
        for (const m of allMatches) {
          if (m.team_a && !m.team_a.includes('/') && !m.team_a.startsWith('W-') && !m.team_a.startsWith('L-')) {
            teamNames.add(m.team_a);
          }
          if (m.team_b && !m.team_b.includes('/') && !m.team_b.startsWith('W-') && !m.team_b.startsWith('L-')) {
            teamNames.add(m.team_b);
          }
        }

        const existingTeams = await db.select().from(teamsTable);
        const nameToTeam = new Map(existingTeams.map(t => [t.name, t]));

        for (const teamName of teamNames) {
          const teamObj = nameToTeam.get(teamName);
          if (!teamObj) continue;

          // Compute AI stats
          let tempSum = 0;
          let attackSum = 0;
          let defenseSum = 0;
          let count = 0;
          let firstMatchId = null as number | null;
          let firstMatchAiData = null as any;

          for (const m of allMatches) {
            const aiData = m.ai_data as any;
            if (!aiData) continue;

            const mIdNum = parseInt(m.id, 10);
            
            if (m.team_a === teamName) {
              const temp = aiData.teamA?.temp;
              const attack = aiData.prediction?.attackA;
              const defense = aiData.prediction?.defenseA;
              if (temp !== undefined) tempSum += temp;
              if (attack !== undefined) attackSum += attack;
              if (defense !== undefined) defenseSum += defense;
              count++;

              if (firstMatchId === null || mIdNum < firstMatchId) {
                firstMatchId = mIdNum;
                firstMatchAiData = { role: 'A', data: aiData };
              }
            } else if (m.team_b === teamName) {
              const temp = aiData.teamB?.temp;
              const attack = aiData.prediction?.attackB;
              const defense = aiData.prediction?.defenseB;
              if (temp !== undefined) tempSum += temp;
              if (attack !== undefined) attackSum += attack;
              if (defense !== undefined) defenseSum += defense;
              count++;

              if (firstMatchId === null || mIdNum < firstMatchId) {
                firstMatchId = mIdNum;
                firstMatchAiData = { role: 'B', data: aiData };
              }
            }
          }

          if (count > 0) {
            const temperature = Math.round(tempSum / count);
            const attack_rating = Math.round(attackSum / count);
            const defense_rating = Math.round(defenseSum / count);
            
            let injuries: string[] = [];
            let news: any[] = [];

            if (firstMatchAiData) {
              const { role, data } = firstMatchAiData;
              const teamKey = role === 'A' ? 'teamA' : 'teamB';
              injuries = data[teamKey]?.injuries || [];

              const rawNews = data.news || [];
              news = rawNews.filter((item: any) => {
                if (!item.text) return false;
                const textLower = item.text.toLowerCase();
                return textLower.includes(teamName.toLowerCase()) || 
                       (teamObj.name_en && textLower.includes(teamObj.name_en.toLowerCase()));
              });

              if (news.length === 0 && rawNews.length > 0) {
                news = [rawNews[0]];
              }
            }

            await db.update(teamsTable)
              .set({
                temperature,
                attack_rating,
                defense_rating,
                injuries,
                news,
                updated_at: new Date()
              })
              .where(sql`${teamsTable.id} = ${teamObj.id}`);
          }
        }
        console.log('✅ Team averages updated successfully.');
      } catch (err: any) {
        console.error('Error recalculating team averages:', err.message);
        errors.push(`Team recalculation: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `AI update completed. ${updatedCount}/${validMatches.length} matches updated.`,
      updated: updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (err: any) {
    console.error('AI Cron job error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
