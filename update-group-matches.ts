import 'dotenv/config';
import { db } from './src/db';
import { matches } from './src/db/schema';
import { generateMatchAIData } from './src/lib/geminiService';
import { eq, sql, and } from 'drizzle-orm';

async function main() {
  console.log('=== STARTING BATCH AI UPDATE FOR GROUP MATCHES (1-72) ===');
  
  // Get API keys from environment (comma-separated list, or fallback to single key)
  const keysStr = process.env.GEMINI_API_KEYS || '';
  const apiKeys = keysStr ? keysStr.split(',').map(k => k.trim()).filter(Boolean) : [];
  
  // If GEMINI_API_KEYS was empty, try the singular GEMINI_API_KEY
  if (apiKeys.length === 0 && process.env.GEMINI_API_KEY) {
    apiKeys.push(process.env.GEMINI_API_KEY.trim());
  }

  if (apiKeys.length === 0) {
    console.error('🔴 No Gemini API keys found in GEMINI_API_KEY or GEMINI_API_KEYS environment variables!');
    process.exit(1);
  }

  console.log(`Configured with ${apiKeys.length} API key(s) for rotation.`);
  const delayMs = process.env.GEMINI_DELAY_MS ? Number(process.env.GEMINI_DELAY_MS) : 180000; // default to 180s (3 minutes)
  console.log(`Rate-limit delay set to: ${delayMs / 1000} seconds (configured via GEMINI_DELAY_MS).`);

  // Fetch all group matches 1 to 72
  const groupMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        sql`CAST(${matches.id} AS INTEGER) >= 1`,
        sql`CAST(${matches.id} AS INTEGER) <= 72`
      )
    );

  // Sort them numerically by ID
  const sortedMatches = [...groupMatches].sort((a, b) => Number(a.id) - Number(b.id));
  console.log(`Found ${sortedMatches.length} group matches in database.`);

  let processedCount = 0;
  let skippedCount = 0;
  let currentKeyIndex = 0;

  for (const match of sortedMatches) {
    const id = match.id;
    
    // Check if match already has AI data
    if (match.ai_data) {
      console.log(`[Match #${id}] Already has AI data. Skipping.`);
      skippedCount++;
      continue;
    }

    console.log(`\n👉 Processing Match #${id}: ${match.team_a} vs ${match.team_b}`);
    
    // Safety check for TBD placeholders
    const isTBD =
      match.team_a.includes('/') ||
      match.team_a.includes('helyezettje') ||
      match.team_a.startsWith('W-') ||
      match.team_a.startsWith('L-');

    if (isTBD) {
      console.warn(`⚠️ Match #${id} contains TBD placeholder teams. Skipping.`);
      skippedCount++;
      continue;
    }

    let attempts = 0;
    const maxAttempts = apiKeys.length;
    let success = false;

    while (attempts < maxAttempts && !success) {
      const activeKey = apiKeys[currentKeyIndex];
      const maskedKey = activeKey ? `${activeKey.substring(0, 8)}...${activeKey.substring(activeKey.length - 4)}` : 'none';
      console.log(`[Key #${currentKeyIndex + 1}/${apiKeys.length}: ${maskedKey}] Calling Gemini API (with Google Search Grounding)...`);

      try {
        const aiData = await generateMatchAIData(match.team_a, match.team_b, activeKey);
        
        console.log('💾 Saving AI analysis to database...');
        await db
          .update(matches)
          .set({
            ai_data: aiData as any,
            last_ai_updated: new Date(),
          })
          .where(eq(matches.id, id));

        console.log(`✓ Match #${id} successfully updated!`);
        processedCount++;
        success = true;

        // Rate-limiting delay before the next match
        console.log(`Sleeping for ${delayMs / 1000} seconds to be rate-limit friendly...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
      } catch (err: any) {
        console.error(`✗ Error on key #${currentKeyIndex + 1} for Match #${id}:`, err.message || err);
        attempts++;

        const isQuotaError = 
          err.message?.includes('RESOURCE_EXHAUSTED') || 
          err.message?.includes('quota') || 
          err.status === 429;

        if (isQuotaError) {
          if (apiKeys.length > 1) {
            console.warn('⚠️ Quota exhausted or rate limit hit. Rotating to next API key...');
            currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
            console.log('Sleeping for 10 seconds before retrying with next key...');
            await new Promise(resolve => setTimeout(resolve, 10000));
          } else {
            console.error('🔴 Quota exhausted on the only configured API key. Exiting batch run to prevent spinning.');
            process.exit(1);
          }
        } else {
          console.error('Non-quota error encountered. Moving to next match.');
          // Sleep slightly on error to cool down
          await new Promise(resolve => setTimeout(resolve, 10000));
          break; // Break the retry loop and move to next match
        }
      }
    }

    if (attempts >= maxAttempts && !success) {
      console.error('🔴 All configured API keys have been tried and failed. Exiting batch run.');
      process.exit(1);
    }
  }

  console.log(`\n=== BATCH AI UPDATE COMPLETED ===`);
  console.log(`Total processed: ${processedCount}`);
  console.log(`Total skipped: ${skippedCount}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error in batch updater:', err);
  process.exit(1);
});
