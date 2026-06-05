"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Save, 
  Plus, 
  Minus, 
  Goal, 
  Award, 
  Clock, 
  Flame, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Swords, 
  Activity, 
  Landmark, 
  TrendingUp, 
  AlertCircle, 
  Newspaper, 
  Lock,
  User,
  LogOut,
  Trophy,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

// ==========================================
// 1. DUMMY TYPES & SCHEMAS
// ==========================================

export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  score_a: number | null;
  score_b: number | null;
  start_time: string;
  status: 'UPCOMING' | 'FINISHED';
  group?: string;
}

export interface Prediction {
  id: string;
  match_id: string;
  predicted_a: number;
  predicted_b: number;
}

interface TeamStats {
  form: ('W' | 'D' | 'L')[];
  temp: number; // Team "temperature" or form index (0-100)
  injuries: string[];
}

interface MatchStats {
  h2hSummary: string;
  h2hHistory: { year: string; res: string; winner: string }[];
  teamA: TeamStats;
  teamB: TeamStats;
  prediction: {
    winA: number;
    draw: number;
    winB: number;
    advice: string;
    attackA: number;
    attackB: number;
    defenseA: number;
    defenseB: number;
  };
  odds: {
    winA: number;
    draw: number;
    winB: number;
  };
  news: string[];
}

// ==========================================
// 2. EMBEDDED HIGH-QUALITY MOCK DATA
// ==========================================

const MOCK_MATCHES: Match[] = [
  {
    id: '1',
    team_a: 'Magyarország',
    team_b: 'Németország',
    score_a: 1,
    score_b: 3,
    start_time: new Date(Date.now() - 3600000 * 24).toISOString(), // Finished yesterday
    status: 'FINISHED',
    group: 'A'
  },
  {
    id: '2',
    team_a: 'Brazília',
    team_b: 'Franciaország',
    score_a: null,
    score_b: null,
    start_time: new Date(Date.now() + 3600000 * 6).toISOString(), // Starts in 6 hours
    status: 'UPCOMING',
    group: 'B'
  },
  {
    id: '3',
    team_a: 'Argentína',
    team_b: 'Portugália',
    score_a: null,
    score_b: null,
    start_time: new Date(Date.now() + 3600000 * 24).toISOString(), // Starts tomorrow
    status: 'UPCOMING',
    group: 'A'
  },
  {
    id: '4',
    team_a: 'Spanyolország',
    team_b: 'Anglia',
    score_a: null,
    score_b: null,
    start_time: new Date(Date.now() + 3600000 * 24 * 3).toISOString(), // 3 days from now
    status: 'UPCOMING',
    group: 'Group Phase'
  },
  {
    id: '5',
    team_a: 'Olaszország',
    team_b: 'Horvátország',
    score_a: null,
    score_b: null,
    start_time: new Date(Date.now() + 3600000 * 24 * 6).toISOString(), // 6 days from now
    status: 'UPCOMING',
    group: 'B'
  },
  {
    id: '6',
    team_a: 'B csoport első helyezettje',
    team_b: 'C csoport második helyezettje',
    score_a: null,
    score_b: null,
    start_time: new Date(Date.now() + 3600000 * 24 * 10).toISOString(), // 10 days from now
    status: 'UPCOMING',
    group: 'Nyolcaddöntő'
  }
];

const MOCK_PREDICTIONS: Prediction[] = [
  { id: 'p1', match_id: '1', predicted_a: 1, predicted_b: 3 }, // Hits 🏆 +3 Points perfectly!
  { id: 'p2', match_id: '2', predicted_a: 2, predicted_b: 2 }, // Active tip
];

const MOCK_LEADERBOARD = [
  { username: 'Tóth Erika', points: 154, correctScores: 22, correctOutcomes: 44 },
  { username: 'Kovács Ádám', points: 142, correctScores: 18, correctOutcomes: 42 },
  { username: 'Nagy Balázs', points: 128, correctScores: 15, correctOutcomes: 39 },
  { username: 'Te (Felhasználó)', points: 125, correctScores: 16, correctOutcomes: 36, isCurrentUser: true },
  { username: 'Szabó Zoltán', points: 96, correctScores: 11, correctOutcomes: 31 },
  { username: 'Varga Péter', points: 38, correctScores: 4, correctOutcomes: 13 },
];

