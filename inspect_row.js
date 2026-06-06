import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://inside.fifa.com/fifa-world-ranking/men', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  const firstRow = page.locator('table tbody tr').first();
  const cells = firstRow.locator('td');
  const cellsCount = await cells.count();
  console.log(`First row has ${cellsCount} cells.`);
  
  for (let i = 0; i < cellsCount; i++) {
    const cell = cells.nth(i);
    const text = await cell.innerText();
    const html = await cell.innerHTML();
    console.log(`\n=== CELL ${i} ===`);
    console.log(`Text: ${JSON.stringify(text)}`);
    console.log(`HTML: ${html.substring(0, 500)}...`);
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
