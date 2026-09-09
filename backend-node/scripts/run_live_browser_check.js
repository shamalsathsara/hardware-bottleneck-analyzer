const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Shamal Sathsara\\.gemini\\antigravity-ide\\brain\\271fabb1-3a06-4293-a96f-3215f524184a';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:5173/bottleneck-calculator', { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Helper to select from dropdown
  async function selectOption(selector, text, matchSubstr) {
    console.log(`Typing "${text}" into ${selector}...`);
    const input = await page.waitForSelector(selector);
    await input.click();
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, selector);
    await sleep(200);
    await input.type(text, { delay: 35 });
    await sleep(1000);

    const matchFound = await page.evaluate((match) => {
      const lis = Array.from(document.querySelectorAll('li'));
      const target = lis.find(li => li.textContent.toLowerCase().includes(match.toLowerCase()));
      if (target) {
        target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        return target.textContent.trim();
      }
      return null;
    }, matchSubstr);

    console.log(`Result for ${selector}: ${matchFound ? 'Selected: ' + matchFound : 'NOT FOUND'}`);
    await sleep(400);
  }

  // TEST 1: i5-8400 + GTX 1660 SUPER + GTA V (High)
  console.log('\n--- LIVE TEST 1: i5-8400 + GTX 1660 SUPER + GTA V ---');
  await selectOption('#cpu-search-input', 'Intel Core i5-8400', 'i5-8400');
  await selectOption('#gpu-search-input', 'GTX 1660 SUPER', '1660 SUPER');
  await selectOption('input[placeholder*="All PC Games"]', 'Grand Theft Auto V', 'Grand Theft Auto');

  await page.select('#settings-select', 'High');
  await page.select('#resolution-select', '1920x1080');

  console.log('Clicking Run Analysis...');
  await page.click('#run-analysis-btn');
  await sleep(3500);

  const shot1 = path.join(ARTIFACT_DIR, 'live_ui_test1_i5_8400_gtav.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('Screenshot 1 saved to:', shot1);

  const t1 = await page.evaluate(() => {
    const text = document.body.innerText;
    const fpsMatch = text.match(/(\d+)\s*FPS/i);
    const hasNotice = text.includes('Game-specific FPS prediction is not available for this hardware yet');
    const isGameAware = text.includes('Game-Aware Performance');
    return { fps: fpsMatch ? fpsMatch[1] : null, hasNotice, isGameAware };
  });
  console.log('TEST 1 UI RESULT:', t1);

  // TEST 2: General PC Analysis (Clear Game)
  console.log('\n--- LIVE TEST 2: General PC Analysis (No Game) ---');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const clearBtn = buttons.find(b => b.textContent.includes('Clear Game'));
    if (clearBtn) clearBtn.click();
  });
  await sleep(400);
  await page.click('#run-analysis-btn');
  await sleep(2500);

  const shot2 = path.join(ARTIFACT_DIR, 'live_ui_test2_general_no_game.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('Screenshot 2 saved to:', shot2);

  const t2 = await page.evaluate(() => {
    const text = document.body.innerText;
    const isGeneral = text.includes('General PC Bottleneck Analysis');
    const hasFps = /\b\d+\s*FPS\b/i.test(text) && !text.includes('Select a game to predict in-game FPS');
    return { isGeneral, hasFps };
  });
  console.log('TEST 2 UI RESULT:', t2);

  // TEST 3: i3-330M Fallback
  console.log('\n--- LIVE TEST 3: i3-330M Unready Fallback ---');
  await selectOption('#cpu-search-input', 'Intel Core i3-330M', '330M');
  await selectOption('input[placeholder*="All PC Games"]', 'Grand Theft Auto V', 'Grand Theft Auto');
  await sleep(400);
  await page.click('#run-analysis-btn');
  await sleep(3000);

  const shot3 = path.join(ARTIFACT_DIR, 'live_ui_test3_i3_330m_fallback.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log('Screenshot 3 saved to:', shot3);

  const t3 = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasNotice = text.includes('Game-specific FPS prediction is not available for this hardware yet');
    const isGeneral = text.includes('General PC Bottleneck Analysis');
    return { hasNotice, isGeneral };
  });
  console.log('TEST 3 UI RESULT:', t3);

  await browser.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
