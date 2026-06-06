import { pgTable, uuid, text, integer, timestamp, boolean, jsonb, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. PROFILES Table (Extends Supabase auth.users)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(), // Links directly to auth.users.id
  username: text('username'),
  points: integer('points').default(0).notNull(),
  correct_scores: integer('correct_scores').default(0).notNull(),
  correct_outcomes: integer('correct_outcomes').default(0).notNull(),
  favorite_team: text('favorite_team'), // User's selected favorite team for "Fan Factor" (double points)
  champion_prediction: text('champion_prediction'), // User's prediction for World Cup winner
  has_transferred: boolean('has_transferred').default(false).notNull(), // Has transferred favorite team after knockout
  avatar: text('avatar'), // Chosen animal emoji avatar
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 2. TEAMS Table (Centralized team data)
export const teams = pgTable('teams', {
  id: text('id').primaryKey(),              // ISO code: "GER", "BRA", etc.
  name: text('name').notNull(),             // Hungarian: "Németország"
  name_en: text('name_en'),                 // English: "Germany"
  group_letter: text('group_letter'),       // "A" through "L"

  // FIFA data (from fifa_rankings_men.md)
  fifa_ranking: integer('fifa_ranking'),
  fifa_points: text('fifa_points'),         // "1735.77" (decimal string)
  form: jsonb('form'),                      // ["W","W","D","L","W"] (last 5 results from FIFA)

  // Averaged AI ratings (computed from existing ai_data across 3 group matches)
  attack_rating: integer('attack_rating'),  // 0-100
  defense_rating: integer('defense_rating'),// 0-100
  temperature: integer('temperature'),      // 0-100

  // AI-generated, refreshable per team
  injuries: jsonb('injuries'),              // ["Player Name (injury detail)", ...]
  news: jsonb('news'),                      // [{text, source, url}, ...]

  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// 3. MATCHES Table
export const matches = pgTable('matches', {
  id: text('id').primaryKey(), // e.g. "1" to "104"
  team_a: text('team_a').notNull(),
  team_b: text('team_b').notNull(),
  score_a: integer('score_a'), // null if not started or not updated
  score_b: integer('score_b'), // null if not started or not updated
  start_time: timestamp('start_time').notNull(), // UTC Timestamp
  status: text('status', { enum: ['NOT_STARTED', 'LIVE', 'FINISHED'] }).default('NOT_STARTED').notNull(),
  group: text('group').notNull(), // e.g. "A", "B", "Legjobb 32", "Nyolcaddöntő", "Negyeddöntő", "Elődöntő", "Döntő"
  api_fixture_id: integer('api_fixture_id'), // API-Football fixture ID mapping
  ai_data: jsonb('ai_data'), // Structured AI analysis data (Gemini output)
  last_ai_updated: timestamp('last_ai_updated'), // When AI data was last refreshed

  // Venue & broadcast data (from all_matches_h2h.md)
  tv_channel: text('tv_channel'),            // "M4 Sport (Hun)" or null
  venue_name: text('venue_name'),            // "Estadio Banorte"
  venue_city: text('venue_city'),            // "Mexikóváros"
  venue_capacity: integer('venue_capacity'), // 87523

  created_at: timestamp('created_at').defaultNow().notNull(),
});

// 4. PREDICTIONS Table
export const predictions = pgTable('predictions', {
  id: uuid('id').primaryKey().defaultRandom(),
  match_id: text('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  user_id: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  predicted_a: integer('predicted_a').notNull(),
  predicted_b: integer('predicted_b').notNull(),
  points_earned: integer('points_earned'), // null until match is FINISHED and scoring runs
  is_tuti: boolean('is_tuti').default(false).notNull(), // "TUTI TIPP" toggle
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique('unique_match_user').on(t.match_id, t.user_id)
]);

// 5. MATCH DETAILS Table (Extra AI analytics, Head to Head stats, odds, and news)
export const matchDetails = pgTable('match_details', {
  match_id: text('match_id').primaryKey().references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  h2h_summary: text('h2h_summary'),
  h2h_history: jsonb('h2h_history'), // json structure of historical match outcomes
  odds: jsonb('odds'), // { winA: number, draw: number, winB: number }
  team_a_stats: jsonb('team_a_stats'), // form, injuries
  team_b_stats: jsonb('team_b_stats'), // form, injuries
  prediction_ai: jsonb('prediction_ai'), // AI generated prediction percentages and text
  news: jsonb('news'), // array of news items
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// 6. ELIMINATED TEAMS Table (Track teams eliminated from the tournament)
export const eliminatedTeams = pgTable('eliminated_teams', {
  team_name: text('team_name').primaryKey(),
  eliminated_at: timestamp('eliminated_at').defaultNow().notNull(),
});
