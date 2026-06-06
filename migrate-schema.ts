import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not set');

const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  console.log('Creating teams table...');
  await sql`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_en TEXT,
      group_letter TEXT,
      fifa_ranking INTEGER,
      fifa_points TEXT,
      form JSONB,
      attack_rating INTEGER,
      defense_rating INTEGER,
      temperature INTEGER,
      injuries JSONB,
      news JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✅ teams table created');

  console.log('Adding columns to matches...');
  const columns = [
    { name: 'tv_channel', type: 'TEXT' },
    { name: 'venue_name', type: 'TEXT' },
    { name: 'venue_city', type: 'TEXT' },
    { name: 'venue_capacity', type: 'INTEGER' },
  ];

  for (const col of columns) {
    try {
      await sql.unsafe(`ALTER TABLE matches ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`  ✅ ${col.name} added`);
    } catch (e: any) {
      if (e.message?.includes('already exists')) {
        console.log(`  ⏭️ ${col.name} already exists`);
      } else {
        throw e;
      }
    }
  }

  console.log('\n✅ All schema changes applied!');
  await sql.end();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