const MOCK_STATS_DATABASE: Record<string, MatchStats> = {
  '1': {
    h2hSummary: "A két csapat legutóbbi 5 mérkőzéséből Németország 2-t nyert, Magyarország 1-et, és 2 alkalommal döntetlen született.",
    h2hHistory: [
      { year: '2024', res: 'GER 2 - 0 HUN', winner: 'GER' },
      { year: '2022', res: 'GER 0 - 1 HUN', winner: 'HUN' },
      { year: '2022', res: 'HUN 1 - 1 GER', winner: 'draw' },
      { year: '2021', res: 'GER 2 - 2 HUN', winner: 'draw' },
    ],
    teamA: {
      form: ['W', 'D', 'W', 'L', 'W'],
      temp: 72,
      injuries: ['Sallai Roland (visszatért, csere)', 'Styles Callum (erőnléti hiányosság)']
    },
    teamB: {
      form: ['W', 'W', 'D', 'W', 'W'],
      temp: 94,
      injuries: ['Serge Gnabry (combhajlító sérülés)', 'Leroy Sané (vádli problémák)']
    },
    prediction: {
      winA: 18,
      draw: 27,
      winB: 55,
      advice: "Németország hazai környezetben toronymagas esélyes, de a fegyelmezett magyar védekezés miatt egy szűkös, 2.5 gól alatti összecsapást vár az AI.",
      attackA: 68,
      attackB: 89,
      defenseA: 78,
      defenseB: 82
    },
    odds: {
      winA: 4.90,
      draw: 3.85,
      winB: 1.62
    },
    news: [
      "Marco Rossi a sajtótájékoztatón: 'Németország ellen nem elég a 100%, fegyelmezettségben és hitben is felül kell múlnunk magunkat.'",
      "Sallai Roland a tegnapi edzés utolsó perceiben jéggel ápolta a combját, de az orvosi stáb mindent megtesz az indításáért.",
      "Julian Nagelsmann reagált: 'Rossi csapata ellen mindig szenvedünk, ha nem diktálunk őrült iramot az első perctől.'",
      "Bild értesülés: a németek a Musiala - Wirtz tengelyt fokozott biztonsági védelemmel szándékoznak tehermentesíteni."
    ]
  },
  '2': {
    h2hSummary: "Történelmi világklasszis rangadó. Az utolsó 5 találkozásból meglepően kiegyenlített a mérleg: 2 francia, 2 brazil győzelem mellett 1 döntetlen.",
    h2hHistory: [
      { year: '2018', res: 'FRA 4 - 3 BRA', winner: 'FRA' },
      { year: '2015', res: 'BRA 3 - 1 FRA', winner: 'BRA' },
      { year: '2013', res: 'BRA 3 - 0 FRA', winner: 'BRA' },
    ],
    teamA: {
      form: ['W', 'W', 'W', 'L', 'W'],
      temp: 84,
      injuries: ['Neymar Jr. (boka rehabilitáció)', 'Eder Militao (túlterheltség okán pihen)']
    },
    teamB: {
      form: ['W', 'L', 'W', 'W', 'D'],
      temp: 78,
      injuries: ['Lucas Hernandez (szalagszakadás)', 'Kingsley Coman (izomszakadás - bizonytalan)']
    },
    prediction: {
      winA: 42,
      draw: 24,
      winB: 34,
      advice: "Igazi döntőnek beillő rangadó. Mindkét csapat rendkívül kreatív elöl, így a Mindkét Csapat Szerez Gólt (BTTS) opció tűnik a legbiztosabb tippnek.",
      attackA: 92,
      attackB: 88,
      defenseA: 75,
      defenseB: 80
    },
    odds: {
      winA: 2.25,
      draw: 3.40,
      winB: 2.65
    },
    news: [
      "Kylian Mbappé új, egyedi francia trikolór védőmaszkban fog pályára lépni a brazil sztárok ellen.",
      "A brazil kempben rendkívüli a hangulat: Vinícius Jr. és Rodrygo állítólag külön szabadrúgás-párbajjal hangoltak.",
      "Francia lapok: Deschamps a középpályán Griezmann hátravont szerepkörével akarja megfogni a brazil kontrákat.",
      "Sérülés hírek: Militao combja javult, de a szövetségi kapitány nem vállal kockázatot, Marquinhos lesz a kezdőben."
    ]
  },
  '3': {
    h2hSummary: "Generációk összecsapása. Messi és Ronaldo válogatott szinten mindössze kétszer találkozott karrierjük során, és a mérleg tökéletesen egyenlő.",
    h2hHistory: [
      { year: '2020', res: 'ARG 1 - 2 POR', winner: 'POR' },
      { year: '2019', res: 'ARG 2 - 1 POR', winner: 'ARG' },
    ],
    teamA: {
      form: ['W', 'W', 'W', 'W', 'D'],
      temp: 96,
      injuries: ['Lisandro Martínez (lábujjsérülés)', 'Acuna Marcos (bizonytalan játék)']
    },
    teamB: {
      form: ['W', 'W', 'L', 'W', 'W'],
      temp: 82,
      injuries: ['Diogo Jota (vádli izomszakadás)', 'Ruben Neves (sárga lapos eltiltás veszély)']
    },
    prediction: {
      winA: 48,
      draw: 28,
      winB: 24,
      advice: "Argentína veretlenségi sorozata kiemelkedő, de Portugália kontrái életveszélyesek. Egy 2-1 vagy 2-2 típusú szoros kimenetelt lát előre a modell.",
      attackA: 94,
      attackB: 85,
      defenseA: 82,
      defenseB: 79
    },
    odds: {
      winA: 1.95,
      draw: 3.35,
      winB: 3.50
    },
    news: [
      "Messi exkluzív nyilatkozata: 'Nem Ronaldóval harcolok, hanem a hazám dicsőségéért. Ez az utolsó vb-m, minden percét kiélvezem.'",
      "Cristiano Ronaldo az edzés után: 'Készen állunk. Portugáliának megvan a tehetsége ahhoz, hogy bárkit legyőzzön ezen a tornán.'",
      "A Buenos Aires-i lapok szerint Scaloni kapitány egy extra védekező középpályást épít be kifejezetten Cristiano semlegesítésére.",
      "A portugál szövetség cáfolja a belső viszályról szóló pletykákat, Bruno Fernandes és Cristiano együtt nevetve edzettek."
    ]
  },
  '4': {
    h2hSummary: "A legutóbbi Európa-bajnoki döntő visszavágója, ahol a spanyolok 2-1-es diadallal hódították el a trófeát az angolok elől.",
    h2hHistory: [
      { year: '2024', res: 'ESP 2 - 1 ENG', winner: 'ESP' },
      { year: '2018', res: 'ESP 2 - 3 ENG', winner: 'ENG' },
      { year: '2018', res: 'ENG 1 - 2 ESP', winner: 'ESP' },
    ],
    teamA: {
      form: ['W', 'W', 'W', 'W', 'W'],
      temp: 100,
      injuries: ['Gavi (félig felépült állapotban padon)', 'Pedri (maximális terhelés alatt)']
    },
    teamB: {
      form: ['W', 'D', 'W', 'D', 'W'],
      temp: 75,
      injuries: ['Harry Kane (enyhe bokazúzódás - kezdeni fog)', 'Luke Shaw (visszaeső combsérülés)']
    },
    prediction: {
      winA: 45,
      draw: 35,
      winB: 20,
      advice: "Spanyolország kontrollálni fogja a középpályát a magas labdabirtoklással. Anglia zárt védekezésből építkező játéka ellen egy döntetlen közeli, óvatos meccs valószínű.",
      attackA: 90,
      attackB: 79,
      defenseA: 84,
      defenseB: 86
    },
    odds: {
      winA: 2.10,
      draw: 3.05,
      winB: 3.35
    },
    news: [
      "Lamine Yamal fantasztikus passz-statisztikái borzolják az angol sajtót: Kyle Walker különleges feladatot kapott Yamal megállítására.",
      "Harry Kane edzésen kapott rúgása szerencsére nem súlyos, az angol csatár sziklaszilárdan ott lesz a kezdőben.",
      "Spanyol lapok: De la Fuente kapitány ragaszkodik az agresszív letámadáshoz, ami az Eb-győzelem kulcsa volt.",
      "Az angol szurkolók petíciót indítottak Bellingham előretoltabb, kötetlenebb bevetéséért."
    ]
  },
  '5': {
    h2hSummary: "Rendkívül szoros, taktikai csaták jellemzik a mediterrán rangadót. Utolsó 4 meccsükből 3 alkalommal döntetlennel zártak.",
    h2hHistory: [
      { year: '2024', res: 'ITA 1 - 1 CRO', winner: 'draw' },
      { year: '2015', res: 'CRO 1 - 1 ITA', winner: 'draw' },
      { year: '2014', res: 'ITA 1 - 1 CRO', winner: 'draw' },
    ],
    teamA: {
      form: ['D', 'W', 'L', 'W', 'D'],
      temp: 64,
      injuries: ['Gianluca Scamacca (combizom sérülés)', 'Scalvini Giorgio (csípőproblémák)']
    },
    teamB: {
      form: ['W', 'D', 'W', 'D', 'L'],
      temp: 68,
      injuries: ['Ivan Perisic (izomfáradás - cserepadon kezd)', 'Vlasic Nikola (enyhe gyulladás)']
    },
    prediction: {
      winA: 34,
      draw: 40,
      winB: 26,
      advice: "Klasszikus kiegyensúlyozott zárómérkőzés a csoportban. Az AI szerint a legreálisabb tipp a pontosan 1-1 vagy gól nélküli 0-0 döntetlen.",
      attackA: 76,
      attackB: 74,
      defenseA: 81,
      defenseB: 78
    },
    odds: {
      winA: 2.45,
      draw: 2.95,
      winB: 2.80
    },
    news: [
      "Luciano Spalletti dühösen reagált a kritikusokra: 'Az olasz taktika nem a védekezésről szól, hanem az intelligens dominanciáról.'",
      "Luka Modric megindító interjúja: 'Tudjuk, hogy ez az utolsó esélyünk ennél a generációnál. Horvátország a szívével fog játszani.'",
      "Olasz sajtóhír: Scamacca kiesésével Retegui kap bizalmat a támadósor élén.",
      "Zágrábi tudósítás: a horvát szurkolók tízezrei érkeznek a helyszínre, szinte hazai pályát teremtve válogatottjuknak."
    ]
  },
  '6': {
    h2hSummary: "Az egyenes kieséses párosítás még nem végleges. Amint eldől a csoportok végeredménye, a statisztikák automatikusan frissülnek.",
    h2hHistory: [],
    teamA: { form: [], temp: 0, injuries: [] },
    teamB: { form: [], temp: 0, injuries: [] },
    prediction: {
      winA: 50,
      draw: 0,
      winB: 50,
      advice: "A párosítás véglegesedése után az AI azonnal legenerálja az elemzést a bejutott csapatok aktuális kerete alapján.",
      attackA: 0,
      attackB: 0,
      defenseA: 0,
      defenseB: 0
    },
    odds: {
      winA: 1.0,
      draw: 1.0,
      winB: 1.0
    },
    news: [
      "A B csoport és C csoport utolsó meccsei fogják eldönteni, hogy melyik csapatok találkoznak ebben az izgalmas ágban.",
      "Az UEFA megerősítette a nyolcaddöntők helyszíneit, a szurkolók már most megrohamozták a jegyértékesítő felületeket.",
      "Kövessétek figyelemmel a csoportmeccsek alakulását a tippek megnyitásáig!"
    ]
  }
};

