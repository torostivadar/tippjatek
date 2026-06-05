import React, { useState, useEffect } from 'react';
import { Match, Prediction, MatchStats } from '@/src/types';
import { Icon, FlagBadge } from './Icons';
import { supabase } from '@/src/lib/supabase';
import { getAbbreviationCode, fmtLong, getGroupTheme } from '@/src/lib/utils';

// Embedded mock data for statistics fallback
const MOCK_STATS_DATABASE: Record<string, MatchStats> = {
  '1': {
    h2hSummary: "A két csapat legutóbbi 5 mérkőzéséből Németország 2-t nyert, Magyarország 1-et, és 2 alkalommal döntetlen született.",
    h2hHistory: [
      { year: '2024', res: 'GER 2 - 0 HUN', winner: 'GER' },
      { year: '2022', res: 'GER 0 - 1 HUN', winner: 'HUN' },
      { year: '2022', res: 'HUN 1 - 1 GER', winner: 'draw' },
      { year: '2021', res: 'GER 2 - 2 HUN', winner: 'draw' },
    ],
    teamA: { form: ['W', 'D', 'W', 'L', 'W'], temp: 72, injuries: ['Sallai Roland (csere)', 'Styles Callum'] },
    teamB: { form: ['W', 'W', 'D', 'W', 'W'], temp: 94, injuries: ['Serge Gnabry', 'Leroy Sané'] },
    prediction: { winA: 18, draw: 27, winB: 55, advice: "Németország hazai környezetben esélyes, de a fegyelmezett magyar védekezés szoros meccset hozhat.", attackA: 68, attackB: 89, defenseA: 78, defenseB: 82 },
    odds: { winA: 4.90, draw: 3.85, winB: 1.62 },
    news: ["Rossi: 'A fegyelmezettség a kulcs.'", "Nagelsmann: 'Mindig szenvedünk Rossi csapata ellen.'"]
  },
  '2': {
    h2hSummary: "Kiegyenlített rangadó. Az utolsó 3 találkozásból 1 francia, 1 brazil győzelem és 1 döntetlen.",
    h2hHistory: [
      { year: '2018', res: 'FRA 4 - 3 BRA', winner: 'FRA' },
      { year: '2015', res: 'BRA 3 - 1 FRA', winner: 'BRA' },
    ],
    teamA: { form: ['W', 'W', 'W', 'L', 'W'], temp: 84, injuries: ['Neymar Jr. (boka rehabilitáció)'] },
    teamB: { form: ['W', 'L', 'W', 'W', 'D'], temp: 78, injuries: ['Lucas Hernandez'] },
    prediction: { winA: 42, draw: 24, winB: 34, advice: "Igazi döntőnek beillő rangadó. Mindkét csapat rendkívül kreatív elöl, gólváltás várható.", attackA: 92, attackB: 88, defenseA: 75, defenseB: 80 },
    odds: { winA: 2.25, draw: 3.40, winB: 2.65 },
    news: ["Mbappé maszkban lép pályára.", "Vinícius Jr. szabadrúgás-párbajjal hangolt."]
  }
};

const RESULT_TONE = {
  exact:    { bg: 'rgba(124,58,237,0.07)', pillBg: '#7C3AED', ic: '#7C3AED', icon: 'trophy' }, // exact - purple
  outcome:  { bg: 'rgba(21,163,74,0.07)',  pillBg: '#16A34A', ic: '#16A34A', icon: 'check' },  // outcome - green
  miss:     { bg: 'rgba(220,38,38,0.06)',  pillBg: '#DC2626', ic: '#DC2626', icon: 'x' },      // miss - red
  none:     { bg: '#F7F9FC',               pillBg: '#64748B', ic: '#8C97A8', icon: 'minus' },  // none - grey
  tutiWin:  { bg: 'rgba(217,119,6,0.10)',  pillBg: '#D97706', ic: '#B45309', icon: 'zap' },    // tuti win - gold
  tutiLoss: { bg: 'rgba(17,24,39,0.05)',   pillBg: '#111827', ic: '#111827', icon: 'zap' },    // tuti loss - black
};

