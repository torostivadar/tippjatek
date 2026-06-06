import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://inside.fifa.com/fifa-world-ranking/men', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  console.log('Fetching first 3 rows HTML...');
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  console.log(`Found ${count} rows`);
  
  for (let i = 0; i < Math.min(count, 3); i++) {
    console.log(`--- ROW ${i + 1} ---`);
    const html = await rows.nth(i).innerHTML();
    console.log(html);
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
