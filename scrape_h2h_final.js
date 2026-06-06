import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  console.log('Navigating to Eredmenyek VB matches page...');
  await page.goto('https://www.eredmenyek.com/foci/vilag/vb/meccsek/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  const matchSelector = 'div.event__match';
  const firstMatch = page.locator(matchSelector).first();
  const matchTextFromList = await firstMatch.innerText();
  console.log('Clicking the first match...');
  await firstMatch.click();
  await page.waitForTimeout(5000); 
  
  const bodyText = await page.locator('body').innerText();
  
  // Extract extra info using Regex on the visible text
  const matchTv = bodyText.match(/TV ADÓ\n(.+?)\n/);
  const tvAdo = matchTv ? matchTv[1].trim() : 'N/A';

  const matchHelyszin = bodyText.match(/HELYSZÍN:\n(.+?)\n(.+?)\n/);
  let helyszin = 'N/A';
  if (matchHelyszin) {
    helyszin = `${matchHelyszin[1].trim()} ${matchHelyszin[2].trim()}`;
  }

  const matchBefogado = bodyText.match(/BEFOGADÓKÉPESSÉG:\n([\d\s]+)\n/);
  const befogadokepesseg = matchBefogado ? matchBefogado[1].trim() : 'N/A';

  // For odds, look for 1 X 2 followed by three floats
  const matchOdds = bodyText.match(/1\s+X\s+2\n([\d.]+)\n([\d.]+)\n([\d.]+)/);
  const odds = matchOdds ? `${matchOdds[1]}, ${matchOdds[2]}, ${matchOdds[3]}` : 'N/A';

  const teamHome = matchTextFromList.split('\n')[1] || 'Hazai';
  const teamAway = matchTextFromList.split('\n')[2] || 'Vendég';
  
  console.log(`Extra Info -> TV: ${tvAdo}, Helyszín: ${helyszin}, Befogadóképesség: ${befogadokepesseg}, Odds: ${odds}`);

  // Scrape H2H matches
  const h2hRows = page.locator('.h2h__row');
  const count = await h2hRows.count();
  
  const h2hData = [];
  for (let i = 0; i < count; i++) {
    const row = h2hRows.nth(i);
    const date = await row.locator('.wclH2h__date').innerText().catch(() => '—');
    const tournament = await row.locator('.h2h__event').innerText().catch(() => '—');
    const homeTeam = await row.locator('.h2h__homeParticipant').innerText().catch(() => '—');
    const awayTeam = await row.locator('.h2h__awayParticipant').innerText().catch(() => '—');
    const resultRaw = await row.locator('.h2h__result').innerText().catch(() => '—');
    const result = resultRaw.replace(/\n/g, '-').trim();
    
    h2hData.push({ date, tournament, homeTeam, awayTeam, result });
  }
  
  await browser.close();
  
  // Format to Markdown
  const today = new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let mdContent = `# Mérkőzés Részletek: ${teamHome} - ${teamAway}\n\n`;
  mdContent += `*Frissítve: ${today}*\n\n`;
  mdContent += `**TV adó:** ${tvAdo}\n`;
  mdContent += `**Helyszín:** ${helyszin}\n`;
  mdContent += `**Befogadóképesség:** ${befogadokepesseg}\n`;
  mdContent += `**Odds (1, X, 2):** ${odds}\n\n`;
  
  mdContent += `### Egymás Elleni Eredmények (H2H)\n\n`;
  mdContent += `| Dátum | Torna | Hazai Csapat | Eredmény | Vendég Csapat |\n`;
  mdContent += `| :--- | :--- | :--- | :---: | :--- |\n`;
  
  for (const match of h2hData) {
    mdContent += `| ${match.date} | ${match.tournament} | ${match.homeTeam} | ${match.result} | ${match.awayTeam} |\n`;
  }
  
  if (h2hData.length === 0) {
    mdContent += `| — | — | Nincs korábbi egymás elleni mérkőzés | — | — |\n`;
  }
  
  const targetDir = '/Users/claudius/Projects/tippjatek/assets';
  const targetFile = path.join(targetDir, 'first_match_h2h.md');
  
  fs.writeFileSync(targetFile, mdContent, 'utf8');
  console.log('Done!');
}

run().catch(err => {
  console.error('Fatal error:', err);
});