const BADGE_TONE = {
  tutiWin: { bg: '#FBF0DA', fg: '#B45309', bd: '#F1DBA6' },
  tutiLoss: { bg: '#E6E8EC', fg: '#111827', bd: '#C9D0DA' },
  fav: { bg: 'transparent', fg: '#EA580C', bd: 'transparent' },
};

function computeResult(match: Match, prediction: Prediction | undefined, favoriteTeam?: string | null) {
  if (!prediction) {
    return { has: false, exact: false, outcome: false, banker: false, favourite: false, total: 0, badges: [], title: 'Nem tippeltél erre a meccsre.', tone: 'none' as const };
  }

  const aA = match.score_a, aB = match.score_b;
  const pA = prediction.predicted_a, pB = prediction.predicted_b;
  if (aA === null || aB === null) return null;

  const exact = aA === pA && aB === pB;
  const outcome = (aA > aB && pA > pB) || (aA < aB && pA < pB) || (aA === aB && pA === pB);
  const banker = prediction.is_tuti;
  const isFav = !!(favoriteTeam && (match.team_a === favoriteTeam || match.team_b === favoriteTeam));

  let total = 0;
  let tone: 'exact' | 'outcome' | 'miss' | 'tutiWin' | 'tutiLoss' = 'miss';
  let title = '';
  const badges: { label: string; tone: 'tutiWin' | 'tutiLoss' | 'fav' }[] = [];

  if (banker) {
    if (exact) {
      total = 100;
      tone = 'tutiWin';
      title = 'TUTI TIPP telitalálat — kiemelkedő +100 pont!';
      badges.push({ label: 'TUTI telitalálat +100', tone: 'tutiWin' });
    } else if (outcome) {
      total = 20;
      tone = 'tutiWin';
      title = 'TUTI TIPP kimenetel — +20 pont.';
      badges.push({ label: 'TUTI kimenetel +20', tone: 'tutiWin' });
    } else {
      total = -30;
      tone = 'tutiLoss';
      title = 'TUTI TIPP mellé — büntetés −30 pont!';
      badges.push({ label: 'TUTI bukta −30', tone: 'tutiLoss' });
    }
  } else {
    if (exact) {
      total = 50;
      tone = 'exact';
      title = 'Tökéletes telitalálat — +50 pont!';
    } else if (outcome) {
      total = 30;
      tone = 'outcome';
      title = 'Eltaláltad a meccs kimenetelét — +30 pont.';
    } else {
      total = 0;
      tone = 'miss';
      title = 'A tipped sajnos nem jött be — 0 pont.';
    }
  }

  if (isFav && !banker) {
    total = total * 2;
    badges.push({ label: `Kedvenc csapat ×2 (Összesen +${total})`, tone: 'fav' });
  }

  return { has: true, exact, outcome, banker, favourite: isFav, total, badges, title, tone };
}

function Section({ icon, iconColor, title, subtitle, children }: { icon: string; iconColor?: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 md:px-7">
      <div className="flex items-center gap-2 mb-1">
        <Icon name={icon} size={14} className={iconColor || 'text-mid'} strokeWidth={2.4} />
        <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-mid font-display">{title}</h4>
      </div>
      {subtitle ? <p className="text-[12px] text-faint mb-4 leading-relaxed">{subtitle}</p> : <div className="mb-4" />}
      {children}
    </div>
  );
}

function TeamColumn({ country, favoriteTeam }: { country: string; favoriteTeam?: string | null }) {
  const isFav = favoriteTeam && country === favoriteTeam;
  return (
    <div className="flex-1 w-full flex flex-col items-center gap-2.5">
      <FlagBadge country={country} size={58} />
      <span className="flex items-center gap-1.5 justify-center px-1">
        {isFav && <Icon name="star" size={14} fill="#F97316" strokeWidth={0} className="shrink-0" />}
        <span className="text-base md:text-lg font-bold text-ink text-center font-display leading-tight">{country}</span>
      </span>
    </div>
  );
}

