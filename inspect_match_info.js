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
  
  console.log('Finding match info items...');
  // Match info items usually have classes containing 'mi__item' or are inside a 'matchInfo' container
  const miItems = page.locator('.mi__item, [class*="matchInfo"], [class*="mi__"]');
  const count = await miItems.count();
  console.log(`Found ${count} match info related elements.`);
  
  for (let i = 0; i < count; i++) {
    const text = await miItems.nth(i).innerText();
    const html = await miItems.nth(i).innerHTML();
    console.log(`--- Element ${i} ---`);
    console.log(`Text: ${text.replace(/\n/g, ' ')}`);
    if (i < 5) console.log(`HTML: ${html.substring(0, 200)}...`);
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
