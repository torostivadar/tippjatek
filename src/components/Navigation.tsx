import React from 'react';
import { Icon } from './Icons';
import { supabase } from '@/src/lib/supabase';
import { User } from '@supabase/supabase-js';

interface NavigationProps {
  activeTab: 'matches' | 'leaderboard' | 'groups';
  setActiveTab: (tab: 'matches' | 'leaderboard' | 'groups') => void;
  user: User | null;
}

export function Navigation({ activeTab, setActiveTab, user }: NavigationProps) {
  return (
    <nav className="fixed top-0 inset-x-0 h-16 z-50 px-4 md:px-6 flex items-center justify-between border-b border-line bg-card/85 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white shadow-[0_8px_18px_-6px_rgba(124,58,237,0.8)]">
          <Icon name="target" size={20} strokeWidth={2.2} />
        </span>
        <div className="leading-none">
          <span className="font-display font-bold text-[15px] tracking-tight text-ink">TIPPJÁTÉK</span>
          <span className="ml-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-accent align-middle">Pro</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 flex items-center gap-2
            ${activeTab === 'matches' 
              ? 'bg-accent text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.7)]' 
              : 'text-mid hover:text-ink hover:bg-wash'}`}
        >
          <Icon name="whistle" size={14} strokeWidth={2.4} />
          <span className="hidden sm:inline">Mérkőzések</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 flex items-center gap-2
            ${activeTab === 'leaderboard' 
              ? 'bg-accent text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.7)]' 
              : 'text-mid hover:text-ink hover:bg-wash'}`}
        >
          <Icon name="trophy" size={14} strokeWidth={2.4} />
          <span className="hidden sm:inline">Ranglista</span>
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 flex items-center gap-2
            ${activeTab === 'groups' 
              ? 'bg-accent text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.7)]' 
              : 'text-mid hover:text-ink hover:bg-wash'}`}
        >
          <Icon name="calendar" size={14} strokeWidth={2.4} />
          <span className="hidden sm:inline">Csoportok</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden md:flex items-center gap-2 pr-3 border-r border-line">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
          <span className="font-mono text-[10px] font-bold text-mid tracking-wide">VB 2026</span>
        </span>
        
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-wash border border-line flex items-center justify-center font-display text-[11px] font-bold text-ink" title={user?.email || ''}>
            {user?.email ? user.email.substring(0, 2).toUpperCase() : 'TE'}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2 text-faint hover:text-rose-600 transition-colors"
            title="Kijelentkezés"
          >
            <Icon name="logout" size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </nav>
  );
}
