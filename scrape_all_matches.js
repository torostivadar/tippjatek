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
  
  // 1. Get all match IDs
  console.log('Navigating to Eredmenyek VB matches page to get IDs...');
  await page.goto('https://www.eredmenyek.com/foci/vilag/vb/meccsek/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  const matchElements = page.locator('div.event__match');
  const count = await matchElements.count();
  console.log(`Found ${count} match elements.`);
  
  if (count === 0) {
    console.error('No matches found. Exiting.');
    await browser.close();
    return;
  }
  
  const matchIds = [];
  const listTeamNames = [];
  
  for (let i = 0; i < count; i++) {
    const idAttr = await matchElements.nth(i).getAttribute('id');
    const text = await matchElements.nth(i).innerText();
    
    // Quick parse of team names from the list just in case
    const parts = text.split('\n');
    let home = 'Hazai';
    let away = 'Vendég';
    if (parts.length >= 3) {
       home = parts[1].trim();
       away = parts[2].trim();
    }
    
    if (idAttr && idAttr.startsWith('g_1_')) {
      matchIds.push({ id: idAttr.substring(4), home, away });
    }
  }
  
  console.log(`Successfully extracted ${matchIds.length} match IDs.`);
  
  // 2. Prepare Markdown
  const today = new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });
  let mdContent = `# VB 2026 Összes Mérkőzés Adatai\n\n`;
  mdContent += `*Frissítve: ${today}*\n\n`;
  
  // 3. Iterate through each match
  for (let i = 0; i < matchIds.length; i++) {
    const match = matchIds[i];
    console.log(`\n[${i + 1}/${matchIds.length}] Scraping match ID: ${match.id} (${match.home} vs ${match.away})...`);
    
    const url = `https://www.eredmenyek.com/merkozes/${match.id}/#/merkozes-osszefoglalo`;
    
    let retries = 3;
    let success = false;
    
    while (retries > 0 && !success) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000); // Wait for scripts to render
        
        const bodyText = await page.locator('body').innerText();
        
        // Extract extra info using Regex
        const matchTv = bodyText.match(/TV ADÓ\n(.+?)\n/);
        const tvAdo = matchTv ? matchTv[1].trim() : 'N/A';

        const matchHelyszin = bodyText.match(/HELYSZÍN:\n(.+?)\n(.+?)\n/);
        let helyszin = 'N/A';
        if (matchHelyszin) {
          helyszin = `${matchHelyszin[1].trim()} ${matchHelyszin[2].trim()}`;
        }

        const matchBefogado = bodyText.match(/BEFOGADÓKÉPESSÉG:\n([\d\s]+)\n/);
        const befogadokepesseg = matchBefogado ? matchBefogado[1].trim() : 'N/A';

        const matchOdds = bodyText.match(/1\s+X\s+2\n([\d.]+)\n([\d.]+)\n([\d.]+)/);
        const odds = matchOdds ? `${matchOdds[1]}, ${matchOdds[2]}, ${matchOdds[3]}` : 'N/A';

        // Get H2H Matches
        const h2hRows = page.locator('.h2h__row');
        const h2hCount = await h2hRows.count();
        const h2hData = [];
        
        for (let j = 0; j < h2hCount; j++) {
          const row = h2hRows.nth(j);
          const date = await row.locator('.wclH2h__date').innerText().catch(() => '—');
          const tournament = await row.locator('.h2h__event').innerText().catch(() => '—');
          const homeTeam = await row.locator('.h2h__homeParticipant').innerText().catch(() => '—');
          const awayTeam = await row.locator('.h2h__awayParticipant').innerText().catch(() => '—');
          const resultRaw = await row.locator('.h2h__result').innerText().catch(() => '—');
          const result = resultRaw.replace(/\n/g, '-').trim();
          h2hData.push({ date, tournament, homeTeam, awayTeam, result });
        }
        
        // Append to Markdown
        mdContent += `## Mérkőzés Részletek: ${match.home} - ${match.away}\n\n`;
        mdContent += `**TV adó:** ${tvAdo}\n`;
        mdContent += `**Helyszín:** ${helyszin}\n`;
        mdContent += `**Befogadóképesség:** ${befogadokepesseg}\n`;
        mdContent += `**Odds (1, X, 2):** ${odds}\n\n`;
        
        mdContent += `### Egymás Elleni Eredmények (H2H)\n\n`;
        mdContent += `| Dátum | Torna | Hazai Csapat | Eredmény | Vendég Csapat |\n`;
        mdContent += `| :--- | :--- | :--- | :---: | :--- |\n`;
        
        for (const h2h of h2hData) {
          mdContent += `| ${h2h.date} | ${h2h.tournament} | ${h2h.homeTeam} | ${h2h.result} | ${h2h.awayTeam} |\n`;
        }
        
        if (h2hData.length === 0) {
          mdContent += `| — | — | Nincs korábbi egymás elleni mérkőzés | — | — |\n`;
        }
        mdContent += `\n---\n\n`;
        
        success = true;
      } catch (err) {
        console.error(`Error on match ${match.id}, retries left: ${retries - 1}`, err.message);
        retries--;
        await page.waitForTimeout(2000);
      }
    }
  }
  
  await browser.close();
  
  const targetDir = '/Users/claudius/Projects/tippjatek/assets';
  const targetFile = path.join(targetDir, 'all_matches_h2h.md');
  
  console.log(`Writing markdown to: ${targetFile}`);
  fs.writeFileSync(targetFile, mdContent, 'utf8');
  console.log('Batch scrape complete!');
}

run().catch(err => {
  console.error('Fatal error:', err);
});
