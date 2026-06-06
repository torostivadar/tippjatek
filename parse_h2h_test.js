import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const matchUrl = 'https://www.eredmenyek.com/merkozes/foci/del-afrika-W2ijYvlr/mexiko-O6iHcNkd/?mid=h4EoUB7T';
  console.log(`Navigating directly to match details: ${matchUrl}`);
  
  await page.goto(matchUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  console.log('Parsing H2H rows...');
  const h2hRows = page.locator('.h2h__row');
  const count = await h2hRows.count();
  console.log(`Found ${count} H2H rows.`);
  
  for (let i = 0; i < count; i++) {
    const row = h2hRows.nth(i);
    
    const date = await row.locator('.wclH2h__date').innerText().catch(() => 'N/A');
    const tournament = await row.locator('.h2h__event').innerText().catch(() => 'N/A');
    const homeTeam = await row.locator('.h2h__homeParticipant').innerText().catch(() => 'N/A');
    const awayTeam = await row.locator('.h2h__awayParticipant').innerText().catch(() => 'N/A');
    const resultRaw = await row.locator('.h2h__result').innerText().catch(() => 'N/A');
    
    // Clean result (replace newlines with dash)
    const result = resultRaw.replace(/\n/g, '-').trim();
    
    console.log(`Match ${i + 1}: ${date} | Torna: ${tournament} | ${homeTeam} ${result} ${awayTeam}`);
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
