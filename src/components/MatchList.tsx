import React from 'react';
import { Match, Prediction } from '@/src/types';
import { Icon, FlagBadge } from './Icons';
import { getAbbreviationCode, fmtTime, groupByDay, getGroupTheme } from '@/src/lib/utils';

// Status Pill Colors mapping
const PILL_TONE = {
  exact:    { bg: '#F1ECFD', fg: '#6D28D9', bd: '#DDD0FA' }, // exact match - purple
  outcome:  { bg: '#E9F8EF', fg: '#15803D', bd: '#C2E9CF' }, // outcome match - green
  miss:     { bg: '#FDECEC', fg: '#DC2626', bd: '#F6CACA' }, // missed - red
  none:     { bg: '#F1F4F8', fg: '#64748B', bd: '#E2E8F0' }, // none - grey
  tutiWin:  { bg: '#FBF0DA', fg: '#B45309', bd: '#F1DBA6' }, // tuti win - gold
  tutiLoss: { bg: '#E6E8EC', fg: '#111827', bd: '#C9D0DA' }, // tuti loss - black
  done:     { bg: '#F1F4F8', fg: '#64748B', bd: '#E2E8F0' }, // saved tip - GREY (same as todo, to avoid lila conflicts)
  urgent:   { bg: '#FEF3C7', fg: '#D97706', bd: '#FCD34D' }, // urgent tip - AMBER / FLASHING (to stand out)
  todo:     { bg: '#F1F4F8', fg: '#64748B', bd: '#E2E8F0' }, // normal tip - grey
  wait:     { bg: '#FBF3E3', fg: '#A16207', bd: '#F2E2BC' }, // waiting for teams - light yellow
};

const FAV_COLOR = '#F97316'; // orange star for favorite team

function deriveStatus(match: Match, pred: Prediction | undefined, favoriteTeam?: string | null) {
  const isFinished = match.status === 'FINISHED';
  // Check if team names are placeholders (TBD)
  const isTBD = 
    match.team_a.includes('/') || 
    match.team_a.includes('helyezettje') || 
    match.team_a.startsWith('W-') || 
    match.team_a.startsWith('L-') || 
    match.id === '6'; // Mock placeholder

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
    
    // In real game, outcome = 30p (or 60p for fav), exact = 50p (or 100p for fav)
    if (exact) return { icon: 'trophy', label: `+${isFav ? 100 : 50}`, tone: 'exact' as const, isFav, exact };
    if (outcome) return { icon: 'check', label: `+${isFav ? 60 : 30}`, tone: 'outcome' as const, isFav, outcome };
    return { icon: 'x', label: '0', tone: 'miss' as const, isFav };
  }

  if (isTBD) return { icon: 'lock', label: 'Vár', tone: 'wait' as const, isFav: false };
  if (pred) return { icon: banker ? 'zap' : 'check', label: `${pred.predicted_a}-${pred.predicted_b}`, tone: 'done' as const, isFav, banker };
  if (within72) return { icon: 'flame', label: 'Tippelj!', tone: 'urgent' as const, pulse: true, isFav };
  return { icon: 'pencil', label: 'Tipp', tone: 'todo' as const, isFav };
}

interface MiniStatusProps {
  icon: string;
  label: string;
  tone: keyof typeof PILL_TONE;
  pulse?: boolean;
}

