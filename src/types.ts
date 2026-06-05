/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  score_a: number | null;
  score_b: number | null;
  start_time: string;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  group?: string;
  stadium?: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_a: number;
  predicted_b: number;
  points_earned?: number;
}

export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  points: number;
}

export type UserPrediction = Prediction & { match: Match };
