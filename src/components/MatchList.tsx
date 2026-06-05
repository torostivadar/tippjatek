import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Match, Prediction } from '@/src/types';
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
  ChevronRight, 
  HelpCircle, 
  Info,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { cn } from '@/src/lib/utils';

interface MatchListProps {
  matches: Match[];
  predictions: Prediction[];
  onSavePrediction: (matchId: string, a: number, b: number) => Promise<void>;
}

// Country flag lookup helper
const getFlag = (country: string): string => {
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

// Help helper for country abbreviation
const getAbbreviation = (country: string): string => {
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
    // Turn "B csoport első" or "B csoport" into abbreviated form
    return parts[0] + ' ' + (parts[2] || 'TBD');
  }
  return codes[country] || country.substring(0, 3).toUpperCase();
};

// Beautiful World Cup Group colors and styles
const groupStyles: Record<string, { border: string, header: string, pill: string, title: string, bg: string }> = {
  'A': { 
    border: 'border-l-6 border-l-emerald-500', 
    header: 'bg-gradient-to-r from-emerald-50/70 to-white text-emerald-950', 
    pill: 'bg-emerald-100 text-emerald-800 border-emerald-200/50',
    title: 'text-emerald-700',
    bg: 'bg-emerald-50/30'
  },
  'B': { 
    border: 'border-l-6 border-l-blue-500', 
    header: 'bg-gradient-to-r from-blue-50/70 to-white text-blue-950', 
    pill: 'bg-blue-100 text-blue-800 border-blue-200/50',
    title: 'text-blue-700',
    bg: 'bg-blue-50/30'
  },
  'C': { 
    border: 'border-l-6 border-l-purple-500', 
    header: 'bg-gradient-to-r from-purple-50/70 to-white text-purple-950', 
    pill: 'bg-purple-100 text-purple-800 border-purple-200/50',
    title: 'text-purple-700',
    bg: 'bg-purple-50/30'
  },
  'D': { 
    border: 'border-l-6 border-l-amber-500', 
    header: 'bg-gradient-to-r from-amber-50/70 to-white text-amber-950', 
    pill: 'bg-amber-100 text-amber-800 border-amber-200/50',
    title: 'text-amber-700',
    bg: 'bg-amber-50/30'
  },
  'Nyolcaddöntő': { 
    border: 'border-l-6 border-l-rose-500', 
    header: 'bg-gradient-to-r from-rose-50/70 to-white text-rose-950', 
    pill: 'bg-rose-100 text-rose-800 border-rose-200/50',
    title: 'text-rose-700',
    bg: 'bg-rose-50/30'
  },
  'default': { 
    border: 'border-l-6 border-l-slate-400', 
    header: 'bg-gradient-to-r from-slate-50 to-white text-slate-900', 
    pill: 'bg-slate-100 text-slate-800 border-slate-200',
    title: 'text-slate-600',
    bg: 'bg-slate-50/30'
  }
};

const OTHER_PLAYERS = [
  { username: 'Kovács Ádám', points: 154 },
  { username: 'Nagy Balázs', points: 142 },
  { username: 'Szabó Zoltán', points: 128 },
  { username: 'Tóth Erika', points: 96 },
  { username: 'Varga Péter', points: 38 },
];

// Deterministic mock tips based on matchId
function getOtherPlayersTips(matchId: string) {
  // Return empty list if undefined bracket matchup
  if (matchId === '6') return [];
  const seed = parseInt(matchId) || 1;
  return OTHER_PLAYERS.map((player, index) => {
    const predicted_a = (seed + index) % 3;
    const predicted_b = (seed * (index + 2)) % 3;
    return {
      username: player.username,
      predicted_a,
      predicted_b,
      points_earned: 0
    };
  });
}

