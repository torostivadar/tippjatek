import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const matchUrl = 'https://www.eredmenyek.com/merkozes/foci/del-afrika-W2ijYvlr/mexiko-O6iHcNkd/?mid=h4EoUB7T';
  console.log(`Navigating to match details...`);
  
  await page.goto(matchUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  // 1. TV ADÓ
  let tvAdo = 'N/A';
  try {
    const tvText = await page.getByText('TV ADÓ').innerText();
    // In Eredmenyek, usually it's a div containing the header and the value
    const parentText = await page.getByText('TV ADÓ').locator('..').innerText();
    tvAdo = parentText.replace('TV ADÓ', '').trim();
  } catch (e) {
    console.log('TV Adó nem található egyszerűen.');
  }

  // 2. HELYSZÍN & BEFOGADÓKÉPESSÉG
  let helyszin = 'N/A';
  let befogadokepesseg = 'N/A';
  try {
    const infoBlocks = page.locator('.mi__item__val, .mi__item__name, .mi__item');
    const count = await infoBlocks.count();
    for (let i = 0; i < count; i++) {
      const text = await infoBlocks.nth(i).innerText();
      console.log(`Info Block ${i}: ${text}`);
    }
  } catch (e) {
    console.log('Nem találhatóak az info blokkok.');
  }

  // 3. ODDSOK
  try {
    // Eredmenyek usually has a table or a specific container for odds
    const oddsCells = page.locator('a[title*="Tippmixpro"] .odds__odd, .oddsTab__table .odds__odd, .ui-table__row .ui-table__cell');
    const oddsCount = await oddsCells.count();
    console.log(`Found ${oddsCount} odds cells.`);
    for (let i = 0; i < Math.min(oddsCount, 15); i++) {
      console.log(`Odd ${i}: ${await oddsCells.nth(i).innerText()}`);
    }
    
    // Also try to find by Tippmixpro title
    const tmPro = page.locator('a[title*="Tippmixpro"]');
    if (await tmPro.count() > 0) {
      console.log(`Found Tippmixpro row. Inner text:`);
      console.log(await tmPro.first().locator('..').locator('..').innerText());
    } else {
      console.log('Tippmixpro row not found directly, dumping odds container text:');
      const oddsContainer = page.locator('#detail-odds, .detail-odds, [data-testid="wcl-odds"]');
      if (await oddsContainer.count() > 0) {
        console.log(await oddsContainer.first().innerText());
      }
    }
  } catch (e) {
    console.log('Hiba az oddsok keresésekor:', e);
  }

  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
