import React from 'react';
import { Team, Match } from '@/src/types';
import { FlagBadge } from './Icons';

interface GroupsProps {
  teams: Team[];
  matches: Match[];
  onSelectTeam: (teamId: string) => void;
}

export function Groups({ teams, matches, onSelectTeam }: GroupsProps) {
  // 1. Calculate Standings
  const standings: Record<string, {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number;
    ga: number;
    gd: number;
    points: number;
  }> = {};

  // Initialize standings for all teams
  for (const team of teams) {
    standings[team.name] = {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    };
  }

  // Parse finished group matches to update standings
  for (const match of matches) {
    const isFinished = match.status === 'FINISHED';
    const isGroupMatch = match.group && match.group.length === 1; // "A" through "L"
    const scoreA = match.score_a;
    const scoreB = match.score_b;

    if (isFinished && isGroupMatch && scoreA !== null && scoreB !== null) {
      const teamA = match.team_a;
      const teamB = match.team_b;

      // Update Team A
      if (standings[teamA]) {
        const s = standings[teamA];
        s.played++;
        s.gf += scoreA;
        s.ga += scoreB;
        s.gd = s.gf - s.ga;
        if (scoreA > scoreB) {
          s.wins++;
          s.points += 3;
        } else if (scoreA < scoreB) {
          s.losses++;
        } else {
          s.draws++;
          s.points += 1;
        }
      }

      // Update Team B
      if (standings[teamB]) {
        const s = standings[teamB];
        s.played++;
        s.gf += scoreB;
        s.ga += scoreA;
        s.gd = s.gf - s.ga;
        if (scoreB > scoreA) {
          s.wins++;
          s.points += 3;
        } else if (scoreB < scoreA) {
          s.losses++;
        } else {
          s.draws++;
          s.points += 1;
        }
      }
    }
  }

  // 2. Group teams by group letter
  const groupsList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const teamsByGroup: Record<string, Team[]> = {};

  for (const letter of groupsList) {
    teamsByGroup[letter] = teams.filter(t => t.group_letter === letter);
  }

  // Sort teams within each group by standings criteria
  for (const letter of groupsList) {
    teamsByGroup[letter].sort((a, b) => {
      const sa = standings[a.name] || { points: 0, gd: 0, gf: 0 };
      const sb = standings[b.name] || { points: 0, gd: 0, gf: 0 };

      // 1. Points
      if (sb.points !== sa.points) return sb.points - sa.points;
      // 2. Goal Difference
      if (sb.gd !== sa.gd) return sb.gd - sa.gd;
      // 3. Goals For
      if (sb.gf !== sa.gf) return sb.gf - sa.gf;
      // 4. FIFA Ranking (lower rank is better, e.g. 1st is better than 10th)
      const rA = a.fifa_ranking || 999;
      const rB = b.fifa_ranking || 999;
      return rA - rB;
    });
  }

  // Helpers for temperature styling
  const getTempColor = (temp: number | null | undefined) => {
    if (temp === undefined || temp === null) return 'bg-slate-300 text-slate-600';
    if (temp >= 75) return 'bg-rose-50 border-rose-200 text-rose-600';
    if (temp >= 55) return 'bg-orange-50 border-orange-200 text-orange-600';
    if (temp >= 35) return 'bg-amber-50 border-amber-200 text-amber-600';
    return 'bg-blue-50 border-blue-200 text-blue-600';
  };

  // Group header colors for premium visual distinction
  const getGroupHeaderStyle = (letter: string) => {
    const styles: Record<string, string> = {
      A: 'from-blue-600 to-indigo-600 shadow-blue-100',
      B: 'from-purple-600 to-indigo-600 shadow-indigo-100',
      C: 'from-pink-600 to-rose-600 shadow-rose-100',
      D: 'from-orange-600 to-amber-600 shadow-orange-100',
      E: 'from-emerald-600 to-teal-600 shadow-emerald-100',
      F: 'from-blue-500 to-cyan-500 shadow-cyan-100',
      G: 'from-violet-600 to-purple-600 shadow-purple-100',
      H: 'from-rose-500 to-orange-500 shadow-orange-100',
      I: 'from-cyan-600 to-teal-600 shadow-teal-100',
      J: 'from-indigo-600 to-violet-600 shadow-indigo-100',
      K: 'from-teal-600 to-emerald-600 shadow-emerald-100',
      L: 'from-amber-500 to-yellow-500 shadow-yellow-100'
    };
    return styles[letter] || 'from-slate-600 to-slate-800';
  };

  return (
    <div className="space-y-12">
      {/* 1. Group Stage Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groupsList.map(letter => {
            const groupTeams = teamsByGroup[letter] || [];
            
            return (
              <div 
                key={letter}
                className="bg-card rounded-3xl border border-line shadow-[0_12px_30px_-15px_rgba(16,24,40,0.08)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-18px_rgba(16,24,40,0.12)]"
              >
                {/* Group Header */}
                <div className={`bg-gradient-to-r ${getGroupHeaderStyle(letter)} px-5 py-4 text-white flex items-center justify-between shadow-sm`}>
                  <h3 className="font-display font-bold text-base tracking-wide">{letter} CSOPORT</h3>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    Állás
                  </span>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-faint border-b border-line bg-wash">
                  <div className="col-span-7">Csapat</div>
                  <div className="col-span-1.5 text-center">M</div>
                  <div className="col-span-1.5 text-center">Gk</div>
                  <div className="col-span-2 text-right">P</div>
                </div>

                {/* Team Rows */}
                <div className="divide-y divide-line">
                  {groupTeams.map((team, idx) => {
                    const stats = standings[team.name] || { played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 };
                    
                    return (
                      <button
                        key={team.id}
                        onClick={() => onSelectTeam(team.id)}
                        className="w-full grid grid-cols-12 px-5 py-3.5 items-center text-left hover:bg-wash transition-colors group"
                      >
                        {/* Team Name and flag */}
                        <div className="col-span-7 flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-mono font-bold text-faint w-4 tabular-nums">
                            {idx + 1}.
                          </span>
                          <FlagBadge country={team.name} size={20} />
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-ink truncate group-hover:text-accent transition-colors">
                              {team.name}
                            </div>
                            <div className="text-[9.5px] font-bold text-faint flex items-center gap-1.5">
                              <span>FIFA #{team.fifa_ranking || '-'}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className={`px-1.5 py-0.1 rounded-[4px] border text-[9px] font-bold ${getTempColor(team.temperature)}`}>
                                {team.temperature || 50}°C
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Matches played */}
                        <div className="col-span-1.5 text-center font-mono text-[13px] text-mid font-semibold tabular-nums">
                          {stats.played}
                        </div>

                        {/* Goal difference */}
                        <div className={`col-span-1.5 text-center font-mono text-[13px] font-semibold tabular-nums ${stats.gd > 0 ? 'text-emerald-600' : stats.gd < 0 ? 'text-rose-500' : 'text-mid'}`}>
                          {stats.gd > 0 ? `+${stats.gd}` : stats.gd}
                        </div>

                        {/* Points */}
                        <div className="col-span-2 text-right font-mono text-[14px] font-extrabold text-ink tabular-nums">
                          {stats.points}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
