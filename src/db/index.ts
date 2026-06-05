import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const globalForDb = global as unknown as {
  postgresClient: postgres.Sql | undefined;
};

export const client =
  globalForDb.postgresClient ??
  postgres(connectionString, {
    max: 1,
    idle_timeout: 5, // Automatically closes idle connections after 5 seconds, allowing the build process to exit
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
export * from './schema';
export * from 'drizzle-orm';
