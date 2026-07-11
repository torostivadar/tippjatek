import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Profile } from '@/src/types';
import { Icon } from './Icons';

interface LeaderboardChartProps {
  profiles: Profile[];
  currentUserId?: string;
}

interface HistoryDataPoint {
  matchIndex: number;
  matchId: string;
  matchName: string;
  [playerName: string]: any;
}

interface RankDataPoint {
  matchIndex: number;
  matchId: string;
  matchName: string;
  ranks: Record<string, number>;
  points: Record<string, number>;
}

export function LeaderboardChart({ profiles, currentUserId }: LeaderboardChartProps) {
  const [history, setHistory] = useState<HistoryDataPoint[]>([]);
  const [players, setPlayers] = useState<string[]>([]);
  const [totalMatches, setTotalMatches] = useState(104);
  const [loading, setLoading] = useState(true);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  const currentUserProfile = profiles.find((p) => p.id === currentUserId);
  const currentUsername = currentUserProfile?.username || '';

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setLoading(false);
          return;
        }

        const res = await fetch('/api/leaderboard/history', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setHistory(data.history);
            setPlayers(data.players);
            if (data.totalMatchesCount) {
              setTotalMatches(data.totalMatchesCount);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching leaderboard history:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-line bg-card p-10 text-center shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)] flex flex-col items-center justify-center gap-3">
        <span className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <span className="text-xs font-bold text-faint uppercase tracking-wider">Grafikon betöltése...</span>
      </div>
    );
  }

  if (history.length === 0 || players.length === 0) {
    return null;
  }

  // Precalculate the rank and points of each player at each step
  const rankHistory: RankDataPoint[] = history.map((point) => {
    const stepRanks: Record<string, number> = {};
    const stepPoints: Record<string, number> = {};

    players.forEach((player) => {
      const playerPoints = point[player] || 0;
      stepPoints[player] = playerPoints;
      
      // Competition ranking: 1 + number of players who have strictly more points
      const rank = 1 + players.filter((other) => (point[other] || 0) > playerPoints).length;
      stepRanks[player] = rank;
    });

    return {
      matchIndex: point.matchIndex,
      matchId: point.matchId,
      matchName: point.matchName,
      ranks: stepRanks,
      points: stepPoints
    };
  });

  // Predefined beautiful palette for players when hovered
  const colorPalette = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f97316', // orange
    '#14b8a6', // teal
    '#eab308', // yellow
    '#ec4899', // pink
    '#f43f5e', // rose
    '#84cc16', // lime
    '#06b6d4', // cyan
  ];

  // Assign stable colors to other players
  const playerColors: Record<string, string> = {};
  let paletteIdx = 0;
  players.forEach((player) => {
    if (player === currentUsername) {
      playerColors[player] = '#7c3aed'; // Active user: deep violet
    } else {
      playerColors[player] = colorPalette[paletteIdx % colorPalette.length];
      paletteIdx++;
    }
  });

  // Calculate scales
  const width = 780;
  const height = 380;
  const paddingLeft = 45;
  const paddingRight = 115; // Space for labels at the end
  const paddingTop = 35;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // X scale
  const getX = (index: number) => {
    return paddingLeft + (index / totalMatches) * chartWidth;
  };

  // Y scale (inverted)
  const maxRank = Math.max(players.length, 2);
  const getY = (rank: number) => {
    return paddingTop + ((rank - 1) / (maxRank - 1)) * chartHeight;
  };

  // Helper to calculate Y coordinate with parallel offset for ties
  const getYWithOffset = (player: string, stepIdx: number) => {
    const rawRank = rankHistory[stepIdx].ranks[player] || maxRank;
    
    // Find all players sharing this exact rank at this step
    const tiedPlayers = players.filter((p) => rankHistory[stepIdx].ranks[p] === rawRank);
    if (tiedPlayers.length <= 1) {
      return getY(rawRank);
    }
    
    // Stable sort to ensure lines don't swap parallel tracks mid-air
    tiedPlayers.sort();
    
    const tieIdx = tiedPlayers.indexOf(player);
    // Offset by a small fraction of a rank unit (e.g. max offset is +/- 0.12 ranks)
    const offset = (tieIdx - (tiedPlayers.length - 1) / 2) * 0.14;
    return getY(rawRank + offset);
  };

  // Y grid lines represent ranks (1., 2., 3., ... 10.)
  const yGridRanks = Array.from({ length: maxRank }, (_, i) => i + 1);

  return (
    <div className="rounded-3xl border border-line bg-card overflow-hidden shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-line">
        <span className="w-10 h-10 rounded-2xl bg-accent/5 border border-accent/15 flex items-center justify-center">
          <Icon name="swords" size={18} className="text-accent" />
        </span>
        <div>
          <h3 className="text-sm font-extrabold text-ink font-display uppercase tracking-wider">Helyezések alakulása</h3>
          <p className="text-[10px] text-faint font-medium mt-0.5">A bajnokság alatti pozícióharcok (1. hely felül, utolsó hely alul)</p>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-x-auto nice-scroll select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[650px] h-auto">
          {/* Y Grid Lines & Labels (Ranks) */}
          {yGridRanks.map((rank) => {
            const yCoord = getY(rank);
            return (
              <g key={rank}>
                <line 
                  x1={paddingLeft} 
                  y1={yCoord} 
                  x2={paddingLeft + chartWidth} 
                  y2={yCoord} 
                  stroke="#e2e8f0" 
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={yCoord + 3} 
                  className={`font-mono text-[9.5px] tabular-nums ${rank === 1 ? 'font-extrabold text-amber-500' : 'font-bold text-faint'}`}
                  textAnchor="end"
                >
                  {rank}.
                </text>
              </g>
            );
          })}

          {/* X Grid Lines (Milestones: e.g. start, increments of 16, final) */}
          {[0, 16, 32, 48, 64, 80, 96, totalMatches].map((idx) => {
            const xCoord = getX(idx);
            return (
              <g key={idx}>
                <line 
                  x1={xCoord} 
                  y1={paddingTop} 
                  x2={xCoord} 
                  y2={paddingTop + chartHeight} 
                  stroke="#f1f5f9" 
                  strokeWidth={1}
                />
                <text 
                  x={xCoord} 
                  y={paddingTop + chartHeight + 15} 
                  className="font-mono text-[9px] font-bold text-faint"
                  textAnchor="middle"
                >
                  {idx === 0 ? 'Start' : `${idx}.m`}
                </text>
              </g>
            );
          })}

          {/* Player Lines */}
          {players.map((player) => {
            const isSelf = player === currentUsername;
            
            // Build SVG path using Sigmoid curves (Bezier) instead of straight lines
            let pathPoints = '';
            rankHistory.forEach((point, stepIdx) => {
              const x = getX(point.matchIndex);
              const y = getYWithOffset(player, stepIdx);

              if (stepIdx === 0) {
                pathPoints = `M ${x} ${y}`;
              } else {
                const prevPoint = rankHistory[stepIdx - 1];
                const prevX = getX(prevPoint.matchIndex);
                const prevY = getYWithOffset(player, stepIdx - 1);
                const dx = x - prevX;
                // Cubic Bezier interpolation: Control points located halfway horizontally
                pathPoints += ` C ${prevX + dx / 2} ${prevY}, ${x - dx / 2} ${y}, ${x} ${y}`;
              }
            });

            // Focus + Context Logic
            // If hovered over anyone, dim everyone else.
            // If not hovered, "self" is active purple, others are uniform soft light gray.
            const isAnyHovered = hoveredPlayer !== null;
            const isThisHovered = hoveredPlayer === player;
            
            let color = '#cbd5e1'; // Default: Soft gray for others
            let opacity = 0.35;
            let strokeWidth = 1.25;

            if (isSelf) {
              color = '#7c3aed'; // Highlighted Purple
              opacity = 1.0;
              strokeWidth = 3.0;
            }

            if (isAnyHovered) {
              if (isThisHovered) {
                color = playerColors[player] || '#7c3aed';
                opacity = 1.0;
                strokeWidth = isSelf ? 4.0 : 2.5;
              } else {
                opacity = isSelf ? 0.35 : 0.08; // Dim unhovered lines severely
              }
            }

            const lastPoint = rankHistory[rankHistory.length - 1];
            const lastRankVal = lastPoint.ranks[player] || maxRank;
            const lastPointsVal = lastPoint.points[player] || 0;
            const lastX = getX(rankHistory.length - 1);
            const lastY = getYWithOffset(player, rankHistory.length - 1);

            return (
              <g 
                key={player}
                onMouseEnter={() => setHoveredPlayer(player)}
                onMouseLeave={() => setHoveredPlayer(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Glow Filter for Active/Hovered Player */}
                {(isSelf || isThisHovered) && (
                  <path 
                    d={pathPoints} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth={strokeWidth + 3} 
                    strokeOpacity={0.15}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                
                {/* Main Line (Sigmoid Path) */}
                <path 
                  d={pathPoints} 
                  fill="none" 
                  stroke={color} 
                  strokeWidth={strokeWidth} 
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Endpoint circle */}
                <circle 
                  cx={lastX} 
                  cy={lastY} 
                  r={isSelf || isThisHovered ? 4.5 : 3} 
                  fill={color} 
                  fillOpacity={opacity}
                />

                {/* Endpoint label */}
                <text 
                  x={lastX + 8} 
                  y={lastY + 3.5} 
                  fill={isSelf || isThisHovered ? color : (isAnyHovered ? '#cbd5e1' : '#475569')}
                  fillOpacity={isAnyHovered && !isThisHovered ? 0.25 : 1}
                  className={`text-[9.5px] select-none ${isSelf || isThisHovered ? 'font-extrabold' : 'font-semibold'}`}
                >
                  {player} ({lastRankVal}. - {lastPointsVal}p)
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