interface StepperProps {
  value: number;
  onAdd: () => void;
  onSub: () => void;
}

function ScoreStepper({ value, onAdd, onSub }: StepperProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button onClick={onAdd} className="w-9 h-9 flex items-center justify-center rounded-full text-accent hover:bg-accent/10 active:scale-90 transition-all">
        <Icon name="plus" size={18} strokeWidth={3} />
      </button>
      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-wash border border-line2 text-4xl font-bold text-ink font-mono tabular-nums select-none">
        {value}
      </div>
      <button onClick={onSub} className="w-9 h-9 flex items-center justify-center rounded-full text-mid hover:bg-wash2 active:scale-90 transition-all">
        <Icon name="minus" size={18} strokeWidth={3} />
      </button>
    </div>
  );
}

function ScoreChip({ value, win }: { value: number; win: boolean }) {
  return (
    <div className={`w-16 h-16 flex items-center justify-center rounded-2xl text-4xl font-bold font-mono tabular-nums select-none border
      ${win ? 'bg-accent text-white border-accent shadow-[0_8px_20px_-8px_rgba(124,58,237,0.55)]' : 'bg-wash text-ink border-line2'}`}>
      {value}
    </div>
  );
}

function SavedTipChip({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-bold text-faint uppercase tracking-[0.16em]">{label}</span>
      <span className={`font-mono text-[12px] font-bold px-3 py-1 rounded-md border tabular-nums whitespace-nowrap ${
        tone === 'accent' ? 'bg-accent/10 text-accent border-accent/30' : 'bg-wash text-ink border-line2'}`}>
        {value}
      </span>
    </div>
  );
}

interface ProbBarProps {
  match: Match;
  stats: MatchStats;
}

function ProbBar({ match, stats }: ProbBarProps) {
  const p = stats.prediction;
  return (
    <div className="rounded-2xl border border-line bg-card p-4 md:p-5">
      <div className="flex gap-1 h-3.5 rounded-full overflow-hidden bg-wash2 mb-3 select-none">
        <div style={{ width: `${p.winA}%`, background: '#7C3AED' }} className="transition-all duration-500" />
        <div style={{ width: `${p.draw}%`, background: '#C8D2DF' }} className="transition-all duration-500" />
        <div style={{ width: `${p.winB}%`, background: '#0EA5E9' }} className="transition-all duration-500" />
      </div>
      <div className="flex justify-between items-center text-[11px] font-bold font-display mb-1">
        <span className="text-accent">{getAbbreviationCode(match.team_a)} {p.winA}%</span>
        <span className="text-mid">Döntetlen {p.draw}%</span>
        <span className="text-sky">{getAbbreviationCode(match.team_b)} {p.winB}%</span>
      </div>

      <div className="grid grid-cols-2 gap-5 mt-5 pt-5 border-t border-line">
        <StatStrength label={match.team_a} attack={p.attackA} defense={p.defenseA} color="#7C3AED" />
        <StatStrength label={match.team_b} attack={p.attackB} defense={p.defenseB} color="#0EA5E9" />
      </div>

      <div className="mt-4 rounded-xl border border-accent/25 bg-accent/[0.06] p-3.5 flex items-start gap-2.5">
        <Icon name="sparkles" size={15} className="text-accent shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-ink/90 leading-relaxed">
          <span className="font-bold text-accent">AI szakértői tanács — </span>
          {stats.prediction.advice}
        </p>
      </div>
    </div>
  );
}

