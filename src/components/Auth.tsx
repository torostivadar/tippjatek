import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion } from 'motion/react';
import { LogIn, UserPlus } from 'lucide-react';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Sikeres regisztráció! Kérlek erősítsd meg az e-mail címed.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-2xl border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black text-slate-900 mb-2">
          {mode === 'login' ? 'Üdv újra!' : 'Csatlakozz te is!'}
        </h2>
        <p className="text-slate-500 italic">Tippelj és nyerj a VB-n!</p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:outline-none focus:border-emerald-500 transition-all"
            placeholder="email@pelda.hu"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">
            Jelszó
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:outline-none focus:border-emerald-500 transition-all"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 disabled:bg-slate-300"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : mode === 'login' ? (
            <>Bejelentkezés <LogIn size={20} /></>
          ) : (
            <>Regisztráció <UserPlus size={20} /></>
          )}
        </button>
      </form>

      <div className="mt-8 text-center pt-8 border-t border-slate-100">
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-sm font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4"
        >
          {mode === 'login' ? 'Még nincs fiókod? Regisztrálj!' : 'Már van fiókod? Jelentkezz be!'}
        </button>
      </div>
    </div>
  );
}
