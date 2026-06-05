import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Match, Prediction, Profile, MatchStats } from '@/src/types';
import { User } from '@supabase/supabase-js';

export function useApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard' | 'groups'>('matches');

  // Load User Auth Session
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch initial data once user is authenticated
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ensure user has a profile record
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (profileCheckError || !profileCheck) {
        // Create profile
        const defaultUsername = user!.email?.split('@')[0] || 'Játékos';
        await supabase
          .from('profiles')
          .insert({
            id: user!.id,
            username: defaultUsername,
            points: 0,
            correct_scores: 0,
            correct_outcomes: 0
          });
      }

      // 2. Fetch matches
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .order('start_time', { ascending: true });
      
      setMatches(matchData || []);

      // 3. Fetch predictions for current user
      const { data: predictionData } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user!.id);
      
      setPredictions(predictionData || []);

      // 4. Fetch profiles (leaderboard)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false });
      
      setProfiles(profileData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Realtime Database Subscriptions
  useEffect(() => {
    if (!user) return;

    // Listen to matches updates (e.g. from live score cron jobs)
    const matchesChannel = supabase
      .channel('realtime-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Match;
          setMatches(prev => prev.map(m => m.id === updated.id ? updated : m));
        } else if (payload.eventType === 'INSERT') {
          const inserted = payload.new as Match;
          setMatches(prev => [...prev, inserted].sort((a, b) => a.start_time.localeCompare(b.start_time)));
        }
      })
      .subscribe();

    // Listen to profiles updates (realtime leaderboard points update)
    const profilesChannel = supabase
      .channel('realtime-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Profile;
          setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p).sort((a, b) => b.points - a.points));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user]);

  const savePrediction = async (matchId: string, a: number, b: number, isTuti: boolean = false) => {
    if (!user) return;

    // Check if match is already locked (started)
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    if (new Date(match.start_time) <= new Date()) {
      alert('Ez a mérkőzés már elkezdődött, a tippek zárolva vannak!');
      return;
    }

    // Check TUTI limits
    const isKnockout = match.group === 'Legjobb 32' || match.group === 'Nyolcaddöntő' || match.group === 'Negyeddöntő' || match.group === 'Elődöntő' || match.group === 'Bronzmérkőzés' || match.group === 'Döntő';
    
    // Check how many TUTIs the user has already saved
    if (isTuti) {
      const currentTutis = predictions.filter(p => {
        if (p.match_id === matchId) return false; // ignore current match if updating
        if (!p.is_tuti) return false;
        const m = matches.find(x => x.id === p.match_id);
        if (!m) return false;
        const mKnockout = m.group === 'Legjobb 32' || m.group === 'Nyolcaddöntő' || m.group === 'Negyeddöntő' || m.group === 'Elődöntő' || m.group === 'Bronzmérkőzés' || m.group === 'Döntő';
        return isKnockout ? mKnockout : !mKnockout;
      });

      if (currentTutis.length >= 3) {
        alert(`Már felhasználtad a maximális 3 db TUTI TIPP-edet ebben a szakaszban (${isKnockout ? 'Egyenes kieséses szakasz' : 'Csoportkör'})!`);
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('predictions')
        .upsert({
          match_id: matchId,
          user_id: user.id,
          predicted_a: a,
          predicted_b: b,
          is_tuti: isTuti,
          updated_at: new Date().toISOString()
        }, { onConflict: 'match_id,user_id' })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPredictions(prev => {
          const filtered = prev.filter(p => p.match_id !== matchId);
          return [...filtered, data as Prediction];
        });
      }
    } catch (err) {
      console.error('Error saving prediction:', err);
      alert('Hiba történt a tipp mentése közben!');
    }
  };

  const selectFavoriteTeam = async (teamName: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_team: teamName })
        .eq('id', user.id);
      
      if (error) throw error;
      setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, favorite_team: teamName } : p));
    } catch (err) {
      console.error('Error setting favorite team:', err);
    }
  };

  const saveChampionPrediction = async (teamName: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ champion_prediction: teamName })
        .eq('id', user.id);
      
      if (error) throw error;
      setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, champion_prediction: teamName } : p));
    } catch (err) {
      console.error('Error setting champion prediction:', err);
    }
  };

  return {
    user,
    loading,
    matches,
    predictions,
    profiles,
    activeTab,
    setActiveTab,
    savePrediction,
    selectFavoriteTeam,
    saveChampionPrediction
  };
}
