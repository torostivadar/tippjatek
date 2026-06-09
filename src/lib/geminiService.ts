import { GoogleGenAI } from '@google/genai';
import type { MatchStats } from '@/src/types';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * Generate AI analysis data for a given match using Gemini 1.5 Pro
 * with Google Search grounding for real-time data.
 */
export async function generateMatchAIData(
  teamA: string,
  teamB: string,
  apiKey?: string
): Promise<MatchStats> {
  const prompt = `Használd a Google Keresést! Nézz utána a legfrissebb híreknek a ${teamA} és ${teamB} közötti 2026-os labdarúgó-világbajnoki mérkőzéssel kapcsolatban.

Töltsd fel az alábbi JSON struktúrát valós, friss adatokkal, KIZÁRÓLAG magyar nyelven!

FONTOS SZABÁLYOK:
- A "probabilities" mezőben a hazai (${teamA}), döntetlen és vendég (${teamB}) győzelmi esélyeket add meg százalékban, amelyek összege PONTOSAN 100 legyen.
- A "team_stats" mezőben 0-100 közötti értékeket adj a támadó- és védekezőerő alapján.
- Az "odds" mezőben valós, európai formátumú tizedes fogadási szorzókat adj (pl. 2.40, nem 240).
- A "h2h" mezőben az utolsó 3-5 egymás elleni meccset sorold fel, a legfrissebbtől a legrégebbi felé.
- A "team_temperature" mezőben a csapat aktuális formaindexét adj (0-100), ahol 0 a legrosszabb, 100 a legjobb.
- A "form_last_5" mezőben az utolsó 5 mérkőzés eredményét add meg W (win), D (draw), L (loss) betűkkel, időrendi sorrendben (legrégebbitől a legfrissebbig).
- A "missing_players" mezőben a sérült vagy eltiltott játékosok neveit add meg.
- A "press_news" mezőben 2-4 friss sajtóhírt, edzői nyilatkozatot adj. Minden hírhez kötelezően mellékeld az eredeti cikk forrásának nevét (source) és közvetlen webcímét (url) is a Google Keresés eredményeiből!
- Az "expert_advice" mezőben adj egy 2-3 mondatos, megalapozott szakértői elemzést.

A válaszod KIZÁRÓLAG ez a JSON struktúra legyen, semmi más:

{
  "probabilities": { "home": <szám>, "draw": <szám>, "away": <szám> },
  "team_stats": {
    "home": { "attack": <szám>, "defense": <szám> },
    "away": { "attack": <szám>, "defense": <szám> }
  },
  "expert_advice": "<szöveg>",
  "odds": { "home": <szám>, "draw": <szám>, "away": <szám> },
  "h2h": [
    { "year": "<év>", "match": "<csapat1> <gól> - <gól> <csapat2>", "result": "<eredmény>" }
  ],
  "team_temperature": {
    "home": { "score": <szám>, "label": "<Hideg/Langyos/Meleg/Forró>" },
    "away": { "score": <szám>, "label": "<Hideg/Langyos/Meleg/Forró>" }
  },
  "form_last_5": { "home": "<WDWLW>", "away": "<WWDWW>" },
  "missing_players": {
    "home": ["<név1>", "<név2>"],
    "away": ["<név1>", "<név2>"]
  },
  "press_news": [
    {
      "text": "<hír szövege>",
      "source": "<forrásportál neve, pl. Nemzeti Sport>",
      "url": "<közvetlen forrás link a keresési találatból>"
    }
  ]
}`;

  const client = apiKey ? new GoogleGenAI({ apiKey }) : genAI;
  let response;

  // Helper to execute API calls with retries for temporary errors (503, 429, etc.)
  const callWithRetry = async (config: any, retries = 3, initialDelay = 1500) => {
    let delay = initialDelay;
    for (let i = 0; i < retries; i++) {
      try {
        return await client.models.generateContent(config);
      } catch (err: any) {
        const errStr = String(err.message || err);
        const isTemporary =
          errStr.includes('503') ||
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('429') ||
          errStr.includes('high demand') ||
          errStr.includes('overloaded');

        if (isTemporary && i < retries - 1) {
          console.warn(`⚠️ Gemini API temporary error (503/429), retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
  };

  try {
    response = await callWithRetry({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });
  } catch (err: any) {
    console.warn(`⚠️ Gemini Search Grounding failed: ${err.message || err}. Retrying WITHOUT Search Grounding...`);
    try {
      response = await callWithRetry({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      });
    } catch (fallbackErr: any) {
      const errStr = String(fallbackErr.message || fallbackErr);
      if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand')) {
        throw new Error('A Google Gemini API jelenleg túlterhelt (503 Service Unavailable). Kérjük, próbáld újra egy kis idő múlva!');
      }
      if (errStr.includes('429') || errStr.includes('quota')) {
        throw new Error('A Google Gemini API elélte a másodpercenkénti/napi lekérdezési korlátot (429 Rate Limit). Kérjük, próbáld újra egy kis idő múlva!');
      }
      throw fallbackErr;
    }
  }

  const text = (response?.text ?? '').trim();

  if (!text) {
    throw new Error('Gemini üres választ adott vissza. Ez biztonsági szűrők vagy átmeneti hálózati hiba miatt fordulhat elő.');
  }

  // Parse the JSON response
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (initialErr: any) {
    // 1. Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch (jsonMatchErr) {
        // Fallback to brace matching
      }
    }

    // 2. If still not parsed, find the first '{' and last '}' and parse that substring
    if (!parsed) {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonSubstring = text.substring(firstBrace, lastBrace + 1);
        try {
          parsed = JSON.parse(jsonSubstring);
        } catch (err: any) {
          throw new Error(`Failed to parse Gemini response as JSON. Error: ${err.message}. Raw text sample: ${text.substring(0, 150)}...`);
        }
      } else {
        throw new Error(`Failed to parse Gemini response as JSON (no curly braces found). Raw text sample: ${text.substring(0, 150)}...`);
      }
    }
  }

  // Map the Gemini response to our MatchStats interface
  return mapGeminiToMatchStats(parsed, teamA, teamB);
}

/**
 * Maps the raw Gemini JSON response to the MatchStats interface
 * used by the frontend components.
 */
function mapGeminiToMatchStats(data: any, teamA: string, teamB: string): MatchStats {
  const prob = data.probabilities || {};
  const teamStats = data.team_stats || {};
  const odds = data.odds || {};
  const h2h = data.h2h || [];
  const temp = data.team_temperature || {};
  const form = data.form_last_5 || {};
  const missing = data.missing_players || {};
  const news = data.press_news || [];

  // Parse form string "WDWLW" into array ['W', 'D', 'W', 'L', 'W']
  const parseForm = (formStr: string): ('W' | 'D' | 'L')[] => {
    if (!formStr || typeof formStr !== 'string') return ['W', 'D', 'W', 'D', 'W'];
    return formStr.split('').filter(c => ['W', 'D', 'L'].includes(c)) as ('W' | 'D' | 'L')[];
  };

  // Map H2H data
  const h2hHistory = h2h.map((item: any) => ({
    year: String(item.year || ''),
    res: String(item.match || ''),
    winner: detectH2HWinner(item, teamA, teamB),
  }));

  // Build H2H summary
  const homeWins = h2hHistory.filter((h: any) => h.winner === getAbbr(teamA)).length;
  const awayWins = h2hHistory.filter((h: any) => h.winner === getAbbr(teamB)).length;
  const draws = h2hHistory.filter((h: any) => h.winner === 'draw').length;
  const h2hSummary = `Az utolsó ${h2hHistory.length} egymás elleni mérkőzésből ${teamA} ${homeWins}-t nyert, ${teamB} ${awayWins}-t, és ${draws} döntetlen született.`;

  return {
    h2hSummary,
    h2hHistory,
    teamA: {
      form: parseForm(form.home),
      temp: temp.home?.score ?? 50,
      injuries: Array.isArray(missing.home) ? missing.home : [],
    },
    teamB: {
      form: parseForm(form.away),
      temp: temp.away?.score ?? 50,
      injuries: Array.isArray(missing.away) ? missing.away : [],
    },
    prediction: {
      winA: prob.home ?? 33,
      draw: prob.draw ?? 34,
      winB: prob.away ?? 33,
      advice: data.expert_advice || 'Nincs elérhető szakértői elemzés.',
      attackA: teamStats.home?.attack ?? 70,
      attackB: teamStats.away?.attack ?? 70,
      defenseA: teamStats.home?.defense ?? 70,
      defenseB: teamStats.away?.defense ?? 70,
    },
    odds: {
      winA: odds.home ?? 2.50,
      draw: odds.draw ?? 3.40,
      winB: odds.away ?? 2.50,
    },
    news: Array.isArray(news)
      ? news.map((item: any) => {
          if (typeof item === 'string') {
            return { text: item };
          }
          return {
            text: item?.text || item?.headline || '',
            url: item?.url || item?.source_url || undefined,
            source: item?.source || item?.source_name || undefined,
          };
        })
      : [],
  };
}

/**
 * Detect the winner from H2H result text.
 */
function detectH2HWinner(item: any, teamA: string, teamB: string): string {
  const result = (item.result || '').toLowerCase();
  const abbrA = getAbbr(teamA);
  const abbrB = getAbbr(teamB);

  if (result.includes('döntetlen') || result.includes('draw')) return 'draw';
  if (result.includes(teamA.toLowerCase()) || result.includes(abbrA.toLowerCase())) return abbrA;
  if (result.includes(teamB.toLowerCase()) || result.includes(abbrB.toLowerCase())) return abbrB;

  // Try to parse from the match score
  const match = (item.match || '').match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    const [, g1, g2] = match;
    if (Number(g1) > Number(g2)) return abbrA;
    if (Number(g2) > Number(g1)) return abbrB;
    return 'draw';
  }

  return 'draw';
}

function getAbbr(name: string): string {
  const map: Record<string, string> = {
    'Magyarország': 'HUN', 'Németország': 'GER', 'Brazília': 'BRA', 'Franciaország': 'FRA',
    'Argentína': 'ARG', 'Portugália': 'POR', 'Spanyolország': 'ESP', 'Anglia': 'ENG',
    'Horvátország': 'CRO', 'Mexikó': 'MEX', 'Kanada': 'CAN', 'Egyesült Államok': 'USA',
    'Hollandia': 'NED', 'Belgium': 'BEL', 'Uruguay': 'URU', 'Kolumbia': 'COL',
    'Japán': 'JPN', 'Koreai Köztársaság': 'KOR', 'Ausztrália': 'AUS', 'Svájc': 'SUI',
    'Törökország': 'TUR', 'Marokkó': 'MAR', 'Szenegál': 'SEN', 'Egyiptom': 'EGY',
    'Tunézia': 'TUN', 'Ghána': 'GHA', 'Algéria': 'ALG', 'Ecuador': 'ECU',
    'Paraguay': 'PAR', 'Irán': 'IRN', 'Irak': 'IRQ', 'Katar': 'QAT',
    'Szaúd-Arábia': 'KSA', 'Panama': 'PAN', 'Haiti': 'HAI', 'Curaçao': 'CUW',
    'Elefántcsontpart': 'CIV', 'Bosznia-Hercegovina': 'BIH', 'Norvégia': 'NOR',
    'Svédország': 'SWE', 'Skócia': 'SCO', 'Ausztria': 'AUT', 'Csehország': 'CZE',
    'Új-Zéland': 'NZL', 'Jordánia': 'JOR', 'Kongói DK': 'COD', 'Üzbegisztán': 'UZB',
    'Dél-afrikai Köztársaság': 'RSA', 'Zöld-foki Köztársaság': 'CPV',
  };
  return map[name] || name.substring(0, 3).toUpperCase();
}
