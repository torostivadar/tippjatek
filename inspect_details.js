import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://inside.fifa.com/fifa-world-ranking/men', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  console.log(`Analyzing first 15 teams...`);
  
  for (let i = 0; i < Math.min(count, 15); i++) {
    const row = rows.nth(i);
    
    // 1. Rank & Trend
    const cell0 = row.locator('td').nth(0);
    const rankNum = await cell0.locator('h3').innerText().catch(() => '');
    
    const trendElem = cell0.locator('.trend-position-cell');
    let trendType = 'neutral';
    let trendVal = '0';
    if (await trendElem.count() > 0) {
      const classes = await trendElem.getAttribute('class') || '';
      if (classes.includes('positive')) trendType = 'positive';
      else if (classes.includes('negative')) trendType = 'negative';
      
      trendVal = await trendElem.locator('.trend-position-cell-text').innerText().catch(() => '0');
    }
    
    // 2. Team
    const cell1 = row.locator('td').nth(1);
    const team = await cell1.innerText();
    
    // 3. Latest Results
    const cell2 = row.locator('td').nth(2);
    const resultDots = cell2.locator('.condition-dot');
    const dotsCount = await resultDots.count();
    const results = [];
    for (let j = 0; j < dotsCount; j++) {
      const dot = resultDots.nth(j);
      const label = await dot.getAttribute('aria-label') || '';
      if (label.toLowerCase().includes('win')) {
        results.push('W');
      } else if (label.toLowerCase().includes('draw')) {
        results.push('D');
      } else if (label.toLowerCase().includes('loss')) {
        results.push('L');
      } else {
        results.push('?');
      }
    }
    
    // 4. Points
    const cell5 = row.locator('td').nth(5);
    const points = await cell5.innerText();
    
    console.log(`Rank: ${rankNum} | Trend: ${trendType} (${trendVal}) | Team: ${team} | Results: ${results.join(', ')} | Points: ${points}`);
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
});