// ==========================================
// 3. FLAG AND STYLING HELPER UTILITIES
// ==========================================

const getFlagEmoji = (country: string): string => {
  const flags: Record<string, string> = {
    'Magyarország': '🇭🇺',
    'Németország': '🇩🇪',
    'Brazília': '🇧🇷',
    'Franciaország': '🇫🇷',
    'Argentína': '🇦🇷',
    'Portugália': '🇵🇹',
    'Spanyolország': '🇪🇸',
    'Anglia': '🇬🇧',
    'Olaszország': '🇮🇹',
    'Horvátország': '🇭🇷'
  };
  if (country.includes('csoport') || country.includes('helyezettje')) {
    return '⚽';
  }
  return flags[country] || '🏳️';
};

const getAbbreviationCode = (country: string): string => {
  const codes: Record<string, string> = {
    'Magyarország': 'HUN',
    'Németország': 'GER',
    'Brazília': 'BRA',
    'Franciaország': 'FRA',
    'Argentína': 'ARG',
    'Portugália': 'POR',
    'Spanyolország': 'ESP',
    'Anglia': 'ENG',
    'Olaszország': 'ITA',
    'Horvátország': 'CRO'
  };
  if (country.includes('csoport') || country.includes('helyezettje')) {
    const parts = country.split(' ');
    return parts[0] + ' ' + (parts[2] || 'TBD');
  }
  return codes[country] || country.substring(0, 3).toUpperCase();
};

