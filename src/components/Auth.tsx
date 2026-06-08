import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Icon } from './Icons';

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
        alert('Sikeres regisztráció!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Hiba történt a hitelesítés során.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-card rounded-3xl shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)] border border-line">
      <div className="text-center mb-8">
        <span className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white mx-auto mb-4 shadow-[0_8px_18px_-6px_rgba(124,58,237,0.8)]">
          <Icon name="target" size={24} strokeWidth={2.2} />
        </span>
        <h2 className="text-2xl font-bold text-ink font-display mb-1.5">
          {mode === 'login' ? 'Tippjáték Pro' : 'Csatlakozz te is!'}
        </h2>
        <p className="text-mid text-xs font-medium uppercase tracking-[0.14em]">
          {mode === 'login' ? 'Jelentkezz be a baráti játékhoz' : 'Hozz létre egy új fiókot'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-[10px] font-bold text-faint uppercase tracking-[0.14em] mb-1.5 ml-1">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3.5 bg-wash border border-line2 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:outline-none focus:border-accent text-sm transition-all"
            placeholder="email@pelda.hu"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-faint uppercase tracking-[0.14em] mb-1.5 ml-1">
            Jelszó
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3.5 bg-wash border border-line2 rounded-2xl focus:ring-4 focus:ring-accent/10 focus:outline-none focus:border-accent text-sm transition-all"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-[12px] uppercase tracking-[0.14em] flex items-center justify-center gap-2 hover:brightness-105 active:brightness-95 transition-all shadow-[0_12px_28px_-12px_rgba(124,58,237,0.7)] disabled:bg-slate-300 disabled:shadow-none"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : mode === 'login' ? (
            <>Bejelentkezés <Icon name="whistle" size={14} /></>
          ) : (
            <>Regisztráció <Icon name="plus" size={14} /></>
          )}
        </button>
      </form>

      <div className="mt-8 text-center pt-6 border-t border-line">
        <button
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="text-xs font-bold text-accent hover:text-accent/90 underline underline-offset-4"
        >
          {mode === 'login' ? 'Még nincs fiókod? Hozz létre egyet!' : 'Már van fiókod? Jelentkezz be!'}
        </button>
      </div>
    </div>
  );
}
