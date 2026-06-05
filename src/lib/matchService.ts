import { db } from '@/src/db';
import { matches } from '@/src/db/schema';
import { eq, not, and, lte, gte } from 'drizzle-orm';
import { scoreMatch } from './scoring';

// Translation map from API-Football English names to our Hungarian team names
const ENGLISH_TO_HUNGARIAN: Record<string, string> = {
  'Algeria': 'Algéria',
  'England': 'Anglia',
  'Argentina': 'Argentína',
  'Australia': 'Ausztrália',
  'Austria': 'Ausztria',
  'Belgium': 'Belgium',
  'Bosnia & Herzegovina': 'Bosznia-Hercegovina',
  'Bosnia and Herzegovina': 'Bosznia-Hercegovina',
  'Bosnia-Herzegovina': 'Bosznia-Hercegovina',
  'Brazil': 'Brazília',
  'Czech Republic': 'Csehország',
  'Czechia': 'Csehország',
  'Curacao': 'Curaçao',
  'Curaçao': 'Curaçao',
  'South Africa': 'Dél-afrikai Köztársaság',
  'Ecuador': 'Ecuador',
  'USA': 'Egyesült Államok',
  'United States': 'Egyesült Államok',
  'Egypt': 'Egyiptom',
  'Ivory Coast': 'Elefántcsontpart',
  "Côte d'Ivoire": 'Elefántcsontpart',
  "Cote d'Ivoire": 'Elefántcsontpart',
  'France': 'Franciaország',
  'Ghana': 'Ghána',
  'Haiti': 'Haiti',
  'Netherlands': 'Hollandia',
  'Croatia': 'Horvátország',
  'Iraq': 'Irak',
  'Iran': 'Irán',
  'Japan': 'Japán',
  'Jordan': 'Jordánia',
  'Canada': 'Kanada',
  'Qatar': 'Katar',
  'Colombia': 'Kolumbia',
  'DR Congo': 'Kongói DK',
  'Congo DR': 'Kongói DK',
  'Korea Republic': 'Koreai Köztársaság',
  'South Korea': 'Koreai Köztársaság',
  'Morocco': 'Marokkó',
  'Mexico': 'Mexikó',
  'Germany': 'Németország',
  'Norway': 'Norvégia',
  'Panama': 'Panama',
  'Paraguay': 'Paraguay',
  'Portugal': 'Portugália',
  'Scotland': 'Skócia',
  'Spain': 'Spanyolország',
  'Switzerland': 'Svájc',
  'Saudi Arabia': 'Szaúd-Arábia',
  'Senegal': 'Szenegál',
  'Sweden': 'Svédország',
  'Tunisia': 'Tunézia',
  'Turkey': 'Törökország',
  'New Zealand': 'Új-Zéland',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Üzbegisztán',
  'Cape Verde': 'Zöld-foki Köztársaság',
  'Cabo Verde': 'Zöld-foki Köztársaság'
};

const HUNGARIAN_TO_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(ENGLISH_TO_HUNGARIAN).map(([eng, hun]) => [hun, eng])
);

let mockFixturesData: any[] | null = null;

export function setMockFixtures(data: any[] | null) {
  mockFixturesData = data;
}

