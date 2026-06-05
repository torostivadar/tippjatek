import { db } from '@/src/db';
import { matches } from '@/src/db/schema';
import { eq, not } from 'drizzle-orm';
import { scoreMatch } from './scoring';

// Translation map from football-data.org English names to our Hungarian team names
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

let mockFixturesData: any[] | null = null;

export function setMockFixtures(data: any[] | null) {
  mockFixturesData = data;
}

// Fetch World Cup 2026 matches from football-data.org
export async function fetchApiFixtures() {
  if (mockFixturesData) {
    return mockFixturesData;
  }

  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY is not set in environment variables');
  }

  const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    method: 'GET',
    headers: {
      'X-Auth-Token': apiKey
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`football-data.org responded with status ${response.status}`);
  }

  const data = await response.json();
  return data.matches || [];
}

// Synchronize database matches with football-data.org data
export async function syncMatchesAndScore(targetMatchIds?: string[]) {
  console.log('Starting football-data.org sync...');
  const apiFixtures = await fetchApiFixtures();
  console.log(`Fetched ${apiFixtures.length} fixtures from football-data.org.`);

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
        return api.id === dbMatch.api_fixture_id;
      }

      // 2. Pair dynamically if api_fixture_id is not yet set
      const isGroupStage = !['Legjobb 32', 'Nyolcaddöntő', 'Negyeddöntő', 'Elődöntő', 'Bronzmérkőzés', 'Döntő'].includes(dbMatch.group);
      
      const apiHomeHun = api.homeTeam?.name ? ENGLISH_TO_HUNGARIAN[api.homeTeam.name] : null;
      const apiAwayHun = api.awayTeam?.name ? ENGLISH_TO_HUNGARIAN[api.awayTeam.name] : null;

      if (isGroupStage) {
        // Group Stage: Match by team names
        return (
          (apiHomeHun === dbMatch.team_a && apiAwayHun === dbMatch.team_b) ||
          (apiAwayHun === dbMatch.team_a && apiHomeHun === dbMatch.team_b)
        );
      } else {
        // Knockout Stage: Match by start time (match start times are unique per slot)
        const apiTime = new Date(api.utcDate).getTime();
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
        .set({ api_fixture_id: apiFixture.id })
        .where(eq(matches.id, dbMatch.id));
      dbMatch.api_fixture_id = apiFixture.id;
      console.log(`Mapped match ${dbMatch.id} to API fixture ID ${apiFixture.id}`);
    }

    const isKnockout = ['Legjobb 32', 'Nyolcaddöntő', 'Negyeddöntő', 'Elődöntő', 'Bronzmérkőzés', 'Döntő'].includes(dbMatch.group);
    const apiHomeName = apiFixture.homeTeam?.name;
    const apiAwayName = apiFixture.awayTeam?.name;
    
    // Automatically update knockout placeholders with real team names if they are determined
    if (isKnockout && apiHomeName && apiAwayName) {
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

    const apiStatus = apiFixture.status;
    const goalsHome = apiFixture.score?.fullTime?.home;
    const goalsAway = apiFixture.score?.fullTime?.away;

    // Check if match is finished (FINISHED)
    const isFinished = apiStatus === 'FINISHED';
    const isLive = ['IN_PLAY', 'PAUSED'].includes(apiStatus);

    if (isFinished && goalsHome !== null && goalsAway !== null) {
      // In football-data.org, score.fullTime contains the score at the end of regular or extra time, 
      // but completely excludes penalty shootouts (which is exactly what we need!).
      const scoreA = Number(goalsHome);
      const scoreB = Number(goalsAway);

      // Determine the loser for knockout elimination (using the winner flag from API)
      let loserTeamName: string | undefined = undefined;
      if (isKnockout && apiHomeName && apiAwayName) {
        const winnerFlag = apiFixture.score?.winner; // 'HOME_TEAM', 'AWAY_TEAM', 'DRAW'
        
        if (winnerFlag === 'HOME_TEAM') {
          loserTeamName = ENGLISH_TO_HUNGARIAN[apiAwayName];
        } else if (winnerFlag === 'AWAY_TEAM') {
          loserTeamName = ENGLISH_TO_HUNGARIAN[apiHomeName];
        }
      }

      // Score the match and recalculate user points
      await scoreMatch(dbMatch.id, scoreA, scoreB, 'FINISHED', loserTeamName);
      console.log(`Match ${dbMatch.id} finished. Scored: ${scoreA}-${scoreB}, status=${apiStatus}, loser=${loserTeamName}`);
      updatedCount++;
    } 
    else if (isLive && goalsHome !== null && goalsAway !== null) {
      // Match in progress: update live scores
      if (dbMatch.score_a !== goalsHome || dbMatch.score_b !== goalsAway || dbMatch.status !== 'LIVE') {
        await db
          .update(matches)
          .set({
            score_a: Number(goalsHome),
            score_b: Number(goalsAway),
            status: 'LIVE'
          })
          .where(eq(matches.id, dbMatch.id));
        console.log(`Match ${dbMatch.id} updated to LIVE. Score: ${goalsHome}-${goalsAway}`);
        updatedCount++;
      }
    }
    else if ((apiStatus === 'TIMED' || apiStatus === 'SCHEDULED') && dbMatch.status !== 'NOT_STARTED') {
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
