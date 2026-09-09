const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Shamal Sathsara\\.gemini\\antigravity-ide\\brain\\271fabb1-3a06-4293-a96f-3215f524184a';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function verifyUi() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  async function typeAndSelect(inputSelector, query, matchText) {
    const input = await page.waitForSelector(inputSelector);
    await input.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await input.type(query, { delay: 30 });
    await sleep(800);

    await page.waitForSelector('li', { timeout: 5000 });
    const clicked = await page.evaluate((text) => {
      const lis = Array.from(document.querySelectorAll('li'));
      const target = lis.find(li => li.textContent.toLowerCase().includes(text.toLowerCase())) || lis[0];
      if (target) {
        target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return target.textContent.trim();
      }
      return null;
    }, matchText);
    console.log(`Selected item: "${clicked}" for query "${query}"`);
    await sleep(600);
  }

  try {
    console.log('Navigating to http://localhost:5173/bottleneck-calculator...');
    await page.goto('http://localhost:5173/bottleneck-calculator', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);

    // TEST 1: i5-8400 + GTX 1660 SUPER + GTA V
    console.log('\n--- TEST 1: i5-8400 + GTX 1660 SUPER + GTA V ---');
    await typeAndSelect('.form-group:nth-of-type(1) input', 'Intel Core i5-8400', '8400');
    await typeAndSelect('.form-group:nth-of-type(2) input', 'GTX 1660 SUPER', '1660 SUPER');
    await typeAndSelect('.form-group:nth-of-type(3) input', 'Grand Theft Auto V', 'Grand Theft Auto');

    // Preset High
    await page.select('#settings-select', 'High');
    // 1080p
    await page.select('#resolution-select', '1920x1080');
    await sleep(300);

    console.log('Clicking Run Analysis button (#run-analysis-btn)...');
    await page.click('#run-analysis-btn');

    // Wait for analysis result to appear
    await sleep(3500);

    const screenshot1 = path.join(ARTIFACT_DIR, 'live_test1_i5_8400_gta_v.png');
    await page.screenshot({ path: screenshot1, fullPage: false });
    console.log(`Saved screenshot 1 to: ${screenshot1}`);

    const res1 = await page.evaluate(() => {
      const text = document.body.innerText;
      const fpsMatch = text.match(/(\d+)\s*FPS/i);
      const hasNotice = text.includes('Game-specific FPS prediction is not available for this hardware yet');
      const isGameAware = text.includes('Game-Aware Performance');
      return { fps: fpsMatch ? fpsMatch[1] : null, hasNotice, isGameAware };
    });
    console.log('TEST 1 Live UI Evaluation:', res1);

    // TEST 2: General PC Analysis (Clear Game)
    console.log('\n--- TEST 2: General PC Analysis (No Game) ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cb = buttons.find(b => b.textContent.includes('Clear Game'));
      if (cb) cb.click();
    });
    await sleep(400);

    console.log('Clicking Run Analysis (#run-analysis-btn)...');
    await page.click('#run-analysis-btn');
    await sleep(2500);

    const screenshot2 = path.join(ARTIFACT_DIR, 'live_test2_general_no_game.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log(`Saved screenshot 2 to: ${screenshot2}`);

    const res2 = await page.evaluate(() => {
      const text = document.body.innerText;
      const isGeneral = text.includes('General PC Bottleneck Analysis');
      const hasFps = /\b\d+\s*FPS\b/i.test(text) && !text.includes('Select a game to predict in-game FPS');
      return { isGeneral, hasFps };
    });
    console.log('TEST 2 Live UI Evaluation:', res2);

    // TEST 3: i3-330M Unready Fallback
    console.log('\n--- TEST 3: i3-330M Unready Fallback ---');
    await typeAndSelect('.form-group:nth-of-type(1) input', 'Intel Core i3-330M', '330M');
    await typeAndSelect('.form-group:nth-of-type(3) input', 'Grand Theft Auto V', 'Grand Theft Auto');
    await sleep(300);

    console.log('Clicking Run Analysis (#run-analysis-btn)...');
    await page.click('#run-analysis-btn');
    await sleep(3000);

    const screenshot3 = path.join(ARTIFACT_DIR, 'live_test3_i3_330m_fallback.png');
    await page.screenshot({ path: screenshot3, fullPage: false });
    console.log(`Saved screenshot 3 to: ${screenshot3}`);

    const res3 = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasNotice = text.includes('Game-specific FPS prediction is not available for this hardware yet');
      const isGeneral = text.includes('General PC Bottleneck Analysis');
      return { hasNotice, isGeneral };
    });
    console.log('TEST 3 Live UI Evaluation:', res3);

    console.log('\n--- BROWSER VERIFICATION SUMMARY ---');
    console.log('Test 1 (i5-8400 + GTX 1660 SUPER + GTA V): FPS = ' + res1.fps + ' FPS, Game-Aware = ' + res1.isGameAware);
    console.log('Test 2 (No Game): General PC Analysis = ' + res2.isGeneral + ', Has FPS = ' + res2.hasFps);
    console.log('Test 3 (i3-330M): Fallback Notice = ' + res3.hasNotice + ', General Mode Fallback = ' + res3.isGeneral);
  } finally {
    await browser.close();
  }
}

verifyUi().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