// Complete mock stats database for all matches (1-6) with premium sport-rumor News lists
interface TeamStats {
  form: ('W' | 'D' | 'L')[];
  temp: number;
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

const MOCK_STATS_DB: Record<string, MatchStats> = {
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
      injuries: ['Sallai Roland (izomhúzódás - bizonytalan)', 'Styles Callum (erőnléti hiányosság)']
    },
    teamB: {
      form: ['W', 'W', 'D', 'W', 'W'],
      temp: 94,
      injuries: ['Serge Gnabry (combhajlító sérülés)', 'Leroy Sané (eltiltás miatt hiányzik)']
    },
    prediction: {
      winA: 18,
      draw: 27,
      winB: 55,
      advice: "Németország hazai környezetben toronymagas esélyes, de a szervezett magyar védelem miatt egy szűkös, 2.5 gól alatti összecsapást vár az AI.",
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
      injuries: ['Diogo Jota (vádli izomszakadás)', 'Ruben Neves (sárga lapos eltiltás vészély)']
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
    h2hSummary: "A pontoság érdekében az egymás elleni statisztikák a csoportkör lezárultával, a párosítások véglegesítésével válnak elérhetővé.",
    h2hHistory: [],
    teamA: { form: [], temp: 0, injuries: [] },
    teamB: { form: [], temp: 0, injuries: [] },
    prediction: {
      winA: 50,
      draw: 0,
      winB: 50,
      advice: "Amint kialakul a pontos párosítás, az AI azonnal legenerálja az esélylatolgatást a csapatok aktuális kerete alapján.",
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
      "A B csoport és C csoport utolsó meccsei fogják eldönteni, hogy melyik csapatok futnak össze ebben az izgalmas ágban.",
      "A sportelemzők szerint ha Spanyolország és Lengyelország jut tovább, az a torna egyik legtechnikásabb csatáját hozhatja.",
      "Az UEFA megerősítette a játékvezetői küldést, de a nevüket titokban tartja a párosítás véglegesedéséig.",
      "Kövessétek figyelemmel a csoportmeccsek alakulását!"
    ]
  }
};

