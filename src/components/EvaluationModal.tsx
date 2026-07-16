import React, { useEffect, useRef } from 'react';
import { Profile } from '@/src/types';
import { Icon } from './Icons';

interface EvaluationModalProps {
  profile: Profile;
  rank: number;
  onClose: () => void;
}

export function EvaluationModal({ profile, rank, onClose }: EvaluationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parse **bold** and *italics*
  const formatText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-accent font-medium">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  // Canvas Confetti Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class definition
    interface ConfettiParticle {
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }

    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849', '#ffc82c'];
    const particles: ConfettiParticle[] = [];

    // Initialize 65 particles falling from top
    for (let i = 0; i < 65; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * -height,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        // Reset particle to top if it leaves screen
        if (p.y > height) {
          p.y = Math.random() * -50 - 10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Determine ranking style and badge text
  let badgeClass = 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-slate-100 border-slate-700 shadow-slate-900/30';
  let badgeText = `${rank}. Helyezett 🎖️`;
  let glowClass = 'shadow-[0_12px_45px_-8px_rgba(124,58,237,0.3)]';

  if (rank === 1) {
    badgeClass = 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border-amber-300 shadow-amber-200/50';
    badgeText = 'Tornagyőztes 🥇';
    glowClass = 'shadow-[0_12px_45px_-8px_rgba(245,158,11,0.5)]';
  } else if (rank === 2) {
    badgeClass = 'bg-gradient-to-r from-slate-300 via-zinc-100 to-slate-400 text-slate-800 border-slate-200 shadow-slate-200/50';
    badgeText = '2. Helyezett 🥈';
    glowClass = 'shadow-[0_12px_45px_-8px_rgba(148,163,184,0.5)]';
  } else if (rank === 3) {
    badgeClass = 'bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500 text-orange-950 border-orange-300 shadow-orange-200/50';
    badgeText = '3. Helyezett 🥉';
    glowClass = 'shadow-[0_12px_45px_-8px_rgba(249,115,22,0.5)]';
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      {/* Falling Confetti Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Modal Dialog Card */}
      <div 
        className="relative w-full max-w-lg bg-card rounded-3xl border border-line shadow-2xl p-6 md:p-8 flex flex-col items-center text-center gap-5 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-300 max-h-[90vh]"
      >
        {/* Top Glow Layer */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-faint hover:text-ink hover:bg-wash rounded-xl transition-all cursor-pointer"
        >
          <Icon name="close" size={20} />
        </button>

        {/* Circular Avatar */}
        <div className="relative mt-2">
          {/* Pulsing Aura */}
          <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl animate-pulse" />
          <div 
            className={`relative w-28 h-28 rounded-full border-[6px] border-white flex items-center justify-center text-5xl bg-gradient-to-tr from-accent/10 to-accent/20 z-10 ${glowClass}`}
          >
            {profile.avatar || '🤖'}
          </div>
        </div>

        {/* Rank Badge */}
        <div className={`px-6 py-2 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg border z-20 -mt-7 ${badgeClass}`}>
          {badgeText}
        </div>

        {/* User Greeting & Title */}
        <div className="space-y-1">
          <h3 className="text-xl font-display font-extrabold text-ink tracking-tight">Gratulálok, {profile.username}!</h3>
          <p className="text-[10px] text-faint font-bold uppercase tracking-widest">Claudius levele megérkezett</p>
        </div>

        {/* Message Content */}
        <div className="w-full bg-wash border border-line rounded-2xl p-4 overflow-y-auto max-h-[40vh] nice-scroll text-left">
          <p className="text-xs text-mid leading-relaxed font-medium whitespace-pre-wrap">
            {formatText(profile.evaluation || '')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="w-full pt-2 flex items-center justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-accent text-white font-bold text-xs uppercase tracking-wider hover:brightness-150 active:brightness-95 transition-all shadow-[0_12px_28px_-12px_rgba(124,58,237,0.7)] cursor-pointer"
          >
            Köszönöm, elolvastam!
          </button>
        </div>
      </div>
    </div>
  );
}
