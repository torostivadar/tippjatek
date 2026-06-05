import { Trophy, Home, User, ListOrdered } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface NavProps {
  activeTab: 'matches' | 'leaderboard' | 'profile';
  setActiveTab: (tab: 'matches' | 'leaderboard' | 'profile') => void;
}

export function Navigation({ activeTab, setActiveTab }: NavProps) {
  const tabs = [
    { id: 'matches', label: 'Meccsek', icon: Home },
    { id: 'leaderboard', label: 'Ranglista', icon: Trophy },
    { id: 'profile', label: 'Profil', icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe-offset-2 z-50 md:top-0 md:bottom-auto md:bg-white/80 md:backdrop-blur-md md:border-b md:border-t-0">
      <div className="max-w-4xl mx-auto flex justify-around md:justify-center md:gap-12">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-col items-center gap-1 py-1 transition-colors relative",
              activeTab === id ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Icon size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
            {activeTab === id && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-2 left-0 right-0 h-0.5 bg-emerald-600 md:-bottom-2.5"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
