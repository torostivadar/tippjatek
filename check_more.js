import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://inside.fifa.com/fifa-world-ranking/men', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  console.log(`Initial rows found: ${count}`);
  
  // Check for buttons containing "Load More" or "More" or page buttons
  const buttons = page.locator('button');
  const buttonsCount = await buttons.count();
  console.log(`Total buttons found: ${buttonsCount}`);
  for (let i = 0; i < buttonsCount; i++) {
    const text = await buttons.nth(i).innerText();
    const html = await buttons.nth(i).innerHTML();
    if (text.trim() || html.includes('svg')) {
      console.log(`Button ${i}: Text="${text.trim()}"`);
    }
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
