import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';

const globalForDb = global as unknown as {
  postgresClient: postgres.Sql | undefined;
};

const client =
  globalForDb.postgresClient ??
  postgres(connectionString, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false, // Required for Supabase pgBouncer connection pooler
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
}

export { client };
export const db = drizzle(client, { schema });
export * from './schema';
export * from 'drizzle-orm';
