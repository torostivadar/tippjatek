import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to FIFA ranking page...');
  await page.goto('https://inside.fifa.com/fifa-world-ranking/men', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  
  // Click the "Show full rankings" button to load all 211 teams
  const showFullBtn = page.locator('button:has-text("Show full rankings")');
  if (await showFullBtn.count() > 0) {
    console.log('Clicking "Show full rankings" to load all teams...');
    await showFullBtn.click();
    await page.waitForTimeout(3000); // Wait for the list to render
  } else {
    console.log('Warning: "Show full rankings" button not found, scraping default loaded rows.');
  }
  
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  console.log(`Found ${count} teams to scrape.`);
  
  const rankingData = [];
  
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    
    // 1. Rank & Trend
    const cell0 = row.locator('td').nth(0);
    const rankNum = await cell0.locator('h3').innerText().catch(() => '');
    
    const trendElem = cell0.locator('.trend-position-cell');
    let trendSymbol = '—';
    if (await trendElem.count() > 0) {
      const classes = await trendElem.getAttribute('class') || '';
      const trendVal = await trendElem.locator('.trend-position-cell-text').innerText().catch(() => '0');
      if (classes.includes('positive')) {
        trendSymbol = `▲ ${trendVal}`;
      } else if (classes.includes('negative')) {
        trendSymbol = `▼ ${trendVal}`;
      }
    }
    
    // 2. Team
    const cell1 = row.locator('td').nth(1);
    const teamName = await cell1.innerText();
    
    // 3. Latest Results (W, D, L formatted as ✔, -, X)
    const cell2 = row.locator('td').nth(2);
    const resultDots = cell2.locator('.condition-dot');
    const dotsCount = await resultDots.count();
    const results = [];
    for (let j = 0; j < dotsCount; j++) {
      const dot = resultDots.nth(j);
      const label = await dot.getAttribute('aria-label') || '';
      if (label.toLowerCase().includes('win')) {
        results.push('✔');
      } else if (label.toLowerCase().includes('draw')) {
        results.push('-');
      } else if (label.toLowerCase().includes('loss')) {
        results.push('X');
      }
    }
    const resultsStr = results.join(' ');
    
    // 4. Points
    const cell5 = row.locator('td').nth(5);
    const points = await cell5.innerText();
    
    rankingData.push({
      rank: rankNum,
      trend: trendSymbol,
      team: teamName,
      results: resultsStr,
      points: points
    });
  }
  
  await browser.close();
  console.log('Browser closed.');
  
  // Format the Markdown content
  const today = new Date().toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  let mdContent = `# FIFA Férfi Világranglista\n\n`;
  mdContent += `*Frissítve: ${today}*\n\n`;
  mdContent += `| Helyezés | Csapat | Utóbbi Eredmények | Pontszám |\n`;
  mdContent += `| :--- | :--- | :--- | :--- |\n`;
  
  for (const team of rankingData) {
    const rankWithTrend = `${team.rank}. (${team.trend})`;
    mdContent += `| ${rankWithTrend} | ${team.team} | ${team.results || '—'} | ${team.points} |\n`;
  }
  
  // Save the file to assets folder
  const targetDir = '/Users/claudius/Projects/tippjatek/assets';
  const targetFile = path.join(targetDir, 'fifa_rankings_men.md');
  
  console.log(`Writing markdown to: ${targetFile}`);
  fs.writeFileSync(targetFile, mdContent, 'utf8');
  console.log('Done!');
}

run().catch(err => {
  console.error('Fatal error:', err);
});
