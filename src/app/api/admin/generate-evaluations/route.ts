import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { matches, predictions, profiles, eliminatedTeams } from '@/src/db/schema';
import { supabase } from '@/src/lib/supabase';
import { GoogleGenAI } from '@google/genai';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Helper to execute API calls with retries for temporary errors (503, 429, etc.)
async function callGeminiWithRetry(prompt: string, retries = 3, initialDelay = 2000) {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });
    } catch (err: any) {
      const errStr = String(err.message || err);
      const isTemporary =
        errStr.includes('503') ||
        errStr.includes('UNAVAILABLE') ||
        errStr.includes('429') ||
        errStr.includes('high demand') ||
        errStr.includes('overloaded');

      if (isTemporary && i < retries - 1) {
        console.warn(`⚠️ Gemini API rate limit or temp error, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2.5;
        continue;
      }
      throw err;
    }
  }
}

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
      return NextResponse.json({ error: 'Forbidden: only admin can generate evaluations' }, { status: 403 });
    }

    // 2. Fetch all data in memory
    const allProfiles = await db.select().from(profiles);
    const allMatches = await db.select().from(matches);
    const allPredictions = await db.select().from(predictions);
    const allEliminated = await db.select().from(eliminatedTeams);

    // Sort finished matches by start_time
    const finishedMatches = allMatches
      .filter(m => m.status === 'FINISHED' && m.score_a !== null && m.score_b !== null)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const eliminatedMap = new Map(allEliminated.map(e => [e.team_name, e.eliminated_at]));

    console.log(`Starting evaluations generation for ${allProfiles.length} profiles...`);

    const results: Array<{ username: string; evaluation: string }> = [];

    // 3. For each player, calculate stats and call Gemini
    for (const player of allProfiles) {
      // Skip test users or completely empty accounts if any, otherwise evaluate everyone
      if (player.username === 'akos.zsolt.nagy' && player.points === 20) {
        // Skip inactive tester
        continue;
      }

      console.log(`Compiling stats for ${player.username}...`);

      // A. Missed predictions
      const playerPreds = allPredictions.filter(p => p.user_id === player.id);
      const playerPredMatchIds = new Set(playerPreds.map(p => p.match_id));
      
      const missedList = finishedMatches.filter(m => !playerPredMatchIds.has(m.id));
      const missedCount = missedList.length;
      const missedNames = missedList
        .slice(0, 5)
        .map(m => `${m.team_a} - ${m.team_b}`)
        .join(', ') + (missedCount > 5 ? ' és továbbiak' : '');

      // B. Hits, Misses, Tutis
      let exactHits = 0;
      let outcomeHits = 0;
      let wrongPredictions = 0;
      let tutiTotal = 0;
      let tutiExact = 0;
      let tutiOutcome = 0;
      let tutiWrong = 0;

      for (const pred of playerPreds) {
        const match = finishedMatches.find(m => m.id === pred.match_id);
        if (!match) continue;

        const actA = match.score_a!;
        const actB = match.score_b!;
        const pA = pred.predicted_a;
        const pB = pred.predicted_b;

        const exact = actA === pA && actB === pB;
        const outcome = (actA > actB && pA > pB) || (actA < actB && pA < pB) || (actA === actB && pA === pB);

        if (exact) {
          exactHits++;
          if (pred.is_tuti) tutiExact++;
        } else if (outcome) {
          outcomeHits++;
          if (pred.is_tuti) tutiOutcome++;
        } else {
          wrongPredictions++;
          if (pred.is_tuti) tutiWrong++;
        }
        if (pred.is_tuti) tutiTotal++;
      }

      // C. Standing Chronological Simulation (Ranks & Rivals)
      const ranksHistory: number[] = [];
      const adjacencyCounts = new Map<string, number>();

      for (let step = 1; step <= finishedMatches.length; step++) {
        const matchesUpToNow = finishedMatches.slice(0, step);
        const matchIdsUpToNow = new Set(matchesUpToNow.map(m => m.id));

        const playerPoints = allProfiles.map(prof => {
          let points = prof.crossroads_bonus || 0;
          
          const userPreds = allPredictions.filter(p => p.user_id === prof.id && matchIdsUpToNow.has(p.match_id));
          for (const pred of userPreds) {
            const m = matchesUpToNow.find(match => match.id === pred.match_id);
            if (!m) continue;

            const actA = m.score_a!;
            const actB = m.score_b!;
            const pA = pred.predicted_a;
            const pB = pred.predicted_b;

            const exact = actA === pA && actB === pB;
            const outcome = (actA > actB && pA > pB) || (actA < actB && pA < pB) || (actA === actB && pA === pB);
            const banker = pred.is_tuti;

            let activeFavoriteTeam: string | null = prof.favorite_team;
            if (prof.has_transferred && prof.original_favorite_team) {
              const elimAt = eliminatedMap.get(prof.original_favorite_team);
              if (elimAt) {
                const matchTime = new Date(m.start_time).getTime();
                const elimTime = new Date(elimAt).getTime();
                if (matchTime < elimTime) {
                  activeFavoriteTeam = prof.original_favorite_team;
                }
              }
            }

            const isFavTeamPlaying = activeFavoriteTeam && 
              (m.team_a === activeFavoriteTeam || m.team_b === activeFavoriteTeam);

            let earned = 0;
            if (banker) {
              if (exact) earned = 100;
              else if (outcome) earned = 20;
              else earned = -30;
            } else {
              if (exact) earned = 50;
              else if (outcome) earned = 30;
              else earned = 0;

              if (isFavTeamPlaying) {
                earned = earned * 2;
              }
            }

            points += earned;
          }

          return {
            id: prof.id,
            username: prof.username,
            points
          };
        });

        playerPoints.sort((a, b) => b.points - a.points);
        const idx = playerPoints.findIndex(p => p.id === player.id);
        const rank = idx + 1;
        ranksHistory.push(rank);

        // Record adjacencies
        if (idx > 0) {
          const neighborAbove = playerPoints[idx - 1].username;
          adjacencyCounts.set(neighborAbove, (adjacencyCounts.get(neighborAbove) || 0) + 1);
        }
        if (idx < playerPoints.length - 1) {
          const neighborBelow = playerPoints[idx + 1].username;
          adjacencyCounts.set(neighborBelow, (adjacencyCounts.get(neighborBelow) || 0) + 1);
        }
      }

      const bestRank = Math.min(...ranksHistory);
      const worstRank = Math.max(...ranksHistory);

      const sortedRivals = Array.from(adjacencyCounts.entries()).sort((a, b) => b[1] - a[1]);
      const rivalsText = sortedRivals.slice(0, 2).map(([name, count]) => `${name} (${count} meccsen át)`).join(' és ');

      // D. Construct Prompt
      const statsPrompt = `Te vagy Claudius, a tippjáték barátságos, kissé csipkelődő és humoros AI kabalája/arca.
Írj egy egyedi, 10-15 mondatos torna-értékelést a következő játékosról: ${player.username}.

Itt vannak a játékos pontos statisztikái a tornáról:
- Megszerzett összes pont eddig: ${player.points} pont.
- Legjobb helyezés a ranglistán: #${bestRank}.
- Legrosszabb helyezés a ranglistán: #${worstRank}.
- Összes tippje: ${playerPreds.length} leadott tipp a 104 meccsből.
- Kihagyott (nem megtippelt) meccsek száma: ${missedCount} meccs.
${missedCount > 0 ? `A kihagyott meccsek listája: ${missedNames}.` : ''}
- Telitalálatok száma: ${exactHits} meccs.
- Kimenetel-találatok száma: ${outcomeHits} meccs.
- Téves tippek száma: ${wrongPredictions} meccs.
- Tuti tippek száma: ${tutiTotal} tipp, ebből telitalálat: ${tutiExact}, csak kimenetel: ${tutiOutcome}, bukott Tuti (amiért -30 pont járt): ${tutiWrong}.
- Kedvenc csapat a torna elején: ${player.original_favorite_team || 'nincs megadva'}.
- Aktuális kedvenc csapat a torna végén: ${player.favorite_team || 'nincs megadva'}.
${player.has_transferred ? `A Crossroads-nál megváltoztatta a kedvencét ${player.original_favorite_team}-ról ${player.favorite_team}-ra.` : ''}
- Világbajnok tippje a torna előtt: ${player.champion_prediction || 'nincs megadva'}.
- Legfőbb vetélytársak a tabellán (akikkel a legtöbb meccset töltötte közvetlen szomszédként): ${rivalsText || 'nincsenek'}.

SZABÁLYOK A SZÖVEG GENERÁLÁSÁHOZ:
1. KIZÁRÓLAG magyar nyelven írj!
2. SZIGORÚAN egyes szám első személyben beszélj (én, Claudius)!
3. A stílus legyen közvetlen, barátságos, humoros, és nyugodtan csipkelődj vagy élcelődj a játékos hibáin (pl. kihagyott tippek, elbukott Tutik, rossz bajnoktipp, a tabella alján való bukdácsolás), de tartsd meg a tiszteletet és a sportszerűséget!
4. Ne használj "hazai" vagy "vendég" meccs/győzelem kifejezéseket a tippelésre vonatkozóan, mert semleges pályán játszanak (nevezd őket győztesnek, vesztesnek, kimenetelnek, vagy az első/második csapatnak)!
5. Ne említs meg benne semmilyen szoftveres/kódolási részletet (pl. Vercel, API, Drizzle, bug, cache, adatbázis)! Úgy beszélj, mint egy igazi AI tipp-partner.
6. A szöveg hossza szigorúan 10 és 15 mondat között legyen!
7. A szövegnek a következő, szó szerinti bekezdéssel kell zárulnia (a zárójelbe tett részt cseréld le egy egyedi, egyetlen mondatra a játékos stílusáról és teljesítményéről!):
"Köszönöm, hogy velem játszottál. [Egyedi mondat a játékos stílusáról és teljesítményéről!] Nagyon várlak vissza a 2028-as foci EB tippjátékra is. Nagyon hiányoznál a csapatból, a te tippjeid nélkül nem lenne igazi a torna!"

A válaszod KIZÁRÓLAG a legenerált magyar szöveg legyen, ne használj semmilyen bevezető vagy lezáró üdvözlést, markdown keretet (pl. ne legyen benne \`\`\`), csak a tiszta szöveget küldd vissza.`;

      // E. Generate with Gemini
      let evaluationText = '';
      try {
        const response = await callGeminiWithRetry(statsPrompt);
        evaluationText = (response?.text ?? '').trim();
      } catch (geminiErr: any) {
        console.error(`Gemini generation failed for ${player.username}:`, geminiErr);
        evaluationText = `Szia ${player.username}! Sajnálom, de a zárókiértékelésed generálása közben egy hiba lépett fel a rendszerben. Mindenesetre szuperül küzdöttél a tornán! Köszönöm, hogy velem játszottál. Igazi élmény volt veled versenyezni! Nagyon várlak vissza a 2028-as foci EB tippjátékra is. Nagyon hiányoznál a csapatból, a te tippjeid nélkül nem lenne igazi a torna!`;
      }

      // F. Save to Database
      await db.update(profiles)
        .set({ evaluation: evaluationText })
        .where(eq(profiles.id, player.id));

      results.push({ username: player.username, evaluation: evaluationText });

      // Small delay between calls to avoid API congestion
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      evaluations: results
    });

  } catch (err: any) {
    console.error('API generate-evaluations error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
