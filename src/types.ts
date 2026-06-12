export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  score_a: number | null;
  score_b: number | null;
  start_time: string;
  status: 'NOT_STARTED' | 'LIVE' | 'FINISHED';
  group: string;
  ai_data?: MatchStats | null;
  last_ai_updated?: string | null;
  last_sync_attempt?: string | null;
  tv_channel?: string | null;
  venue_name?: string | null;
  venue_city?: string | null;
  venue_capacity?: number | null;
}

export interface Squad {
  manager?: string | null;
  goalkeepers?: string[] | null;
  defenders?: string[] | null;
  midfielders?: string[] | null;
  forwards?: string[] | null;
}

export interface Team {
  id: string;
  name: string;
  name_en?: string | null;
  group_letter?: string | null;
  fifa_ranking?: number | null;
  fifa_points?: string | null;
  form?: string[] | null;
  attack_rating?: number | null;
  defense_rating?: number | null;
  temperature?: number | null;
  injuries?: string[] | null;
  news?: { text: string; source?: string; url?: string }[] | null;
  squad?: Squad | null;
  updated_at?: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_a: number;
  predicted_b: number;
  points_earned?: number | null;
  is_tuti: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  username: string;
  points: number;
  correct_scores: number;
  correct_outcomes: number;
  favorite_team?: string | null;
  champion_prediction?: string | null;
  has_transferred: boolean;
  avatar?: string | null;
}

export interface MatchStats {
  h2hSummary: string;
  h2hHistory: { year: string; res: string; winner: string }[];
  teamA: {
    form: ('W' | 'D' | 'L')[];
    temp: number;
    injuries: string[];
  };
  teamB: {
    form: ('W' | 'D' | 'L')[];
    temp: number;
    injuries: string[];
  };
  prediction: {
    winA: number;
    draw: number;
    winB: number;
    advice: string;
    attackA: number;
    attackB: number;
    defenseA: number;
    defenseB: number;
  };
  odds: {
    winA: number;
    draw: number;
    winB: number;
  };
  news: { text: string; url?: string; source?: string }[];
}
