import React, { useState } from 'react';
import { Icon, FlagBadge } from './Icons';
import { supabase } from '@/src/lib/supabase';

// Shared list of 48 teams
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

interface CrossroadsModalProps {
  favoriteTeam: string;
  eliminatedTeams: string[];
  onSubmitChoice: (option: 'A' | 'B', newFavoriteTeam?: string) => Promise<void>;
}

export function CrossroadsModal({ favoriteTeam, eliminatedTeams, onSubmitChoice }: CrossroadsModalProps) {
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | null>(null);
  const [newFavorite, setNewFavorite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter out eliminated teams to find the active ones
  const activeTeams = TEAMS_LIST.filter(t => !eliminatedTeams.includes(t) && t !== favoriteTeam);

  const handleConfirm = async () => {
    if (!selectedOption) return;
    if (selectedOption === 'A' && !newFavorite) {
      alert('Kérlek válaszd ki az új kedvenc csapatodat!');
      return;
    }

    const confirmMsg = selectedOption === 'A' 
      ? `Biztosan új kedvencnek választod a(z) ${newFavorite} csapatot? Ez a döntés végleges és -30 pont levonással jár.`
      : `Biztosan hűséges maradsz a(z) ${favoriteTeam} csapathoz? Ez a döntés végleges és +30 pont jóváírással jár.`;

    if (!confirm(confirmMsg)) return;

    setSubmitting(true);
    try {
      await onSubmitChoice(selectedOption, selectedOption === 'A' ? newFavorite : undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink/70 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-xl w-full bg-card rounded-3xl border border-line p-6 md:p-8 shadow-[0_24px_60px_-15px_rgba(124,58,237,0.35)] text-center my-8">
        
        {/* Banner header */}
        <div className="mb-6">
          <span className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 mx-auto mb-4">
            <Icon name="shield" size={30} className="text-rose-600 animate-bounce" />
          </span>
          <h2 className="text-2xl font-bold text-ink font-display tracking-tight mb-2">Kiesési Válaszút!</h2>
          <p className="text-mid text-sm leading-relaxed max-w-sm mx-auto">
            Sajnáljuk, de a kedvenc csapatod (<span className="font-bold text-ink">{favoriteTeam}</span>) kiesett a tornáról.
          </p>
        </div>

        {/* Flag badge of the fallen team */}
        <div className="flex items-center justify-center gap-3 bg-rose-50/50 border border-rose-100/70 rounded-2xl p-4 mb-6 max-w-xs mx-auto">
          <FlagBadge country={favoriteTeam} size={28} />
          <div className="text-left leading-none">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Kiesett kedvenc</div>
            <div className="font-display text-sm font-bold text-ink mt-1">{favoriteTeam}</div>
          </div>
        </div>

        {/* Options grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7 text-left">
          
          {/* OPTION A */}
          <button
            type="button"
            onClick={() => setSelectedOption('A')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer
              ${selectedOption === 'A'
                ? 'bg-purple-50/50 border-accent shadow-[0_8px_20px_-10px_rgba(124,58,237,0.4)]'
                : 'bg-card border-line hover:border-line2'}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md
                  ${selectedOption === 'A' ? 'bg-accent text-white' : 'bg-wash2 text-mid'}`}>
                  A-TERV
                </span>
                <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">-30 pont</span>
              </div>
              <h3 className="font-display font-bold text-sm text-ink mb-1">Új kedvenc csapat</h3>
              <p className="text-[11.5px] text-mid leading-relaxed">
                Válassz új csapatot a még versenyben lévők közül. A dupla pontok szorzója érvényes marad a meccseikre.
              </p>
            </div>
            
            {selectedOption === 'A' && (
              <div className="mt-4 w-full" onClick={(e) => e.stopPropagation()}>
                <select
                  value={newFavorite}
                  onChange={(e) => setNewFavorite(e.target.value)}
                  className="w-full bg-white border border-line2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">-- Válassz új csapatot --</option>
                  {activeTeams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </button>

          {/* OPTION B */}
          <button
            type="button"
            onClick={() => setSelectedOption('B')}
            className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer
              ${selectedOption === 'B'
                ? 'bg-orange-50/50 border-orange-500 shadow-[0_8px_20px_-10px_rgba(249,115,22,0.4)]'
                : 'bg-card border-line hover:border-line2'}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md
                  ${selectedOption === 'B' ? 'bg-orange-600 text-white' : 'bg-wash2 text-mid'}`}>
                  B-TERV
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">+30 pont</span>
              </div>
              <h3 className="font-display font-bold text-sm text-ink mb-1">Hűségnyilatkozat</h3>
              <p className="text-[11.5px] text-mid leading-relaxed">
                Hűséges maradsz a kiesett kedvencedhez. Kapsz egy egyszeri +30 pontos bónuszt, de nincs több dupla pontot adó meccsed.
              </p>
            </div>
            <div className="mt-4 h-8" /> {/* spacing to match option A height */}
          </button>

        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedOption || submitting}
          className="w-full bg-accent text-white font-bold py-3.5 rounded-2xl transition-all shadow-[0_8px_24px_-8px_rgba(124,58,237,0.6)] disabled:opacity-40 disabled:shadow-none hover:shadow-[0_8px_24px_-4px_rgba(124,58,237,0.7)] cursor-pointer"
        >
          {submitting ? 'Döntés rögzítése...' : 'Döntés megerősítése'}
        </button>

        <p className="text-[10px] text-faint italic mt-3.5">
          Figyelem: Ez a döntés végleges és visszavonhatatlan. Utólagosan nem módosítható.
        </p>

      </div>
    </div>
  );
}