// Fetch World Cup 2026 matches from API-Football
export async function fetchApiFixtures() {
  if (mockFixturesData) {
    return mockFixturesData;
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY is not set in environment variables');
  }

  const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
    method: 'GET',
    headers: {
      'x-apisports-key': apiKey,
      'x-apisports-host': 'v3.football.api-sports.io'
    },
    // Keep it short, fail quickly if external API is slow
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`API-Football responded with status ${response.status}`);
  }

  const data = await response.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(data.errors)}`);
  }

  return data.response || [];
}

// Synchronize database matches with API-Football data
export async function syncMatchesAndScore(targetMatchIds?: string[]) {
  console.log('Starting API-Football sync...');
  const apiFixtures = await fetchApiFixtures();
  console.log(`Fetched ${apiFixtures.length} fixtures from API-Football.`);

  // Get all matches from our DB that are not finished
  const dbMatches = await db
    .select()
    .from(matches)
    .where(not(eq(matches.status, 'FINISHED')));

  const matchesToProcess = targetMatchIds
    ? dbMatches.filter(m => targetMatchIds.includes(m.id))
    : dbMatches;

  let updatedCount = 0;

  for (const dbMatch of matchesToProcess) {
    // Attempt to find matching fixture from API
    const apiFixture = apiFixtures.find((api: any) => {
      // 1. Match by api_fixture_id if already saved
      if (dbMatch.api_fixture_id !== null) {
        return api.fixture.id === dbMatch.api_fixture_id;
      }

      // 2. Pair dynamically if api_fixture_id is not yet set
      const isGroupStage = !['Legjobb 32', 'Nyolcaddöntő', 'Negyeddöntő', 'Elődöntő', 'Bronzmérkőzés', 'Döntő'].includes(dbMatch.group);
      
      const apiHomeHun = ENGLISH_TO_HUNGARIAN[api.teams.home.name];
      const apiAwayHun = ENGLISH_TO_HUNGARIAN[api.teams.away.name];

      if (isGroupStage) {
        // Group Stage: Match by team names
        return (
          (apiHomeHun === dbMatch.team_a && apiAwayHun === dbMatch.team_b) ||
          (apiAwayHun === dbMatch.team_a && apiHomeHun === dbMatch.team_b)
        );
      } else {
        // Knockout Stage: Match by start time (match start times are unique per slot)
        const apiTime = new Date(api.fixture.date).getTime();
        const dbTime = new Date(dbMatch.start_time).getTime();
        // Allow a 1-hour window for timezone safety, but they should match exactly
        return Math.abs(apiTime - dbTime) < 60 * 60 * 1000;
      }
    });

    if (!apiFixture) {
      continue;
    }

    // Save api_fixture_id if it's missing in our DB
    if (dbMatch.api_fixture_id === null) {
      await db
        .update(matches)
        .set({ api_fixture_id: apiFixture.fixture.id })
        .where(eq(matches.id, dbMatch.id));
      dbMatch.api_fixture_id = apiFixture.fixture.id;
      console.log(`Mapped match ${dbMatch.id} to API fixture ID ${apiFixture.fixture.id}`);
    }

    const isKnockout = ['Legjobb 32', 'Nyolcaddöntő', 'Negyeddöntő', 'Elődöntő', 'Bronzmérkőzés', 'Döntő'].includes(dbMatch.group);
    const apiHomeName = apiFixture.teams.home.name;
    const apiAwayName = apiFixture.teams.away.name;
    
    // Automatically update knockout placeholders with real team names if they are determined
    if (isKnockout) {
      const isHomeReal = ENGLISH_TO_HUNGARIAN.hasOwnProperty(apiHomeName);
      const isAwayReal = ENGLISH_TO_HUNGARIAN.hasOwnProperty(apiAwayName);

      if (isHomeReal && isAwayReal) {
        const transHome = ENGLISH_TO_HUNGARIAN[apiHomeName];
        const transAway = ENGLISH_TO_HUNGARIAN[apiAwayName];

        if (dbMatch.team_a !== transHome || dbMatch.team_b !== transAway) {
          await db
            .update(matches)
            .set({ team_a: transHome, team_b: transAway })
            .where(eq(matches.id, dbMatch.id));
          dbMatch.team_a = transHome;
          dbMatch.team_b = transAway;
          console.log(`Updated knockout match ${dbMatch.id} teams: ${transHome} vs ${transAway}`);
        }
      }
    }

    const apiStatus = apiFixture.fixture.status.short;
    const goalsHome = apiFixture.goals.home;
    const goalsAway = apiFixture.goals.away;

    // Check if match is finished (FT: Full Time, AET: After Extra Time, PEN: Penalty Shootout)
    const isFinished = ['FT', 'AET', 'PEN'].includes(apiStatus);
    const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(apiStatus);

    if (isFinished) {
      // Compute official score up to extra time, completely ignoring penalty shootouts
      let scoreA = goalsHome;
      let scoreB = goalsAway;

      if (apiStatus === 'PEN' || apiStatus === 'AET') {
        const extratime = apiFixture.score.extratime;
        if (extratime && extratime.home !== null && extratime.away !== null) {
          scoreA = extratime.home;
          scoreB = extratime.away;
        }
      }

      // Determine the loser for knockout elimination (using the winner flag from API)
      let loserTeamName: string | undefined = undefined;
      if (isKnockout) {
        const homeWinner = apiFixture.teams.home.winner; // true/false/null
        const awayWinner = apiFixture.teams.away.winner;
        
        if (homeWinner === false) {
          loserTeamName = ENGLISH_TO_HUNGARIAN[apiHomeName];
        } else if (awayWinner === false) {
          loserTeamName = ENGLISH_TO_HUNGARIAN[apiAwayName];
        }
      }

      // Score the match and recalculate user points
      await scoreMatch(dbMatch.id, scoreA, scoreB, 'FINISHED', loserTeamName);
      console.log(`Match ${dbMatch.id} finished. Scored: ${scoreA}-${scoreB}, status=${apiStatus}, loser=${loserTeamName}`);
      updatedCount++;
    } 
    else if (isLive) {
      // Match in progress: update live scores
      if (dbMatch.score_a !== goalsHome || dbMatch.score_b !== goalsAway || dbMatch.status !== 'LIVE') {
        await db
          .update(matches)
          .set({
            score_a: goalsHome !== null ? Number(goalsHome) : null,
            score_b: goalsAway !== null ? Number(goalsAway) : null,
            status: 'LIVE'
          })
          .where(eq(matches.id, dbMatch.id));
        console.log(`Match ${dbMatch.id} updated to LIVE. Score: ${goalsHome}-${goalsAway}`);
        updatedCount++;
      }
    }
    else if (apiStatus === 'NS' && dbMatch.status !== 'NOT_STARTED') {
      // Revert to NOT_STARTED if match has been postponed or reset
      await db
        .update(matches)
        .set({
          score_a: null,
          score_b: null,
          status: 'NOT_STARTED'
        })
        .where(eq(matches.id, dbMatch.id));
      console.log(`Match ${dbMatch.id} reset to NOT_STARTED`);
      updatedCount++;
    }
  }

  console.log(`Sync complete. Updated ${updatedCount} matches.`);
  return { updated: updatedCount };
}
