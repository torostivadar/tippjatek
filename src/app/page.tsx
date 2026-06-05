"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/src/hooks/useApp';
import { Navigation } from '@/src/components/Navigation';
import { MatchList } from '@/src/components/MatchList';
import { MatchDetail } from '@/src/components/MatchDetail';
import { Leaderboard } from '@/src/components/Leaderboard';
import { Auth } from '@/src/components/Auth';
import { Icon } from '@/src/components/Icons';
import { Rules } from '@/src/components/Rules';

// Full list of 48 teams in the World Cup
const TEAMS_LIST = [
  'Algéria', 'Anglia', 'Argentína', 'Ausztrália', 'Ausztria',
  'Belgium', 'Bosznia-Hercegovina', 'Brazília', 'Csehország', 'Curaçao',
  'Dél-afrikai Köztársaság', 'Ecuador', 'Egyesült Államok', 'Egyiptom', 'Elefántcsontpart',
  'Franciaország', 'Ghána', 'Haiti', 'Hollandia', 'Horvátország',
  'Irak', 'Irán', 'Japán', 'Jordánia', 'Kanada',
  'Katar', 'Kolumbia', 'Kongói DK', 'Koreai Köztársaság', 'Marokkó',
  'Mexikó', 'Németország', 'Norvégia', 'Panama', 'Paraguay',
  'Portugália', 'Skócia', 'Spanyolország', 'Svájc', 'Szaúd-Arábia',
  'Szenegál', 'Svédország', 'Tunézia', 'Törökország', 'Új-Zéland',
  'Uruguay', 'Üzbegisztán', 'Zöld-foki Köztársaság'
].sort((a, b) => a.localeCompare(b, 'hu'));

