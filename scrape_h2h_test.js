import { chromium } from 'playwright';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set user-agent to look like a standard browser to avoid bot detection
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  console.log('Navigating to Eredmenyek VB matches page...');
  await page.goto('https://www.eredmenyek.com/foci/vilag/vb/meccsek/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  console.log('Current URL:', page.url());
  
  // Find match elements. Flashscore/Eredmenyek typically uses classes like event__match
  const matchLocators = [
    'div.event__match',
    '[id^="g_1_"]',
    '.eventRow',
    'a[href*="/merkozes/"]'
  ];
  
  let foundSelector = null;
  let matchCount = 0;
  
  for (const selector of matchLocators) {
    const count = await page.locator(selector).count();
    console.log(`Checking selector "${selector}": found ${count} elements`);
    if (count > 0 && !foundSelector) {
      foundSelector = selector;
      matchCount = count;
    }
  }
  
  if (!foundSelector) {
    console.log('No match elements found. Let us print some body text to see if it is blocked or empty...');
    const bodyText = await page.locator('body').innerText();
    console.log(bodyText.substring(0, 1000));
    await browser.close();
    return;
  }
  
  console.log(`Using selector "${foundSelector}" to click the first match...`);
  const firstMatch = page.locator(foundSelector).first();
  
  // Let's print details of the first match before clicking
  const matchText = await firstMatch.innerText();
  console.log('First match text preview:', JSON.stringify(matchText));
  
  console.log('Clicking the match...');
  await firstMatch.click();
  
  console.log('Waiting 5 seconds for match detail page to load...');
  await page.waitForTimeout(5000);
  
  console.log('Current URL after click:', page.url());
  
  // Check the text on the page to see if we can find H2H or scores
  const pageText = await page.locator('body').innerText();
  console.log('Page text preview (first 1500 chars):');
  console.log(pageText.substring(0, 1500));
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
