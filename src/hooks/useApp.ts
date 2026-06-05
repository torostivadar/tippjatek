import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Match, Prediction, Profile } from '@/src/types';
import { User } from '@supabase/supabase-js';

export function useApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard' | 'profile'>('matches');

  useEffect(() => {
    // Mocking user for demo purposes instead of real auth
    setTimeout(() => {
      setUser({
        id: 'user-123',
        email: 'demo@tippjatek.hu',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User);
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    const mockMatches: Match[] = [
      {
        id: '1',
        team_a: 'Magyarország',
        team_b: 'Németország',
        score_a: null,
        score_b: null,
        // Kicked off 25 hours from now (within 72 hour reminder, missing prediction)
        start_time: new Date(Date.now() + 90000000).toISOString(),
        status: 'UPCOMING',
        group: 'A'
      },
      {
        id: '2',
        team_a: 'Brazília',
        team_b: 'Franciaország',
        score_a: 2,
        score_b: 1,
        start_time: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        status: 'FINISHED',
        group: 'B'
      },
      {
        id: '3',
        team_a: 'Argentína',
        team_b: 'Portugália',
        score_a: null,
        score_b: null,
        // Kicked off 71 hours from now (within 72 hour reminder, missing prediction)
        start_time: new Date(Date.now() + 255600000).toISOString(),
        status: 'UPCOMING',
        group: 'C'
      },
      {
        id: '4',
        team_a: 'Spanyolország',
        team_b: 'Anglia',
        score_a: 1,
        score_b: 1,
        start_time: new Date(Date.now() - 172800000).toISOString(),
        status: 'FINISHED',
        group: 'D'
      },
      {
        id: '5',
        team_a: 'Olaszország',
        team_b: 'Horvátország',
        score_a: null,
        score_b: null,
        // Kicked off 6 days from now (outside 72 hours limit)
        start_time: new Date(Date.now() + 3600000 * 24 * 6).toISOString(),
        status: 'UPCOMING',
        group: 'B'
      },
      {
        id: '6',
        team_a: 'B csoport első helyezettje',
        team_b: 'C csoport második helyezettje',
        score_a: null,
        score_b: null,
        // Kicked off 10 days from now
        start_time: new Date(Date.now() + 3600000 * 24 * 10).toISOString(),
        status: 'UPCOMING',
        group: 'Nyolcaddöntő'
      }
    ];

    setMatches(mockMatches);

    // Mock predictions for local user
    setPredictions([
      { id: 'p1', user_id: 'user-123', match_id: '2', predicted_a: 2, predicted_b: 1, points_earned: 3 },
      { id: 'p2', user_id: 'user-123', match_id: '4', predicted_a: 0, predicted_b: 2, points_earned: 1 },
    ]);

    // Mock profiles
    setProfiles([
      { id: 'p_1', username: 'Kovács Ádám', points: 154 },
      { id: 'p_2', username: 'Nagy Balázs', points: 142 },
      { id: 'p_3', username: 'Szabó Zoltán', points: 128 },
      { id: 'p_4', username: 'Tóth Erika', points: 96 },
      { id: 'user-123', username: 'Te (Demo)', points: 42 },
      { id: 'p_5', username: 'Varga Péter', points: 38 },
    ]);
  };

  const savePrediction = async (matchId: string, a: number, b: number) => {
    const newPrediction: Prediction = {
      id: Math.random().toString(),
      user_id: user?.id || 'guest',
      match_id: matchId,
      predicted_a: a,
      predicted_b: b
    };

    setPredictions(prev => {
      const existing = prev.findIndex(p => p.match_id === matchId);
      if (existing > -1) {
        const next = [...prev];
        next[existing] = newPrediction;
        return next;
      }
      return [...prev, newPrediction];
    });

    // In production:
    // await supabase.from('predictions').upsert({ match_id: matchId, user_id: user.id, predicted_a: a, predicted_b: b });
  };

  return {
    user,
    loading,
    matches,
    predictions,
    profiles,
    activeTab,
    setActiveTab,
    savePrediction
  };
}
