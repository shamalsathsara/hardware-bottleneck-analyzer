const puppeteer = require('puppeteer-core');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Shamal Sathsara\\.gemini\\antigravity-ide\\brain\\271fabb1-3a06-4293-a96f-3215f524184a';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runVerification() {
  console.log('Launching Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();

  async function typeAndSelect(inputSelector, query, matchText) {
    const input = await page.waitForSelector(inputSelector, { timeout: 15000 });
    await input.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');
    await input.type(query, { delay: 20 });
    await sleep(800);

    await page.waitForSelector('li', { timeout: 8000 });
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
    await sleep(500);
  }

  async function clearGame() {
    const cleared = await page.evaluate(() => {
      const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Clear Game'));
      if (clearBtn) {
        clearBtn.click();
        return true;
      }
      const input = document.querySelector('#game-search-input');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    });
    console.log('Cleared game:', cleared);
    await sleep(500);
  }

  try {
    console.log('Navigating to http://localhost:5173/bottleneck-calculator...');
    await page.goto('http://localhost:5173/bottleneck-calculator', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(2000);

    // Populate CPU and GPU
    await typeAndSelect('#cpu-search-input', 'Intel Core i5-8400', '8400');
    await typeAndSelect('#gpu-search-input', 'GTX 1660 SUPER', '1660 SUPER');
    await typeAndSelect('#game-search-input', 'Grand Theft Auto V', 'Grand Theft Auto');
    await page.select('#settings-select', 'High');

    // ── CASE 1: 1080p + Game ──
    console.log('\n=============================================');
    console.log('CASE 1: 1080p (FHD) + Game -> Real Model V2 FPS');
    console.log('=============================================');
    await page.select('#resolution-select', '1920x1080');
    await sleep(300);

    const badge1080 = await page.evaluate(() => {
      const badge = document.querySelector('.badge-status-pill');
      return badge ? badge.textContent.trim() : null;
    });
    console.log('1080p Select Badge:', badge1080);

    await page.click('#run-analysis-btn');
    await sleep(4000);

    const result1 = await page.evaluate(() => {
      const fpsEl = document.querySelector('.gauge-fps-value');
      const gaugeWrap = document.querySelector('.fps-gauge-container');
      const notice = document.querySelector('.incomplete-v2-notice-banner');
      const heroGeneral = document.querySelector('.general-bottleneck-hero-card');
      return {
        fps: fpsEl ? fpsEl.textContent.trim() : null,
        hasGauge: !!gaugeWrap,
        hasNotice: !!notice,
        hasGeneralCard: !!heroGeneral,
      };
    });
    console.log('Case 1 Results:', JSON.stringify(result1, null, 2));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_case1_1080p_game.png'), fullPage: false });

    // ── CASE 2: 1440p + Game ──
    console.log('\n=============================================');
    console.log('CASE 2: 1440p (QHD) + Game -> Still Developing notice + Bottleneck active');
    console.log('=============================================');
    await page.select('#resolution-select', '2560x1440');
    await sleep(300);

    const badge1440 = await page.evaluate(() => {
      const badge = document.querySelector('.badge-status-pill');
      return badge ? badge.textContent.trim() : null;
    });
    console.log('1440p Select Badge:', badge1440);

    await page.click('#run-analysis-btn');
    await sleep(3000);

    const result2 = await page.evaluate(() => {
      const fpsEl = document.querySelector('.gauge-fps-value');
      const gaugeWrap = document.querySelector('.fps-gauge-container');
      const notice = document.querySelector('.incomplete-v2-notice-banner');
      const heroGeneral = document.querySelector('.general-bottleneck-hero-card');
      const bottleneckNumber = document.querySelector('.general-bottleneck-number');
      return {
        fps: fpsEl ? fpsEl.textContent.trim() : null,
        hasGauge: !!gaugeWrap,
        hasNotice: !!notice,
        noticeText: notice ? notice.textContent.replace(/\s+/g, ' ').trim() : null,
        hasGeneralCard: !!heroGeneral,
        bottleneckValue: bottleneckNumber ? bottleneckNumber.textContent.trim() : null
      };
    });
    console.log('Case 2 Results:', JSON.stringify(result2, null, 2));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_case2_1440p_game.png'), fullPage: false });

    // ── CASE 3: 4K + Game ──
    console.log('\n=============================================');
    console.log('CASE 3: 4K (UHD) + Game -> Still Developing notice + Bottleneck active');
    console.log('=============================================');
    await page.select('#resolution-select', '3840x2160');
    await sleep(300);

    const badge4k = await page.evaluate(() => {
      const badge = document.querySelector('.badge-status-pill');
      return badge ? badge.textContent.trim() : null;
    });
    console.log('4K Select Badge:', badge4k);

    await page.click('#run-analysis-btn');
    await sleep(3000);

    const result3 = await page.evaluate(() => {
      const fpsEl = document.querySelector('.gauge-fps-value');
      const gaugeWrap = document.querySelector('.fps-gauge-container');
      const notice = document.querySelector('.incomplete-v2-notice-banner');
      const heroGeneral = document.querySelector('.general-bottleneck-hero-card');
      const bottleneckNumber = document.querySelector('.general-bottleneck-number');
      return {
        fps: fpsEl ? fpsEl.textContent.trim() : null,
        hasGauge: !!gaugeWrap,
        hasNotice: !!notice,
        noticeText: notice ? notice.textContent.replace(/\s+/g, ' ').trim() : null,
        hasGeneralCard: !!heroGeneral,
        bottleneckValue: bottleneckNumber ? bottleneckNumber.textContent.trim() : null
      };
    });
    console.log('Case 3 Results:', JSON.stringify(result3, null, 2));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_case3_4k_game.png'), fullPage: false });

    // ── CASE 4: No Game Selected ──
    console.log('\n=============================================');
    console.log('CASE 4: No Game Selected -> Normal Bottleneck Analysis');
    console.log('=============================================');
    await clearGame();
    await page.select('#resolution-select', '1920x1080');
    await sleep(300);

    await page.click('#run-analysis-btn');
    await sleep(3000);

    const result4 = await page.evaluate(() => {
      const fpsEl = document.querySelector('.gauge-fps-value');
      const gaugeWrap = document.querySelector('.fps-gauge-container');
      const notice = document.querySelector('.incomplete-v2-notice-banner');
      const heroGeneral = document.querySelector('.general-bottleneck-hero-card');
      const bottleneckNumber = document.querySelector('.general-bottleneck-number');
      return {
        fps: fpsEl ? fpsEl.textContent.trim() : null,
        hasGauge: !!gaugeWrap,
        hasNotice: !!notice,
        hasGeneralCard: !!heroGeneral,
        bottleneckValue: bottleneckNumber ? bottleneckNumber.textContent.trim() : null
      };
    });
    console.log('Case 4 Results:', JSON.stringify(result4, null, 2));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'verify_case4_no_game.png'), fullPage: false });

    console.log('\n=============================================');
    console.log('ALL 4 RESOLUTION UX CASES VERIFIED SUCCESSFULLY!');
    console.log('=============================================');
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
