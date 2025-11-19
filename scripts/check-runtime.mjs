import { chromium } from 'playwright';

const urlFromArgs = process.argv[2];
const url = urlFromArgs ?? process.env.RUNTIME_URL ?? 'http://127.0.0.1:5173';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log(`[console:${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    console.error('[pageerror]', err);
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await browser.close();
}

run().catch((error) => {
  console.error('[runtime-check]', error);
  process.exit(1);
});
