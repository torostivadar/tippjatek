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
  
  const extractInfo = async (label) => {
    try {
      // Find the element containing the exact text (case insensitive or exact depending on how it's rendered)
      // Usually these are in a container like .mi__item or similar under .matchInfo
      const labelLocator = page.locator(`text="${label}"`).first();
      const parentHtml = await labelLocator.locator('..').innerHTML();
      console.log(`--- HTML around "${label}" ---`);
      console.log(parentHtml);
    } catch (e) {
      console.log(`Could not find structure for "${label}"`);
    }
  };

  await extractInfo('TV ADÓ');
  await extractInfo('HELYSZÍN:');
  await extractInfo('BEFOGADÓKÉPESSÉG:');
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
