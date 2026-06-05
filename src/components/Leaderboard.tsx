import { Profile } from '@/src/types';
import { motion } from 'motion/react';
import { Trophy, Medal, Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function Leaderboard({ profiles }: { profiles: Profile[] }) {
  const sortedProfiles = [...profiles].sort((a, b) => b.points - a.points);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden max-w-2xl mx-auto">
      <div className="p-8 bg-emerald-600 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-3 font-display">
          <Trophy className="text-yellow-400" />
          Ranglista
        </h2>
        <p className="text-emerald-100 mt-1">A legjobb tippmesterek</p>
      </div>

      <div className="divide-y divide-slate-50">
        {sortedProfiles.map((profile, index) => {
          const isTop3 = index < 3;
          const rankColors = [
            'bg-yellow-100 text-yellow-700 border-yellow-200',
            'bg-slate-100 text-slate-700 border-slate-200',
            'bg-orange-100 text-orange-700 border-orange-200',
          ];

          return (
            <motion.div
              key={profile.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center justify-between p-6 hover:bg-slate-50 transition-colors",
                index === 0 && "bg-yellow-50/30"
              )}
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black border-2",
                  isTop3 ? rankColors[index] : "bg-white text-slate-400 border-slate-100 shadow-sm"
                )}>
                  {index + 1}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border-4 border-white shadow-sm bg-slate-200 flex items-center justify-center text-lg font-bold">
                    {profile.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      {profile.username}
                      {index === 0 && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      {index === 0 ? 'Bajnok' : index < 3 ? 'Dobogós' : 'Játékos'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-slate-900 leading-none font-display">
                  {profile.points}
                </span>
                <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">
                  Pont
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
