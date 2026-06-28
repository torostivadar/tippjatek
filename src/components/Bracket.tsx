import React, { useState } from 'react';
import { Match, Prediction } from '@/src/types';
import { FlagBadge, Icon } from './Icons';
import { getAbbreviationCode } from '@/src/lib/utils';

interface BracketProps {
  matches: Match[];
  predictions: Prediction[];
  onSelectMatch: (matchId: string) => void;
}

export function Bracket({ matches, predictions, onSelectMatch }: BracketProps) {
  // Mobile active tab: r16 (L32->L16), qf (L16->L8), sf (Döntők), all (Teljes)
  const [mobileRoundTab, setMobileRoundTab] = useState<'r16' | 'qf' | 'sf' | 'all'>('r16');

  // Helper to find match by ID string
  const findMatch = (id: string) => matches.find(m => m.id === id);

  // Styling properties for connection lines
  const strokeColor = '#a78bfa'; // violet-400
  const strokeWidth = 3;
  const strokeOpacity = 0.65;

  // Render a single match card in the bracket tree
  const renderMatchCard = (matchId: string, className = '', isCompact = true) => {
    const match = findMatch(matchId);
    if (!match) return null;

    const pred = predictions.find(p => p.match_id === match.id);
    const isFinished = match.status === 'FINISHED';
    const isLive = match.status === 'LIVE';

    // Highlight border if live
    const borderStyle = isLive 
      ? 'border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse' 
      : 'border-line hover:border-line2';

    // Show abbreviation in compact mode, full name in list mode
    const teamAName = isCompact ? getAbbreviationCode(match.team_a) : match.team_a;
    const teamBName = isCompact ? getAbbreviationCode(match.team_b) : match.team_b;

    const fullMatchTitle = `${match.team_a} – ${match.team_b}`;

    return (
      <div 
        onClick={() => onSelectMatch(match.id)}
        title={fullMatchTitle}
        className={`bg-card rounded-2xl border p-2.5 cursor-pointer transition-all duration-200 select-none shadow-xs hover:shadow-sm hover:scale-[1.01] flex flex-col justify-between ${borderStyle} ${isCompact ? 'w-[125px] h-[78px]' : 'w-full'} ${className}`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between text-[8px] font-bold text-faint mb-1.5 uppercase tracking-wider shrink-0">
          <span>#{match.id}</span>
          {isLive ? (
            <span className="text-amber-600 flex items-center gap-0.5 animate-pulse">
              <span className="w-1 h-1 rounded-full bg-amber-500" /> LIVE
            </span>
          ) : isFinished ? (
            <span className="text-emerald-600">FT</span>
          ) : (
            <span>
              {new Date(match.start_time).toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' })}
            </span>
          )}
        </div>

        {/* Teams and Scores container */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          {/* Team A Row */}
          <div className="flex items-center justify-between gap-1 py-0.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <FlagBadge country={match.team_a} size={14} />
              <span className={`text-[10px] font-extrabold truncate ${isFinished && match.score_a !== null && match.score_b !== null && match.score_a < match.score_b ? 'text-faint font-semibold' : 'text-ink'}`}>
                {teamAName}
              </span>
            </div>
            {match.score_a !== null && (
              <span className="font-mono text-[10px] font-extrabold text-ink tabular-nums">
                {match.score_a}
              </span>
            )}
          </div>

          {/* Team B Row */}
          <div className="flex items-center justify-between gap-1 py-0.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <FlagBadge country={match.team_b} size={14} />
              <span className={`text-[10px] font-extrabold truncate ${isFinished && match.score_a !== null && match.score_b !== null && match.score_b < match.score_a ? 'text-faint font-semibold' : 'text-ink'}`}>
                {teamBName}
              </span>
            </div>
            {match.score_b !== null && (
              <span className="font-mono text-[10px] font-extrabold text-ink tabular-nums">
                {match.score_b}
              </span>
            )}
          </div>
        </div>

        {/* Prediction Indicator */}
        {pred && (
          <div className="mt-1 pt-0.5 border-t border-dashed border-line flex items-center justify-between text-[7px] font-bold text-accent shrink-0">
            <span>Tipp</span>
            <span className="font-mono tabular-nums bg-accent/5 px-1 rounded text-[7.5px]">
              {pred.predicted_a} - {pred.predicted_b}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header and Mobile Tabs Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card rounded-2xl border border-line p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-ink font-display flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
              <Icon name="swords" size={16} className="text-accent" />
            </span>
            Kieséses Szakasz Ágrajz
          </h2>
          <p className="text-[11.5px] text-faint font-medium mt-0.5">Mozgatható ágrajz. Vidd rá a kurzort a teljes nevekért, és kattints a tippeléshez.</p>
        </div>

        {/* Tabs for mobile/desktop layout switches */}
        <div className="flex flex-wrap gap-1 bg-wash border border-line p-1 rounded-xl shrink-0">
          {[
            { id: 'r16' as const, label: 'L32 ➔ L16' },
            { id: 'qf' as const, label: 'L16 ➔ L8' },
            { id: 'sf' as const, label: 'Döntők' },
            { id: 'all' as const, label: 'Teljes ágrajz' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setMobileRoundTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer
                ${mobileRoundTab === tab.id 
                  ? 'bg-accent text-white shadow-xs' 
                  : 'text-mid hover:text-ink'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MOBILE ROUNDS VIEW (Rendered based on tab selection) */}
      <div className="block lg:hidden">
        {/* R16 - Round of 32 feeding into Round of 16 */}
        {mobileRoundTab === 'r16' && (
          <div className="space-y-6">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-faint border-b border-line pb-1.5">
              Nyolcaddöntő ágak (Legjobb 32 ➔ 16)
            </span>
            {[
              { r16: '90', feed: ['73', '75'], side: 'Bal ág' },
              { r16: '89', feed: ['74', '77'], side: 'Bal ág' },
              { r16: '91', feed: ['76', '78'], side: 'Bal ág' },
              { r16: '92', feed: ['79', '80'], side: 'Bal ág' },
              { r16: '94', feed: ['81', '84'], side: 'Jobb ág' },
              { r16: '93', feed: ['82', '83'], side: 'Jobb ág' },
              { r16: '95', feed: ['85', '86'], side: 'Jobb ág' },
              { r16: '96', feed: ['87', '88'], side: 'Jobb ág' }
            ].map((group) => (
              <div key={group.r16} className="bg-wash/40 border border-line p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[8px] font-bold text-faint uppercase">
                  <span>Nyolcaddöntő #{group.r16}</span>
                  <span>{group.side}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {/* Left Column: 2 R32 matches */}
                  <div className="flex-1 space-y-3">
                    {renderMatchCard(group.feed[0], 'w-full', true)}
                    {renderMatchCard(group.feed[1], 'w-full', true)}
                  </div>

                  {/* Center Connector Line */}
                  <svg className="w-5 h-[168px] shrink-0" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                    <path d="M 0 39 L 10 39 L 10 129 L 0 129 M 10 84 L 20 84" />
                  </svg>

                  {/* Right Column: 1 R16 match */}
                  <div className="flex-1 flex items-center justify-center">
                    {renderMatchCard(group.r16, 'w-full', true)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* QF - Round of 16 feeding into Quarterfinals */}
        {mobileRoundTab === 'qf' && (
          <div className="space-y-6">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-faint border-b border-line pb-1.5">
              Negyeddöntő ágak (Legjobb 16 ➔ 8)
            </span>
            {[
              { qf: '97', feed: ['89', '90'], side: 'Bal ág' },
              { qf: '98', feed: ['91', '92'], side: 'Bal ág' },
              { qf: '99', feed: ['93', '94'], side: 'Jobb ág' },
              { qf: '100', feed: ['95', '96'], side: 'Jobb ág' }
            ].map((group) => (
              <div key={group.qf} className="bg-wash/40 border border-line p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[8px] font-bold text-faint uppercase">
                  <span>Negyeddöntő #{group.qf}</span>
                  <span>{group.side}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {/* Left Column: 2 R16 matches */}
                  <div className="flex-1 space-y-3">
                    {renderMatchCard(group.feed[0], 'w-full', true)}
                    {renderMatchCard(group.feed[1], 'w-full', true)}
                  </div>

                  {/* Center Connector Line */}
                  <svg className="w-5 h-[168px] shrink-0" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                    <path d="M 0 39 L 10 39 L 10 129 L 0 129 M 10 84 L 20 84" />
                  </svg>

                  {/* Right Column: 1 QF match */}
                  <div className="flex-1 flex items-center justify-center">
                    {renderMatchCard(group.qf, 'w-full', true)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SF & F - Semis, Finals, Third place */}
        {mobileRoundTab === 'sf' && (
          <div className="space-y-6">
            <span className="block text-[9px] font-extrabold uppercase tracking-widest text-faint border-b border-line pb-1.5">
              Döntő küzdelmek (Elődöntők ➔ Döntő)
            </span>
            <div className="bg-wash/40 border border-line p-3 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                {/* Left Column: 2 Semis */}
                <div className="flex-1 space-y-3">
                  <span className="block text-[8px] font-bold text-faint uppercase text-center">Elődöntők</span>
                  {renderMatchCard('101', 'w-full', true)}
                  {renderMatchCard('102', 'w-full', true)}
                </div>

                {/* Center Connector Line */}
                <svg className="w-5 h-[168px] shrink-0" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                  <path d="M 0 39 L 10 39 L 10 129 L 0 129 M 10 84 L 20 84" />
                </svg>

                {/* Right Column: Final & Third place */}
                <div className="flex-1 space-y-3">
                  <span className="block text-[8px] font-bold text-amber-600 uppercase text-center">Döntő & 3. Hely</span>
                  {renderMatchCard('104', 'w-full border-amber-500/30 bg-amber-500/[0.02]', true)}
                  {renderMatchCard('103', 'w-full', true)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. FULL BRACKET INTERACTIVE TREE (Shown on desktop OR when 'all' is selected on mobile) */}
      <div className={`overflow-x-auto nice-scroll pb-6 ${mobileRoundTab !== 'all' ? 'hidden lg:block' : 'block'}`}>
        <div className="flex items-center justify-center p-4 bg-wash/30 rounded-3xl border border-line select-none">
          {/* Main Tree wrapper container - exactly 720px high for perfect mathematical alignments */}
          <div className="flex items-center gap-x-0 h-[720px]">
            
            {/* COLUMN 1: LEFT ROUND OF 32 */}
            <div className="h-[720px] flex flex-col justify-between">
              {[
                { top: '73', bottom: '75' },
                { top: '74', bottom: '77' },
                { top: '76', bottom: '78' },
                { top: '79', bottom: '80' }
              ].map((pair, idx) => (
                <div key={idx} className="h-[180px] flex flex-col justify-center gap-6">
                  {renderMatchCard(pair.top)}
                  {renderMatchCard(pair.bottom)}
                </div>
              ))}
            </div>

            {/* COLUMN 2: LEFT CONNECTORS 1 */}
            <div className="h-[720px] flex flex-col justify-between shrink-0">
              {[1, 2, 3, 4].map(idx => (
                <svg key={idx} className="w-6 h-[180px]" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                  <path d="M 0 39 L 12 39 L 12 141 L 0 141 M 12 90 L 24 90" />
                </svg>
              ))}
            </div>

            {/* COLUMN 3: LEFT ROUND OF 16 */}
            <div className="h-[720px] flex flex-col justify-between">
              {['90', '89', '91', '92'].map(id => (
                <div key={id} className="h-[180px] flex items-center">
                  {renderMatchCard(id)}
                </div>
              ))}
            </div>

            {/* COLUMN 4: LEFT CONNECTORS 2 */}
            <div className="h-[720px] flex flex-col justify-between shrink-0">
              {[1, 2].map(idx => (
                <svg key={idx} className="w-6 h-[360px]" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                  <path d="M 0 90 L 12 90 L 12 270 L 0 270 M 12 180 L 24 180" />
                </svg>
              ))}
            </div>

            {/* COLUMN 5: LEFT QUARTER-FINALS */}
            <div className="h-[720px] flex flex-col justify-between">
              {['97', '98'].map(id => (
                <div key={id} className="h-[360px] flex items-center">
                  {renderMatchCard(id)}
                </div>
              ))}
            </div>

            {/* COLUMN 6: LEFT CONNECTORS 3 */}
            <div className="h-[720px] flex items-center shrink-0">
              <svg className="w-6 h-[720px]" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                <path d="M 0 180 L 12 180 L 12 540 L 0 540 M 12 360 L 24 360" />
              </svg>
            </div>

            {/* COLUMN 7: LEFT SEMI-FINALS */}
            <div className="h-[720px] flex items-center">
              {renderMatchCard('101')}
            </div>

            {/* COLUMN 8: LEFT CONNECTORS 4 */}
            <div className="h-[720px] flex items-center shrink-0">
              <svg className="w-6 h-[78px]" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                <path d="M 0 39 L 24 39" />
              </svg>
            </div>

            {/* COLUMN 9: ABSOLUTE CENTER (FINAL & THIRD PLACE & CHAMPION) */}
            <div className="h-[720px] relative w-[160px] shrink-0 border-x border-dashed border-line/20">
              {/* Winner Cup - mathematically positioned */}
              <div className="absolute top-[50px] left-1/2 -translate-x-1/2 text-center bg-gradient-to-b from-amber-500/25 to-amber-500/[0.02] border border-amber-500/25 p-3 rounded-2xl shadow-xs w-36">
                <span className="inline-flex w-8 h-8 rounded-xl bg-amber-500 text-white items-center justify-center shadow-[0_4px_12px_-3px_rgba(245,158,11,0.5)] mb-1.5">
                  <Icon name="trophy" size={16} strokeWidth={2} />
                </span>
                <div className="font-display font-black text-[9px] uppercase tracking-wide text-amber-700">Világbajnok</div>
                <div className="text-[10.5px] font-black text-ink mt-0.5 truncate">
                  {findMatch('104')?.status === 'FINISHED' 
                    ? (findMatch('104')?.score_a! > findMatch('104')?.score_b! ? findMatch('104')?.team_a : findMatch('104')?.team_b)
                    : 'Nem ismert'}
                </div>
              </div>

              {/* VB Döntő - mathematically positioned exactly in the center (center matches 360px vertical height) */}
              <div className="absolute top-[321px] left-1/2 -translate-x-1/2 space-y-1 w-32">
                <span className="block text-center text-[7.5px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-500/10 py-0.5 px-2 rounded-full border border-amber-500/20 w-fit mx-auto">Döntő</span>
                {renderMatchCard('104', 'border-amber-500/30')}
              </div>

              {/* Bronzmeccs - mathematically positioned */}
              <div className="absolute bottom-[50px] left-1/2 -translate-x-1/2 space-y-1 w-32">
                <span className="block text-center text-[7.5px] font-extrabold uppercase tracking-widest text-faint">3. helyért</span>
                {renderMatchCard('103')}
              </div>
            </div>

            {/* COLUMN 10: RIGHT CONNECTORS 4 */}
            <div className="h-[720px] flex items-center shrink-0">
              <svg className="w-6 h-[78px]" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                <path d="M 24 39 L 0 39" />
              </svg>
            </div>

            {/* COLUMN 11: RIGHT SEMI-FINALS */}
            <div className="h-[720px] flex items-center">
              {renderMatchCard('102')}
            </div>

            {/* COLUMN 12: RIGHT CONNECTORS 3 */}
            <div className="h-[720px] flex items-center shrink-0">
              <svg className="w-6 h-[720px]" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                <path d="M 24 180 L 12 180 L 12 540 L 24 540 M 12 360 L 0 360" />
              </svg>
            </div>

            {/* COLUMN 13: RIGHT QUARTER-FINALS */}
            <div className="h-[720px] flex flex-col justify-between">
              {['99', '100'].map(id => (
                <div key={id} className="h-[360px] flex items-center">
                  {renderMatchCard(id)}
                </div>
              ))}
            </div>

            {/* COLUMN 14: RIGHT CONNECTORS 2 */}
            <div className="h-[720px] flex flex-col justify-between shrink-0">
              {[1, 2].map(idx => (
                <svg key={idx} className="w-6 h-[360px]" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                  <path d="M 24 90 L 12 90 L 12 270 L 24 270 M 12 180 L 0 180" />
                </svg>
              ))}
            </div>

            {/* COLUMN 15: RIGHT ROUND OF 16 */}
            <div className="h-[720px] flex flex-col justify-between">
              {['94', '93', '95', '96'].map(id => (
                <div key={id} className="h-[180px] flex items-center">
                  {renderMatchCard(id)}
                </div>
              ))}
            </div>

            {/* COLUMN 16: RIGHT CONNECTORS 1 */}
            <div className="h-[720px] flex flex-col justify-between shrink-0">
              {[1, 2, 3, 4].map(idx => (
                <svg key={idx} className="w-6 h-[180px]" style={{ color: strokeColor }} stroke="currentColor" strokeWidth={strokeWidth} strokeOpacity={strokeOpacity} fill="none">
                  <path d="M 24 39 L 12 39 L 12 141 L 24 141 M 12 90 L 0 90" />
                </svg>
              ))}
            </div>

            {/* COLUMN 17: RIGHT ROUND OF 32 */}
            <div className="h-[720px] flex flex-col justify-between">
              {[
                { top: '81', bottom: '84' },
                { top: '82', bottom: '83' },
                { top: '85', bottom: '86' },
                { top: '87', bottom: '88' }
              ].map((pair, idx) => (
                <div key={idx} className="h-[180px] flex flex-col justify-center gap-6">
                  {renderMatchCard(pair.top)}
                  {renderMatchCard(pair.bottom)}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
