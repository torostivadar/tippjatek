import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://inside.fifa.com/fifa-world-ranking/men', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  console.log(`Initial rows: ${await page.locator('table tbody tr').count()}`);
  
  // Click the "Show full rankings" button if it exists
  const showFullBtn = page.locator('button:has-text("Show full rankings")');
  if (await showFullBtn.count() > 0) {
    console.log('Clicking "Show full rankings"...');
    await showFullBtn.click();
    await page.waitForTimeout(3000);
    console.log(`Rows after clicking full rankings: ${await page.locator('table tbody tr').count()}`);
  }
  
  // Let's see if there is a "Show more" button or pagination
  let showMoreBtn = page.locator('button:has-text("Show more")');
  while (await showMoreBtn.count() > 0 && await showMoreBtn.first().isVisible()) {
    console.log('Clicking "Show more"...');
    await showMoreBtn.first().click();
    await page.waitForTimeout(2000);
    console.log(`Rows count: ${await page.locator('table tbody tr').count()}`);
    showMoreBtn = page.locator('button:has-text("Show more")');
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
