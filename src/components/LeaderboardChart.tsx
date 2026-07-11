import React, { useState, useEffect, useRef } from 'react';
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
  
  // States for multi-select (click) and temporary highlight (hover)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentUserProfile = profiles.find((p) => p.id === currentUserId);
  const currentUsername = currentUserProfile?.username || '';

  // Scroll to the end (right side) on load so users see the current rankings
  useEffect(() => {
    if (history.length > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [history]);

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

  // Predefined beautiful palette for players
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

  // Assign stable colors to players
  const playerColors: Record<string, string> = {};
  let paletteIdx = 0;
  players.forEach((player) => {
    if (player === currentUsername) {
      playerColors[player] = '#7c3aed'; // Active User: Purple
    } else {
      playerColors[player] = colorPalette[paletteIdx % colorPalette.length];
      paletteIdx++;
    }
  });

  // Calculate scales
  const width = 780;
  const height = 380;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 35;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // X scale
  const getX = (index: number) => {
    return paddingLeft + (index / totalMatches) * chartWidth;
  };

  // Y scale
  const maxRank = Math.max(players.length, 2);
  const getY = (rank: number) => {
    return paddingTop + ((rank - 1) / (maxRank - 1)) * chartHeight;
  };

  // Helper to calculate Y coordinate with parallel offset for ties
  const getYWithOffset = (player: string, stepIdx: number) => {
    const rawRank = rankHistory[stepIdx].ranks[player] || maxRank;
    
    const tiedPlayers = players.filter((p) => rankHistory[stepIdx].ranks[p] === rawRank);
    if (tiedPlayers.length <= 1) {
      return getY(rawRank);
    }
    
    tiedPlayers.sort();
    
    const tieIdx = tiedPlayers.indexOf(player);
    const offset = (tieIdx - (tiedPlayers.length - 1) / 2) * 0.14;
    return getY(rawRank + offset);
  };

  // Y grid lines represent ranks (1., 2., 3., ... 9.)
  const yGridRanks = Array.from({ length: maxRank }, (_, i) => i + 1);

  // Toggle selection for a player
  const handlePillClick = (player: string) => {
    setSelectedPlayers((prev) => 
      prev.includes(player)
        ? prev.filter((p) => p !== player)
        : [...prev, player]
    );
  };

  // Determine if any highlighting is active
  const isAnyHighlighted = selectedPlayers.length > 0 || hoveredPlayer !== null;

  return (
    <div className="rounded-3xl border border-line bg-card overflow-hidden shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)] p-5 space-y-5">
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

      {/* Scrollable Container */}
      <div ref={scrollContainerRef} className="relative w-full overflow-x-auto nice-scroll select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[950px] md:min-w-0 h-auto">
          {/* Y Grid Lines & Labels */}
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

          {/* X Grid Lines */}
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
            
            // Build SVG path
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
                pathPoints += ` C ${prevX + dx / 2} ${prevY}, ${x - dx / 2} ${y}, ${x} ${y}`;
              }
            });

            // Focus + Context Logic with multi-select support
            const isHighlighted = selectedPlayers.includes(player) || hoveredPlayer === player;
            
            let color = '#cbd5e1'; // Faint gray
            let opacity = 0.50; // default visible gray
            let strokeWidth = 1.25;

            // Highlighted Active User (Self)
            if (isSelf) {
              color = '#7c3aed';
              opacity = 1.0;
              strokeWidth = 3.0;
            }

            if (isAnyHighlighted) {
              if (isHighlighted) {
                color = playerColors[player] || '#7c3aed';
                opacity = 1.0;
                strokeWidth = isSelf ? 4.0 : 2.5;
              } else {
                // Not highlighted: dim slightly but keep visible (opacity 0.15)
                color = '#cbd5e1';
                opacity = isSelf ? 0.35 : 0.15;
              }
            } else {
              // Default state (no highlighting active at all)
              if (!isSelf) {
                // Make the gray lines slightly darker/more visible by default
                color = '#94a3b8'; // Slate gray
                opacity = 0.50;
              }
            }

            const lastPoint = rankHistory[rankHistory.length - 1];
            const lastRankVal = lastPoint.ranks[player] || maxRank;
            const lastX = getX(rankHistory.length - 1);
            const lastY = getYWithOffset(player, rankHistory.length - 1);

            return (
              <g 
                key={player}
                onMouseEnter={() => setHoveredPlayer(player)}
                onMouseLeave={() => setHoveredPlayer(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Glow Filter */}
                {(isSelf || isHighlighted) && (
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
                
                {/* Main Sigmoid Path */}
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
                  r={isSelf || isHighlighted ? 4.5 : 3} 
                  fill={color} 
                  fillOpacity={opacity}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Legend (Pills) - Compakt, Name-Only layout */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-line">
        {players.map((player) => {
          const color = playerColors[player] || '#cbd5e1';
          const isSelf = player === currentUsername;
          const isSelected = selectedPlayers.includes(player) || hoveredPlayer === player;

          // Highlighted border/background style when selected
          const activeStyle = isSelected
            ? { borderColor: color, backgroundColor: `${color}12`, color: '#0f172a' }
            : { borderColor: 'var(--color-line)', color: 'var(--color-mid)' };

          return (
            <button
              key={player}
              onClick={() => handlePillClick(player)}
              onMouseEnter={() => setHoveredPlayer(player)}
              onMouseLeave={() => setHoveredPlayer(null)}
              style={activeStyle}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all duration-200 cursor-pointer select-none hover:border-line2 hover:text-ink
                ${isSelf && !isAnyHighlighted ? 'bg-[#F4F0FE] border-accent/40 text-accent' : ''}`}
            >
              {/* Dot indicator with player color */}
              <span 
                className="w-1.5 h-1.5 rounded-full shrink-0" 
                style={{ backgroundColor: color }}
              />
              <span>
                {player}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