// Countdown timer subcomponent
function CountdownTimer({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function updateTimer() {
      const difference = new Date(startTime).getTime() - Date.now();
      if (difference <= 0) {
        setTimeLeft('Elkezdődött');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (days > 0) parts.push(`${days}n`);
      if (hours > 0 || days > 0) parts.push(`${hours}ó`);
      parts.push(`${minutes}p`);
      parts.push(`${seconds}mp`);

      setTimeLeft(parts.join(' '));
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1 text-[11px] font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
      <Clock size={11} className="text-emerald-600 animate-pulse" />
      <span>{timeLeft}</span>
    </div>
  );
}

export function MatchList({ matches, predictions, onSavePrediction }: MatchListProps) {
  // Sort matches chronologically
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Selected Match State - default to the first match
  const [selectedMatchId, setSelectedMatchId] = useState<string>(sortedMatches[0]?.id || '');

  // Find currently selected match
  const selectedMatch = sortedMatches.find(m => m.id === selectedMatchId) || sortedMatches[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pb-24 md:pb-8">
      
      {/* LEFT COLUMN: 1/3 narrow sidebar layout */}
      <div className="lg:col-span-1 flex flex-col gap-3">
        <div className="bg-slate-100/50 rounded-xl p-3 border border-slate-200/40 flex items-center justify-between">
          <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Mérkőzések időrendben</div>
          <span className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
            {sortedMatches.length} meccs
          </span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[800px] overflow-y-auto pr-1 scrollbar-thin">
          {sortedMatches.map((match) => {
            const pred = predictions.find(p => p.match_id === match.id);
            const isSelected = match.id === selectedMatchId;
            const isFinished = match.status === 'FINISHED';
            
            // Calculate if the kickoff starts within 72 hours
            const kickoffTime = new Date(match.start_time).getTime();
            const timeLeftMs = kickoffTime - Date.now();
            const isWithin72Hours = timeLeftMs > 0 && timeLeftMs <= 72 * 60 * 60 * 1000;
            const isTBD = match.id === '6'; // Bracket match is TBD

            // Calculate points and status badge
            let shortStatus = '';
            let statusColor = '';
            let myTippText = '';

            if (isFinished && match.score_a !== null && match.score_b !== null) {
              const actA = match.score_a;
              const actB = match.score_b;
              const predA = pred?.predicted_a ?? 0;
              const predB = pred?.predicted_b ?? 0;
              myTippText = pred ? `T: ${predA}-${predB}` : 'Nincs';

              if (actA === predA && actB === predB) {
                shortStatus = '🏆 +3p';
                statusColor = 'bg-emerald-500/10 text-emerald-800 border-emerald-200/80 font-black';
              } else if ((actA > actB && predA > predB) || (actA < actB && predA < predB) || (actA === actB && predA === predB)) {
                shortStatus = '✅ +1p';
                statusColor = 'bg-blue-500/10 text-blue-800 border-blue-200/80 font-bold';
              } else {
                shortStatus = '❌ 0p';
                statusColor = 'bg-slate-100 text-slate-500 border-slate-200';
              }
            } else if (isTBD) {
              shortStatus = 'Vár';
              statusColor = 'bg-amber-100 text-amber-800 border-amber-200/50';
              myTippText = '-';
            } else if (pred) {
              shortStatus = '👍 Kész';
              statusColor = 'bg-teal-500/10 text-teal-855 border-teal-200/60 font-bold';
              myTippText = `${pred.predicted_a}-${pred.predicted_b}`;
            } else {
              myTippText = 'Még nincs';
              if (isWithin72Hours) {
                shortStatus = '🔥 Tippelj!';
                statusColor = 'bg-red-500/15 text-red-700 border-red-350 animate-pulse font-extrabold';
              } else {
                shortStatus = '✍️ Tipp';
                statusColor = 'bg-orange-500/10 text-orange-800 border-orange-200';
              }
            }

            return (
              <button
                key={match.id}
                onClick={() => setSelectedMatchId(match.id)}
                className={cn(
                  "relative text-left p-2 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2 overflow-hidden w-full select-none cursor-pointer",
                  isSelected 
                    ? "bg-white border-emerald-400 shadow-sm ring-1 ring-emerald-500/10" 
                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs"
                )}
              >
                {/* Active Selection Indicator Ribbon */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600" />
                )}

                {/* Main match description info container (1 Row!) */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 pl-1 pr-1">
                  {/* Start time abbreviated */}
                  <span className="text-[10px] font-bold font-mono text-slate-400 shrink-0">
                    {format(new Date(match.start_time), 'MM.dd HH:mm', { locale: hu })}
                  </span>

                  {/* Team A Abreviation */}
                  <span className="text-[11px] font-extrabold text-slate-700 truncate text-right flex-1 min-w-0" title={match.team_a}>
                    {getAbbreviation(match.team_a)}
                  </span>

                  {/* Flag A */}
                  <span className="text-sm shrink-0 select-none">{getFlag(match.team_a)}</span>

                  {/* Result display in the center */}
                  <span className="text-[10px] font-mono px-1 py-0.5 bg-slate-100/80 border border-slate-200/60 rounded text-slate-600 shrink-0">
                    {isFinished ? `${match.score_a}-${match.score_b}` : 'vs'}
                  </span>

                  {/* Flag B */}
                  <span className="text-sm shrink-0 select-none">{getFlag(match.team_b)}</span>

                  {/* Team B Abreviation */}
                  <span className="text-[11px] font-extrabold text-slate-700 truncate text-left flex-1 min-w-0" title={match.team_b}>
                    {getAbbreviation(match.team_b)}
                  </span>
                </div>

                {/* Rightmost info field including predicted score and status/badge points */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Your prediction label */}
                  {!isTBD && (
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded font-mono border border-slate-200/60 shrink-0">
                      {myTippText}
                    </span>
                  )}

                  {/* Point or warning status badge */}
                  <span className={cn(
                    "text-[10px] font-black py-0.5 px-1.5 rounded-md border shrink-0 text-center uppercase tracking-wider",
                    statusColor
                  )}>
                    {shortStatus}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: 2/3 wide stats details pane */}
      <div className="lg:col-span-2">
        <AnimatePresence mode="wait">
          {selectedMatch ? (
            <motion.div
              key={selectedMatch.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <MatchDetailPane 
                match={selectedMatch}
                prediction={predictions.find(p => p.match_id === selectedMatch.id)}
                onSave={onSavePrediction}
              />
            </motion.div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-md text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-350 mb-4 animate-bounce">
                <Goal size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-700 mb-1">Nincs kijelölt mérkőzés</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Válassz ki egy mérkőzést a bal oldali listából a részletes elemzések, AI tippek és statisztikák megtekintéséhez!
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

// Subcomponent: The Wide Details Dashboard Panel (2/3 width)
function MatchDetailPane({ match, prediction, onSave }: {
  match: Match;
  prediction?: Prediction;
  onSave: (matchId: string, a: number, b: number) => Promise<void>;
}) {
  const [a, setA] = useState(prediction?.predicted_a ?? 0);
  const [b, setB] = useState(prediction?.predicted_b ?? 0);
  const [saving, setSaving] = useState(false);
  const [hasSavedSuccessfully, setHasSavedSuccessfully] = useState(false);

  // Sync with prediction changes
  useEffect(() => {
    if (prediction) {
      setA(prediction.predicted_a);
      setB(prediction.predicted_b);
    } else {
      setA(0);
      setB(0);
    }
    setHasSavedSuccessfully(false);
  }, [prediction, match.id]);

  const hasChanged = a !== (prediction?.predicted_a ?? 0) || b !== (prediction?.predicted_b ?? 0);
  const isFinished = match.status === 'FINISHED';
  const isTBD = match.id === '6'; // Match 6 is undetermined knockout

  // Style customization based on group/stage
  const style = groupStyles[match.group || 'default'] || groupStyles['default'];
  const stats = MOCK_STATS_DB[match.id];

  // Calculate user's points
  let pointsEarned = null;
  let pointReason = '';
  if (isFinished && match.score_a !== null && match.score_b !== null) {
    const actA = match.score_a;
    const actB = match.score_b;
    const predA = prediction?.predicted_a ?? 0;
    const predB = prediction?.predicted_b ?? 0;

    if (actA === predA && actB === predB) {
      pointsEarned = 3;
      pointReason = 'Telitalálat! Tökéletes eredményt jósoltál és maximális pontot szereztél.';
    } else if ((actA > actB && predA > predB) || (actA < actB && predA < predB) || (actA === actB && predA === predB)) {
      pointsEarned = 1;
      pointReason = 'Kimenetel helyes! Eltaláltad a győztes csapatot vagy a döntetlent.';
    } else {
      pointsEarned = 0;
      pointReason = 'Sajnos nem talált. A tippelt eredmény és a valóság eltér.';
    }
  }

  const handleSave = async () => {
    setSaving(true);
    await onSave(match.id, a, b);
    setSaving(false);
    setHasSavedSuccessfully(true);
    // Hide notification after 3s
    setTimeout(() => setHasSavedSuccessfully(false), 3000);
  };

  const adjustScore = (team: 'a' | 'b', change: number) => {
    if (isFinished || isTBD) return;
    if (team === 'a') {
      setA(prev => Math.max(0, prev + change));
    } else {
      setB(prev => Math.max(0, prev + change));
    }
  };

  // Other players' predictions
  const otherTips = getOtherPlayersTips(match.id);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden">
      
      {/* 1. TOP STATS HEADER CARD */}
      <div className={cn("px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4", style.header)}>
        <div className="flex items-center gap-2">
          <Calendar size={14} className={cn("text-emerald-600", style.title)} />
          <span className="text-xs font-bold tracking-wide">
            {format(new Date(match.start_time), 'yyyy. MMMM d., HH:mm', { locale: hu })}
          </span>
          {match.group && (
            <span className={cn("text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border", style.pill)}>
              {match.group} fázis
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isFinished && <CountdownTimer startTime={match.start_time} />}
          <span className={cn(
            "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
            isFinished ? "bg-slate-200 text-slate-600" : "bg-emerald-500/10 text-emerald-800"
          )}>
            {isFinished ? 'Lejátszott' : isTBD ? 'Párosítás előtt' : 'Aktív Tippjáték'}
          </span>
        </div>
      </div>

      {/* 2. MATCHUP GRAPHIC & INTERACTIVE TIPPING SECTION */}
      <div className="p-6 md:p-8 border-b border-slate-100">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Team A Badge */}
          <div className="flex-1 w-full flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl flex items-center justify-center text-5xl shadow-sm border border-slate-200/40 transform hover:scale-105 transition-transform">
              {getFlag(match.team_a)}
            </div>
            <span className="text-lg font-black text-slate-800 text-center font-display leading-tight">{match.team_a}</span>
          </div>

          {/* Interactive center core */}
          <div className="flex flex-col items-center gap-4 min-w-[200px]">
            <div className="flex items-center gap-4">
              
              {isFinished ? (
                /* SCOREBOARD FINISHED DISPLAY */
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
                /* LOCK SYMBOL FOR TBD BRACKET MATCHES */
                <div className="flex flex-col items-center gap-1.5 py-4">
                  <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 border border-amber-200 border-dashed animate-pulse">
                    <Lock size={22} />
                  </div>
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Tippelés zárolva</span>
                </div>
              ) : (
                /* ACTIVE TIPPABLE SCOREBOARD */
                <>
                  {/* Team A score selector */}
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => adjustScore('a', 1)}
                      className="p-1 hover:bg-slate-100 text-emerald-600 rounded-full transition-colors"
                      title="Növel"
                    >
                      <Plus size={18} strokeWidth={2.8} />
                    </button>
                    <div className="w-16 h-16 flex items-center justify-center bg-slate-50 border-2 border-slate-200/80 rounded-2xl text-3xl font-black text-slate-800 shadow-inner font-display select-none">
                      {a}
                    </div>
                    <button 
                      onClick={() => adjustScore('a', -1)}
                      className="p-1 hover:bg-slate-100 text-emerald-600 rounded-full transition-colors"
                      title="Csökkent"
                    >
                      <Minus size={18} strokeWidth={2.8} />
                    </button>
                  </div>

                  <span className="text-slate-300 font-extrabold text-2xl font-display mt-[-8px]">:</span>

                  {/* Team B score selector */}
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onClick={() => adjustScore('b', 1)}
                      className="p-1 hover:bg-slate-100 text-emerald-600 rounded-full transition-colors"
                      title="Növel"
                    >
                      <Plus size={18} strokeWidth={2.8} />
                    </button>
                    <div className="w-16 h-16 flex items-center justify-center bg-slate-50 border-2 border-slate-200/80 rounded-2xl text-3xl font-black text-slate-800 shadow-inner font-display select-none">
                      {b}
                    </div>
                    <button 
                      onClick={() => adjustScore('b', -1)}
                      className="p-1 hover:bg-slate-100 text-emerald-600 rounded-full transition-colors"
                      title="Csökkent"
                    >
                      <Minus size={18} strokeWidth={2.8} />
                    </button>
                  </div>
                </>
              )}

            </div>

            {/* Warning when bracket teams are undetermined / Match is locked */}
            {isTBD && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-center">
                <p className="text-[11px] text-amber-855 font-bold leading-relaxed">
                  A nyolcaddöntő pontos párosítása jelenleg még nem ismert. A tippek leadása az igazi csapatok kialakulása után nyílik meg.
                </p>
              </div>
            )}

            {/* Te tippelésed label underneath */}
            {!isTBD && (
              <div className="text-center">
                {isFinished ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Megtett tipped</span>
                    <div className="px-4 py-1.5 bg-slate-100 border border-slate-205 text-slate-750 font-black text-sm rounded-full font-mono">
                      {a} - {b}
                    </div>
                  </div>
                ) : (
                  prediction ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Már leadott tipped</span>
                      <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-full font-mono">
                        {prediction.predicted_a} - {prediction.predicted_b}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-rose-500 font-extrabold italic bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/50 animate-pulse">
                      Még nem tippeltél erre a mérkőzésre!
                    </span>
                  )
                )}
              </div>
            )}

          </div>

          {/* Team B Badge */}
          <div className="flex-1 w-full flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl flex items-center justify-center text-5xl shadow-sm border border-slate-200/40 transform hover:scale-105 transition-transform">
              {getFlag(match.team_b)}
            </div>
            <span className="text-lg font-black text-slate-800 text-center font-display leading-tight">{match.team_b}</span>
          </div>

        </div>

        {/* Dynamic Save button wrapper */}
        {hasChanged && !isFinished && !isTBD && (
          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 bg-emerald-600 text-white font-extrabold flex items-center justify-center gap-2 hover:bg-emerald-700 active:bg-emerald-800 rounded-2xl transition-all shadow-md active:scale-[0.99] text-xs tracking-wider uppercase font-display"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>Leadott tipp módosítása / mentése</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Success confirmation toast inline */}
        {hasSavedSuccessfully && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-emerald-50 text-emerald-850 p-3 rounded-xl border border-emerald-200 text-xs text-center font-bold"
          >
            🎉 Sikeresen elmentettük a tippedet a rendszerbe! Sok sikert a játékhoz!
          </motion.div>
        )}

      </div>

      {/* 3. POINTS AWARDED (IF PLAYED) */}
      {pointsEarned !== null && (
        <div className={cn(
          "px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 gap-3",
          pointsEarned === 3 ? "bg-emerald-500/5" : pointsEarned === 1 ? "bg-blue-500/5" : "bg-slate-50"
        )}>
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Award size={18} className={cn(
              pointsEarned === 3 ? "text-emerald-600 animate-bounce" : pointsEarned === 1 ? "text-blue-500" : "text-slate-400"
            )} />
            <span className="text-xs font-bold text-slate-650">{pointReason}</span>
          </div>
          
          <span className={cn(
            "text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shrink-0 shadow-xs border",
            pointsEarned === 3 ? "bg-emerald-500 text-white border-emerald-600" : pointsEarned === 1 ? "bg-blue-500 text-white border-blue-600" : "bg-slate-200 text-slate-700 border-slate-300"
          )}>
            +{pointsEarned} Pontszám
          </span>
        </div>
      )}

      {/* 4. OTHER PLAYERS' PREDICTIONS DISPLAY */}
      {!isTBD && (
        <div className="bg-slate-50/20 border-b border-slate-100 px-6 py-4">
          {isFinished ? (
            /* Match completed: Open list of other players' tips */
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-550 uppercase tracking-wider mb-3">
                <Eye size={15} className="text-emerald-500" />
                <span>Barátok leadott tippjei és pontjai ezen a meccsen</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {otherTips.map((tip, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-2 px-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                    <span className="text-slate-605 font-bold">{tip.username}</span>
                    <span className="font-mono bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded font-black text-slate-800">
                      {tip.predicted_a} - {tip.predicted_b}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Match upcoming: Secret padlocked box */
            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold bg-slate-100/30 p-3 rounded-xl border border-slate-200/30">
              <EyeOff size={14} className="text-slate-400 animate-pulse" />
              <span>🔒 A többiek tippjei titkosak a kezdő sípszóig (visszaesés elkerülése érdekében!)</span>
            </div>
          )}
        </div>
      )}

      {/* 5. VERTICAL ARRANGEMENT OF DETAILED SPORTS ANALYTICS: 
          egymás alatt az előrejelzések, bukmékerek szotzói, egymás elleni meccsek, forma, hőfok, hiányzók, sérültek, hírek */}
      {stats ? (
        <div className="divide-y divide-slate-100 bg-slate-50/40">
          
          {/* A. AI PREDICTIONS (AI ELŐREJELZÉSEK ÉS AI TIPPEK) */}
          <div className="p-6">
            <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded uppercase tracking-wider mb-3 inline-flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-500 animate-spin" />
              AI Algoritmus Elemzése (Predictions)
            </span>
            
            <h4 className="text-sm font-black text-slate-800 mb-2 font-display">
              Ki a favorit? AI valószínűségi modell eredményei
            </h4>

            {/* Beautiful comparative bar chart representation */}
            <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-xs">
              <div className="flex gap-1 h-3.5 rounded-full overflow-hidden bg-slate-100 mb-3 select-none">
                <div 
                  className="bg-emerald-500 hover:opacity-90 transition-opacity" 
                  style={{ width: `${stats.prediction.winA}%` }} 
                  title={`${match.team_a}: ${stats.prediction.winA}%`}
                />
                <div 
                  className="bg-slate-300 hover:opacity-90 transition-opacity" 
                  style={{ width: `${stats.prediction.draw}%` }} 
                  title={`Döntetlen: ${stats.prediction.draw}%`}
                />
                <div 
                  className="bg-blue-500 hover:opacity-90 transition-opacity" 
                  style={{ width: `${stats.prediction.winB}%` }} 
                  title={`${match.team_b}: ${stats.prediction.winB}%`}
                />
              </div>

              <div className="flex justify-between items-center text-xs font-black font-display mb-4">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  <span>{match.team_a}: {stats.prediction.winA}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 bg-slate-300 rounded-full" />
                  <span>Döntetlen: {stats.prediction.draw}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-700">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  <span>{match.team_b}: {stats.prediction.winB}%</span>
                </div>
              </div>

              {/* Támadás/Védekezés AI mérőszámok */}
              {!isTBD && (
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-100">
                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{match.team_a}</span>
                    <div className="space-y-1.5 text-[11px] font-bold text-slate-600">
                      <div className="flex justify-between">
                        <span>Támadóerő (Attack):</span>
                        <span className="text-emerald-700 font-black">{stats.prediction.attackA}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${stats.prediction.attackA}%` }} />
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>Védekezőerő (Defense):</span>
                        <span className="text-emerald-700 font-black">{stats.prediction.defenseA}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${stats.prediction.defenseA}%` }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{match.team_b}</span>
                    <div className="space-y-1.5 text-[11px] font-bold text-slate-600">
                      <div className="flex justify-between">
                        <span>Támadóerő (Attack):</span>
                        <span className="text-blue-750 font-black">{stats.prediction.attackB}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${stats.prediction.attackB}%` }} />
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>Védekezőerő (Defense):</span>
                        <span className="text-blue-750 font-black">{stats.prediction.defenseB}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${stats.prediction.defenseB}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Javaslat / Konkrét tanács */}
              <div className="mt-2 bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed font-semibold italic flex items-start gap-2">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <span>AI Szakértői Tanács: "{stats.prediction.advice}"</span>
              </div>
            </div>
          </div>

          {/* B. BOOKMAKER PRE-MATCH ODDS (FOGADÁSI ESÉLYEK) */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Landmark size={14} className="text-slate-500" />
              <span>Pre-Match Fogadási Szorzók (Oddsok)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              A nemzetközi bukméker irodák (Bet365, Unibet) súlyozott szorzói. Mutatja a matematikai papírformát.
            </p>

            {isTBD ? (
              <div className="bg-white rounded-xl p-4 border border-slate-100 text-center text-xs text-slate-400 font-semibold italic">
                A szorzók a pontos ellenfelek kvalifikációja után kerülnek kikalkulálásra.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-150 rounded-2xl p-3 text-center shadow-xs">
                  <span className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">{match.team_a} győz (1)</span>
                  <span className="text-sm font-black text-emerald-700 font-mono">{stats.odds.winA}</span>
                </div>
                <div className="bg-white border border-slate-150 rounded-2xl p-3 text-center shadow-xs">
                  <span className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">Döntetlen (X)</span>
                  <span className="text-sm font-black text-slate-600 font-mono">{stats.odds.draw}</span>
                </div>
                <div className="bg-white border border-slate-150 rounded-2xl p-3 text-center shadow-xs">
                  <span className="block text-[9px] font-extrabold text-slate-400 uppercase mb-1">{match.team_b} győz (2)</span>
                  <span className="text-sm font-black text-blue-700 font-mono">{stats.odds.winB}</span>
                </div>
              </div>
            )}
          </div>

          {/* C. HEAD-TO-HEAD (EGYMÁS ELLENI EREDMÉNYEK) */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Swords size={14} className="text-red-500" />
              <span>Egymás elleni történelem (H2H)</span>
            </h4>
            <p className="text-xs text-slate-700 font-semibold mb-4 leading-relaxed bg-white border border-slate-100 p-3.5 rounded-xl shadow-xs">
              {stats.h2hSummary}
            </p>

            {stats.h2hHistory.length > 0 ? (
              <div className="space-y-2">
                {stats.h2hHistory.map((h, i) => (
                  <div key={i} className="flex justify-between items-center text-xs py-2 px-3 bg-white rounded-xl border border-slate-100 shadow-xs">
                    <span className="font-bold text-slate-400 font-mono">{h.year}</span>
                    <span className="font-black text-slate-700 font-display">{h.res}</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider",
                      h.winner === 'draw' 
                        ? "bg-slate-100 text-slate-600 border-slate-205" 
                        : "bg-emerald-500/10 text-emerald-800 border-emerald-200/50"
                    )}>
                      {h.winner === 'draw' ? 'Döntetlen' : `${getAbbreviation(h.winner)} győzelem`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 border border-slate-100 text-center text-xs text-slate-500 font-semibold italic">
                A csapatok egymás elleni statisztikája a pontos párosítás eldöntése után válik aktívvá.
              </div>
            )}
          </div>

          {/* D. TEAM FORM & TEMPERATURE (FORMAMUTATÓ & CSAPATHŐMÉRSÉKLET) */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-orange-500" />
              <span>Aktuális Forma és Csapathőmérséklet (Form & Heat)</span>
            </h4>

            {isTBD ? (
              <div className="bg-white rounded-xl p-4 border border-slate-100 text-center text-xs text-slate-500 font-semibold italic">
                A formamutatók a csoportkör végeredményei alapján fognak frissülni.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Team A Form & Temp */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-800">{match.team_a}</span>
                    <div className="flex items-center gap-1">
                      <Flame size={12} className="text-orange-500 animate-pulse animate-bounce" />
                      <span className="text-[10px] font-black font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                        HŐFOK: {stats.teamA.temp}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mb-2">
                    {stats.teamA.form.map((f, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-xs border text-white font-mono",
                          f === 'W' ? "bg-emerald-500 border-emerald-600" : f === 'D' ? "bg-slate-400 border-slate-500" : "bg-red-500 border-red-600"
                        )}
                        title={f === 'W' ? 'Győzelem' : f === 'D' ? 'Döntetlen' : 'Vereség'}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-450 italic font-semibold font-display block">Közeli 5 meccs eredménye (balról jobbra haladva)</span>
                </div>

                {/* Team B Form & Temp */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-slate-800">{match.team_b}</span>
                    <div className="flex items-center gap-1">
                      <Flame size={12} className="text-orange-500 animate-pulse animate-bounce" />
                      <span className="text-[10px] font-black font-mono text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md">
                        HŐFOK: {stats.teamB.temp}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 mb-2">
                    {stats.teamB.form.map((f, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-xs border text-white font-mono",
                          f === 'W' ? "bg-emerald-500 border-emerald-600" : f === 'D' ? "bg-slate-400 border-slate-500" : "bg-red-500 border-red-600"
                        )}
                        title={f === 'W' ? 'Győzelem' : f === 'D' ? 'Döntetlen' : 'Vereség'}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-450 italic font-semibold font-display block">Közeli 5 meccs eredménye (balról jobbra haladva)</span>
                </div>

              </div>
            )}
          </div>

          {/* E. SIDELINED / INJURED / SUSPENDED (HIÁNYZÓK ÉS SÉRÜLTEK) */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-red-500" />
              <span>Sérülések és Eltiltások (Hiányzók)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              A meccs kimenetelét alapjaiban befolyásoló kieső kulcsjátékosok hivatalos jelentése.
            </p>

            {isTBD ? (
              <div className="bg-white rounded-xl p-4 border border-slate-100 text-center text-xs text-slate-500 font-semibold italic">
                A hiányzó játékosok listája a pontos csapatpárok után válik ismertté.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team A injuries */}
                <div className="bg-red-50/20 border border-red-100/60 rounded-2xl p-4">
                  <span className="block text-[11px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5 border-b border-red-100 pb-1.5">
                    🏥 {match.team_a} ({stats.teamA.injuries.length})
                  </span>
                  {stats.teamA.injuries.length > 0 ? (
                    <ul className="space-y-1.5">
                      {stats.teamA.injuries.map((inj, idx) => (
                        <li key={idx} className="text-xs text-slate-700 font-semibold list-disc ml-4">{inj}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-450 font-bold italic">Nincs sérült vagy maródi kulcspozícióban!</span>
                  )}
                </div>

                {/* Team B injuries */}
                <div className="bg-red-50/20 border border-red-100/60 rounded-2xl p-4">
                  <span className="block text-[11px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5 border-b border-red-100 pb-1.5">
                    🏥 {match.team_b} ({stats.teamB.injuries.length})
                  </span>
                  {stats.teamB.injuries.length > 0 ? (
                    <ul className="space-y-1.5">
                      {stats.teamB.injuries.map((inj, idx) => (
                        <li key={idx} className="text-xs text-slate-700 font-semibold list-disc ml-4">{inj}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-450 font-bold italic">Nincs sérült vagy maródi kulcspozícióban!</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* F. SPORT NEWS & RUMORS (SAJTÓSZOBA ÉS FRISS HÍREK) */}
          <div className="p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Newspaper size={14} className="text-emerald-500" />
              <span>Sajtószoba és Friss Hírek (Rumors)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Zárt sajtótájékoztatókról, pletykalapokból és a helyszíni tudósítóktól származó exkluzív morzsák.
            </p>

            <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 shadow-xs">
              {stats.news.map((item, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex gap-3 text-xs leading-relaxed font-semibold text-slate-650",
                    idx < stats.news.length - 1 ? "border-b border-slate-100 pb-3" : ""
                  )}
                >
                  <span className="text-lg leading-none shrink-0 text-slate-400 select-none">📰</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
}
