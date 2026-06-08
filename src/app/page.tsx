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
import { CrossroadsModal } from '@/src/components/CrossroadsModal';
import { Groups } from '@/src/components/Groups';
import { TeamProfile } from '@/src/components/TeamProfile';

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
    eliminatedTeams,
    activeTab,
    setActiveTab,
    savePrediction,
    selectFavoriteTeam,
    saveChampionPrediction,
    changeUsername,
    changeAvatar,
    submitCrossroadsChoice,
    teams
  } = useApp();

  const [selectedMatchId, setSelectedMatchId] = useState<string>('1');
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

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
  const isFavoriteTeamEliminated = currentProfile && currentProfile.favorite_team && eliminatedTeams.includes(currentProfile.favorite_team);
  const showCrossroadsBlock = user && currentProfile && isFavoriteTeamEliminated && !currentProfile.has_transferred;

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

  // Enforce Crossroads Modal (Option A or B) if favorite team was knocked out
  if (showCrossroadsBlock && currentProfile?.favorite_team) {
    return (
      <CrossroadsModal
        favoriteTeam={currentProfile.favorite_team}
        eliminatedTeams={eliminatedTeams}
        onSubmitChoice={submitCrossroadsChoice}
      />
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
            <span className="font-bold">The Fan Factor:</span> Amikor a kedvenc csapatod játszik, arra a meccsre automatikusan **dupla pontot** kapsz (helyes kimenetelért 30 helyett 60, telitalálatért 50 helyett 100 pont)! Ezt a választást a világbajnokság első mérkőzésének kezdetéig (2026. június 11. 21:00) szabadon módosíthatod a profilodban, utána viszont véglegessé válik.
          </div>

          <div className="max-h-60 overflow-y-auto border border-line rounded-2xl p-2 divide-y divide-line nice-scroll bg-wash">
            {TEAMS_LIST.map(team => (
              <button
                key={team}
                onClick={() => selectFavoriteTeam(team)}
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
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  const openTipsCount = matches.filter(m => {
    const isFinished = m.status === 'FINISHED';
    const isTBD = m.team_a.includes('/') || m.team_a.includes('helyezettje');
    if (isFinished || isTBD) return false;
    const hasPrediction = predictions.some(p => p.match_id === m.id);
    return !hasPrediction;
  }).length;

  const myRank = profiles.findIndex(p => p.id === user.id) + 1;
  const myPoints = currentProfile?.points ?? 0;

  return (
    <div className="min-h-screen text-ink pb-20">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        username={currentProfile?.username}
        favoriteTeam={currentProfile?.favorite_team}
        championPrediction={currentProfile?.champion_prediction}
        avatar={currentProfile?.avatar}
        onChangeUsername={changeUsername}
        onChangeAvatar={changeAvatar}
        onSaveChampionPrediction={saveChampionPrediction}
        onSelectFavoriteTeam={selectFavoriteTeam}
      />

      <main className="mx-auto px-4 md:px-6 pt-24 pb-28 max-w-[1280px]">
        {/* Header section */}
        <header className="mb-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl md:text-[40px] font-bold text-ink tracking-tight font-display leading-[1.05]">
              {activeTab === 'matches' ? 'Mérkőzések & elemzések' : 
               activeTab === 'leaderboard' ? 'Globális tippbajnokság' : 
               activeTab === 'groups' ? 'Csoportok & Ágrajz' : 'Játékszabály'}
            </h1>
            <p className="text-mid text-[13px] mt-2 max-w-xl leading-relaxed">
              {activeTab === 'matches' && 'Válassz meccset a listából, add le a tipped, és mélyülj el az elemzésekben, oddsokban és formamutatókban.'}
              {activeTab === 'leaderboard' && 'A barátok pontszámai, telitalálatai és az aktuális helyezésed egy helyen.'}
              {activeTab === 'groups' && 'A torna csoportbeosztása és a kieséses szakasz ágrajza.'}
              {activeTab === 'rules' && 'Ismerd meg a pontozási rendszert, a TUTI tippeket, a Fan Factor bónuszt és a kiesési szabályokat.'}
            </p>
          </div>
          {activeTab === 'matches' && (
            <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:items-center md:gap-2.5">
              <div 
                onClick={() => setActiveTab('leaderboard')}
                className="flex items-center gap-1.5 md:gap-2.5 rounded-xl border border-line bg-card px-2 md:px-3.5 py-1.5 md:py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] min-w-0 cursor-pointer hover:bg-wash active:scale-95 transition-all select-none"
              >
                <Icon name="zap" size={13} className="text-accent shrink-0 md:scale-110" />
                <div className="leading-tight min-w-0">
                  <div className="font-mono text-[13px] md:text-[15px] font-bold text-ink tabular-nums truncate">{myPoints}</div>
                  <div className="text-[8.5px] md:text-[9.5px] font-bold uppercase tracking-[0.05em] md:tracking-[0.12em] text-faint truncate">Pontom</div>
                </div>
              </div>
              <div 
                onClick={() => setActiveTab('leaderboard')}
                className="flex items-center gap-1.5 md:gap-2.5 rounded-xl border border-line bg-card px-2 md:px-3.5 py-1.5 md:py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] min-w-0 cursor-pointer hover:bg-wash active:scale-95 transition-all select-none"
              >
                <Icon name="trophy" size={13} className="text-amber-500 shrink-0 md:scale-110" />
                <div className="leading-tight min-w-0">
                  <div className="font-mono text-[13px] md:text-[15px] font-bold text-ink tabular-nums truncate">{myRank > 0 ? `${myRank}.` : '-'}</div>
                  <div className="text-[8.5px] md:text-[9.5px] font-bold uppercase tracking-[0.05em] md:tracking-[0.12em] text-faint truncate">Helyezés</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2.5 rounded-xl border border-line bg-card px-2 md:px-3.5 py-1.5 md:py-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)] min-w-0">
                <Icon name="flame" size={13} className="text-rose-500 shrink-0 md:scale-110" />
                <div className="leading-tight min-w-0">
                  <div className="font-mono text-[13px] md:text-[15px] font-bold text-ink tabular-nums truncate">{openTipsCount}</div>
                  <div className="text-[8.5px] md:text-[9.5px] font-bold uppercase tracking-[0.05em] md:tracking-[0.12em] text-faint truncate">Nyitott tipp</div>
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
                onSelect={(matchId) => {
                  setSelectedMatchId(matchId);
                  setMobileDetailOpen(true);
                }}
                favoriteTeam={currentProfile?.favorite_team}
              />
            </div>
            <div className="hidden md:block md:col-span-2">
              {selectedMatch ? (
                <MatchDetail
                  match={selectedMatch}
                  prediction={selectedPrediction}
                  onSave={savePrediction}
                  favoriteTeam={currentProfile?.favorite_team}
                  teams={teams}
                  onSelectTeam={setSelectedTeamId}
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
            {/* World Cup Champion Prediction Card has been moved to the Profile Dropdown */}

            <Leaderboard profiles={profiles} currentUserId={user.id} />
          </div>
        )}

        {/* 3. GROUPS TAB */}
        {activeTab === 'groups' && (
          <Groups 
            teams={teams}
            matches={matches}
            onSelectTeam={setSelectedTeamId}
          />
        )}

        {/* 4. RULES TAB */}
        {activeTab === 'rules' && (
          <Rules />
        )}
      </main>

      {/* Mobile Match Detail Drawer / Bottom Sheet */}
      {mobileDetailOpen && selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setMobileDetailOpen(false)}
          />
          {/* Sheet Content */}
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-[28px] border-t border-line overflow-hidden flex flex-col shadow-[0_-10px_30px_rgba(16,24,40,0.12)] z-50 animate-in slide-in-from-bottom duration-300">
            {/* Drag Handle Indicator */}
            <div className="flex justify-center py-2.5 shrink-0 bg-wash">
              <div className="w-12 h-1 rounded-full bg-line" />
            </div>

            {/* Close Button Header */}
            <div className="px-4 py-2 border-b border-line flex justify-between items-center bg-wash shrink-0">
              <span className="text-[10px] font-bold text-faint uppercase tracking-wider">Mérkőzés részletei</span>
              <button 
                onClick={() => setMobileDetailOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-line bg-card text-mid hover:text-ink text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Bezárás
              </button>
            </div>

            {/* Scrollable Detail Body */}
            <div className="overflow-y-auto flex-1 nice-scroll">
              <MatchDetail
                match={selectedMatch}
                prediction={selectedPrediction}
                onSave={savePrediction}
                favoriteTeam={currentProfile?.favorite_team}
                teams={teams}
                onSelectTeam={(teamId) => {
                  setSelectedTeamId(teamId);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {selectedTeam && (
        <TeamProfile 
          team={selectedTeam}
          matches={matches}
          predictions={predictions}
          favoriteTeam={currentProfile?.favorite_team}
          onClose={() => setSelectedTeamId(null)}
          onSelectMatch={(matchId) => {
            setSelectedMatchId(matchId);
            setSelectedTeamId(null);
            setActiveTab('matches');
            setMobileDetailOpen(true);
          }}
        />
      )}
    </div>
  );
}