function StatStrength({ label, attack, defense, color }: { label: string; attack: number; defense: number; color: string }) {
  return (
    <div className="space-y-2.5">
      <span className="block text-[9.5px] font-bold text-faint uppercase tracking-[0.14em] truncate">{label}</span>
      {[['Támadás', attack], ['Védekezés', defense]].map(([name, val]) => (
        <div key={name}>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-mid">{name}</span>
            <span className="font-mono font-bold tabular-nums" style={{ color }}>{val}%</span>
          </div>
          <div className="w-full bg-wash2 h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function OddsBlock({ match, stats }: { match: Match; stats: MatchStats }) {
  const cells = [
    { label: `${getAbbreviationCode(match.team_a)} győz`, val: stats.odds.winA, color: 'text-accent' },
    { label: 'Döntetlen', val: stats.odds.draw, color: 'text-mid' },
    { label: `${getAbbreviationCode(match.team_b)} győz`, val: stats.odds.winB, color: 'text-sky' }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cells.map((c) => (
        <div key={c.label} className="rounded-2xl border border-line bg-card p-3.5 text-center shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="block text-[9.5px] font-bold text-faint uppercase tracking-wider mb-1.5">{c.label}</span>
          <span className={`text-xl font-bold font-mono tabular-nums ${c.color}`}>{c.val.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

function H2HBlock({ stats }: { stats: MatchStats }) {
  return (
    <div>
      <p className="text-[12.5px] text-ink/85 leading-relaxed mb-4 rounded-xl border border-line bg-card p-3.5">{stats.h2hSummary}</p>
      {stats.h2hHistory.length > 0 && (
        <div className="space-y-2">
          {stats.h2hHistory.map((h, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-line bg-card px-3.5 py-2.5">
              <span className="font-mono text-[11px] text-faint">{h.year}</span>
              <span className="font-display text-[13px] font-bold text-ink tracking-wide">{h.res}</span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border whitespace-nowrap ${
                h.winner === 'draw' ? 'bg-wash text-mid border-line' : 'bg-accent/10 text-accent border-accent/25'}`}>
                {h.winner === 'draw' ? 'Döntetlen' : `${h.winner} győz.`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormBlock({ match, stats }: { match: Match; stats: MatchStats }) {
  const bg = (o: string) => o === 'W' ? '#15A34A' : o === 'D' ? '#C8D2DF' : '#E5564B';
  const fg = (o: string) => o === 'D' ? '#334155' : '#FFFFFF';
  
  const Card = ({ country, data }: { country: string; data: any }) => (
    <div className="rounded-2xl border border-line bg-card p-4 flex items-center justify-between gap-3">
      <span className="text-[12.5px] font-bold text-ink font-display truncate">{country}</span>
      <div className="flex gap-1.5">
        {data.form.map((o: string, i: number) => (
          <span 
            key={i} 
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold font-display"
            style={{ background: bg(o), color: fg(o) }}
          >
            {o}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card country={match.team_a} data={stats.teamA} />
      <Card country={match.team_b} data={stats.teamB} />
    </div>
  );
}

function heatColor(v: number) {
  v = Math.max(0, Math.min(100, v));
  const blue = [37, 99, 235], purple = [124, 58, 237], red = [220, 38, 38];
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

function TempGauge({ value, size = 120 }: { value: number; size?: number }) {
  const r = 42, C = 2 * Math.PI * r;
  const off = C * (1 - Math.max(0, Math.min(100, value)) / 100);
  const color = heatColor(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E9EEF5" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.7,.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-display font-extrabold text-ink" style={{ fontSize: size * 0.33 }}>{value}</span>
        <span className="font-bold uppercase tracking-[0.1em] mt-1" style={{ fontSize: size * 0.115, color }}>{heatWord(value)}</span>
      </div>
    </div>
  );
}

function HeatBlock({ match, stats }: { match: Match; stats: MatchStats }) {
  const Team = ({ country, data }: { country: string; data: any }) => (
    <div className="flex flex-col items-center text-center gap-3.5">
      <TempGauge value={data.temp} />
      <span className="text-[13px] font-bold text-ink font-display leading-tight px-1">{country}</span>
    </div>
  );
  return (
    <div className="grid grid-cols-2 gap-6 py-1">
      <Team country={match.team_a} data={stats.teamA} />
      <Team country={match.team_b} data={stats.teamB} />
    </div>
  );
}

function InjuriesBlock({ match, stats }: { match: Match; stats: MatchStats }) {
  const Col = ({ country, injuries }: { country: string; injuries: string[] }) => (
    <div className="rounded-2xl border border-line bg-card p-4">
      <span className="block text-[9.5px] font-bold text-faint uppercase tracking-[0.14em] mb-3">{country}</span>
      {injuries.length > 0 ? (
        <ul className="space-y-2">
          {injuries.map((inj, i) => (
            <li key={i} className="text-[12.5px] text-ink/85 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
              <span>{inj}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-[12.5px] font-medium text-accent">Nincs regisztrált sérült játékos.</span>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Col country={match.team_a} injuries={stats.teamA.injuries} />
      <Col country={match.team_b} injuries={stats.teamB.injuries} />
    </div>
  );
}

function NewsBlock({ stats }: { stats: MatchStats }) {
  return (
    <div className="space-y-2.5">
      {stats.news.map((n, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-line bg-card p-3.5">
          <span className="w-8 h-8 rounded-full bg-wash border border-line flex items-center justify-center shrink-0">
            <Icon name="newspaper" size={13} className="text-mid" />
          </span>
          <p className="text-[12.5px] text-ink/85 leading-relaxed">{n}</p>
        </div>
      ))}
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line2 bg-wash p-5 text-center">
      <span className="text-[12.5px] text-faint italic">{text}</span>
    </div>
  );
}

interface MatchDetailProps {
  match: Match;
  prediction?: Prediction;
  onSave: (matchId: string, a: number, b: number, isTuti: boolean) => void;
  favoriteTeam?: string | null;
}

export function MatchDetail({ match, prediction, onSave, favoriteTeam }: MatchDetailProps) {
  const [a, setA] = useState(prediction?.predicted_a ?? 0);
  const [b, setB] = useState(prediction?.predicted_b ?? 0);
  const [isTuti, setIsTuti] = useState(prediction?.is_tuti ?? false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [dbStats, setDbStats] = useState<MatchStats | null>(null);

  // Sync state on match swap
  useEffect(() => {
    setA(prediction?.predicted_a ?? 0);
    setB(prediction?.predicted_b ?? 0);
    setIsTuti(prediction?.is_tuti ?? false);
    setToast(false);

    // Read AI data directly from the match object (cached in matches.ai_data JSONB)
    if (match.ai_data) {
      setDbStats(match.ai_data);
    } else {
      // Fallback to static mock database for demo/dev
      setDbStats(MOCK_STATS_DATABASE[match.id] || null);
    }
  }, [prediction, match.id, match.ai_data]);

  const isFinished = match.status === 'FINISHED';
  const isTBD = 
    match.team_a.includes('/') || 
    match.team_a.includes('helyezettje') || 
    match.team_a.startsWith('W-') || 
    match.team_a.startsWith('L-');

  const theme = getGroupTheme(match.group);
  const hasChanges = a !== (prediction?.predicted_a ?? 0) || b !== (prediction?.predicted_b ?? 0) || isTuti !== (prediction?.is_tuti ?? false);
  const result = isFinished && match.score_a !== null && match.score_b !== null ? computeResult(match, prediction, favoriteTeam) : null;
  const isFav = !!(favoriteTeam && (match.team_a === favoriteTeam || match.team_b === favoriteTeam));

  const adjust = (team: 'a' | 'b', d: number) => {
    if (isFinished || isTBD) return;
    if (team === 'a') setA((p) => Math.max(0, p + d));
    else setB((p) => Math.max(0, p + d));
  };

  const apply = async () => {
    setSaving(true);
    await onSave(match.id, a, b, isTuti);
    setSaving(false);
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="rounded-3xl border border-line bg-card overflow-hidden shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)]">
      
      {/* 1. Header ribbon */}
      <div 
        className="px-6 md:px-7 py-4 border-b border-line flex flex-wrap justify-between items-center gap-3"
        style={{ background: `linear-gradient(100deg, #7C3AED24, transparent 60%)` }}
      >
        <div className="flex items-center gap-2.5">
          <Icon name="calendar" size={14} style={{ color: '#7C3AED' }} className="shrink-0" />
          <span className="font-mono text-[12px] font-medium text-ink tabular-nums">{fmtLong(match.start_time)}</span>
          {theme.label && (
            <span 
              className="text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border"
              style={{ color: '#7C3AED', borderColor: '#7C3AED55', background: '#7C3AED14' }}
            >
              {theme.label}
            </span>
          )}
          {isFav && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider" style={{ color: '#EA580C' }}>
              <Icon name="star" size={11} fill="#F97316" strokeWidth={0} /> Kedvenc · ×2 pont
            </span>
          )}
        </div>
        <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.14em] border ${
          isFinished ? 'bg-wash text-mid border-line2' :
          isTBD ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-accent/10 text-accent border-accent/30'}`}
        >
          {isFinished ? 'Lejátszott' : isTBD ? 'Párosításra vár' : '● Fogadás él'}
        </span>
      </div>

      {/* 2. Stepper and prediction input */}
      <div className="px-6 md:px-8 py-7 border-b border-line">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <TeamColumn country={match.team_a} favoriteTeam={favoriteTeam} />

          <div className="flex flex-col items-center gap-4 min-w-[210px]">
            <div className="flex items-center gap-4">
              {isFinished ? (
                <>
                  <ScoreChip value={match.score_a ?? 0} win={(match.score_a ?? 0) > (match.score_b ?? 0)} />
                  <span className="text-faint font-display font-bold text-2xl">:</span>
                  <ScoreChip value={match.score_b ?? 0} win={(match.score_b ?? 0) > (match.score_a ?? 0)} />
                </>
              ) : isTBD ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <span className="w-14 h-14 rounded-full bg-amber-50 border border-dashed border-amber-300 flex items-center justify-center text-amber-500 animate-pulse">
                    <Icon name="lock" size={20} />
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.16em]">Lezárva</span>
                </div>
              ) : (
                <>
                  <ScoreStepper value={a} onAdd={() => adjust('a', 1)} onSub={() => adjust('a', -1)} />
                  <span className="text-faint font-display font-bold text-2xl mt-[-6px]">:</span>
                  <ScoreStepper value={b} onAdd={() => adjust('b', 1)} onSub={() => adjust('b', -1)} />
                </>
              )}
            </div>

            {!isTBD && (
              <div className="text-center min-h-[44px] flex flex-col items-center justify-center gap-2">
                {isFinished ? (
                  <SavedTipChip label="Tipped" value={`${a} - ${b} ${prediction?.is_tuti ? '⭐️' : ''}`} tone="neutral" />
                ) : prediction ? (
                  <SavedTipChip label="Mentett tipped" value={`${prediction.predicted_a} - ${prediction.predicted_b} ${prediction.is_tuti ? '⭐️' : ''}`} tone="accent" />
                ) : (
                  <span className="text-[12px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full animate-pulse">
                    Még nem tippeltél — állítsd be fent a gólokat.
                  </span>
                )}
              </div>
            )}
          </div>

          <TeamColumn country={match.team_b} favoriteTeam={favoriteTeam} />
        </div>

        {/* TUTI TIPP Toggle */}
        {!isFinished && !isTBD && (
          <div className="mt-5 flex items-center justify-between border border-line bg-wash p-3.5 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isTuti ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-card text-mid border-line'}`}>
                <Icon name="zap" size={15} strokeWidth={isTuti ? 2.5 : 2} />
              </span>
              <div>
                <span className="block text-[12.5px] font-bold text-ink">TUTI TIPP</span>
                <span className="block text-[10px] text-faint font-medium">Helyes: 100/20 pont · Rossz: −30 pont (max. 3/szakasz)</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (isFav) {
                  alert('A TUTI TIPP és a Kedvenc Csapat bónusz nem vonható össze egy meccsen!');
                  return;
                }
                setIsTuti(!isTuti);
              }}
              className={`w-11 h-6 rounded-full transition-all duration-200 p-0.5 relative outline-none flex items-center ${isTuti ? 'bg-accent' : 'bg-slate-200'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isTuti ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        )}

        {hasChanges && !isFinished && !isTBD && (
          <button 
            onClick={apply} 
            disabled={saving}
            className="mt-6 w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-[12px] uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:brightness-105 active:brightness-95 transition-all shadow-[0_12px_28px_-12px_rgba(124,58,237,0.7)]"
          >
            {saving ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <><Icon name="save" size={15} strokeWidth={2.4} /> Tipp mentése / módosítása</>
            )}
          </button>
        )}
        {toast && (
          <div className="mt-3 rounded-xl border border-accent/30 bg-accent/10 text-accent text-[12px] text-center font-bold py-2.5 px-3">
            Sikeresen elmentettük a tippedet ✦
          </div>
        )}
      </div>

      {/* 3. Scoring results display */}
      {result && (
        <div 
          className="px-6 md:px-7 py-4 border-b border-line flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ background: RESULT_TONE[result.tone].bg }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon 
              name={RESULT_TONE[result.tone].icon} 
              size={18} 
              className="shrink-0"
              style={{ color: RESULT_TONE[result.tone].ic }} 
            />
            <div className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-ink/90">{result.title}</span>
              {result.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {result.badges.map((bdg, i) => {
                    const bt = BADGE_TONE[bdg.tone] || BADGE_TONE.fav;
                    return (
                      <span 
                        key={i} 
                        className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border whitespace-nowrap"
                        style={{ background: bt.bg, color: bt.fg, borderColor: bt.bd }}
                      >
                        {bdg.tone === 'fav' && <Icon name="star" size={9} fill={bt.fg} strokeWidth={0} />}
                        {bdg.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <span 
            className="text-[11px] font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shrink-0 whitespace-nowrap font-display text-white"
            style={{ background: RESULT_TONE[result.tone].pillBg }}
          >
            {result.total > 0 ? `+${result.total}` : result.total} pont
          </span>
        </div>
      )}

      {/* 4. Statistics */}
      {dbStats ? (
        <div className="divide-y divide-line bg-wash/50">
          <Section 
            icon="sparkles" 
            iconColor="text-accent" 
            title="AI valószínűségszámítás"
            subtitle="A modell predikciós görbéje a korábbi meccsek és a sérülthelyzet alapján:"
          >
            <ProbBar match={match} stats={dbStats} />
          </Section>
          <Section 
            icon="landmark" 
            title="Fogadási szorzók (oddsok)"
            subtitle="A vezető fogadóirodák átlagolt, pre-match szorzói:"
          >
            <OddsBlock match={match} stats={dbStats} />
          </Section>
          <Section icon="swords" iconColor="text-rose-500" title="Egymás elleni mérleg (H2H)">
            <H2HBlock stats={dbStats} />
          </Section>
          <Section 
            icon="activity" 
            iconColor="text-accent" 
            title="Csapathőfok"
            subtitle="A csapat aktuális formaindexe — kék (hideg) a gyenge, piros (forró) a kiváló forma."
          >
            {isTBD ? <Placeholder text="A hőfok az egyenes kieséses fázis kezdetekor frissül." /> : <HeatBlock match={match} stats={dbStats} />}
          </Section>
          <Section icon="trending" iconColor="text-accent" title="Forma · utolsó 5 meccs">
            {isTBD ? <Placeholder text="A formamutató az egyenes kieséses fázis kezdetekor frissül." /> : <FormBlock match={match} stats={dbStats} />}
          </Section>
          <Section icon="shield" iconColor="text-amber-500" title="Hiányzók & sérültek">
            {isTBD ? <Placeholder text="A sérülési jelentések a pontos csapatok ismertté válása után frissülnek." /> : <InjuriesBlock match={match} stats={dbStats} />}
          </Section>
          <Section icon="newspaper" title="Sajtóhírek & értesülések">
            <NewsBlock stats={dbStats} />
          </Section>
        </div>
      ) : (
        <div className="px-6 py-10 text-center bg-wash/50">
          <span className="inline-flex items-center gap-2 text-[12.5px] text-faint italic">
            <Icon name="activity" size={15} className="text-faint" />
            Ehhez a mérkőzéshez még nincsenek részletes elemzések — a tipped leadása fent továbbra is működik.
          </span>
        </div>
      )}
    </div>
  );
}
