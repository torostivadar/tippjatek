import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  console.log('Navigating to Eredmenyek VB matches page...');
  await page.goto('https://www.eredmenyek.com/foci/vilag/vb/meccsek/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  const matchElements = page.locator('div.event__match');
  const count = await matchElements.count();
  console.log(`Found ${count} match elements.`);
  
  const ids = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    const idAttr = await matchElements.nth(i).getAttribute('id');
    // ID looks like 'g_1_h4EoUB7T'
    if (idAttr && idAttr.startsWith('g_1_')) {
      ids.push(idAttr.substring(4));
    }
  }
  
  console.log('Sample Match IDs:', ids);
  
  await browser.close();
}

run().catch(err => console.error(err));