export default function Home() {
  const {
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
  } = useApp();

  const [selectedMatchId, setSelectedMatchId] = useState<string>('1');
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);

  // Set default selected match once matches load
  useEffect(() => {
    if (matches.length > 0 && selectedMatchId === '1') {
      // Find the first match that is not finished, or default to match '1'
      const firstUpcoming = matches.find(m => m.status !== 'FINISHED');
      if (firstUpcoming) {
        setSelectedMatchId(firstUpcoming.id);
      }
    }
  }, [matches]);

  const currentProfile = profiles.find(p => p.id === user?.id);
  const showFavoritePrompt = user && currentProfile && !currentProfile.favorite_team;

  // The World Cup starts on June 11, 2026 at 21:00 CEST (19:00 UTC)
  const isBeforeTournamentStart = new Date() < new Date('2026-06-11T19:00:00Z');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <span className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-mid font-mono text-xs uppercase tracking-widest animate-pulse">Adatok betöltése...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Auth />
      </div>
    );
  }

  // Enforce Favorite Team choice before doing anything else
  if (showFavoritePrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-card rounded-3xl shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)] border border-line">
          <div className="text-center mb-6">
            <span className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 mx-auto mb-4 border border-orange-200">
              <Icon name="star" size={24} fill="#F97316" strokeWidth={0} />
            </span>
            <h2 className="text-2xl font-bold text-ink font-display mb-1.5">Válaszd ki a Kedvenc Csapatod!</h2>
            <p className="text-mid text-xs font-semibold uppercase tracking-[0.12em]">Kötelező választani az első meccs előtt</p>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-[12.5px] leading-relaxed mb-6">
            <span className="font-bold">The Fan Factor:</span> Amikor a kedvenc csapatod játszik, arra a meccsre automatikusan **dupla pontot** kapsz (helyes kimenetelért 30 helyett 60, telitalálatért 50 helyett 100 pont)! Ezt a választást a későbbiekben már nem tudod módosítani.
          </div>

          <div className="max-h-60 overflow-y-auto border border-line rounded-2xl p-2 divide-y divide-line nice-scroll bg-wash">
            {TEAMS_LIST.map(team => (
              <button
                key={team}
                onClick={() => {
                  if (confirm(`Biztosan a(z) ${team} csapatot választod kedvencednek? Ezt később nem módosíthatod!`)) {
                    selectFavoriteTeam(team);
                  }
                }}
                className="w-full text-left p-3 text-[13px] font-semibold text-ink hover:bg-white hover:text-accent rounded-xl transition-colors flex items-center justify-between"
              >
                <span>{team}</span>
                <Icon name="chevron" size={12} className="text-faint" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];
  const selectedPrediction = predictions.find(p => p.match_id === selectedMatchId);

  const openTipsCount = matches.filter(m => {
    const isFinished = m.status === 'FINISHED';
    const isTBD = m.team_a.includes('/') || m.team_a.includes('helyezettje') || m.id === '6';
    if (isFinished || isTBD) return false;
    const hasPrediction = predictions.some(p => p.match_id === m.id);
    return !hasPrediction;
  }).length;

  const myRank = profiles.findIndex(p => p.id === user.id) + 1;
  const myPoints = currentProfile?.points ?? 0;

  return (
    <div className="min-h-screen text-ink pb-20">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      <main className="mx-auto px-4 md:px-6 pt-24 pb-28 max-w-[1280px]">
        {/* Header section */}
        <header className="mb-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl md:text-[40px] font-bold text-ink tracking-tight font-display leading-[1.05]">
              {activeTab === 'matches' ? 'Mérkőzések & elemzések' : activeTab === 'leaderboard' ? 'Globális tippbajnokság' : 'Csoportok & Ágrajz'}
            </h1>
            <p className="text-mid text-[13px] mt-2 max-w-xl leading-relaxed">
              {activeTab === 'matches' && 'Válassz meccset a listából, add le a tipped, és mélyülj el az AI-elemzésben, oddsokban és formamutatókban.'}
              {activeTab === 'leaderboard' && 'A barátok pontszámai, telitalálatai és az aktuális helyezésed egy helyen.'}
              {activeTab === 'groups' && 'A torna csoportbeosztása és a kieséses szakasz ágrajza.'}
            </p>
          </div>
          {activeTab === 'matches' && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <Icon name="zap" size={15} className="text-accent" />
                <div className="leading-tight">
                  <div className="font-mono text-[15px] font-bold text-ink tabular-nums">{myPoints}</div>
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint">Pontom</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <Icon name="trophy" size={15} className="text-amber-500" />
                <div className="leading-tight">
                  <div className="font-mono text-[15px] font-bold text-ink tabular-nums">{myRank > 0 ? `${myRank}.` : '-'}</div>
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint">Helyezés</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <Icon name="flame" size={15} className="text-rose-500" />
                <div className="leading-tight">
                  <div className="font-mono text-[15px] font-bold text-ink tabular-nums">{openTipsCount}</div>
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint">Nyitott tipp</div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* 1. MATCHES TAB */}
        {activeTab === 'matches' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div className="md:col-span-1">
              <MatchList
                matches={matches}
                predictions={predictions}
                selectedId={selectedMatchId}
                onSelect={setSelectedMatchId}
                favoriteTeam={currentProfile?.favorite_team}
              />
            </div>
            <div className="md:col-span-2">
              {selectedMatch ? (
                <MatchDetail
                  match={selectedMatch}
                  prediction={selectedPrediction}
                  onSave={savePrediction}
                  favoriteTeam={currentProfile?.favorite_team}
                />
              ) : (
                <div className="rounded-3xl border border-line bg-card p-10 text-center text-faint italic shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)]">
                  Válassz ki egy mérkőzést a bal oldali listából.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {/* World Cup Champion Prediction Card (Active before first match) */}
            {currentProfile && (
              <div className="max-w-2xl mx-auto rounded-3xl border border-line bg-card p-6 shadow-[0_10px_30px_-15px_rgba(16,24,40,0.20)]">
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Icon name="sparkles" size={18} className="text-accent" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-ink font-display">Világbajnok tipp (+150 pont)</h3>
                    {isBeforeTournamentStart ? (
                      <div className="mt-3">
                        <p className="text-[12px] text-mid mb-2.5">
                          Tippeld meg a világbajnokot az első vb meccs kezdete előtt! A helyes tippért a bajnokság végén +150 pont jár.
                        </p>
                        <select
                          value={currentProfile.champion_prediction || ''}
                          onChange={(e) => saveChampionPrediction(e.target.value)}
                          className="p-2.5 bg-wash border border-line2 rounded-xl text-xs font-semibold text-ink focus:outline-none focus:border-accent"
                        >
                          <option value="">-- Válassz világbajnokot --</option>
                          {TEAMS_LIST.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-2 text-[12.5px] text-mid font-medium flex items-center gap-1.5">
                        <span>Leadott tipped:</span>
                        {currentProfile.champion_prediction ? (
                          <span className="font-bold text-accent bg-accent/5 border border-accent/20 px-2 py-0.5 rounded">
                            {currentProfile.champion_prediction}
                          </span>
                        ) : (
                          <span className="text-rose-500 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                            Nem tippeltél időben
                          </span>
                        )}
                        <span className="text-[10px] text-faint italic ml-1">(Az első meccs után a tippek lezárultak).</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Leaderboard profiles={profiles} currentUserId={user.id} />
          </div>
        )}

        {/* 3. GROUPS TAB (Hamarosan...) */}
        {activeTab === 'groups' && (
          <div className="max-w-2xl mx-auto rounded-3xl border border-line bg-card p-10 text-center shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)]">
            <span className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mx-auto mb-5 border border-accent/20">
              <Icon name="calendar" size={28} className="text-accent animate-pulse" />
            </span>
            <h2 className="text-xl font-bold text-ink font-display mb-2">Csoportbeosztás & Ágrajz</h2>
            <p className="text-mid text-[13.5px] max-w-md mx-auto leading-relaxed">
              Hamarosan! A csoportok aktuális állása és az egyenes kieséses szakasz élő ágrajza a csoportkör meccseinek előrehaladtával itt fog megjelenni dinamikusan.
            </p>
          </div>
        )}

        {/* 4. RULES TAB */}
        {activeTab === 'rules' && (
          <Rules />
        )}
      </main>
    </div>
  );
}
