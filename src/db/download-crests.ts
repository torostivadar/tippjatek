import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Translation map
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
  'Irán': 'Irán',
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

const databaseUrl = process.env.DATABASE_URL;
const apiKey = process.env.API_FOOTBALL_KEY;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}
if (!apiKey) {
  throw new Error('API_FOOTBALL_KEY is not set');
}

const sql = postgres(databaseUrl);

async function run() {
  console.log('Starting crest downloader...');

  // 1. Create table in Supabase if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS team_crests (
      team_name TEXT PRIMARY KEY,
      crest_url TEXT,
      svg_data TEXT
    );
  `;
  console.log('Ensured team_crests table exists in Supabase.');

  // 2. Query football-data.org teams
  const response = await fetch('https://api.football-data.org/v4/competitions/WC/teams', {
    method: 'GET',
    headers: {
      'X-Auth-Token': apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.status}`);
  }

  const data = await response.json();
  const teams = data.teams || [];
  console.log(`Fetched ${teams.length} teams from API.`);

  // 3. Create local public/crests directory
  const publicCrestsDir = path.join(process.cwd(), 'public', 'crests');
  if (!fs.existsSync(publicCrestsDir)) {
    fs.mkdirSync(publicCrestsDir, { recursive: true });
    console.log('Created local public/crests directory.');
  }

  // 4. Download and store crests
  for (const team of teams) {
    const englishName = team.name;
    const hungarianName = ENGLISH_TO_HUNGARIAN[englishName] || englishName;
    const crestUrl = team.crest;

    if (!crestUrl) {
      console.warn(`Skipping ${hungarianName} (no crest URL)`);
      continue;
    }

    try {
      console.log(`Downloading crest for ${hungarianName}...`);
      
      const crestRes = await fetch(crestUrl);
      if (!crestRes.ok) {
        throw new Error(`Status ${crestRes.status}`);
      }

      const svgText = await crestRes.text();
      const cleanSvgText = svgText.replace(/\0/g, '').replace(/\u0000/g, '');

      // Save locally
      const localPath = path.join(publicCrestsDir, `${hungarianName}.svg`);
      fs.writeFileSync(localPath, svgText);

      // Save to Supabase
      await sql`
        INSERT INTO team_crests (team_name, crest_url, svg_data)
        VALUES (${hungarianName}, ${crestUrl}, ${cleanSvgText})
        ON CONFLICT (team_name) 
        DO UPDATE SET crest_url = EXCLUDED.crest_url, svg_data = EXCLUDED.svg_data;
      `;

      console.log(`Successfully stored crest for ${hungarianName}.`);
    } catch (err: any) {
      console.error(`Error downloading crest for ${hungarianName}:`, err.message);
    }
  }

  console.log('Finished downloading and storing all team crests!');
  await sql.end();
}

run().catch(console.error);
