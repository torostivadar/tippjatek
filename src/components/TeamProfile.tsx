import React from 'react';
import { Team, Match, Prediction } from '@/src/types';
import { FlagBadge, Icon } from './Icons';
import { getAbbreviationCode, fmtTime } from '@/src/lib/utils';

function heatColor(v: number) {
  v = Math.max(0, Math.min(100, v));
  const blue = [59, 130, 246], purple = [124, 58, 237], red = [239, 68, 68];
  if (v <= 50) return `rgb(${blue[0]},${blue[1]},${blue[2]})`;
  let t = 0;
  let a = blue, b = purple;
  if (v <= 75) {
    t = (v - 50) / 25;
  } else {
    a = purple;
    b = red;
    t = (v - 75) / 25;
  }
  const m = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

function heatWord(v: number) {
  return v < 50 ? 'Hideg' : v < 68 ? 'Langyos' : v < 84 ? 'Meleg' : 'Forró';
}

function fmtMatchDate(dateStr: string | Date): string {
  try {
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}.${day}.`;
  } catch {
    return '';
  }
}

function TempGauge({ value, size = 120 }: { value: number; size?: number }) {
  const r = 42, C = 2 * Math.PI * r;
  const off = C * (1 - Math.max(0, Math.min(100, value)) / 100);
  const color = heatColor(value);
  return (
    <div className="relative shrink-0 animate-in fade-in zoom-in-95 duration-500" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E9EEF5" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-display font-extrabold text-ink" style={{ fontSize: size * 0.33 }}>{value}</span>
        <span className="font-bold uppercase tracking-[0.05em] mt-1" style={{ fontSize: size * 0.085, color }}>{heatWord(value)}</span>
      </div>
    </div>
  );
}

const PILL_TONE = {
  exact:    { bg: '#F1ECFD', fg: '#6D28D9', bd: '#DDD0FA' },
  outcome:  { bg: '#E9F8EF', fg: '#15803D', bd: '#C2E9CF' },
  miss:     { bg: '#FDECEC', fg: '#DC2626', bd: '#F6CACA' },
  none:     { bg: '#F1F4F8', fg: '#64748B', bd: '#E2E8F0' },
  tutiWin:  { bg: '#FBF0DA', fg: '#B45309', bd: '#F1DBA6' },
  tutiLoss: { bg: '#E6E8EC', fg: '#111827', bd: '#C9D0DA' },
  done:     { bg: '#F1F4F8', fg: '#64748B', bd: '#E2E8F0' },
  urgent:   { bg: '#FEF3C7', fg: '#D97706', bd: '#FCD34D' },
  todo:     { bg: '#F1F4F8', fg: '#64748B', bd: '#E2E8F0' },
  wait:     { bg: '#FBF3E3', fg: '#A16207', bd: '#F2E2BC' },
};

const FAV_COLOR = '#F97316';

function deriveStatus(match: Match, pred: Prediction | undefined, favoriteTeam?: string | null) {
  const isFinished = match.status === 'FINISHED';
  const isTBD = 
    match.team_a.includes('/') || 
    match.team_a.includes('helyezettje') || 
    match.team_a.startsWith('W-') || 
    match.team_a.startsWith('L-');

  const ms = new Date(match.start_time).getTime() - Date.now();
  const within72 = ms > 0 && ms <= 72 * 3600000;
  const isFav = !!(favoriteTeam && (match.team_a === favoriteTeam || match.team_b === favoriteTeam));
  const banker = !!(pred && pred.is_tuti);

  if (isFinished && match.score_a !== null && match.score_b !== null) {
    if (!pred) return { icon: 'minus', label: 'Nincs', tone: 'none' as const, isFav };
    const aA = match.score_a, aB = match.score_b, pA = pred.predicted_a, pB = pred.predicted_b;
    const exact = aA === pA && aB === pB;
    const outcome = (aA > aB && pA > pB) || (aA < aB && pA < pB) || (aA === aB && pA === pB);

    if (banker) {
      if (exact || outcome) return { icon: 'zap', label: 'TUTI', tone: 'tutiWin' as const, isFav, banker };
      return { icon: 'zap', label: 'TUTI', tone: 'tutiLoss' as const, isFav, banker };
    }
    if (exact) return { icon: 'trophy', label: `+${isFav ? 100 : 50}`, tone: 'exact' as const, isFav, exact };
    if (outcome) return { icon: 'check', label: `+${isFav ? 60 : 30}`, tone: 'outcome' as const, isFav, outcome };
    return { icon: 'x', label: '0', tone: 'miss' as const, isFav };
  }

  if (isTBD) return { icon: 'lock', label: 'Vár', tone: 'wait' as const, isFav: false };
  if (pred) return { icon: banker ? 'zap' : 'check', label: `${pred.predicted_a}-${pred.predicted_b}`, tone: 'done' as const, isFav, banker };
  if (within72) return { icon: 'flame', label: 'Tippelj!', tone: 'urgent' as const, pulse: true, isFav };
  return { icon: 'pencil', label: 'Tipp', tone: 'todo' as const, isFav };
}

function MiniStatus({ icon, label, tone, pulse }: { icon: string; label: string; tone: keyof typeof PILL_TONE; pulse?: boolean }) {
  const t = PILL_TONE[tone] || PILL_TONE.none;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md pl-1.5 pr-2 py-1 text-[10px] font-bold tabular-nums shrink-0 border whitespace-nowrap ${pulse ? 'animate-pulse' : ''}`}
      style={{ background: t.bg, color: t.fg, borderColor: t.bd }}
    >
      <Icon name={icon} size={11} strokeWidth={2.6} />
      <span className="font-mono">{label}</span>
    </span>
  );
}

