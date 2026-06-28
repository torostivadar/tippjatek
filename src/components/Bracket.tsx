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
          <p className="text-[11.5px] text-faint font-medium mt-0.5">Vidd rá a kurzort a teljes nevekért. Koppints a tipp leadásához.</p>
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
              Felső és Alsó Ágak (Legjobb 32 ➔ 16)
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
            ].map((group, idx) => (
              <div key={group.r16} className="bg-wash/40 border border-line p-3 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-[8px] font-bold text-faint uppercase">
                  <span>Nyolcaddöntő #{group.r16} ága</span>
                  <span>{group.side}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  {/* Left Column: 2 R32 matches */}
                  <div className="flex-1 space-y-2.5">
                    {renderMatchCard(group.feed[0], 'w-full', true)}
                    {renderMatchCard(group.feed[1], 'w-full', true)}
                  </div>

                  {/* Center Connector Arrow */}
                  <div className="text-faint flex flex-col items-center justify-center shrink-0">
                    <Icon name="chevron" size={14} className="text-line2" />
                  </div>

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
                  <span>Negyeddöntő #{group.qf} ága</span>
                  <span>{group.side}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  {/* Left Column: 2 R16 matches */}
                  <div className="flex-1 space-y-2.5">
                    {renderMatchCard(group.feed[0], 'w-full', true)}
                    {renderMatchCard(group.feed[1], 'w-full', true)}
                  </div>

                  {/* Center Connector Arrow */}
                  <div className="text-faint flex flex-col items-center justify-center shrink-0">
                    <Icon name="chevron" size={14} className="text-line2" />
                  </div>

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
              <div className="flex items-center justify-between gap-3">
                {/* Left Column: 2 Semis */}
                <div className="flex-1 space-y-2.5">
                  <span className="block text-[8px] font-bold text-faint uppercase text-center">Elődöntők</span>
                  {renderMatchCard('101', 'w-full', true)}
                  {renderMatchCard('102', 'w-full', true)}
                </div>

                {/* Center Arrow */}
                <div className="text-faint flex flex-col items-center justify-center shrink-0">
                  <Icon name="chevron" size={14} className="text-line2" />
                </div>

                {/* Right Column: Final & Third place */}
                <div className="flex-1 space-y-2.5">
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
        <div className="flex items-center justify-center p-4 bg-wash/30 rounded-3xl border border-line">
          <div className="grid grid-cols-9 gap-x-4 items-center">
            
            {/* COLUMN 1: LEFT ROUND OF 32 */}
            <div className="space-y-6">
              <span className="block text-center text-[9px] font-extrabold uppercase tracking-widest text-faint mb-2">L32 - Bal ág</span>
              {[
                { top: '73', bottom: '75' },
                { top: '74', bottom: '77' },
                { top: '76', bottom: '78' },
                { top: '79', bottom: '80' }
              ].map((pair, idx) => (
                <div key={idx} className="space-y-2.5">
                  {renderMatchCard(pair.top)}
                  {renderMatchCard(pair.bottom)}
                </div>
              ))}
            </div>

            {/* COLUMN 2: LEFT ROUND OF 16 */}
            <div className="space-y-[134px] pt-12">
              {['90', '89', '91', '92'].map(id => renderMatchCard(id))}
            </div>

            {/* COLUMN 3: LEFT QUARTER-FINALS */}
            <div className="space-y-[390px] pt-28">
              {['97', '98'].map(id => renderMatchCard(id))}
            </div>

            {/* COLUMN 4: LEFT SEMI-FINALS */}
            <div className="pt-2">
              <span className="block text-center text-[8px] font-extrabold uppercase tracking-widest text-faint mb-4">Elődöntő 1</span>
              {renderMatchCard('101')}
            </div>

            {/* COLUMN 5: ABSOLUTE CENTER (FINAL & THIRD PLACE & CHAMPION) */}
            <div className="flex flex-col items-center justify-center space-y-10 py-10 shrink-0">
              {/* Winner Cup */}
              <div className="text-center bg-gradient-to-b from-amber-400/20 to-amber-400/[0.02] border border-amber-500/20 p-4 rounded-3xl shadow-xs w-36">
                <span className="inline-flex w-10 h-10 rounded-2xl bg-amber-500 text-white items-center justify-center shadow-[0_6px_16px_-4px_rgba(245,158,11,0.5)] mb-2">
                  <Icon name="trophy" size={20} strokeWidth={2} />
                </span>
                <div className="font-display font-black text-[10px] uppercase tracking-wide text-amber-700">Világbajnok</div>
                <div className="text-[11px] font-black text-ink mt-1 truncate">
                  {findMatch('104')?.status === 'FINISHED' 
                    ? (findMatch('104')?.score_a! > findMatch('104')?.score_b! ? findMatch('104')?.team_a : findMatch('104')?.team_b)
                    : 'Nem ismert'}
                </div>
              </div>

              {/* VB Döntő */}
              <div className="space-y-1.5">
                <span className="block text-center text-[8px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-500/10 py-0.5 px-2 rounded-full border border-amber-500/20 w-fit mx-auto">Döntő</span>
                {renderMatchCard('104', 'border-amber-500/30')}
              </div>

              {/* Bronzmeccs */}
              <div className="space-y-1.5">
                <span className="block text-center text-[8px] font-extrabold uppercase tracking-widest text-faint">3. helyért</span>
                {renderMatchCard('103')}
              </div>
            </div>

            {/* COLUMN 6: RIGHT SEMI-FINALS */}
            <div className="pt-2">
              <span className="block text-center text-[8px] font-extrabold uppercase tracking-widest text-faint mb-4">Elődöntő 2</span>
              {renderMatchCard('102')}
            </div>

            {/* COLUMN 7: RIGHT QUARTER-FINALS */}
            <div className="space-y-[390px] pt-28">
              {['99', '100'].map(id => renderMatchCard(id))}
            </div>

            {/* COLUMN 8: RIGHT ROUND OF 16 */}
            <div className="space-y-[134px] pt-12">
              {['94', '93', '95', '96'].map(id => renderMatchCard(id))}
            </div>

            {/* COLUMN 9: RIGHT ROUND OF 32 */}
            <div className="space-y-6">
              <span className="block text-center text-[9px] font-extrabold uppercase tracking-widest text-faint mb-2">L32 - Jobb ág</span>
              {[
                { top: '81', bottom: '84' },
                { top: '82', bottom: '83' },
                { top: '85', bottom: '86' },
                { top: '87', bottom: '88' }
              ].map((pair, idx) => (
                <div key={idx} className="space-y-2.5">
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
