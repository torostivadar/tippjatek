import React from 'react';
import { Icon } from './Icons';

export function Rules() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Overview Header Card */}
      <div 
        className="rounded-3xl border border-line bg-card p-6 md:p-8 shadow-[0_18px_50px_-24px_rgba(16,24,40,0.30)]"
        style={{ background: 'linear-gradient(100deg, rgba(124,58,237,0.05), transparent 70%)' }}
      >
        <div className="flex items-center gap-4 mb-4">
          <span className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20">
            <Icon name="newspaper" size={24} className="text-accent" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-ink font-display">Hivatalos Játékszabályok</h2>
            <p className="text-xs text-faint font-semibold uppercase tracking-wider">Tippjáték Pro — VB 2026</p>
          </div>
        </div>
        <p className="text-mid text-[13.5px] leading-relaxed">
          A szabályokat úgy alakítottuk ki, hogy az utolsó pillanatig izgalmas, taktikus és kiszámíthatatlan maradjon a bajnokság. Olvasd el a részleteket, hogy a legtöbb pontot gyűjthesd be!
        </p>
      </div>

      {/* Grid of Rule sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* 1. Base Scoring Card */}
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="trophy" size={16} className="text-accent" strokeWidth={2.4} />
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink font-display">Alappontozás</h3>
            </div>
            <p className="text-mid text-[12.5px] leading-relaxed mb-4">
              Minden játékos 0 pontról indul. Tippelni a mérkőzés **hivatalos kezdési időpontjáig** lehet, utána a tipp lezárul.
            </p>
            <ul className="space-y-2.5 text-[12.5px] text-ink font-semibold">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono text-xs border border-emerald-200">+30</span>
                <span>Helyes kimenetel eltalálása (1X2)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-mono text-xs border border-purple-200">+20</span>
                <span>Telitalálat (pontos eredményért, összesen: 50p)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center font-mono text-xs border border-slate-200">0</span>
                <span>Mellément tippekért nem jár pont</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-line text-[11px] text-faint leading-relaxed">
            <span className="font-bold">Egyenes kieséses szakasz:</span> Ha a rendes játékidő döntetlen, a **hosszabbítás utáni végeredmény** számít! A 11-es párbajokat nem kell megtippelni.
          </div>
        </div>

        {/* 2. TUTI TIPP Card */}
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="zap" size={16} className="text-amber-500 animate-pulse" strokeWidth={2.4} />
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink font-display">TUTI TIPP (Joker)</h3>
            </div>
            <p className="text-mid text-[12.5px] leading-relaxed mb-4">
              Aktiváld a meccseknél a TUTI TIPP kapcsolót, ha nagyon biztos vagy a dolgodban. De vigyázz, komoly tétje van!
            </p>
            <ul className="space-y-2.5 text-[12.5px] text-ink font-semibold">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-mono text-xs border border-amber-200">+100</span>
                <span>Telitalálat TUTI tippel</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-mono text-xs border border-amber-200">+20</span>
                <span>Csak a kimenetel (kevesebb, mint az alap 30!)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-mono text-xs border border-rose-200">−30</span>
                <span>Teljesen mellément tippért **pontlevonás!**</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-line text-[11px] text-faint leading-relaxed">
            <span className="font-bold">Korlátok:</span> A csoportkörben **3 db**, az egyenes kieséses szakaszban szintén **3 db** használható fel. A megmaradt tippek nem vihetők át!
          </div>
        </div>

        {/* 3. The Fan Factor (Kedvenc csapat) */}
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="star" size={16} fill="#F97316" strokeWidth={0} />
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink font-display">Kedvenc Csapat (The Fan Factor)</h3>
            </div>
            <p className="text-mid text-[12.5px] leading-relaxed mb-4">
              A játék megkezdése előtt mindenki köteles kiválasztani **egyetlen egy** kedvenc válogatottat a teljes mezőnyből.
            </p>
            <ul className="space-y-2.5 text-[12.5px] text-ink font-semibold">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center font-mono text-xs border border-orange-200">x2</span>
                <span>Pontduplázás minden meccsükre automatikusan</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-mono text-xs border border-purple-200">100</span>
                <span>Telitalálat a kedvenc meccsén (50 helyett 100 pont!)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-mono text-xs border border-emerald-200">60</span>
                <span>Csak a kimenetel (30 helyett 60 pont!)</span>
              </li>
            </ul>
          </div>
          <div className="mt-5 pt-4 border-t border-line text-[11px] text-faint leading-relaxed">
            <span className="font-bold">KORLÁTOZÁS:</span> A **TUTI TIPP** és a **Kedvenc Csapat** szorzók **NEM vonhatóak össze** egy meccsen.
          </div>
        </div>

        {/* 4. Champion Prediction Card */}
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="sparkles" size={16} className="text-accent" strokeWidth={2.4} />
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink font-display">Világbajnok tipp</h3>
            </div>
            <p className="text-mid text-[12.5px] leading-relaxed mb-4">
              Az abszolút vb győztes megtippelése. A tippet a VB legelső meccsének kezdőrúgásáig le kell adnod a ranglista fül alatt!
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-[12.5px] font-semibold text-accent flex items-center justify-between">
              <span>Helyes VB győztes tippért jár:</span>
              <span className="font-mono text-lg font-bold">+150 pont</span>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-line text-[11px] text-faint leading-relaxed">
            A pontok kiosztása a vb döntő lezárása után, a torna legvégén történik meg automatikusan.
          </div>
        </div>

        {/* 5. Kiesési Válaszút (The Knockout Crossroads) Card */}
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm flex flex-col justify-between md:col-span-2">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon name="swords" size={16} className="text-rose-500" strokeWidth={2.4} />
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-ink font-display">Kiesési Válaszút (The Knockout Crossroads)</h3>
            </div>
            <p className="text-mid text-[12.5px] leading-relaxed mb-4">
              Mi történik, ha kiesik a Kedvenc Csapatod a tornáról? Nem maradsz bónusz nélkül, de komoly döntést kell hoznod! Amint a választott kedvenc csapatod kiesik, a rendszer zárolja a fiókodat, és a következő belépéskor választás elé állít:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-rose-50/50 border border-rose-200/60 rounded-2xl p-4 text-[12.5px]">
                <div className="font-bold text-rose-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center font-mono text-xs">A</span>
                  <span>„ÚJ KEDVENC” (Átigazolás)</span>
                </div>
                <p className="text-mid text-[12px] leading-relaxed">
                  Választhatsz egy **új kedvenc csapatot** a még versenyben lévő válogatottak közül. Ezzel továbbra is él a **pontduplázás (×2 bónusz)** az új csapatod meccseire. 
                  <span className="block mt-2 font-bold text-rose-600">Ára: −30 pont levonás (átigazolási adó)</span>
                </p>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4 text-[12.5px]">
                <div className="font-bold text-emerald-700 mb-1.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center font-mono text-xs">B</span>
                  <span>„HŰSÉGNYILATKOZAT” (Kitartás)</span>
                </div>
                <p className="text-mid text-[12px] leading-relaxed">
                  Úgy döntesz, hogy hűséges maradsz a már kiesett csapatodhoz. Nem választasz újat, a pontduplázási bónuszod elvész a torna hátralévő részére.
                  <span className="block mt-2 font-bold text-emerald-600">Jutalmad: +30 pont hűségbónusz azonnal</span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-line text-[11px] text-faint leading-relaxed">
            <span className="font-bold">Megjegyzés:</span> A döntést **azonnal és kötelezően** meg kell hoznod a felugró ablakban (addig nem éred el a tippeket és a ranglistát). A választásod végleges, később nem módosítható!
          </div>
        </div>

      </div>
    </div>
  );
}