function MiniStatus({ icon, label, tone, pulse }: MiniStatusProps) {
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

interface TeamCodeProps {
  country: string;
  align: 'left' | 'right';
  favoriteTeam?: string | null;
}

function TeamCode({ country, align, favoriteTeam }: TeamCodeProps) {
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

interface MatchRowProps {
  match: Match;
  pred?: Prediction;
  selected: boolean;
  onClick: () => void;
  favoriteTeam?: string | null;
}

function MatchRow({ match, pred, selected, onClick, favoriteTeam }: MatchRowProps) {
  const isFinished = match.status === 'FINISHED';
  const st = deriveStatus(match, pred, favoriteTeam);

  return (
    <button
      onClick={onClick}
      className={`group grid grid-cols-[26px_1fr_80px] items-center gap-1.5 w-full rounded-xl px-2 h-[44px] border-2 transition-all duration-150 cursor-pointer text-left
        ${selected
          ? 'border-accent bg-[#F4F0FE] shadow-[0_8px_20px_-10px_rgba(124,58,237,0.5)]'
          : 'border-line bg-card hover:border-line2 hover:bg-wash'}`}
    >
      <span className={`font-mono text-[11px] font-medium tabular-nums shrink-0 ${selected ? 'text-accent' : 'text-faint'}`}>
        {fmtTime(match.start_time)}
      </span>

      <div className="flex items-center justify-center gap-1.5 min-w-0">
        <TeamCode country={match.team_a} align="right" favoriteTeam={favoriteTeam} />
        <FlagBadge country={match.team_a} size={18} />
        {isFinished ? (
          <span className="font-mono text-[11px] font-bold px-1 py-0.5 rounded shrink-0 tabular-nums whitespace-nowrap bg-ink text-card">
            {match.score_a}:{match.score_b}
          </span>
        ) : (
          <span className="font-mono text-[10px] font-bold text-faint shrink-0 px-0.5 uppercase tracking-wide">vs</span>
        )}
        <FlagBadge country={match.team_b} size={18} />
        <TeamCode country={match.team_b} align="left" favoriteTeam={favoriteTeam} />
      </div>

      <div className="flex justify-end">
        <MiniStatus {...st} />
      </div>
    </button>
  );
}

interface DayHeaderProps {
  label: string;
  count: string;
}

function DayHeader({ label, count }: DayHeaderProps) {
  return (
    <div className="sticky top-0 z-10 -mx-1 px-1">
      <div className="flex items-center gap-2 bg-slate-50/90 backdrop-blur-sm py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-mid">{label}</span>
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[10px] font-bold text-faint">{count}</span>
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    ['#6D28D9', 'Telitalálat (+50/100)'],
    ['#15803D', 'Kimenetel (+30/60)'],
    ['#DC2626', 'Nem talált (0)'],
    ['#B45309', 'TUTI bejött (+100/20)'],
    ['#111827', 'TUTI bukta (-30)'],
    ['#64748B', 'Nem tippelt / Mentett'],
  ];
  return (
    <div className="rounded-xl border border-line bg-card px-3.5 py-3 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-faint mb-2.5">Jelmagyarázat</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {items.map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
            <span className="text-[10.5px] text-mid truncate">{l}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon name="star" size={11} fill={FAV_COLOR} strokeWidth={0} className="shrink-0" />
          <span className="text-[10.5px] text-mid truncate">Kedvenc · Dupla pont</span>
        </div>
      </div>
    </div>
  );
}

interface MatchListProps {
  matches: Match[];
  predictions: Prediction[];
  selectedId: string;
  onSelect: (id: string) => void;
  favoriteTeam?: string | null;
}

export function MatchList({ matches, predictions, selectedId, onSelect, favoriteTeam }: MatchListProps) {
  const days = groupByDay(matches);
  
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border border-line bg-card px-3.5 py-2.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-mid">
          <Icon name="calendar" size={13} className="text-accent" />
          Időrendi lista
        </span>
        <span className="font-mono text-[10px] font-bold text-mid bg-wash border border-line px-2 py-0.5 rounded-full">
          {matches.length} meccs
        </span>
      </div>

      <div className="flex flex-col gap-3 md:max-h-[calc(100vh-320px)] md:overflow-y-auto md:pr-1.5 nice-scroll">
        {days.map((day) => (
          <div key={day.key} className="flex flex-col gap-1.5">
            <DayHeader label={day.label} count={`${day.items.length} meccs`} />
            {day.items.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                pred={predictions.find((p) => p.match_id === m.id)}
                selected={m.id === selectedId}
                onClick={() => onSelect(m.id)}
                favoriteTeam={favoriteTeam}
              />
            ))}
          </div>
        ))}
      </div>

      <Legend />
    </div>
  );
}
