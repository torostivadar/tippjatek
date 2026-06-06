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
  
  // Let's find elements that contain "EGYMÁS ELLENI MECCSEK" or look like H2H
  console.log('Finding H2H container...');
  const h2hSections = page.locator('.h2h__section, .h2h, [class*="h2h"]');
  const h2hCount = await h2hSections.count();
  console.log(`Found ${h2hCount} H2H-related elements.`);
  
  for (let i = 0; i < h2hCount; i++) {
    const className = await h2hSections.nth(i).getAttribute('class');
    const text = await h2hSections.nth(i).innerText();
    console.log(`Element ${i}: Class="${className}" | Text preview: ${JSON.stringify(text.substring(0, 150))}`);
    
    // Dump some HTML of the first few
    if (i < 5) {
      const html = await h2hSections.nth(i).innerHTML();
      console.log(`HTML snippet: ${html.substring(0, 300)}...`);
    }
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
