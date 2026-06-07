import React from 'react';
import crestsMap from '@/src/lib/crests-map.json';

const ICON_PATHS: Record<string, string> = {
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flame: '<path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 .5-2 1-2.5C16 9 17 11 17 14a5 5 0 0 1-10 0c0-4 3-6 5-12z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4M12 16h.01"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.3 3.4M6.6 6.6A18 18 0 0 0 2 12s3.5 8 10 8a10 10 0 0 0 4-.8"/><path d="m2 2 20 20"/><path d="M9.5 9.5a3 3 0 0 0 4.2 4.2"/>',
  sparkles: '<path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 14l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 17.5 21 6V3h-3L6.5 14.5"/><path d="M11 19l-6-6M8 16l-4 4M5 21l-2-2"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  landmark: '<path d="M3 22h18M4 10h16M12 2 3 7v0h18v0z"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/>',
  newspaper: '<path d="M4 22h14a2 2 0 0 0 2-2V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v16a2 2 0 0 1-2-2V8"/><path d="M16 7h-6M16 11h-6M16 15h-6"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  trophy: '<path d="M6 4h12v3a6 6 0 0 1-12 0V4z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3"/><path d="M9 16h6M10 19h4M12 16v3"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  trending: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  zap: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1A4 4 0 0 1 16 11"/>',
  whistle: '<circle cx="9" cy="13" r="5"/><path d="M14 11h6a1 1 0 0 1 1 1 5 5 0 0 1-5 5M9 8V5h2"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  star: '<path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.5 9.8l6.6-.9L12 2.5z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  fill?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, className = '', strokeWidth = 2, fill = 'none', style }: IconProps) {
  const p = ICON_PATHS[name];
  if (!p) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: p }}
    />
  );
}

// Complete flag codes mapping for all 48 World Cup teams
const FLAG_CODE: Record<string, string> = {
  'Magyarország': 'hu',
  'Németország': 'de',
  'Brazília': 'br',
  'Franciaország': 'fr',
  'Argentína': 'ar',
  'Portugália': 'pt',
  'Spanyolország': 'es',
  'Anglia': 'gb-eng',
  'Olaszország': 'it',
  'Horvátország': 'hr',
  'Svájc': 'ch',
  'Marokkó': 'ma',
  'Hollandia': 'nl',
  'Japán': 'jp',
  'Belgium': 'be',
  'Uruguay': 'uy',
  'Mexikó': 'mx',
  'Dél-afrikai Köztársaság': 'za',
  'Koreai Köztársaság': 'kr',
  'Csehország': 'cz',
  'Kanada': 'ca',
  'Bosznia-Hercegovina': 'ba',
  'Egyesült Államok': 'us',
  'Paraguay': 'py',
  'Katar': 'qa',
  'Haiti': 'ht',
  'Skócia': 'gb-sct',
  'Ausztrália': 'au',
  'Törökország': 'tr',
  'Curaçao': 'cw',
  'Elefántcsontpart': 'ci',
  'Ecuador': 'ec',
  'Svédország': 'se',
  'Tunézia': 'tn',
  'Zöld-foki Köztársaság': 'cv',
  'Egyiptom': 'eg',
  'Szaúd-Arábia': 'sa',
  'Irán': 'ir',
  'Új-Zéland': 'nz',
  'Szenegál': 'sn',
  'Irak': 'iq',
  'Norvégia': 'no',
  'Algéria': 'dz',
  'Ausztria': 'at',
  'Jordánia': 'jo',
  'Kongói DK': 'cd',
  'Ghána': 'gh',
  'Panama': 'pa',
  'Üzbegisztán': 'uz',
  'Kolumbia': 'co'
};

export function getFlagCode(country: string): string | null {
  if (!country || country.includes('csoport') || country.includes('helyezettje') || country.includes('/') || country.startsWith('W-') || country.startsWith('L-')) return null;
  return FLAG_CODE[country] || null;
}

interface FlagBadgeProps {
  country: string;
  size?: number;
}

export function FlagBadge({ country, size = 24 }: FlagBadgeProps) {
  const filename = (crestsMap as Record<string, string>)[country];
  
  if (!filename) {
    const w = Math.round(size * 4 / 3);
    return (
      <span 
        className="inline-flex items-center justify-center shrink-0 rounded-[3px] bg-slate-100 border border-slate-200 text-slate-400"
        style={{ width: w, height: size }}
      >
        <Icon name="target" size={Math.round(size * 0.66)} />
      </span>
    );
  }

  return (
    <img
      src={`/crests/${filename}`}
      alt={country}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}
