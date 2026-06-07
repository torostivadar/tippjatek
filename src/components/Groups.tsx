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

  const getGroupHeaderStyle = (letter: string) => {
    const styles: Record<string, string> = {
      A: 'bg-blue-600 text-white',
      B: 'bg-indigo-600 text-white',
      C: 'bg-rose-600 text-white',
      D: 'bg-orange-600 text-white',
      E: 'bg-emerald-600 text-white',
      F: 'bg-cyan-600 text-white',
      G: 'bg-purple-600 text-white',
      H: 'bg-amber-600 text-white',
      I: 'bg-teal-600 text-white',
      J: 'bg-sky-600 text-white',
      K: 'bg-fuchsia-600 text-white',
      L: 'bg-violet-600 text-white'
    };
    return styles[letter] || 'bg-slate-700 text-white';
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
                className="bg-card rounded-2xl border border-line shadow-[0_2px_8px_-2px_rgba(16,24,40,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_12px_24px_-10px_rgba(16,24,40,0.08)] hover:border-line2"
              >
                {/* Group Header */}
                <div className={`px-5 py-3.5 flex items-center justify-between ${getGroupHeaderStyle(letter)}`}>
                  <h3 className="font-display font-bold text-[13px] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
                    {letter} csoport
                  </h3>
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] bg-white/20 text-white border border-white/30 px-2.5 py-0.5 rounded-full shadow-xs">
                    Állás
                  </span>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-faint border-b border-line bg-wash/50">
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
                        className="w-full grid grid-cols-12 px-5 py-3 items-center text-left hover:bg-wash transition-colors group"
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
