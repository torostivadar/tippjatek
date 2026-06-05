/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useApp } from '@/src/hooks/useApp';
import { Navigation } from '@/src/components/Navigation';
import { MatchList } from '@/src/components/MatchList';
import { Leaderboard } from '@/src/components/Leaderboard';
import { Auth } from '@/src/components/Auth';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { cn } from '@/src/lib/utils';

export default function App() {
  const { 
    user, 
    loading, 
    matches, 
    predictions, 
    profiles, 
    activeTab, 
    setActiveTab,
    savePrediction 
  } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className={cn(
        "mx-auto px-4 md:px-6 pt-24 pb-32 md:pt-32 transition-all duration-300",
        activeTab === 'matches' ? "max-w-7xl w-full" : "max-w-4xl"
      )}>
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl font-display">
              {activeTab === 'matches' ? 'Meccsek' : activeTab === 'leaderboard' ? 'Ranglista' : 'Profilom'}
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              {activeTab === 'matches' ? 'Tippelj az eredményekre és gyűjts pontokat!' : 'Ki vezeti a bajnokságot?'}
            </p>
          </div>
          
          <button 
            onClick={() => supabase.auth.signOut()}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
            title="Kijelentkezés"
          >
            <LogOut size={20} />
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'matches' && (
              <MatchList 
                matches={matches} 
                predictions={predictions} 
                onSavePrediction={savePrediction}
              />
            )}
            {activeTab === 'leaderboard' && (
              <Leaderboard profiles={profiles} />
            )}
            {activeTab === 'profile' && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl max-w-lg mx-auto overflow-hidden">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                    <UserIcon size={48} strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold">{user.email}</h2>
                    <p className="text-slate-400 font-medium">{profiles.find(p => p.id === user.id)?.points || 0} gyűjtött pont</p>
                  </div>
                  
                  <div className="w-full grid grid-cols-3 gap-4 mt-4">
                    {[
                      { label: 'Tippek', val: predictions.length },
                      { label: 'Teljes találat', val: '0' },
                      { label: 'Helyezés', val: '#4' },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 p-4 rounded-2xl text-center">
                        <span className="block text-xl font-black text-slate-800">{s.val}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
    </div>
  );
}