function TeamCode({ country, align, favoriteTeam }: { country: string; align: 'left' | 'right'; favoriteTeam?: string | null }) {
  const isFav = favoriteTeam && country === favoriteTeam;
  const star = isFav && <Icon name="star" size={9} fill={FAV_COLOR} strokeWidth={0} className="shrink-0" />;
  return (
    <span className={`flex items-center gap-0.5 min-w-0 ${align === 'right' ? 'justify-end' : ''}`}>
      {align === 'right' && star}
      <span className="font-display text-[12.5px] font-bold truncate max-w-[72px] text-ink">
        {getAbbreviationCode(country)}
      </span>
      {align === 'left' && star}
    </span>
  );
}

interface TeamProfileProps {
  team: Team;
  matches: Match[];
  predictions: Prediction[];
  favoriteTeam?: string | null;
  onClose: () => void;
  onSelectMatch?: (matchId: string) => void;
}

export function TeamProfile({ team, matches, predictions, favoriteTeam, onClose, onSelectMatch }: TeamProfileProps) {
  const teamMatches = matches
    .filter(m => m.team_a === team.name || m.team_b === team.name)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  // Temperature color helper
  const getTempColor = (temp: number | null | undefined) => {
    if (temp === undefined || temp === null) return 'text-slate-400';
    if (temp >= 75) return 'text-rose-500';
    if (temp >= 55) return 'text-orange-500';
    if (temp >= 35) return 'text-amber-500';
    return 'text-blue-500';
  };

  const getTempBg = (temp: number | null | undefined) => {
    if (temp === undefined || temp === null) return 'bg-slate-100';
    if (temp >= 75) return 'bg-rose-500';
    if (temp >= 55) return 'bg-orange-500';
    if (temp >= 35) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_70px_-15px_rgba(16,24,40,0.25)] border border-line overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600" />

        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-line flex items-center justify-between gap-4 pt-8 shrink-0 bg-wash">
          <div className="flex items-center gap-4 min-w-0">
            <div className="shadow-md rounded-2xl overflow-hidden bg-white p-1 border border-line shrink-0">
              <FlagBadge country={team.name} size={48} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-bold text-ink tracking-tight font-display">
                  {team.name}
                </h2>
                {team.group_letter && (
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                    {team.group_letter} Csoport
                  </span>
                )}
              </div>
              <p className="text-mid text-xs font-semibold uppercase tracking-[0.12em] mt-1.5 flex items-center gap-1.5">
                <span>{team.name_en}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-line bg-card flex items-center justify-center text-mid hover:text-ink hover:bg-wash hover:scale-105 transition-all shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <Icon name="chevron" size={16} className="rotate-90 text-faint" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 md:p-8 overflow-y-auto nice-scroll flex-1">
          
          {/* Section 1: Ratings, FIFA info, Temperature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            
            {/* AI Strengths (Attack & Defense) & FIFA info stack */}
            <div className="space-y-5">
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint flex items-center gap-2">
                  <Icon name="target" size={14} className="text-indigo-500" />
                  Csapaterősség (AI)
                </h4>
                
                {/* Attack Strength */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-ink">Támadóerő</span>
                    <span className="text-indigo-600 font-mono">{team.attack_rating || 50}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${team.attack_rating || 50}%` }}
                    />
                  </div>
                </div>

                {/* Defense Strength */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-ink">Védelmi erő</span>
                    <span className="text-rose-500 font-mono">{team.defense_rating || 50}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${team.defense_rating || 50}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* FIFA Ranking & Points Card */}
              <div className="bg-wash border border-line rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Icon name="award" size={20} strokeWidth={2.4} />
                  </span>
                  <div>
                    <span className="block text-[9px] font-bold text-faint uppercase tracking-wider">FIFA Helyezés</span>
                    <span className="block text-lg font-extrabold text-ink font-display">#{team.fifa_ranking || '-'}</span>
                  </div>
                </div>
                <div className="text-right border-l border-line pl-4">
                  <span className="block text-[9px] font-bold text-faint uppercase tracking-wider">FIFA Pontszám</span>
                  <span className="block text-lg font-extrabold text-ink font-mono tabular-nums">
                    {team.fifa_points ? Math.round(parseFloat(team.fifa_points)).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Temperature circular gauge (Matches MatchDetail style) */}
            <div className="space-y-4 flex flex-col">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint flex items-center gap-2">
                <Icon name="flame" size={14} className={getTempColor(team.temperature)} />
                Csapat Hőfoka (AI)
              </h4>
              
              <div className="flex flex-col items-center justify-center text-center gap-3.5 flex-1 py-1">
                <TempGauge value={team.temperature ?? 50} size={115} />
                <div className="space-y-1 max-w-[280px]">
                  <span className="block text-[10px] font-bold text-ink uppercase tracking-wider">Aktuális Forma & Hangulat</span>
                  <p className="text-[11.5px] leading-relaxed text-mid font-semibold">
                    {team.temperature && team.temperature >= 75 ? '🔥 Extrém forró hangulat. Kimagasló forma és önbizalom.' :
                     team.temperature && team.temperature >= 55 ? '☀️ Jó hangulat és stabil csapatmorál.' :
                     team.temperature && team.temperature >= 35 ? '☁️ Átlagos, ingadozó forma.' :
                     '❄️ Fagyos hangulat, morális problémák vagy sérüléshullám.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Recent Form & Injuries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-line py-6">
            
            {/* Recent Form (FIFA) */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint flex items-center gap-2">
                <Icon name="trophy" size={14} className="text-amber-500" />
                Utolsó 5 Eredmény (FIFA)
              </h4>
              
              <div className="flex items-center gap-2.5">
                {team.form && team.form.length > 0 ? (
                  team.form.map((res, i) => (
                    <span 
                      key={i}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-extrabold font-mono border shadow-sm ${
                        res === 'W' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                        res === 'D' ? 'bg-slate-50 border-slate-200 text-slate-500' :
                        'bg-rose-50 border-rose-200 text-rose-600'
                      }`}
                    >
                      {res}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-faint italic font-semibold">Nincs elérhető formaadat</span>
                )}
              </div>
            </div>

            {/* Injuries */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint flex items-center gap-2">
                <Icon name="zap" size={14} className="text-rose-500" />
                Sérültek & Hiányzók
              </h4>
              
              <div className="max-h-28 overflow-y-auto border border-line rounded-2xl p-3 bg-wash nice-scroll">
                {team.injuries && team.injuries.length > 0 ? (
                  <ul className="space-y-1.5">
                    {team.injuries.map((injury, i) => (
                      <li key={i} className="text-xs font-semibold text-ink flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="truncate">{injury}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-emerald-600 font-bold flex items-center gap-2 py-1">
                    <Icon name="star" size={14} className="text-emerald-500" />
                    Minden játékos bevethető (nincs sérült)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: News */}
          <div className="border-t border-line py-6 space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint flex items-center gap-2">
              <Icon name="newspaper" size={14} className="text-blue-500" />
              Friss Hírek & Jelentések
            </h4>
            
            <div className="space-y-2.5">
              {team.news && team.news.length > 0 ? (
                team.news.map((n, i) => {
                  const getDomain = (url: string) => {
                    try {
                      return new URL(url).hostname.replace('www.', '');
                    } catch {
                      return 'Forrás';
                    }
                  };
                  const sourceName = n.source || (n.url ? getDomain(n.url) : null);
                  return (
                    <div key={i} className="flex gap-3 rounded-2xl border border-line bg-card p-3.5 items-start">
                      <span className="w-8 h-8 rounded-full bg-wash border border-line flex items-center justify-center shrink-0 mt-0.5">
                        <Icon name="newspaper" size={13} className="text-mid" />
                      </span>
                      <div className="flex flex-col gap-1 leading-relaxed">
                        <p className="text-[12.5px] text-ink/85">{n.text}</p>
                        {sourceName && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {n.url ? (
                              <a
                                href={n.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10.5px] font-bold text-accent hover:underline"
                              >
                                <span>Forrás: {sourceName}</span>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="inline-block shrink-0"
                                >
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-[10.5px] font-bold text-faint">
                                Forrás: {sourceName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-faint italic font-semibold text-center py-4 bg-wash rounded-2xl border border-line">
                  Nincsenek friss hírek a csapattal kapcsolatban.
                </div>
              )}
            </div>
          </div>

          {/* Section 3.5: Matches on the tournament */}
          <div className="border-t border-line py-6 space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint flex items-center gap-2">
              <Icon name="calendar" size={14} className="text-accent" />
              Mérkőzések a tornán
            </h4>
            <div className="flex flex-col gap-1.5">
              {teamMatches.map((m) => {
                const pred = predictions.find(p => p.match_id === m.id);
                const st = deriveStatus(m, pred, favoriteTeam);
                const isFinished = m.status === 'FINISHED';
                const clickable = !!onSelectMatch;
                
                return (
                  <button
                    key={m.id}
                    onClick={() => clickable && onSelectMatch(m.id)}
                    className="group grid grid-cols-[40px_1fr_80px] items-center gap-1.5 w-full rounded-xl px-2 h-[44px] border-2 border-line bg-card hover:border-line2 hover:bg-wash transition-all cursor-pointer text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                  >
                    <span className="font-mono text-[11px] font-medium text-faint shrink-0 tabular-nums">
                      {fmtMatchDate(m.start_time)}
                    </span>

                    <div className="flex items-center justify-center gap-1.5 min-w-0">
                      <TeamCode country={m.team_a} align="right" favoriteTeam={favoriteTeam} />
                      <FlagBadge country={m.team_a} size={18} />
                      {isFinished ? (
                        <span className="font-mono text-[11px] font-bold px-1 py-0.5 rounded shrink-0 tabular-nums whitespace-nowrap bg-ink text-card">
                          {m.score_a}:{m.score_b}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] font-bold text-faint shrink-0 px-0.5 uppercase tracking-wide">vs</span>
                      )}
                      <FlagBadge country={m.team_b} size={18} />
                      <TeamCode country={m.team_b} align="left" favoriteTeam={favoriteTeam} />
                    </div>

                    <div className="flex justify-end">
                      <MiniStatus {...st} />
                    </div>
                  </button>
                );
              })}
              {teamMatches.length === 0 && (
                <div className="text-xs text-faint italic py-2">Nincsenek mérkőzések ehhez a csapathoz.</div>
              )}
            </div>
          </div>

          {/* Section 4: Squad (Keret) */}
          {team.squad && (
            <div className="border-t border-line pt-6 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.15em] text-faint flex items-center gap-2">
                <Icon name="users" size={14} className="text-accent" />
                Hivatalos Keret & Szövetségi Kapitány
              </h4>

              {team.squad.manager && (
                <div className="bg-wash border border-line rounded-2xl p-4 flex items-center gap-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <span className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <Icon name="whistle" size={18} strokeWidth={2.4} />
                  </span>
                  <div>
                    <span className="block text-[9px] font-bold text-faint uppercase tracking-wider">Szövetségi Kapitány</span>
                    <span className="block text-sm font-bold text-ink">{team.squad.manager}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Kapusok', players: team.squad.goalkeepers, icon: 'hand', color: 'text-indigo-500' },
                  { title: 'Védők', players: team.squad.defenders, icon: 'shield', color: 'text-blue-500' },
                  { title: 'Középpályások', players: team.squad.midfielders, icon: 'antenna', color: 'text-emerald-500' },
                  { title: 'Támadók', players: team.squad.forwards, icon: 'target', color: 'text-rose-500' },
                ].map((pos) => (
                  <div key={pos.title} className="border border-line rounded-2xl p-4 bg-wash/30 flex flex-col gap-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                    <div className="flex items-center gap-2 pb-2 border-b border-line">
                      <Icon name={pos.icon} size={13} className={pos.color} />
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">{pos.title}</span>
                      <span className="ml-auto font-mono text-[10px] font-bold text-faint bg-wash border border-line px-1.5 py-0.2 rounded-md">
                        {pos.players?.length || 0}
                      </span>
                    </div>
                    <ul className="divide-y divide-line/40 max-h-48 overflow-y-auto nice-scroll pr-1">
                      {pos.players && pos.players.length > 0 ? (
                        pos.players.map((p, i) => {
                          const matchNum = p.match(/^(\d+)\s+(.*)$/);
                          let num = '';
                          let name = p;
                          if (matchNum) {
                            num = matchNum[1];
                            name = matchNum[2];
                          }
                          return (
                            <li key={i} className="py-1.5 text-xs text-ink/90 font-medium flex items-start gap-1.5 truncate">
                              {num && <span className="text-faint select-none font-mono font-semibold text-[10px] shrink-0 mt-0.5 w-5">{num}</span>}
                              <span className="truncate">{name}</span>
                            </li>
                          );
                        })
                      ) : (
                        <li className="py-2 text-xs text-faint italic">Nincs megadva játékos.</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-wash border-t border-line text-center text-[10px] font-semibold text-faint shrink-0">
          Adatok utoljára frissítve: {team.updated_at ? new Date(team.updated_at).toLocaleString('hu-HU') : 'N/A'}
        </div>

      </div>
    </div>
  );
}
