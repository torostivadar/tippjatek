import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { matches } from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema });

// Helper to convert CEST times (Hungary) to UTC Date objects
// e.g. "2026-06-11 21:00" CEST -> UTC is 2 hours behind in summer (UTC+2) -> "2026-06-11T19:00:00Z"
function createDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  // We construct a local date in Hungary and return it.
  // In JavaScript, new Date(Date.UTC(...)) or using ISO strings is standard.
  // Let's create an ISO string representing CEST (UTC+2 in summer)
  const pad = (num: number) => String(num).padStart(2, '0');
  const isoString = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+02:00`;
  return new Date(isoString);
}

const rawMatches = [
  // 1. játéknap – június 11. (csütörtök)
  { id: '1', team_a: 'Mexikó', team_b: 'Dél-afrikai Köztársaság', time: createDate(2026, 6, 11, 21, 0), group: 'A' },
  { id: '2', team_a: 'Koreai Köztársaság', team_b: 'Csehország', time: createDate(2026, 6, 12, 4, 0), group: 'A' },
  // 2. játéknap – június 12. (péntek)
  { id: '3', team_a: 'Kanada', team_b: 'Bosznia-Hercegovina', time: createDate(2026, 6, 12, 21, 0), group: 'B' },
  { id: '4', team_a: 'Egyesült Államok', team_b: 'Paraguay', time: createDate(2026, 6, 13, 3, 0), group: 'D' },
  // 3. játéknap – június 13. (szombat)
  { id: '5', team_a: 'Katar', team_b: 'Svájc', time: createDate(2026, 6, 13, 21, 0), group: 'B' },
  { id: '6', team_a: 'Brazília', team_b: 'Marokkó', time: createDate(2026, 6, 14, 0, 0), group: 'C' },
  { id: '7', team_a: 'Haiti', team_b: 'Skócia', time: createDate(2026, 6, 14, 3, 0), group: 'C' },
  { id: '8', team_a: 'Ausztrália', team_b: 'Törökország', time: createDate(2026, 6, 14, 6, 0), group: 'D' },
  // 4. játéknap – június 14. (vasárnap)
  { id: '9', team_a: 'Németország', team_b: 'Curaçao', time: createDate(2026, 6, 14, 19, 0), group: 'E' },
  { id: '10', team_a: 'Hollandia', team_b: 'Japán', time: createDate(2026, 6, 14, 22, 0), group: 'F' },
  { id: '11', team_a: 'Elefántcsontpart', team_b: 'Ecuador', time: createDate(2026, 6, 15, 1, 0), group: 'E' },
  { id: '12', team_a: 'Svédország', team_b: 'Tunézia', time: createDate(2026, 6, 15, 4, 0), group: 'F' },
  // 5. játéknap – június 15. (hétfő)
  { id: '13', team_a: 'Spanyolország', team_b: 'Zöld-foki Köztársaság', time: createDate(2026, 6, 15, 18, 0), group: 'H' },
  { id: '14', team_a: 'Belgium', team_b: 'Egyiptom', time: createDate(2026, 6, 15, 21, 0), group: 'G' },
  { id: '15', team_a: 'Szaúd-Arábia', team_b: 'Uruguay', time: createDate(2026, 6, 16, 0, 0), group: 'H' },
  { id: '16', team_a: 'Irán', team_b: 'Új-Zéland', time: createDate(2026, 6, 16, 3, 0), group: 'G' },
  // 6. játéknap – június 16. (kedd)
  { id: '17', team_a: 'Franciaország', team_b: 'Szenegál', time: createDate(2026, 6, 16, 21, 0), group: 'I' },
  { id: '18', team_a: 'Irak', team_b: 'Norvégia', time: createDate(2026, 6, 17, 0, 0), group: 'I' },
  { id: '19', team_a: 'Argentína', team_b: 'Algéria', time: createDate(2026, 6, 17, 3, 0), group: 'J' },
  { id: '20', team_a: 'Ausztria', team_b: 'Jordánia', time: createDate(2026, 6, 17, 6, 0), group: 'J' },
  // 7. játéknap – június 17. (szerda)
  { id: '21', team_a: 'Portugália', team_b: 'Kongói DK', time: createDate(2026, 6, 17, 19, 0), group: 'K' },
  { id: '22', team_a: 'Anglia', team_b: 'Horvátország', time: createDate(2026, 6, 17, 22, 0), group: 'L' },
  { id: '23', team_a: 'Ghána', team_b: 'Panama', time: createDate(2026, 6, 18, 1, 0), group: 'L' },
  { id: '24', team_a: 'Üzbegisztán', team_b: 'Kolumbia', time: createDate(2026, 6, 18, 4, 0), group: 'K' },
  // 8. játéknap – június 18. (csütörtök)
  { id: '25', team_a: 'Csehország', team_b: 'Dél-afrikai Köztársaság', time: createDate(2026, 6, 18, 18, 0), group: 'A' },
  { id: '26', team_a: 'Bosznia-Hercegovina', team_b: 'Svájc', time: createDate(2026, 6, 18, 21, 0), group: 'B' },
  { id: '27', team_a: 'Kanada', team_b: 'Katar', time: createDate(2026, 6, 19, 0, 0), group: 'B' },
  { id: '28', team_a: 'Mexikó', team_b: 'Koreai Köztársaság', time: createDate(2026, 6, 19, 3, 0), group: 'A' },
  // 9. játéknap – június 19. (péntek)
  { id: '29', team_a: 'Egyesült Államok', team_b: 'Ausztrália', time: createDate(2026, 6, 19, 21, 0), group: 'D' },
  { id: '30', team_a: 'Skócia', team_b: 'Marokkó', time: createDate(2026, 6, 20, 0, 0), group: 'C' },
  { id: '31', team_a: 'Brazília', team_b: 'Haiti', time: createDate(2026, 6, 20, 2, 30), group: 'C' },
  { id: '32', team_a: 'Törökország', team_b: 'Paraguay', time: createDate(2026, 6, 20, 5, 0), group: 'D' },
  // 10. játéknap – június 20. (szombat)
  { id: '33', team_a: 'Hollandia', team_b: 'Svédország', time: createDate(2026, 6, 20, 19, 0), group: 'F' },
  { id: '34', team_a: 'Németország', team_b: 'Elefántcsontpart', time: createDate(2026, 6, 20, 22, 0), group: 'E' },
  { id: '35', team_a: 'Ecuador', team_b: 'Curaçao', time: createDate(2026, 6, 21, 2, 0), group: 'E' },
  { id: '36', team_a: 'Tunézia', team_b: 'Japán', time: createDate(2026, 6, 21, 6, 0), group: 'F' },
  // 11. játéknap – június 21. (vasárnap)
  { id: '37', team_a: 'Spanyolország', team_b: 'Szaúd-Arábia', time: createDate(2026, 6, 21, 18, 0), group: 'H' },
  { id: '38', team_a: 'Belgium', team_b: 'Irán', time: createDate(2026, 6, 21, 21, 0), group: 'G' },
  { id: '39', team_a: 'Uruguay', team_b: 'Zöld-foki Köztársaság', time: createDate(2026, 6, 22, 0, 0), group: 'H' },
  { id: '40', team_a: 'Új-Zéland', team_b: 'Egyiptom', time: createDate(2026, 6, 22, 3, 0), group: 'G' },
  // 12. játéknap – június 22. (hétfő)
  { id: '41', team_a: 'Franciaország', team_b: 'Irak', time: createDate(2026, 6, 22, 19, 0), group: 'I' },
  { id: '42', team_a: 'Norvégia', team_b: 'Szenegál', time: createDate(2026, 6, 22, 22, 0), group: 'I' },
  { id: '43', team_a: 'Argentína', team_b: 'Ausztria', time: createDate(2026, 6, 23, 2, 0), group: 'J' },
  { id: '44', team_a: 'Jordánia', team_b: 'Algéria', time: createDate(2026, 6, 23, 5, 0), group: 'J' },
  // 13. játéknap – június 23. (kedd)
  { id: '45', team_a: 'Portugália', team_b: 'Üzbegisztán', time: createDate(2026, 6, 23, 19, 0), group: 'K' },
  { id: '46', team_a: 'Kolumbia', team_b: 'Kongói DK', time: createDate(2026, 6, 23, 22, 0), group: 'K' },
  { id: '47', team_a: 'Anglia', team_b: 'Ghána', time: createDate(2026, 6, 24, 2, 0), group: 'L' },
  { id: '48', team_a: 'Panama', team_b: 'Horvátország', time: createDate(2026, 6, 24, 5, 0), group: 'L' },
  // 14. játéknap – június 24. (szerda) - Záró kör
  { id: '49', team_a: 'Dél-afrikai Köztársaság', team_b: 'Koreai Köztársaság', time: createDate(2026, 6, 24, 22, 0), group: 'A' },
  { id: '50', team_a: 'Csehország', team_b: 'Mexikó', time: createDate(2026, 6, 24, 22, 0), group: 'A' },
  { id: '51', team_a: 'Svájc', team_b: 'Kanada', time: createDate(2026, 6, 25, 2, 0), group: 'B' },
  { id: '52', team_a: 'Bosznia-Hercegovina', team_b: 'Katar', time: createDate(2026, 6, 25, 2, 0), group: 'B' },
  // 15. játéknap – június 25. (csütörtök)
  { id: '53', team_a: 'Marokkó', team_b: 'Haiti', time: createDate(2026, 6, 25, 19, 0), group: 'C' },
  { id: '54', team_a: 'Skócia', team_b: 'Brazília', time: createDate(2026, 6, 25, 19, 0), group: 'C' },
  { id: '55', team_a: 'Törökország', team_b: 'Egyesült Államok', time: createDate(2026, 6, 25, 23, 0), group: 'D' },
  { id: '56', team_a: 'Paraguay', team_b: 'Ausztrália', time: createDate(2026, 6, 25, 23, 0), group: 'D' },
  // 16. játéknap – június 26. (péntek)
  { id: '57', team_a: 'Curaçao', team_b: 'Elefántcsontpart', time: createDate(2026, 6, 26, 21, 0), group: 'E' },
  { id: '58', team_a: 'Ecuador', team_b: 'Németország', time: createDate(2026, 6, 26, 21, 0), group: 'E' },
  { id: '59', team_a: 'Japán', team_b: 'Svédország', time: createDate(2026, 6, 27, 1, 0), group: 'F' },
  { id: '60', team_a: 'Tunézia', team_b: 'Hollandia', time: createDate(2026, 6, 27, 1, 0), group: 'F' },
  // 17. játéknap – június 27. (szombat)
  { id: '61', team_a: 'Egyiptom', team_b: 'Irán', time: createDate(2026, 6, 27, 19, 0), group: 'G' },
  { id: '62', team_a: 'Új-Zéland', team_b: 'Belgium', time: createDate(2026, 6, 27, 19, 0), group: 'G' },
  { id: '63', team_a: 'Zöld-foki Köztársaság', team_b: 'Szaúd-Arábia', time: createDate(2026, 6, 27, 22, 0), group: 'H' },
  { id: '64', team_a: 'Uruguay', team_b: 'Spanyolország', time: createDate(2026, 6, 27, 22, 0), group: 'H' },
  { id: '65', team_a: 'Szenegál', team_b: 'Irak', time: createDate(2026, 6, 28, 2, 0), group: 'I' },
  { id: '66', team_a: 'Norvégia', team_b: 'Franciaország', time: createDate(2026, 6, 28, 2, 0), group: 'I' },
  { id: '67', team_a: 'Algéria', team_b: 'Ausztria', time: createDate(2026, 6, 28, 5, 0), group: 'J' },
  { id: '68', team_a: 'Jordánia', team_b: 'Argentína', time: createDate(2026, 6, 28, 5, 0), group: 'J' },
  // 18. játéknap – június 28. (vasárnap)
  { id: '69', team_a: 'Kongói DK', team_b: 'Üzbegisztán', time: createDate(2026, 6, 28, 19, 0), group: 'K' },
  { id: '70', team_a: 'Kolumbia', team_b: 'Portugália', time: createDate(2026, 6, 28, 19, 0), group: 'K' },
  { id: '71', team_a: 'Horvátország', team_b: 'Ghána', time: createDate(2026, 6, 28, 22, 0), group: 'L' },
  { id: '72', team_a: 'Panama', team_b: 'Anglia', time: createDate(2026, 6, 28, 22, 0), group: 'L' },

  // 2. LEGJOBB 32 KÖRE (73–88. mérkőzések)
  { id: '73', team_a: 'A/2', team_b: 'B/2', time: createDate(2026, 6, 29, 3, 0), group: 'Legjobb 32' },
  { id: '74', team_a: 'E/1', team_b: 'A/B/C/D/E 3', time: createDate(2026, 6, 29, 19, 0), group: 'Legjobb 32' },
  { id: '75', team_a: 'F/1', team_b: 'C/D/E/F/G 3', time: createDate(2026, 6, 29, 22, 0), group: 'Legjobb 32' },
  { id: '76', team_a: 'I/1', team_b: 'C/D/E/G/H 3', time: createDate(2026, 6, 30, 3, 0), group: 'Legjobb 32' },
  { id: '77', team_a: 'C/2', team_b: 'F/2', time: createDate(2026, 6, 30, 20, 0), group: 'Legjobb 32' },
  { id: '78', team_a: 'D/1', team_b: 'B/E/F/G/I 3', time: createDate(2026, 6, 30, 23, 0), group: 'Legjobb 32' },
  { id: '79', team_a: 'G/1', team_b: 'A/B/C/E/F 3', time: createDate(2026, 7, 1, 3, 0), group: 'Legjobb 32' },
  { id: '80', team_a: 'H/1', team_b: 'J/2', time: createDate(2026, 7, 1, 18, 0), group: 'Legjobb 32' },
  { id: '81', team_a: 'I/2', team_b: 'L/2', time: createDate(2026, 7, 1, 21, 0), group: 'Legjobb 32' },
  { id: '82', team_a: 'D/2', team_b: 'H/2', time: createDate(2026, 7, 2, 0, 0), group: 'Legjobb 32' },
  { id: '83', team_a: 'J/1', team_b: 'H/I/J/K/L 3', time: createDate(2026, 7, 2, 4, 0), group: 'Legjobb 32' },
  { id: '84', team_a: 'K/1', team_b: 'E/I/J/K/L 3', time: createDate(2026, 7, 2, 19, 0), group: 'Legjobb 32' },
  { id: '85', team_a: 'L/1', team_b: 'G/H/I/J/K 3', time: createDate(2026, 7, 2, 22, 0), group: 'Legjobb 32' },
  { id: '86', team_a: 'B/1', team_b: 'A/E/F/G/H 3', time: createDate(2026, 7, 3, 2, 0), group: 'Legjobb 32' },
  { id: '87', team_a: 'A/1', team_b: 'C/F/G/H/I 3', time: createDate(2026, 7, 3, 5, 0), group: 'Legjobb 32' },
  { id: '88', team_a: 'C/1', team_b: 'K/2', time: createDate(2026, 7, 4, 3, 0), group: 'Legjobb 32' },

  // 3. NYOLCADDÖNTŐK (89–96. mérkőzések)
  { id: '89', team_a: 'W-74', team_b: 'W-77', time: createDate(2026, 7, 4, 22, 0), group: 'Nyolcaddöntő' },
  { id: '90', team_a: 'W-73', team_b: 'W-75', time: createDate(2026, 7, 5, 3, 0), group: 'Nyolcaddöntő' },
  { id: '91', team_a: 'W-76', team_b: 'W-78', time: createDate(2026, 7, 5, 22, 0), group: 'Nyolcaddöntő' },
  { id: '92', team_a: 'W-79', team_b: 'W-80', time: createDate(2026, 7, 6, 3, 0), group: 'Nyolcaddöntő' },
  { id: '93', team_a: 'W-82', team_b: 'W-83', time: createDate(2026, 7, 6, 21, 0), group: 'Nyolcaddöntő' },
  { id: '94', team_a: 'W-81', team_b: 'W-84', time: createDate(2026, 7, 7, 2, 0), group: 'Nyolcaddöntő' },
  { id: '95', team_a: 'W-85', team_b: 'W-86', time: createDate(2026, 7, 7, 22, 0), group: 'Nyolcaddöntő' },
  { id: '96', team_a: 'W-87', team_b: 'W-88', time: createDate(2026, 7, 8, 3, 0), group: 'Nyolcaddöntő' },

  // 4. NEGYEDDÖNTŐK (97–100. mérkőzések)
  { id: '97', team_a: 'W-89', team_b: 'W-90', time: createDate(2026, 7, 10, 3, 0), group: 'Negyeddöntő' },
  { id: '98', team_a: 'W-91', team_b: 'W-92', time: createDate(2026, 7, 11, 2, 0), group: 'Negyeddöntő' },
  { id: '99', team_a: 'W-93', team_b: 'W-94', time: createDate(2026, 7, 11, 22, 0), group: 'Negyeddöntő' },
  { id: '100', team_a: 'W-95', team_b: 'W-96', time: createDate(2026, 7, 12, 2, 0), group: 'Negyeddöntő' },

  // 5. ELŐDÖNTŐK (101–102. mérkőzések)
  { id: '101', team_a: 'W-97', team_b: 'W-98', time: createDate(2026, 7, 15, 2, 0), group: 'Elődöntő' },
  { id: '102', team_a: 'W-99', team_b: 'W-100', time: createDate(2026, 7, 16, 2, 0), group: 'Elődöntő' },

  // 6. BRONZMÉRKŐZÉS ÉS DÖNTŐ (103–104. mérkőzések)
  { id: '103', team_a: 'L-101', team_b: 'L-102', time: createDate(2026, 7, 18, 22, 0), group: 'Bronzmérkőzés' },
  { id: '104', team_a: 'W-101', team_b: 'W-102', time: createDate(2026, 7, 19, 21, 0), group: 'Döntő' }
];

async function seed() {
  console.log('Seeding matches...');
  try {
    // Clear matches table (cascade will handle predictions and details)
    await db.delete(matches);
    
    // Format for insert
    const insertData = rawMatches.map(m => ({
      id: m.id,
      team_a: m.team_a,
      team_b: m.team_b,
      start_time: m.time,
      status: 'NOT_STARTED' as const,
      group: m.group
    }));

    await db.insert(matches).values(insertData);
    console.log(`Successfully seeded ${insertData.length} matches!`);
    
  } catch (error) {
    console.error('Error during seeding matches:', error);
  } finally {
    await client.end();
  }
}

seed();
