import React, { useState } from 'react';
import { Icon } from './Icons';
import { supabase } from '@/src/lib/supabase';
import { User } from '@supabase/supabase-js';

const TEAMS_LIST = [
  'Algéria', 'Anglia', 'Argentína', 'Ausztrália', 'Ausztria',
  'Belgium', 'Bosznia-Hercegovina', 'Brazília', 'Csehország', 'Curaçao',
  'Dél-afrikai Köztársaság', 'Ecuador', 'Egyesült Államok', 'Egyiptom', 'Elefántcsontpart',
  'Franciaország', 'Ghána', 'Haiti', 'Hollandia', 'Horvátország',
  'Irak', 'Irán', 'Japán', 'Jordánia', 'Kanada',
  'Katar', 'Kolumbia', 'Kongói DK', 'Koreai Köztársaság', 'Marokkó',
  'Mexikó', 'Németország', 'Norvégia', 'Panama', 'Paraguay',
  'Portugália', 'Skócia', 'Spanyolország', 'Svájc', 'Szaúd-Arábia',
  'Szenegál', 'Svédország', 'Tunézia', 'Törökország', 'Új-Zéland',
  'Uruguay', 'Üzbegisztán', 'Zöld-foki Köztársaság'
].sort((a, b) => a.localeCompare(b, 'hu'));

const AVATARS_LIST = ['🦁', '🦊', '🐻', '🐼', '🐨', '🐯', '🐱', '🐶', '🐸', '🐵', '🐔', '🐧', '🐙', '🦄', '🦖', '🐬', '🐝', '🦉', '🐺', '🐰'];

interface NavigationProps {
  activeTab: 'matches' | 'leaderboard' | 'groups' | 'rules';
  setActiveTab: (tab: 'matches' | 'leaderboard' | 'groups' | 'rules') => void;
  user: User | null;
  username?: string;
  favoriteTeam?: string | null;
  championPrediction?: string | null;
  avatar?: string | null;
  onChangeUsername?: (newName: string) => Promise<void>;
  onChangeAvatar?: (emoji: string) => Promise<void>;
  onSaveChampionPrediction?: (teamName: string) => Promise<void>;
  onSelectFavoriteTeam?: (teamName: string) => Promise<void>;
}

