import React from 'react';

import { Icon } from './Icons';
import { Profile } from '@/src/types';

interface LeaderboardProps {
  profiles: Profile[];
  currentUserId?: string;
}

export function Leaderboard({ profiles, currentUserId }: LeaderboardProps) {
  const maxPoints = Math.max(...profiles.map((p) => p.points), 1);
  
  const getMedalColor = (idx: number) => {
    if (idx === 0) return '#CA8A04'; // Gold
    if (idx === 1) return '#94A3B8'; // Silver
    if (idx === 2) return '#C2722E'; // Bronze
    return '#B9C3D1';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl border border-line bg-card overflow-hidden shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)]">
        <div 
          className="flex items-center gap-3 px-6 py-5 border-b border-line"
          style={{ background: 'linear-gradient(100deg, rgba(202,138,4,0.08), transparent 68%)' }}
        >
          <span className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Icon name="trophy" size={20} className="text-amber-500" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink font-display">Baráti tippbajnokság</h2>
            <p className="text-[11px] text-faint font-medium">Helyes kimenetel +30 pont · telitalálat ezen felül +20 pont</p>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2">
          {profiles.map((p, idx) => {
            const isCurrentUser = p.id === currentUserId;
            const medalColor = getMedalColor(idx);
            const isTop3 = idx < 3;
            
            return (
              <div 
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-3.5 py-3 transition-all
                  ${isCurrentUser
                    ? 'bg-[#F4F0FE] border-accent shadow-[0_8px_20px_-12px_rgba(124,58,237,0.5)]'
                    : 'bg-card border-line hover:border-line2'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold font-mono shrink-0"
                    style={{ 
                      color: isTop3 ? medalColor : '#8C97A8', 
                      boxShadow: `inset 0 0 0 1.5px ${medalColor}`, 
                      background: isTop3 ? `${medalColor}18` : 'transparent' 
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className={`block text-[13px] font-bold truncate font-display ${isCurrentUser ? 'text-accent' : 'text-ink'}`}>
                      {p.avatar && <span className="mr-1.5 align-middle text-[15px] select-none" role="img" aria-label="avatar">{p.avatar}</span>}
                      {p.username} {isCurrentUser && '(Én)'}
                    </span>
                    <span className="font-mono text-[10px] text-faint tabular-nums whitespace-nowrap">
                      {p.correct_scores} teli · {p.correct_outcomes} kimenetel
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block w-24">
                    <div className="w-full bg-wash2 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${(p.points / maxPoints) * 100}%`, 
                          background: isCurrentUser ? '#7C3AED' : '#C8D2DF' 
                        }} 
                      />
                    </div>
                  </div>
                  <span className={`font-mono text-[13px] font-bold rounded-xl px-3 py-1.5 tabular-nums min-w-[72px] text-center whitespace-nowrap
                    ${isCurrentUser ? 'bg-accent text-white' : 'bg-ink text-card'}`}>
                    {p.points} p
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
