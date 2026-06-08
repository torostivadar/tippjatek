import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/db/schema';
import { eq, or, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema });

// 48 teams list with ISO code, Hungarian name, and English name in fifa_rankings_men.md
const TEAMS_LIST = [
  { id: 'ARG', name: 'Argentína', name_en: 'Argentina' },
  { id: 'ESP', name: 'Spanyolország', name_en: 'Spain' },
  { id: 'FRA', name: 'Franciaország', name_en: 'France' },
  { id: 'ENG', name: 'Anglia', name_en: 'England' },
  { id: 'POR', name: 'Portugália', name_en: 'Portugal' },
  { id: 'BRA', name: 'Brazília', name_en: 'Brazil' },
  { id: 'MAR', name: 'Marokkó', name_en: 'Morocco' },
  { id: 'NED', name: 'Hollandia', name_en: 'Netherlands' },
  { id: 'BEL', name: 'Belgium', name_en: 'Belgium' },
  { id: 'GER', name: 'Németország', name_en: 'Germany' },
  { id: 'CRO', name: 'Horvátország', name_en: 'Croatia' },
  { id: 'COL', name: 'Kolumbia', name_en: 'Colombia' },
  { id: 'MEX', name: 'Mexikó', name_en: 'Mexico' },
  { id: 'SEN', name: 'Szenegál', name_en: 'Senegal' },
  { id: 'URU', name: 'Uruguay', name_en: 'Uruguay' },
  { id: 'USA', name: 'Egyesült Államok', name_en: 'USA' },
  { id: 'JPN', name: 'Japán', name_en: 'Japan' },
  { id: 'SUI', name: 'Svájc', name_en: 'Switzerland' },
  { id: 'IRN', name: 'Irán', name_en: 'IR Iran' },
  { id: 'DEN', name: 'Dánia', name_en: 'Denmark' }, // Megjegyzés: Dánia kijutott? Ellenőrizzük a seed.ts-t.
  { id: 'TUR', name: 'Törökország', name_en: 'Türkiye' },
  { id: 'AUT', name: 'Ausztria', name_en: 'Austria' },
  { id: 'ECU', name: 'Ecuador', name_en: 'Ecuador' },
  { id: 'KOR', name: 'Koreai Köztársaság', name_en: 'Korea Republic' },
  { id: 'AUS', name: 'Ausztrália', name_en: 'Australia' },
  { id: 'ALG', name: 'Algéria', name_en: 'Algeria' },
  { id: 'EGY', name: 'Egyiptom', name_en: 'Egypt' },
  { id: 'CAN', name: 'Kanada', name_en: 'Canada' },
  { id: 'NOR', name: 'Norvégia', name_en: 'Norway' },
  { id: 'UKR', name: 'Ukrajna', name_en: 'Ukraine' }, // Ukrajna kijutott? Ellenőrizzük a seed.ts-t.
  { id: 'CIV', name: 'Elefántcsontpart', name_en: "Côte d'Ivoire" },
  { id: 'PAN', name: 'Panama', name_en: 'Panama' },
  { id: 'POL', name: 'Lengyelország', name_en: 'Poland' }, // Lengyelország kijutott?
  { id: 'SWE', name: 'Svédország', name_en: 'Sweden' },
  { id: 'CZE', name: 'Csehország', name_en: 'Czechia' },
  { id: 'PAR', name: 'Paraguay', name_en: 'Paraguay' },
  { id: 'SCO', name: 'Skócia', name_en: 'Scotland' },
  { id: 'CMR', name: 'Kamerun', name_en: 'Cameroon' }, // Kamerun kijutott?
  { id: 'COD', name: 'Kongói DK', name_en: 'Congo DR' },
  { id: 'TUN', name: 'Tunézia', name_en: 'Tunisia' },
  { id: 'VEN', name: 'Venezuela', name_en: 'Venezuela' }, // Venezuela kijutott?
  { id: 'UZB', name: 'Üzbegisztán', name_en: 'Uzbekistan' },
  { id: 'CPV', name: 'Zöld-foki Köztársaság', name_en: 'Cabo Verde' },
  { id: 'KSA', name: 'Szaúd-Arábia', name_en: 'Saudi Arabia' },
  { id: 'JOR', name: 'Jordánia', name_en: 'Jordan' },
  { id: 'BIH', name: 'Bosznia-Hercegovina', name_en: 'Bosnia and Herzegovina' },
  { id: 'HAI', name: 'Haiti', name_en: 'Haiti' },
  { id: 'CUW', name: 'Curaçao', name_en: 'Curaçao' },
  { id: 'RSA', name: 'Dél-afrikai Köztársaság', name_en: 'South Africa' },
  { id: 'GHA', name: 'Ghána', name_en: 'Ghana' },
  { id: 'QAT', name: 'Katar', name_en: 'Qatar' },
  { id: 'IRQ', name: 'Irak', name_en: 'Iraq' },
  { id: 'NZL', name: 'Új-Zéland', name_en: 'New Zealand' }
];

