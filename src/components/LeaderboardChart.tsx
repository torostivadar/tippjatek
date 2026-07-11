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

  if (history.length === 0) {
    return null;
  }

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

  // Assign stable colors to other players
  const playerColors: Record<string, string> = {};
  let paletteIdx = 0;
  players.forEach((player) => {
    if (player === currentUsername) {
      playerColors[player] = '#7c3aed'; // Highlighted Purple
    } else {
      playerColors[player] = colorPalette[paletteIdx % colorPalette.length];
      paletteIdx++;
    }
  });

  // Calculate scales
  const width = 780;
  const height = 380;
  const paddingLeft = 45;
  const paddingRight = 105; // Space for labels at the end
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // X scale: maps matchIndex (0 to totalMatches) to X coordinate
  const getX = (index: number) => {
    return paddingLeft + (index / totalMatches) * chartWidth;
  };

  // Find max points in history for Y scale
  let maxPointsValue = 0;
  history.forEach((point) => {
    players.forEach((player) => {
      if (point[player] > maxPointsValue) {
        maxPointsValue = point[player];
      }
    });
  });
  // Round up to nearest 50 for clean grid lines
  const yMax = Math.max(Math.ceil(maxPointsValue / 50) * 50, 100);

  // Y scale: maps points to Y coordinate (inverted for SVG coords)
  const getY = (points: number) => {
    return paddingTop + chartHeight - (points / yMax) * chartHeight;
  };

  // Grid lines
  const gridSteps = 5;
  const yGridValues = Array.from({ length: gridSteps + 1 }, (_, i) => (yMax / gridSteps) * i);

  return (
    <div className="rounded-3xl border border-line bg-card overflow-hidden shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-line">
        <span className="w-10 h-10 rounded-2xl bg-accent/5 border border-accent/15 flex items-center justify-center">
          <Icon name="swords" size={18} className="text-accent" />
        </span>
        <div>
          <h3 className="text-sm font-extrabold text-ink font-display uppercase tracking-wider">Pontok alakulása</h3>
          <p className="text-[10px] text-faint font-medium mt-0.5">A ranglista menetelése mérkőzésről mérkőzésre (0 ➔ {totalMatches}. meccs)</p>
        </div>
      </div>

      {/* Responsive SVG Chart */}
      <div className="relative w-full overflow-x-auto nice-scroll select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[650px] h-auto">
          {/* Y Grid Lines & Labels */}
          {yGridValues.map((val) => {
            const yCoord = getY(val);
            return (
              <g key={val}>
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
                  className="font-mono text-[9px] font-bold text-faint tabular-nums"
                  textAnchor="end"
                >
                  {val}
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
            const color = playerColors[player] || '#cbd5e1';
            
            // Build SVG path
            const pathPoints = history.map((point, index) => {
              const x = getX(index);
              const y = getY(point[player] || 0);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ');

            // Determine rendering weights based on hover
            const isAnyHovered = hoveredPlayer !== null;
            const isThisHovered = hoveredPlayer === player;
            
            let opacity = 0.45;
            let strokeWidth = 1.5;
            if (isSelf) {
              opacity = 1.0;
              strokeWidth = 3.0;
            }
            if (isAnyHovered) {
              if (isThisHovered) {
                opacity = 1.0;
                strokeWidth = isSelf ? 4.0 : 2.5;
              } else {
                opacity = isSelf ? 0.45 : 0.15;
              }
            }

            const lastPoint = history[history.length - 1];
            const lastPointsVal = lastPoint[player] || 0;
            const lastX = getX(history.length - 1);
            const lastY = getY(lastPointsVal);

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
                
                {/* Main Line */}
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
                  fill={color} 
                  fillOpacity={isAnyHovered && !isThisHovered ? 0.35 : 1}
                  className={`text-[9.5px] select-none ${isSelf || isThisHovered ? 'font-extrabold' : 'font-semibold'}`}
                >
                  {player} ({lastPointsVal})
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