export function Navigation({ 
  activeTab, 
  setActiveTab, 
  user, 
  username, 
  favoriteTeam, 
  championPrediction, 
  avatar,
  onChangeUsername, 
  onChangeAvatar,
  onSaveChampionPrediction,
  onSelectFavoriteTeam
}: NavigationProps) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [editName, setEditName] = useState(username || '');
  const [saving, setSaving] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isBeforeTournamentStart = new Date() < new Date('2026-06-11T19:00:00Z');
  return (
    <>
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

        {/* Desktop navigation tabs */}
        <div className="hidden md:flex items-center gap-1.5">
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

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 flex items-center gap-2
              ${activeTab === 'rules' 
                ? 'bg-accent text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.7)]' 
                : 'text-mid hover:text-ink hover:bg-wash'}`}
          >
            <Icon name="newspaper" size={14} strokeWidth={2.4} />
            <span className="hidden sm:inline">Játékszabály</span>
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
          
          {/* Desktop Profile Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={() => {
                setEditName(username || '');
                setShowProfileDropdown(!showProfileDropdown);
              }}
              className="flex items-center gap-2 hover:bg-wash p-1 rounded-full md:pr-3 transition-colors cursor-pointer"
              title="Profil beállítások"
            >
              <span className={`w-8 h-8 rounded-full bg-wash border border-line flex items-center justify-center font-display font-bold text-ink shrink-0 ${avatar ? 'text-[17px]' : 'text-[11px]'}`}>
                {avatar || (username ? username.substring(0, 2).toUpperCase() : (user?.email ? user.email.substring(0, 2).toUpperCase() : 'TE'))}
              </span>
              {username && (
                <span className="hidden md:inline text-[11px] font-bold text-mid">
                  {username}
                </span>
              )}
              <Icon name="chevron" size={10} className={`text-faint transition-transform duration-200 ${showProfileDropdown ? 'rotate-90' : 'rotate-0'}`} />
            </button>

            {showProfileDropdown && (
              <>
                {/* Overlay to close when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileDropdown(false)}
                />
                
                {/* Dropdown panel */}
                <div className="absolute right-0 mt-2 w-72 bg-card rounded-2xl border border-line shadow-[0_12px_30px_-10px_rgba(16,24,40,0.20)] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="border-b border-line pb-3 mb-3">
                    <div className="font-display font-bold text-[13px] text-ink">Profilom</div>
                    <div className="font-mono text-[10px] text-faint truncate mt-0.5">{user?.email}</div>
                  </div>

                  <div className="space-y-3">
                    {/* Name edit field */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-1.5">Becenév</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 bg-wash border border-line2 rounded-xl px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-accent"
                          placeholder="Megjelenített név"
                          disabled={saving}
                        />
                        <button
                          onClick={async () => {
                            if (!editName.trim()) return;
                            setSaving(true);
                            await onChangeUsername?.(editName);
                            setSaving(false);
                            setShowProfileDropdown(false);
                          }}
                          disabled={saving || editName.trim() === username}
                          className="bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-[0_4px_10px_-3px_rgba(124,58,237,0.4)] disabled:opacity-40 disabled:shadow-none cursor-pointer"
                        >
                          {saving ? 'Ment...' : 'Mentés'}
                        </button>
                      </div>
                    </div>

                    {/* Avatar selection grid */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-1.5 font-display">Avatar választása</label>
                      <div className="grid grid-cols-5 gap-1.5 bg-wash border border-line rounded-xl p-2 max-w-[240px] mx-auto">
                        {AVATARS_LIST.map((emoji) => {
                          const isSelected = avatar === emoji;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => onChangeAvatar?.(emoji)}
                              className={`w-9 h-9 rounded-lg border flex items-center justify-center text-[19px] transition-all cursor-pointer select-none
                                ${isSelected 
                                  ? 'bg-accent/10 border-accent scale-105 shadow-[0_2px_8px_-2px_rgba(124,58,237,0.4)]' 
                                  : 'bg-white border-line hover:bg-wash hover:scale-105'}`}
                              title="Avatar kiválasztása"
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Favorite team selection / display */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-1.5">Kedvenc csapatom (Fan Factor)</label>
                      {isBeforeTournamentStart ? (
                        <select
                          value={favoriteTeam || ''}
                          onChange={(e) => onSelectFavoriteTeam?.(e.target.value)}
                          className="w-full bg-wash border border-line2 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-accent cursor-pointer"
                        >
                          <option value="">-- Válassz kedvenc csapatot --</option>
                          {TEAMS_LIST.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        favoriteTeam && (
                          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-orange-700">Kedvenc csapat</div>
                              <div className="font-display text-xs font-bold text-ink truncate mt-0.5">{favoriteTeam}</div>
                            </div>
                            <span className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                              <Icon name="star" size={14} fill="#F97316" strokeWidth={0} />
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    {/* World Cup Champion Prediction */}
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-1.5">Világbajnok tipp (+150 pont)</label>
                      {isBeforeTournamentStart ? (
                        <select
                          value={championPrediction || ''}
                          onChange={(e) => onSaveChampionPrediction?.(e.target.value)}
                          className="w-full bg-wash border border-line2 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-accent cursor-pointer"
                        >
                          <option value="">-- Válassz világbajnokot --</option>
                          {TEAMS_LIST.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-accent">Világbajnok tipp</div>
                            <div className="font-display text-xs font-bold text-ink truncate mt-0.5">
                              {championPrediction || 'Nem tippeltél időben'}
                            </div>
                          </div>
                          <span className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                            <Icon name="sparkles" size={14} className="text-accent" />
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sign out button */}
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="w-full border border-line hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-mid text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <Icon name="logout" size={14} strokeWidth={2.2} />
                      Kijelentkezés
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            onClick={() => {
              setEditName(username || '');
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden w-10 h-10 rounded-xl border border-line bg-card flex items-center justify-center text-mid hover:text-ink hover:bg-wash hover:scale-105 transition-all shadow-[0_1px_2px_rgba(16,24,40,0.04)] cursor-pointer"
            title="Menü"
          >
            <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={18} strokeWidth={2.4} />
          </button>
        </div>
      </nav>

      {/* Mobile Slide-out Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] md:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Menu */}
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-card text-ink border-l border-line shadow-[-10px_0_30px_rgba(16,24,40,0.08)] z-[100] p-5 overflow-y-auto flex flex-col md:hidden animate-in slide-in-from-right duration-300">
            {/* Header / close section */}
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white shadow-sm">
                  <Icon name="target" size={15} strokeWidth={2.2} />
                </span>
                <span className="font-display font-bold text-sm tracking-tight text-ink">TIPPJÁTÉK</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-xl border border-line bg-wash flex items-center justify-center text-mid hover:text-ink cursor-pointer transition-colors"
                title="Bezárás"
              >
                <Icon name="x" size={14} strokeWidth={2.4} />
              </button>
            </div>

            {/* Navigation tabs */}
            <div className="space-y-2.5 pb-5 border-b border-line shrink-0">
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-2">Navigáció</span>
              {[
                { tab: 'matches' as const, label: 'Mérkőzések', icon: 'whistle' },
                { tab: 'leaderboard' as const, label: 'Ranglista', icon: 'trophy' },
                { tab: 'groups' as const, label: 'Csoportok', icon: 'calendar' },
                { tab: 'rules' as const, label: 'Játékszabály', icon: 'newspaper' }
              ].map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-3 cursor-pointer
                      ${isActive 
                        ? 'bg-accent text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.7)]' 
                        : 'text-mid hover:text-ink hover:bg-wash'}`}
                  >
                    <Icon name={item.icon} size={14} strokeWidth={2.4} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile Settings */}
            <div className="pt-5 flex-1 space-y-4">
              <span className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-2">Profil & Beállítások</span>
              
              {/* Nickname */}
              <div>
                <label className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-1.5">Becenév</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-wash border border-line2 rounded-xl px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-accent"
                    placeholder="Megjelenített név"
                    disabled={saving}
                  />
                  <button
                    onClick={async () => {
                      if (!editName.trim()) return;
                      setSaving(true);
                      await onChangeUsername?.(editName);
                      setSaving(false);
                    }}
                    disabled={saving || editName.trim() === username}
                    className="bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
                  >
                    Mentés
                  </button>
                </div>
              </div>

              {/* Avatar selection grid */}
              <div>
                <label className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-1.5 font-display">Avatar választása</label>
                <div className="grid grid-cols-5 gap-1.5 bg-wash border border-line rounded-xl p-2">
                  {AVATARS_LIST.map((emoji) => {
                    const isSelected = avatar === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onChangeAvatar?.(emoji)}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center text-[19px] transition-all cursor-pointer select-none
                          ${isSelected 
                            ? 'bg-accent/10 border-accent scale-105 shadow-[0_2px_8px_-2px_rgba(124,58,237,0.4)]' 
                            : 'bg-white border-line hover:bg-wash'}`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Favorite Team */}
              <div>
                <label className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-1.5">Kedvenc csapat (Fan Factor)</label>
                {isBeforeTournamentStart ? (
                  <select
                    value={favoriteTeam || ''}
                    onChange={(e) => onSelectFavoriteTeam?.(e.target.value)}
                    className="w-full bg-wash border border-line2 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="">-- Válassz kedvencet --</option>
                    {TEAMS_LIST.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  favoriteTeam && (
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 flex items-center justify-between">
                      <span className="font-display text-xs font-bold text-ink truncate">{favoriteTeam}</span>
                      <span className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center shrink-0">
                        <Icon name="star" size={12} fill="#F97316" strokeWidth={0} />
                      </span>
                    </div>
                  )
                )}
              </div>

              {/* Champion Prediction */}
              <div>
                <label className="block text-[9.5px] font-bold uppercase tracking-[0.12em] text-faint mb-1.5">Világbajnok tipp</label>
                {isBeforeTournamentStart ? (
                  <select
                    value={championPrediction || ''}
                    onChange={(e) => onSaveChampionPrediction?.(e.target.value)}
                    className="w-full bg-wash border border-line2 rounded-xl px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:border-accent cursor-pointer"
                  >
                    <option value="">-- Válassz világbajnokot --</option>
                    {TEAMS_LIST.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5 flex items-center justify-between">
                    <span className="font-display text-xs font-bold text-ink truncate">
                      {championPrediction || 'Nem tippeltél időben'}
                    </span>
                    <span className="w-6 h-6 rounded-md bg-purple-100 flex items-center justify-center shrink-0">
                      <Icon name="sparkles" size={12} className="text-accent" />
                    </span>
                  </div>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={() => supabase.auth.signOut()}
                className="w-full border border-line hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 text-mid text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Icon name="logout" size={14} strokeWidth={2.2} />
                Kijelentkezés
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