// Let's filter TEAMS_LIST to match exactly the 48 teams in crests-map.json
const CRESTS_MAP = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/lib/crests-map.json'), 'utf8'));
const VALID_HUNGARIAN_NAMES = new Set(Object.keys(CRESTS_MAP));

// Normalize team names for H2H parser
const NORMALIZE_TEAM_NAME: Record<string, string> = {
  'USA': 'Egyesült Államok',
  'Dél-Afrika': 'Dél-afrikai Köztársaság',
  'Dél-Korea': 'Koreai Köztársaság',
  'Curacao': 'Curaçao',
  'Zöld-foki szigetek': 'Zöld-foki Köztársaság',
  'Zöld-foki Köztársaság': 'Zöld-foki Köztársaság',
  'Dél-afrikai Köztársaság': 'Dél-afrikai Köztársaság',
  'Koreai Köztársaság': 'Koreai Köztársaság',
  'Curaçao': 'Curaçao'
};

function normalizeName(name: string): string {
  const trimmed = name.trim();
  return NORMALIZE_TEAM_NAME[trimmed] || trimmed;
}

async function main() {
  console.log('Starting data import script...');

  // Parse official squads from jatekosok.md
  console.log('Parsing jatekosok.md...');
  const squadsPath = path.join(process.cwd(), '../assets/jatekosok.md');
  const squadsContent = fs.readFileSync(squadsPath, 'utf8');
  const squadLines = squadsContent.split('\n');

  const squadsMap: Record<string, {
    manager: string | null;
    goalkeepers: string[];
    defenders: string[];
    midfielders: string[];
    forwards: string[];
  }> = {};

  const NORMALIZE_UPPERCASE_TEAM_NAME: Record<string, string> = {
    'MEXIKÓ': 'Mexikó',
    'DÉL-AFRIKA': 'Dél-afrikai Köztársaság',
    'DÉL-KOREA': 'Koreai Köztársaság',
    'CSEHORSZÁG': 'Csehország',
    'KANADA': 'Kanada',
    'BOSZNIA-HERCEGOVINA': 'Bosznia-Hercegovina',
    'KATAR': 'Katar',
    'SVÁJC': 'Svájc',
    'BRAZÍLIA': 'Brazília',
    'MAROKKÓ': 'Marokkó',
    'HAITI': 'Haiti',
    'SKÓCIA': 'Skócia',
    'EGYESÜLT ÁLLAMOK': 'Egyesült Államok',
    'PARAGUAY': 'Paraguay',
    'AUSZTRÁLIA': 'Ausztrália',
    'TÖRÖKORSZÁG': 'Törökország',
    'NÉMETORSZÁG': 'Németország',
    'CURAÇAO': 'Curaçao',
    'ELEFÁNTCSONTPART': 'Elefántcsontpart',
    'ECUADOR': 'Ecuador',
    'HOLLANDIA': 'Hollandia',
    'JAPÁN': 'Japán',
    'SVÉDORSZÁG': 'Svédország',
    'TUNÉZIA': 'Tunézia',
    'BELGIUM': 'Belgium',
    'EGYIPTOM': 'Egyiptom',
    'IRÁN': 'Irán',
    'ÚJ-ZÉLAND': 'Új-Zéland',
    'SPANYOLORSZÁG': 'Spanyolország',
    'ZÖLD-FOKI-SZIGETEK': 'Zöld-foki Köztársaság',
    'SZAÚD-ARÁBIA': 'Szaúd-Arábia',
    'URUGUAY': 'Uruguay',
    'FRANCIAORSZÁG': 'Franciaország',
    'SZENEGÁL': 'Szenegál',
    'IRAK': 'Irak',
    'NORVÉGIA': 'Norvégia',
    'ARGENTÍNA': 'Argentína',
    'ALGÉRIA': 'Algéria',
    'AUSZTRIA': 'Ausztria',
    'JORDÁNIA': 'Jordánia',
    'PORTUGÁLIA': 'Portugália',
    'KONGÓI DK': 'Kongói DK',
    'ÜZBEGISZTÁN': 'Üzbegisztán',
    'KOLUMBIA': 'Kolumbia',
    'OLASZORSZÁG': 'Olaszország',
    'HORVÁTORSZÁG': 'Horvátország',
    'ANGLIA': 'Anglia',
    'GHÁNA': 'Ghána',
    'PANAMA': 'Panama'
  };

  let currentTeam: string | null = null;
  let currentPos: 'goalkeepers' | 'defenders' | 'midfielders' | 'forwards' | null = null;

  for (const line of squadLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('###')) {
      let rawName = trimmed.replace('###', '').trim();
      rawName = rawName.split('(')[0].trim().toUpperCase();
      const dbName = NORMALIZE_UPPERCASE_TEAM_NAME[rawName];
      if (dbName) {
        currentTeam = dbName;
        squadsMap[currentTeam] = {
          manager: null,
          goalkeepers: [],
          defenders: [],
          midfielders: [],
          forwards: []
        };
        currentPos = null;
      } else {
        currentTeam = null;
        currentPos = null;
      }
    } else if (currentTeam) {
      const sq = squadsMap[currentTeam];
      if (trimmed.startsWith('- **Szövetségi kapitány:**')) {
        sq.manager = trimmed.replace('- **Szövetségi kapitány:**', '').trim();
      } else if (trimmed.startsWith('- **Kapusok:**')) {
        currentPos = 'goalkeepers';
      } else if (trimmed.startsWith('- **Védők:**')) {
        currentPos = 'defenders';
      } else if (trimmed.startsWith('- **Középpályások:**')) {
        currentPos = 'midfielders';
      } else if (trimmed.startsWith('- **Támadók:**')) {
        currentPos = 'forwards';
      } else if (trimmed.startsWith('-') && currentPos) {
        const pName = trimmed.replace(/^[-\s*]+/, '').trim();
        if (pName) {
          sq[currentPos].push(pName);
        }
      }
    }
  }
  console.log(`Parsed ${Object.keys(squadsMap).length} team squads.`);

  // 1. Load matches from database to dynamically map groups
  console.log('Fetching matches from DB...');
  const dbMatches = await db.select().from(schema.matches);
  console.log(`Fetched ${dbMatches.length} matches.`);

  // Determine group letters from group stage matches
  const teamToGroup: Record<string, string> = {};
  for (const match of dbMatches) {
    // Group stage matches have single-character groups like 'A', 'B', etc.
    if (match.group && match.group.length === 1) {
      teamToGroup[match.team_a] = match.group;
      teamToGroup[match.team_b] = match.group;
    }
  }

  // 2. Parse fifa_rankings_men.md
  console.log('Parsing fifa_rankings_men.md...');
  const rankingsPath = path.join(process.cwd(), '../assets/fifa_rankings_men.md');
  const rankingsContent = fs.readFileSync(rankingsPath, 'utf8');
  const rankingLines = rankingsContent.split('\n');

  interface FifaData {
    ranking: number;
    points: string;
    form: string[];
  }
  const fifaDataMap: Record<string, FifaData> = {};

  for (const line of rankingLines) {
    if (!line.includes('|')) continue;
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 5) continue;
    
    // Format: | Helyezés | Csapat | Utóbbi Eredmények | Pontszám |
    // Sample: | 10. (—) | Germany | ✔ ✔ ✔ ✔ ✔ | 1735.77 |
    const rankText = parts[1]; // "10. (—)"
    const englishName = parts[2]; // "Germany"
    const formSymbols = parts[3]; // "✔ ✔ ✔ ✔ ✔"
    const pointsText = parts[4]; // "1735.77"

    if (rankText.startsWith('Helyezés') || rankText.startsWith(':---')) continue;

    const rankMatch = rankText.match(/^(\d+)\./);
    if (!rankMatch) continue;
    const ranking = parseInt(rankMatch[1], 10);

    // Convert symbols: ✔ -> W, X -> D, - -> L
    const form = formSymbols
      .split(/\s+/)
      .filter(s => s)
      .map(s => {
        if (s === '✔') return 'W';
        if (s === 'X') return 'D';
        if (s === '-') return 'L';
        return s;
      });

    fifaDataMap[englishName] = {
      ranking,
      points: pointsText,
      form
    };
  }
  console.log(`Parsed ${Object.keys(fifaDataMap).length} FIFA rankings.`);

  // 3. Compute AI averages from existing ai_data
  console.log('Computing AI averages from matches.ai_data...');
  const teamAiStats: Record<string, {
    tempSum: number;
    attackSum: number;
    defenseSum: number;
    count: number;
    firstMatchId: number | null;
    firstMatchAiData: any | null;
  }> = {};

  // Initialize stats for valid teams
  for (const name of VALID_HUNGARIAN_NAMES) {
    teamAiStats[name] = {
      tempSum: 0,
      attackSum: 0,
      defenseSum: 0,
      count: 0,
      firstMatchId: null,
      firstMatchAiData: null
    };
  }

  for (const match of dbMatches) {
    const aiData: any = match.ai_data;
    if (!aiData) continue;

    const matchIdNum = parseInt(match.id, 10);

    // Team A
    if (teamAiStats[match.team_a]) {
      const stats = teamAiStats[match.team_a];
      const temp = aiData.teamA?.temp;
      const attack = aiData.prediction?.attackA;
      const defense = aiData.prediction?.defenseA;

      if (temp !== undefined) stats.tempSum += temp;
      if (attack !== undefined) stats.attackSum += attack;
      if (defense !== undefined) stats.defenseSum += defense;
      stats.count++;

      // Track first match to extract news & injuries
      if (stats.firstMatchId === null || matchIdNum < stats.firstMatchId) {
        stats.firstMatchId = matchIdNum;
        stats.firstMatchAiData = {
          role: 'A',
          data: aiData
        };
      }
    }

    // Team B
    if (teamAiStats[match.team_b]) {
      const stats = teamAiStats[match.team_b];
      const temp = aiData.teamB?.temp;
      const attack = aiData.prediction?.attackB;
      const defense = aiData.prediction?.defenseB;

      if (temp !== undefined) stats.tempSum += temp;
      if (attack !== undefined) stats.attackSum += attack;
      if (defense !== undefined) stats.defenseSum += defense;
      stats.count++;

      // Track first match to extract news & injuries
      if (stats.firstMatchId === null || matchIdNum < stats.firstMatchId) {
        stats.firstMatchId = matchIdNum;
        stats.firstMatchAiData = {
          role: 'B',
          data: aiData
        };
      }
    }
  }

  // 4. Save/Upsert Teams
  console.log('Saving teams to database...');
  let importedTeamsCount = 0;
  for (const teamConf of TEAMS_LIST) {
    if (!VALID_HUNGARIAN_NAMES.has(teamConf.name)) {
      continue; // Filter only the 48 teams playing in the World Cup
    }

    const groupLetter = teamToGroup[teamConf.name] || null;
    const fifa = fifaDataMap[teamConf.name_en];
    
    // AI data
    const ai = teamAiStats[teamConf.name];
    let temperature = 50;
    let attack_rating = 50;
    let defense_rating = 50;
    let injuries: string[] = [];
    let news: any[] = [];

    if (ai && ai.count > 0) {
      temperature = Math.round(ai.tempSum / ai.count);
      attack_rating = Math.round(ai.attackSum / ai.count);
      defense_rating = Math.round(ai.defenseSum / ai.count);

      // Extract injuries and news from first match
      if (ai.firstMatchAiData) {
        const { role, data } = ai.firstMatchAiData;
        const teamKey = role === 'A' ? 'teamA' : 'teamB';
        injuries = data[teamKey]?.injuries || [];

        // News filter: include news items mentioning the team name
        const rawNews = data.news || [];
        news = rawNews.filter((item: any) => {
          if (!item.text) return false;
          const textLower = item.text.toLowerCase();
          return textLower.includes(teamConf.name.toLowerCase()) || 
                 textLower.includes(teamConf.name_en.toLowerCase());
        });

        // Fallback: if news filter leaves us with empty array, but we have news, keep the first one
        if (news.length === 0 && rawNews.length > 0) {
          news = [rawNews[0]];
        }
      }
    }

    // Host nations (USA, Canada, Mexico) must have at least 90% temperature
    if (['Egyesült Államok', 'Kanada', 'Mexikó'].includes(teamConf.name)) {
      if (temperature < 90) {
        temperature = 90;
      }
    }

    // Insert or update team
    const teamRecord = {
      id: teamConf.id,
      name: teamConf.name,
      name_en: teamConf.name_en,
      group_letter: groupLetter,
      fifa_ranking: fifa ? fifa.ranking : null,
      fifa_points: fifa ? fifa.points : null,
      form: fifa ? fifa.form : null,
      temperature,
      attack_rating,
      defense_rating,
      injuries,
      news,
      squad: squadsMap[teamConf.name] || null,
      updated_at: new Date()
    };

    // Upsert using drizzle client
    await db.insert(schema.teams).values(teamRecord)
      .onConflictDoUpdate({
        target: schema.teams.id,
        set: {
          name: teamRecord.name,
          name_en: teamRecord.name_en,
          group_letter: teamRecord.group_letter,
          fifa_ranking: teamRecord.fifa_ranking,
          fifa_points: teamRecord.fifa_points,
          form: teamRecord.form,
          temperature: teamRecord.temperature,
          attack_rating: teamRecord.attack_rating,
          defense_rating: teamRecord.defense_rating,
          injuries: teamRecord.injuries,
          news: teamRecord.news,
          squad: teamRecord.squad,
          updated_at: teamRecord.updated_at
        }
      });

    importedTeamsCount++;
  }
  console.log(`✅ Upserted ${importedTeamsCount} teams into database.`);

  // 5. Parse all_matches_h2h.md and update matches + matchDetails
  console.log('Parsing all_matches_h2h.md...');
  const h2hPath = path.join(process.cwd(), '../assets/all_matches_h2h.md');
  const h2hContent = fs.readFileSync(h2hPath, 'utf8');
  
  // Split matches by "## Mérkőzés Részletek:"
  const matchSections = h2hContent.split('## Mérkőzés Részletek:');
  console.log(`Found ${matchSections.length - 1} match sections in all_matches_h2h.md`);

  let updatedMatchesCount = 0;

  for (const section of matchSections) {
    if (!section.trim()) continue;

    const lines = section.split('\n');
    const titleLine = lines[0].trim(); // e.g. "Mexikó - Dél-Afrika"
    const titleParts = titleLine.split(' - ').map(s => s.trim());
    if (titleParts.length < 2) continue;

    const teamA_raw = titleParts[0];
    const teamB_raw = titleParts[1];
    
    const teamA_norm = normalizeName(teamA_raw);
    const teamB_norm = normalizeName(teamB_raw);

    // Parse tv, venue, capacity, odds
    let tv_channel: string | null = null;
    let venue_name: string | null = null;
    let venue_city: string | null = null;
    let venue_capacity: number | null = null;
    let odds: { winA: number; draw: number; winB: number } | null = null;
    
    // Parse H2H history
    const h2hHistory: any[] = [];
    let parsingH2HTable = false;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('**TV adó:**')) {
        const val = trimmedLine.replace('**TV adó:**', '').trim();
        tv_channel = val === 'N/A' ? null : val;
      } 
      else if (trimmedLine.startsWith('**Helyszín:**')) {
        const val = trimmedLine.replace('**Helyszín:**', '').trim();
        // Extract venue and city, e.g. "Estadio Banorte (Mexikóváros)"
        const venueMatch = val.match(/^(.*?)\s*\((.*?)\)$/);
        if (venueMatch) {
          venue_name = venueMatch[1].trim();
          venue_city = venueMatch[2].trim();
        } else {
          venue_name = val;
        }
      } 
      else if (trimmedLine.startsWith('**Befogadóképesség:**')) {
        const val = trimmedLine.replace('**Befogadóképesség:**', '').replace(/\s+/g, '').trim();
        venue_capacity = parseInt(val, 10) || null;
      } 
      else if (trimmedLine.startsWith('**Odds (1, X, 2):**')) {
        const val = trimmedLine.replace('**Odds (1, X, 2):**', '').trim();
        const oddsParts = val.split(',').map(o => parseFloat(o.trim()));
        if (oddsParts.length === 3) {
          odds = {
            winA: oddsParts[0],
            draw: oddsParts[1],
            winB: oddsParts[2]
          };
        }
      }
      else if (trimmedLine.startsWith('### Egymás Elleni Eredmények (H2H)')) {
        parsingH2HTable = true;
      }
      else if (parsingH2HTable && trimmedLine.startsWith('|')) {
        // Table row parsing
        // | Dátum | Torna | Hazai Csapat | Eredmény | Vendég Csapat |
        // | 11.06.10 | VB | Dél-Afrika | 1-1 | Mexikó |
        // or no history: | — | — | Nincs korábbi egymás elleni mérkőzés | — | — |
        if (trimmedLine.includes('Dátum') || trimmedLine.includes(':---')) continue;
        if (trimmedLine.includes('Nincs korábbi egymás elleni mérkőzés')) continue;

        const tableParts = trimmedLine.split('|').map(p => p.trim());
        if (tableParts.length >= 6) {
          const date = tableParts[1];
          // tableParts[2] is Torna, which we drop as requested by user
          const homeTeam = normalizeName(tableParts[3]);
          const result = tableParts[4];
          const awayTeam = normalizeName(tableParts[5]);

          h2hHistory.push({
            date,
            home: homeTeam,
            score: result,
            away: awayTeam
          });
        }
      }
    }

    // Now find the match in the database
    // We match by team names (allowing A-B or B-A order)
    const matchedMatch = dbMatches.find(m => 
      (m.team_a === teamA_norm && m.team_b === teamB_norm) ||
      (m.team_a === teamB_norm && m.team_b === teamA_norm)
    );

    if (matchedMatch) {
      // If order is reversed (e.g. database has B vs A instead of A vs B),
      // we must reverse the odds!
      let alignedOdds = odds;
      if (odds && matchedMatch.team_a === teamB_norm) {
        alignedOdds = {
          winA: odds.winB,
          draw: odds.draw,
          winB: odds.winA
        };
      }

      // Update matches table fields
      const updatedAiData = matchedMatch.ai_data ? { ...matchedMatch.ai_data as object } : {};
      if (alignedOdds) {
        (updatedAiData as any).odds = alignedOdds;
      }
      (updatedAiData as any).h2hHistory = h2hHistory;

      await db.update(schema.matches)
        .set({
          tv_channel,
          venue_name,
          venue_city,
          venue_capacity,
          ai_data: updatedAiData
        })
        .where(eq(schema.matches.id, matchedMatch.id));

      // Update or insert into match_details table
      const detailRecord = {
        match_id: matchedMatch.id,
        h2h_history: h2hHistory,
        odds: alignedOdds,
        updated_at: new Date()
      };

      await db.insert(schema.matchDetails).values(detailRecord)
        .onConflictDoUpdate({
          target: schema.matchDetails.match_id,
          set: {
            h2h_history: detailRecord.h2h_history,
            odds: detailRecord.odds,
            updated_at: detailRecord.updated_at
          }
        });

      updatedMatchesCount++;
    } else {
      console.warn(`⚠️ Could not find database match for markdown section: ${teamA_norm} vs ${teamB_norm}`);
    }
  }

  console.log(`✅ Successfully updated ${updatedMatchesCount} matches and their details.`);
  console.log('Data import script completed successfully!');
}

main()
  .catch(err => {
    console.error('Error during data import:', err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