const groupColorTheme: Record<string, { header: string; pill: string; text: string }> = {
  'A': { 
    header: 'from-emerald-50 to-white text-emerald-950', 
    pill: 'bg-emerald-100/80 text-emerald-800 border-emerald-200/60',
    text: 'text-emerald-700'
  },
  'B': { 
    header: 'from-blue-50 to-white text-blue-950', 
    pill: 'bg-blue-100/80 text-blue-800 border-blue-200/60',
    text: 'text-blue-700'
  },
  'Nyolcaddöntő': { 
    header: 'from-rose-50 to-white text-rose-950', 
    pill: 'bg-rose-100 border-rose-200/60 text-rose-800',
    text: 'text-rose-700'
  },
  'default': { 
    header: 'from-slate-50 to-white text-slate-800', 
    pill: 'bg-slate-100/80 border-slate-205 text-slate-700',
    text: 'text-slate-600'
  }
};

// ==========================================
// 4. MAIN PROTOTYPE CONTAINER
// ==========================================

export default function TippjatekMockup() {
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard'>('matches');
  
  // Simulated state engines
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [predictions, setPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('2'); // Brazília vs Franciaország defaults

  // Simulated backend save logic
  const handleSavePrediction = (matchId: string, goldA: number, goldB: number) => {
    // Backend/Supabase logic substituted with local state
    setPredictions(prev => {
      const filtered = prev.filter(p => p.match_id !== matchId);
      return [...filtered, {
        id: `p_${Date.now()}`,
        match_id: matchId,
        predicted_a: goldA,
        predicted_b: goldB
      }];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Dynamic Header */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200/80 z-50 px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
            ⚽
          </div>
          <span className="font-black text-lg font-display tracking-tight text-slate-800">Tippjáték Pro</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'matches' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mérkőzések & Elemzések
          </button>
          <button 
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'leaderboard' 
                ? 'bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ranglista
          </button>
        </div>

        <div className="flex items-center gap-2 border-l pl-4 border-slate-200/80">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[11px] font-bold text-slate-500 font-mono">LIVE / 2026 VB</span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto px-4 pt-24 pb-32 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight font-display">
            {activeTab === 'matches' ? 'Mérkőzések & AI Eredményjelzők' : 'Globális Tippbajnokság'}
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 font-medium">
            {activeTab === 'matches' 
              ? 'Átlátható 1/3 és 2/3 elrendezésű, egysoros, ultra-kompakt meccslista és részletes sport-analitika.'
              : 'Nézd meg a barátaid pontszámait, a helyes tippeléseket és az aktuális helyezésedet.'}
          </p>
        </div>

        {activeTab === 'matches' ? (
          /* ==========================================
             5. VERTICAL SPLIT SCREEN PATTERN (1/3 & 2/3)
             ========================================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT SIDEBAR (1/3) - Ultra-compact Single Line Cards */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-200/40 flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Időrendi Szuper-Lista</div>
                <span className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                  {matches.length} mérkőzés
                </span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-[750px] overflow-y-auto pr-1 scrollbar-thin">
                {matches.map((match) => {
                  const pred = predictions.find(p => p.match_id === match.id);
                  const isSelected = match.id === selectedMatchId;
                  const isFinished = match.status === 'FINISHED';
                  
                  // Calculate time metadata
                  const kickoffTime = new Date(match.start_time).getTime();
                  const timeLeftMs = kickoffTime - Date.now();
                  const isWithin72Hours = timeLeftMs > 0 && timeLeftMs <= 72 * 60 * 60 * 1000;
                  const isTBD = match.id === '6';

                  let shortStatus = '';
                  let statusColor = '';
                  let myTippText = '';

                  if (isFinished && match.score_a !== null && match.score_b !== null) {
                    const actA = match.score_a;
                    const actB = match.score_b;
                    const predA = pred?.predicted_a ?? 0;
                    const predB = pred?.predicted_b ?? 0;
                    myTippText = pred ? `Tipp: ${predA}-${predB}` : 'Nincs';

                    if (actA === predA && actB === predB) {
                      shortStatus = '🏆 +3p';
                      statusColor = 'bg-emerald-500/10 text-emerald-800 border-emerald-250 font-black';
                    } else if ((actA > actB && predA > predB) || (actA < actB && predA < predB) || (actA === actB && predA === predB)) {
                      shortStatus = '✅ +1p';
                      statusColor = 'bg-blue-500/10 text-blue-800 border-blue-250 font-bold';
                    } else {
                      shortStatus = '❌ 0p';
                      statusColor = 'bg-slate-100 text-slate-500 border-slate-250';
                    }
                  } else if (isTBD) {
                    shortStatus = 'Vár';
                    statusColor = 'bg-amber-100 text-amber-800 border-amber-250';
                    myTippText = '-';
                  } else if (pred) {
                    shortStatus = '✔ Kész';
                    statusColor = 'bg-teal-500/10 text-teal-800 border-teal-200/50';
                    myTippText = `${pred.predicted_a}-${pred.predicted_b}`;
                  } else {
                    myTippText = 'Hiányzik';
                    if (isWithin72Hours) {
                      shortStatus = '🔥 Tippelj!';
                      statusColor = 'bg-red-500/15 text-red-700 border-red-300 animate-pulse font-bold';
                    } else {
                      shortStatus = '✍ Tipp';
                      statusColor = 'bg-orange-500/10 text-orange-800 border-orange-200';
                    }
                  }

                  return (
                    <button
                      key={match.id}
                      onClick={() => setSelectedMatchId(match.id)}
                      className={`relative text-left p-2 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 overflow-hidden w-full select-none cursor-pointer ${
                        isSelected 
                          ? 'bg-white border-emerald-400 shadow-md ring-1 ring-emerald-500/10 scale-[1.01]' 
                          : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      {/* Left vertical border for active meccs */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600" />
                      )}

                      {/* Main compact row content */}
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-1 pr-1">
                        <span className="text-[10px] font-bold font-mono text-slate-400 shrink-0">
                          {format(new Date(match.start_time), 'MM.dd HH:mm', { locale: hu })}
                        </span>

                        <span className="text-[11px] font-extrabold text-slate-700 truncate text-right flex-1 min-w-0">
                          {getAbbreviationCode(match.team_a)}
                        </span>

                        <span className="text-sm shrink-0 select-none">{getFlagEmoji(match.team_a)}</span>

                        <span className="text-[10px] font-mono px-1 py-0.5 bg-slate-100/90 border border-slate-200/50 rounded text-slate-600 shrink-0">
                          {isFinished ? `${match.score_a}-${match.score_b}` : 'vs'}
                        </span>

                        <span className="text-sm shrink-0 select-none">{getFlagEmoji(match.team_b)}</span>

                        <span className="text-[11px] font-extrabold text-slate-700 truncate text-left flex-1 min-w-0">
                          {getAbbreviationCode(match.team_b)}
                        </span>
                      </div>

                      {/* Right side tip & score metadata */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isTBD && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded font-mono border border-slate-200/50 shrink-0">
                            {myTippText}
                          </span>
                        )}

                        <span className={`text-[10px] font-black py-0.5 px-1.5 rounded border shrink-0 text-center uppercase tracking-wider ${statusColor}`}>
                          {shortStatus}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT MECCS DETAILS PANEL (2/3) */}
            <div className="lg:col-span-2">
              <MatchDetailComponent 
                match={matches.find(m => m.id === selectedMatchId) || matches[0]}
                prediction={predictions.find(p => p.match_id === selectedMatchId)}
                onSave={handleSavePrediction}
              />
            </div>

          </div>
        ) : (
          /* ==========================================
             LEADERBOARD VIEW PREVIEW
             ========================================== */
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-md p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-500 w-8 h-8" />
              <div>
                <h2 className="text-xl font-black text-slate-800">Baráti Tippbajnokság Állása</h2>
                <p className="text-xs text-slate-400 font-medium">Pontszámítás: Telitalálat 🏆 +3 pont, Kimenetel sikeres ✅ +1 pont.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {MOCK_LEADERBOARD.map((user, idx) => (
                <div 
                  key={idx}
                  className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${
                    user.isCurrentUser 
                      ? 'bg-emerald-500/10 border-emerald-300 ring-2 ring-emerald-500/5 shadow-inner' 
                      : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono font-black ${
                      idx === 0 
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-350' 
                        : idx === 1 
                          ? 'bg-slate-100 text-slate-700 border border-slate-250' 
                          : idx === 2 
                            ? 'bg-amber-100 text-amber-800 border border-amber-350' 
                            : 'bg-slate-50 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className={`text-xs font-black ${user.isCurrentUser ? 'text-slate-900 font-extrabold' : 'text-slate-750'}`}>
                      {user.username} {user.isCurrentUser && ' (ÉN)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right shrink-0">
                      <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Teli / Kimenetel</span>
                      <span className="text-[10px] font-mono font-bold text-slate-600">
                        {user.correctScores} teli, {user.correctOutcomes} kim.
                      </span>
                    </div>

                    <div className="bg-slate-900 text-white rounded-xl py-1.5 px-3 font-mono text-xs font-black text-center min-w-[65px]">
                      {user.points} pont
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// 5. DETAILED ANALYTICS COMPONENT
// ==========================================

function MatchDetailComponent({ match, prediction, onSave }: {
  match: Match;
  prediction?: Prediction;
  onSave: (matchId: string, a: number, b: number) => void;
}) {
  const [a, setA] = useState(prediction?.predicted_a ?? 0);
  const [b, setB] = useState(prediction?.predicted_b ?? 0);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Sync state on match swap
  useEffect(() => {
    if (prediction) {
      setA(prediction.predicted_a);
      setB(prediction.predicted_b);
    } else {
      setA(0);
      setB(0);
    }
    setShowToast(false);
  }, [prediction, match.id]);

  const hasChanges = a !== (prediction?.predicted_a ?? 0) || b !== (prediction?.predicted_b ?? 0);
  const isFinished = match.status === 'FINISHED';
  const isTBD = match.id === '6';

  const selectedTheme = groupColorTheme[match.group || 'default'] || groupColorTheme['default'];
  const stats = MOCK_STATS_DATABASE[match.id];

  // Point scoring summary
  let calculatedPoints = null;
  let summaryReasonText = '';
  if (isFinished && match.score_a !== null && match.score_b !== null) {
    const actA = match.score_a;
    const actB = match.score_b;
    const predA = prediction?.predicted_a ?? 0;
    const predB = prediction?.predicted_b ?? 0;

    if (actA === predA && actB === predB) {
      calculatedPoints = 3;
      summaryReasonText = 'Tökéletes telitalálat! Megkaptad a maximálisan kiosztható +3 pontot.';
    } else if ((actA > actB && predA > predB) || (actA < actB && predA < predB) || (actA === actB && predA === predB)) {
      calculatedPoints = 1;
      summaryReasonText = 'Sikeres kimenetel előrejelzés! +1 pontot szereztél ezen a meccsen.';
    } else {
      calculatedPoints = 0;
      summaryReasonText = 'Sajnos nem talált be a tipped. 0 pont ehhez a meccshez.';
    }
  }

  const handleApplyTip = () => {
    setSaving(true);
    // Simulate API delay
    setTimeout(() => {
      onSave(match.id, a, b);
      setSaving(false);
      setShowToast(true);
      // Fade out toast
      setTimeout(() => setShowToast(false), 3000);
    }, 450);
  };

  const adjustScoreValue = (team: 'a' | 'b', change: number) => {
    if (isFinished || isTBD) return;
    if (team === 'a') {
      setA(prev => Math.max(0, prev + change));
    } else {
      setB(prev => Math.max(0, prev + change));
    }
  };

  // Mock deterministic other tips
  const otherTipsSimulated = [
    { username: 'Kovács Ádám', predicted_a: (parseInt(match.id) + 1) % 3, predicted_b: (parseInt(match.id) * 2) % 3 },
    { username: 'Nagy Balázs', predicted_a: (parseInt(match.id) + 2) % 3, predicted_b: (parseInt(match.id) + 1) % 3 },
    { username: 'Szabó Zoltán', predicted_a: (parseInt(match.id)) % 3, predicted_b: (parseInt(match.id) * 3) % 4 },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
      
      {/* 1. Header Banner */}
      <div className={`px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r ${selectedTheme.header}`}>
        <div className="flex items-center gap-2">
          <Calendar size={14} className={selectedTheme.text} />
          <span className="text-xs font-extrabold tracking-wide font-mono">
            {format(new Date(match.start_time), 'yyyy. MMMM d., HH:mm', { locale: hu })}
          </span>
          {match.group && (
            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${selectedTheme.pill}`}>
              {match.group} fázis
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
            isFinished ? 'bg-slate-200 text-slate-650' : 'bg-emerald-500/10 text-emerald-850'
          }`}>
            {isFinished ? 'Lejátszott' : isTBD ? 'Párosításra vár' : 'Fogadás él'}
          </span>
        </div>
      </div>

      {/* 2. Interactive Matchup Display */}
      <div className="p-6 md:p-8 border-b border-slate-100 bg-linear-to-b from-white to-slate-50/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Team A */}
          <div className="flex-1 w-full flex flex-col items-center gap-2">
            <span className="text-5xl transform hover:scale-110 transition-transform select-none mb-1">
              {getFlagEmoji(match.team_a)}
            </span>
            <span className="text-lg font-black text-slate-800 text-center font-display leading-tight">
              {match.team_a}
            </span>
          </div>

          {/* Core Interactive Center */}
          <div className="flex flex-col items-center gap-4 min-w-[200px]">
            <div className="flex items-center gap-4">
              {isFinished ? (
                <>
                  <div className="w-16 h-16 flex items-center justify-center bg-slate-900 text-white rounded-2xl text-3xl font-black shadow-md font-display select-none">
                    {match.score_a}
                  </div>
                  <span className="text-slate-400 font-extrabold text-2xl font-display">:</span>
                  <div className="w-16 h-16 flex items-center justify-center bg-slate-900 text-white rounded-2xl text-3xl font-black shadow-md font-display select-none">
                    {match.score_b}
                  </div>
                </>
              ) : isTBD ? (
                <div className="flex flex-col items-center gap-1.5 py-4">
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200 border-dashed animate-pulse">
                    <Lock size={22} />
                  </div>
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Lezárva</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => adjustScoreValue('a', 1)} className="p-1 hover:bg-slate-100 text-emerald-600 rounded-full transition-colors">
                      <Plus size={18} strokeWidth={2.8} />
                    </button>
                    <div className="w-16 h-16 flex items-center justify-center bg-white border-2 border-slate-200/80 rounded-2xl text-3xl font-black text-slate-800 shadow-xs font-display select-none">
                      {a}
                    </div>
                    <button onClick={() => adjustScoreValue('a', -1)} className="p-1 hover:bg-slate-100 text-emerald-600 rounded-full transition-colors">
                      <Minus size={18} strokeWidth={2.8} />
                    </button>
                  </div>

                  <span className="text-slate-300 font-extrabold text-2xl font-display mt-[-8px]">:</span>

                  <div className="flex flex-col items-center gap-1">
                    <button onClick={() => adjustScoreValue('b', 1)} className="p-1 hover:bg-slate-100 text-emerald-600 rounded-full transition-colors">
                      <Plus size={18} strokeWidth={2.8} />
                    </button>
                    <div className="w-16 h-16 flex items-center justify-center bg-white border-2 border-slate-200/80 rounded-2xl text-3xl font-black text-slate-800 shadow-xs font-display select-none">
                      {b}
                    </div>
                    <button onClick={() => adjustScoreValue('b', -1)} className="p-1 hover:bg-slate-100 text-emerald-600 rounded-full transition-colors">
                      <Minus size={18} strokeWidth={2.8} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hint overlay messages */}
            {!isTBD && (
              <div className="text-center">
                {isFinished ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Te leadott tipped</span>
                    <div className="px-3.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 font-black text-xs rounded-full font-mono">
                      {a} - {b}
                    </div>
                  </div>
                ) : (
                  prediction ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-display">Már mentett tipped</span>
                      <div className="px-3.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-full font-mono">
                        {prediction.predicted_a} - {prediction.predicted_b}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-rose-500 font-extrabold italic bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/50 animate-pulse font-display">
                      Még nem tippeltél! Kattints a fenti nyilakra.
                    </span>
                  )
                )}
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="flex-1 w-full flex flex-col items-center gap-2">
            <span className="text-5xl transform hover:scale-110 transition-transform select-none mb-1">
              {getFlagEmoji(match.team_b)}
            </span>
            <span className="text-lg font-black text-slate-800 text-center font-display leading-tight">
              {match.team_b}
            </span>
          </div>

        </div>

        {/* Action Button */}
        {hasChanges && !isFinished && !isTBD && (
          <div className="mt-6">
            <button
              onClick={handleApplyTip}
              disabled={saving}
              className="w-full py-3.5 bg-emerald-600 text-white font-extrabold flex items-center justify-center gap-2 hover:bg-emerald-700 active:bg-emerald-800 rounded-2xl transition-all shadow-md text-xs tracking-wider uppercase font-display"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>Saját tipp mentése vagy módosítása</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Dynamic Client confirmation toast */}
        {showToast && (
          <div className="mt-3 bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-xs text-center font-bold font-display">
            🎉 Sikeresen mentettük a tippedet a Claude Design meccs-mockupban!
          </div>
        )}
      </div>

      {/* 3. Assigned Score Results */}
      {calculatedPoints !== null && (
        <div className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 gap-3 ${
          calculatedPoints === 3 ? 'bg-emerald-500/5' : calculatedPoints === 1 ? 'bg-blue-500/5' : 'bg-slate-50'
        }`}>
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Award size={18} className={calculatedPoints > 0 ? 'text-emerald-600 animate-pulse' : 'text-slate-400'} />
            <span className="text-xs font-extrabold text-slate-650">{summaryReasonText}</span>
          </div>
          <span className={`text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider border shrink-0 font-display ${
            calculatedPoints === 3 
              ? 'bg-emerald-500 text-white border-emerald-600' 
              : calculatedPoints === 1 
                ? 'bg-blue-500 text-white border-blue-600' 
                : 'bg-slate-200 text-slate-700 border-slate-300'
          }`}>
            +{calculatedPoints} Pont
          </span>
        </div>
      )}

      {/* 4. Friends and Group tips */}
      {!isTBD && (
        <div className="bg-slate-50/20 border-b border-slate-100 px-6 py-4">
          {isFinished ? (
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-550 uppercase tracking-wider mb-3">
                <Eye size={15} className="text-emerald-500" />
                <span>Barátok leadott tippjei és pontjai ezen a meccsen</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {otherTipsSimulated.map((tip, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-2 px-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                    <span className="text-slate-600 font-bold">{tip.username}</span>
                    <span className="font-mono bg-slate-50 border border-slate-200/65 px-2 py-0.5 rounded font-black text-slate-800">
                      {tip.predicted_a} - {tip.predicted_b}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-405 font-bold bg-slate-100/30 p-3 rounded-xl border border-slate-200/30">
              <EyeOff size={14} className="text-slate-450" />
              <span>A barátok tippjei titkosak maradnak a meccs kezdetéig (spekuláció elkerülése érdekében!)</span>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
         5. VERTICAL ARRANGEMENT OF DETAILED SPORTS DATA
         ========================================== */}
      {stats ? (
        <div className="divide-y divide-slate-100 bg-slate-50/30">
          
          {/* A. AI PREDICTION BAR & RADAR INFO */}
          <div className="p-6">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-sm uppercase tracking-widest mb-3 inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-500 shrink-0" />
              AI Valószínűségszámítás & Szakértői Vélemény
            </span>
            <p className="text-xs text-slate-500 mb-4 font-medium">Az AI modell predikciós görbéje a két csapat korábbi meccsei és sérülthelyzete alapján:</p>

            <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs">
              <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-150 mb-3 select-none">
                <div className="bg-emerald-500" style={{ width: `${stats.prediction.winA}%` }} />
                <div className="bg-slate-300" style={{ width: `${stats.prediction.draw}%` }} />
                <div className="bg-blue-500" style={{ width: `${stats.prediction.winB}%` }} />
              </div>

              <div className="flex justify-between items-center text-[10px] font-black font-display mb-4">
                <span className="text-emerald-705">{match.team_a}: {stats.prediction.winA}%</span>
                <span className="text-slate-500">Döntetlen: {stats.prediction.draw}%</span>
                <span className="text-blue-705">{match.team_b}: {stats.prediction.winB}%</span>
              </div>

              {!isTBD && (
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100 text-xs font-bold text-slate-600">
                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{match.team_a}</span>
                    <div className="flex justify-between text-[11px]">
                      <span>Támadás:</span>
                      <span className="text-emerald-700 font-extrabold">{stats.prediction.attackA}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full"><div className="bg-emerald-500 h-full" style={{ width: `${stats.prediction.attackA}%` }} /></div>
                    <div className="flex justify-between text-[11px] pt-1">
                      <span>Védekezés:</span>
                      <span className="text-emerald-700 font-extrabold">{stats.prediction.defenseA}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full"><div className="bg-emerald-500 h-full" style={{ width: `${stats.prediction.defenseA}%` }} /></div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{match.team_b}</span>
                    <div className="flex justify-between text-[11px]">
                      <span>Támadás:</span>
                      <span className="text-blue-700 font-extrabold">{stats.prediction.attackB}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full"><div className="bg-blue-500 h-full" style={{ width: `${stats.prediction.attackB}%` }} /></div>
                    <div className="flex justify-between text-[11px] pt-1">
                      <span>Védekezés:</span>
                      <span className="text-blue-700 font-extrabold">{stats.prediction.defenseB}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1 rounded-full"><div className="bg-blue-500 h-full" style={{ width: `${stats.prediction.defenseB}%` }} /></div>
                  </div>
                </div>
              )}

              <div className="mt-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs text-amber-900 leading-relaxed font-semibold italic flex items-start gap-2">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                <span>AI Szakértői Tanács: "{stats.prediction.advice}"</span>
              </div>
            </div>
          </div>

          {/* B. BOOKMAKERS ODDS */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-display">
              <Landmark size={14} className="text-slate-500" />
              <span>Pre-Match Fogadási Szorzók (Oddsók)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4 font-medium">A világ vezető fogadóirodáinak (Bet365, Unibet) átlagolt, számszerűsített szorzói:</p>

            {isTBD ? (
              <div className="bg-white rounded-xl p-4 border border-slate-100 text-center text-xs text-slate-400 font-semibold italic">
                A szorzók a nyolcaddöntős párosítás véglegesedése után válnak elérhetővé.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-150 rounded-2xl p-3 text-center shadow-xs">
                  <span className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">{getAbbreviationCode(match.team_a)} győz</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">{stats.odds.winA}</span>
                </div>
                <div className="bg-white border border-slate-150 rounded-2xl p-3 text-center shadow-xs">
                  <span className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Döntetlen</span>
                  <span className="text-sm font-black text-slate-650 font-mono">{stats.odds.draw}</span>
                </div>
                <div className="bg-white border border-slate-150 rounded-2xl p-3 text-center shadow-xs">
                  <span className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">{getAbbreviationCode(match.team_b)} győz</span>
                  <span className="text-sm font-black text-blue-705 font-mono">{stats.odds.winB}</span>
                </div>
              </div>
            )}
          </div>

          {/* C. HEAD-TO-HEAD HISTORY */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-display">
              <Swords size={14} className="text-red-500" />
              <span>Egymás elleni történelem (H2H)</span>
            </h4>
            <div className="text-xs text-slate-700 font-semibold mb-4 leading-relaxed bg-white border border-slate-205 p-3.5 rounded-xl shadow-xs">
              {stats.h2hSummary}
            </div>

            {stats.h2hHistory.length > 0 && (
              <div className="space-y-2">
                {stats.h2hHistory.map((history, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-2 px-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                    <span className="font-bold text-slate-400 font-mono">{history.year}</span>
                    <span className="font-black text-slate-700 font-display">{history.res}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                      history.winner === 'draw' 
                        ? 'bg-slate-100 text-slate-650 border-slate-200' 
                        : 'bg-emerald-500/10 text-emerald-800 border-emerald-200'
                    }`}>
                      {history.winner === 'draw' ? 'X' : `${history.winner} győzelem`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* D. FORM INDICATORS AND STABILITY TEMPERATURE */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 font-display">
              <Activity size={14} className="text-emerald-600" />
              <span>Csapatok Formája (Form) & Stabilitási Hőfok</span>
            </h4>

            {isTBD ? (
              <div className="bg-white rounded-xl p-4 border border-slate-100 text-center text-xs text-slate-400 font-semibold italic">
                A csapatok formamutatója az egyenes kiesés fázis kezdetekor frissül.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Team A Form */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-800">{match.team_a}</span>
                    <span className="text-[10px] font-bold text-slate-405 font-mono">Hőfok: {stats.teamA.temp}%</span>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {stats.teamA.form.map((outcome, index) => (
                      <span 
                        key={index} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                          outcome === 'W' ? 'bg-emerald-500' : outcome === 'D' ? 'bg-slate-400' : 'bg-red-500'
                        }`}
                      >
                        {outcome}
                      </span>
                    ))}
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${stats.teamA.temp}%` }} />
                  </div>
                </div>

                {/* Team B Form */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-800">{match.team_b}</span>
                    <span className="text-[10px] font-bold text-slate-405 font-mono">Hőfok: {stats.teamB.temp}%</span>
                  </div>
                  <div className="flex gap-1 mb-3">
                    {stats.teamB.form.map((outcome, index) => (
                      <span 
                        key={index} 
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                          outcome === 'W' ? 'bg-emerald-500' : outcome === 'D' ? 'bg-slate-400' : 'bg-red-500'
                        }`}
                      >
                        {outcome}
                      </span>
                    ))}
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${stats.teamB.temp}%` }} />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* E. INJURIES & MISSING PLAYERS */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-display">
              <ShieldAlert size={14} className="text-amber-500" />
              <span>Hiányzók & Sérültek (Injuries)</span>
            </h4>

            {isTBD ? (
              <div className="bg-white rounded-xl p-4 border border-slate-100 text-center text-xs text-slate-400 font-semibold italic">
                A keret sérülési jelentések a pontos csapatok ismertté válása után frissülnek.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Team A Injuries */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">{match.team_a}</span>
                  {stats.teamA.injuries.length > 0 ? (
                    <ul className="space-y-1.5">
                      {stats.teamA.injuries.map((injury, i) => (
                        <li key={i} className="text-xs font-semibold text-slate-650 flex items-start gap-1.5">
                          <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                          <span>{injury}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">Nincs regisztrált sérült játokos.</span>
                  )}
                </div>

                {/* Team B Injuries */}
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">{match.team_b}</span>
                  {stats.teamB.injuries.length > 0 ? (
                    <ul className="space-y-1.5">
                      {stats.teamB.injuries.map((injury, i) => (
                        <li key={i} className="text-xs font-semibold text-slate-650 flex items-start gap-1.5">
                          <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                          <span>{injury}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">Nincs regisztrált sérült játékos.</span>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* F. TEAM NEWS & JOURNALIST RUMORS */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-display">
              <Newspaper size={14} className="text-slate-505" />
              <span>Sajtóhírek & Helyszíni Értesülések (News)</span>
            </h4>

            <div className="space-y-3">
              {stats.news.map((rumor, index) => (
                <div key={index} className="flex gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200/50">
                    <Newspaper size={13} className="text-slate-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">{rumor}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-400 font-semibold italic">
          Ehhez a mérkőzéshez még sincsenek részletes statisztikai elemzéseink.
        </div>
      )}

    </div>
  );
}
