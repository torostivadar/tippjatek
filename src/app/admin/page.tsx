"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Match } from '@/src/types';
import { Icon, FlagBadge } from '@/src/components/Icons';
import { getAbbreviationCode, fmtLong } from '@/src/lib/utils';
import { User } from '@supabase/supabase-js';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  
  // Scoring inputs
  const [scoreA, setScoreA] = useState<string>('');
  const [scoreB, setScoreB] = useState<string>('');
  const [status, setStatus] = useState<'NOT_STARTED' | 'LIVE' | 'FINISHED'>('NOT_STARTED');
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Authenticate user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch matches once authenticated as admin
  useEffect(() => {
    if (user && user.email === 'tools.claudius@gmail.com') {
      fetchMatches();
    }
  }, [user]);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('id', { ascending: true }); // ID ordering to easily find matches 1-104

    if (data) {
      // Cast the string IDs to numbers to sort numerically (1, 2, ..., 104)
      const sorted = [...data].sort((a, b) => Number(a.id) - Number(b.id));
      setMatches(sorted);
    }
  };

  const selectMatch = (m: Match) => {
    setSelectedMatch(m);
    setScoreA(m.score_a !== null ? String(m.score_a) : '');
    setScoreB(m.score_b !== null ? String(m.score_b) : '');
    setStatus(m.status);
    setSuccessMsg('');
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;
    setSubmitting(true);
    setSuccessMsg('');

    try {
      // Get current Supabase session token for Bearer authentication
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        alert('Nincs érvényes munkamenet token!');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/admin/score-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          scoreA: scoreA === '' ? null : Number(scoreA),
          scoreB: scoreB === '' ? null : Number(scoreB),
          status
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Mentési hiba');
      }

      setSuccessMsg('Mérkőzés eredménye mentve és a pontszámítás lefutott!');
      
      // Update local state
      setMatches(prev => prev.map(m => m.id === selectedMatch.id ? {
        ...m,
        score_a: scoreA === '' ? null : Number(scoreA),
        score_b: scoreB === '' ? null : Number(scoreB),
        status
      } : m));

      setSelectedMatch(null);

    } catch (err: any) {
      console.error(err);
      alert('Hiba: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check admin access (only tools.claudius@gmail.com is allowed)
  if (!user || user.email !== 'tools.claudius@gmail.com') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-center">
        <span className="w-12 h-12 bg-red-100 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mb-4">
          <Icon name="shield" size={24} className="text-red-600" />
        </span>
        <h1 className="text-2xl font-bold text-ink font-display mb-1.5">403 - Hozzáférés megtagadva</h1>
        <p className="text-mid text-sm max-w-sm mb-6">
          Ez a felület védett, csak az adminisztrátori e-mail címmel érhető el.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
        >
          Kijelentkezés
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-ink">
      <nav className="fixed top-0 inset-x-0 h-16 z-50 px-4 md:px-6 flex items-center justify-between border-b border-line bg-card/85 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white">
            <Icon name="shield" size={20} />
          </span>
          <div className="leading-none">
            <span className="font-display font-bold text-[15px] tracking-tight text-ink">TIPPJÁTÉK ADMIN</span>
            <span className="ml-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-red-500 align-middle">B-TERV</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-4 py-2 bg-wash border border-line rounded-xl text-[11px] font-bold uppercase tracking-[0.1em] text-mid hover:text-ink transition-colors flex items-center gap-1.5"
          >
            <Icon name="whistle" size={14} /> Játék felület
          </a>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2 text-faint hover:text-rose-600 transition-colors"
            title="Kijelentkezés"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </nav>

      <main className="mx-auto px-4 md:px-6 pt-24 pb-28 max-w-[1280px]">
        <header className="mb-7">
          <h1 className="text-3xl font-bold font-display text-ink tracking-tight">Eredmények Manuális Rögzítése</h1>
          <p className="text-mid text-[13px] mt-2">
            Ha a torna alatt az automatikus API-Football szinkronizáció lehalna, itt manuálisan is lezárhatod a mérkőzéseket. A pontszámítás a gombnyomásra azonnal lefut az összes tippre.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Match selector (2/3 width) */}
          <div className="lg:col-span-2 rounded-3xl border border-line bg-card p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-mid mb-4">Mérkőzések listája (1 - 104)</h2>
            
            <div className="max-h-[600px] overflow-y-auto divide-y divide-line nice-scroll bg-wash rounded-2xl border border-line">
              {matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => selectMatch(m)}
                  className={`w-full text-left p-3 flex flex-wrap items-center justify-between gap-4 transition-colors hover:bg-white
                    ${selectedMatch?.id === m.id ? 'bg-[#F4F0FE] hover:bg-[#F4F0FE]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-faint">#{m.id}</span>
                    <span className="font-mono text-[11px] text-mid">{new Date(m.start_time).toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    <div className="flex items-center gap-2">
                      <FlagBadge country={m.team_a} size={16} />
                      <span className="font-bold text-[13px] text-ink">{getAbbreviationCode(m.team_a)}</span>
                      <span className="text-xs text-faint">vs</span>
                      <FlagBadge country={m.team_b} size={16} />
                      <span className="font-bold text-[13px] text-ink">{getAbbreviationCode(m.team_b)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {m.status === 'FINISHED' ? (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-ink text-card rounded">
                        {m.score_a} : {m.score_b}
                      </span>
                    ) : m.status === 'LIVE' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 border border-red-200 rounded animate-pulse">
                        LIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded">
                        Vár
                      </span>
                    )}
                    <span className="text-[10px] font-semibold bg-white border border-line px-2 py-0.5 rounded-full text-faint">
                      {m.group}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scoring panel (1/3 width) */}
          <div className="lg:col-span-1">
            {selectedMatch ? (
              <form onSubmit={handleScoreSubmit} className="rounded-3xl border border-line bg-card p-6 shadow-md space-y-5">
                <div className="pb-3 border-b border-line">
                  <h3 className="font-bold font-display text-[15px] text-ink">#{selectedMatch.id} meccs lezárása</h3>
                  <p className="text-xs text-faint mt-1">
                    {selectedMatch.team_a} vs {selectedMatch.team_b}
                  </p>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold">
                    {successMsg}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-faint uppercase tracking-wider">
                    Mérkőzés státusza
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 bg-wash border border-line2 rounded-2xl focus:outline-none focus:border-accent text-sm font-semibold"
                  >
                    <option value="NOT_STARTED">NOT_STARTED (Nincs elkezdve)</option>
                    <option value="LIVE">LIVE (Zajlik)</option>
                    <option value="FINISHED">FINISHED (Befejeződött)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-faint uppercase tracking-wider truncate">
                      {getAbbreviationCode(selectedMatch.team_a)} gólok
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={scoreA}
                      onChange={(e) => setScoreA(e.target.value)}
                      disabled={status !== 'FINISHED'}
                      className="w-full p-3 bg-wash border border-line2 rounded-2xl text-center focus:outline-none focus:border-accent font-bold font-mono text-lg disabled:opacity-50"
                      placeholder="-"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-faint uppercase tracking-wider truncate">
                      {getAbbreviationCode(selectedMatch.team_b)} gólok
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={scoreB}
                      onChange={(e) => setScoreB(e.target.value)}
                      disabled={status !== 'FINISHED'}
                      className="w-full p-3 bg-wash border border-line2 rounded-2xl text-center focus:outline-none focus:border-accent font-bold font-mono text-lg disabled:opacity-50"
                      placeholder="-"
                    />
                  </div>
                </div>

                {status === 'FINISHED' && (scoreA === '' || scoreB === '') && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl font-medium leading-relaxed">
                    FINISHED státuszban meg kell adni a gólok számát a pontszámításhoz!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || (status === 'FINISHED' && (scoreA === '' || scoreB === ''))}
                  className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-[12px] uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:brightness-105 active:brightness-95 transition-all shadow-[0_12px_28px_-12px_rgba(124,58,237,0.7)] disabled:bg-slate-300 disabled:shadow-none"
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Mentés & Pontszámítás <Icon name="save" size={14} /></>
                  )}
                </button>
              </form>
            ) : (
              <div className="rounded-3xl border border-dashed border-line2 p-10 text-center text-faint italic bg-wash">
                Kattints egy mérkőzésre a listából a szerkesztéshez és lezáráshoz.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
