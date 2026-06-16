import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAbbreviationCode(country: string): string {
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
    'Horvátország': 'CRO',
    'Mexikó': 'MEX',
    'Dél-afrikai Köztársaság': 'RSA',
    'Koreai Köztársaság': 'KOR',
    'Csehország': 'CZE',
    'Kanada': 'CAN',
    'Bosznia-Hercegovina': 'BIH',
    'Egyesült Államok': 'USA',
    'Paraguay': 'PAR',
    'Katar': 'QAT',
    'Svájc': 'SUI',
    'Marokkó': 'MAR',
    'Haiti': 'HAI',
    'Skócia': 'SCO',
    'Ausztrália': 'AUS',
    'Törökország': 'TUR',
    'Curaçao': 'CUW',
    'Hollandia': 'NED',
    'Japán': 'JPN',
    'Elefántcsontpart': 'CIV',
    'Ecuador': 'ECU',
    'Svédország': 'SWE',
    'Tunézia': 'TUN',
    'Zöld-foki Köztársaság': 'CPV',
    'Belgium': 'BEL',
    'Egyiptom': 'EGY',
    'Szaúd-Arábia': 'KSA',
    'Uruguay': 'URU',
    'Irán': 'IRN',
    'Új-Zéland': 'NZL',
    'Szenegál': 'SEN',
    'Irak': 'IRQ',
    'Norvégia': 'NOR',
    'Algéria': 'ALG',
    'Ausztria': 'AUT',
    'Jordánia': 'JOR',
    'Kongói DK': 'COD',
    'Ghána': 'GHA',
    'Panama': 'PAN',
    'Üzbegisztán': 'UZB',
    'Kolumbia': 'COL'
  };

  if (!country) return '';
  if (
    country.includes('csoport') || 
    country.includes('helyezettje') || 
    country.includes('/') || 
    country.startsWith('W-') || 
    country.startsWith('L-')
  ) {
    return country;
  }
  return codes[country] || country.substring(0, 3).toUpperCase();
}

export function fmtTime(dateStr: string | Date): string {
  try {
    return format(new Date(dateStr), 'HH:mm');
  } catch (e) {
    return '';
  }
}

export function fmtLong(dateStr: string | Date): string {
  try {
    return format(new Date(dateStr), 'yyyy. MMMM d. (EEEE) HH:mm', { locale: hu });
  } catch (e) {
    return '';
  }
}

export function groupByDay<T extends { start_time: string | Date }>(items: T[]) {
  const groups: Record<string, { key: string; label: string; items: T[] }> = {};
  
  items.forEach(item => {
    try {
      const d = new Date(item.start_time);
      const key = format(d, 'yyyy-MM-dd');
      const label = format(d, 'MMMM d. (EEEE)', { locale: hu });
      
      if (!groups[key]) {
        groups[key] = { key, label, items: [] };
      }
      groups[key].items.push(item);
    } catch (e) {
      // Ignore invalid date
    }
  });

  return Object.values(groups).sort((a, b) => a.key.localeCompare(b.key));
}

export function getGroupTheme(groupName: string): { label: string; bg: string; fg: string } {
  if (!groupName) return { label: '', bg: '', fg: '' };
  
  if (groupName.length === 1 && groupName >= 'A' && groupName <= 'L') {
    return {
      label: `${groupName} csoport`,
      bg: '#7C3AED14',
      fg: '#7C3AED'
    };
  }

  return {
    label: groupName,
    bg: '#7C3AED14',
    fg: '#7C3AED'
  };
}

/**
 * Safely parse a date object that was returned from a timestamp-without-timezone database column
 * and return its UTC timestamp, avoiding local server timezone shifts.
 */
export function getUtcTimestamp(dateVal: Date | string | number): number {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 0;
  
  // If it's a string that already has timezone info or is a number, we can parse it normally
  if (typeof dateVal === 'string' && (dateVal.endsWith('Z') || dateVal.includes('+') || dateVal.includes('GMT'))) {
    return d.getTime();
  }
  if (typeof dateVal === 'number') {
    return d.getTime();
  }

  // Otherwise, extract local parts and construct a UTC timestamp
  return Date.UTC(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  );
}

