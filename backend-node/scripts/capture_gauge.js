const puppeteer = require('puppeteer-core');
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function captureGauge() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 1100 },
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/bottleneck-calculator', { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Type CPU: i5-8400
  const cpuInp = await page.waitForSelector('#cpu-search-input');
  await cpuInp.click();
  await cpuInp.type('Intel Core i5-8400', { delay: 25 });
  await sleep(800);
  await page.evaluate(() => {
    const lis = Array.from(document.querySelectorAll('li'));
    const t = lis.find(li => li.textContent.includes('i5-8400'));
    if (t) t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  await sleep(400);

  // Type GPU: GTX 1660 SUPER
  const gpuInp = await page.waitForSelector('#gpu-search-input');
  await gpuInp.click();
  await gpuInp.type('GTX 1660 SUPER', { delay: 25 });
  await sleep(800);
  await page.evaluate(() => {
    const lis = Array.from(document.querySelectorAll('li'));
    const t = lis.find(li => li.textContent.includes('1660 SUPER'));
    if (t) t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  await sleep(400);

  // Type Game: Fortnite (which gives ~135 FPS, exactly 3 digits!)
  const gameInp = await page.waitForSelector('input[placeholder*="All PC Games"]');
  await gameInp.click();
  await gameInp.type('Fortnite', { delay: 25 });
  await sleep(800);
  await page.evaluate(() => {
    const lis = Array.from(document.querySelectorAll('li'));
    const t = lis.find(li => li.textContent.toLowerCase().includes('fortnite'));
    if (t) t.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  await sleep(400);

  await page.click('#run-analysis-btn');
  await sleep(3500);

  const gaugeEl = await page.waitForSelector('.fps-gauge-container');
  const screenshotPath = 'C:\\Users\\Shamal Sathsara\\.gemini\\antigravity-ide\\brain\\271fabb1-3a06-4293-a96f-3215f524184a\\gauge_fixed_preview.png';
  await gaugeEl.screenshot({ path: screenshotPath });
  console.log('Saved gauge screenshot to:', screenshotPath);

  const text = await page.evaluate(() => document.querySelector('.fps-gauge-container').innerText);
  console.log('Gauge text:', text.replace(/\n/g, ' '));

  await browser.close();
}
captureGauge().catch(console.error);
