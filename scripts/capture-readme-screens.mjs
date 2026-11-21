/**
 * Capture the three README product screenshots (mobile viewport).
 * Requires Expo web at http://localhost:8081
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.resolve('docs/screenshots');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

page.on('dialog', async (d) => {
  await d.accept();
});

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file });
  console.log('SHOT', file);
}

async function dismissWelcome() {
  for (let i = 0; i < 6; i++) {
    const getStarted = page.getByText('Get started', { exact: true });
    const next = page.getByText('Next', { exact: true });
    if (await getStarted.isVisible().catch(() => false)) {
      await getStarted.click();
      break;
    }
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(350);
      continue;
    }
    break;
  }
  await page.waitForTimeout(1000);
}

try {
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1800);
  await dismissWelcome();

  const firstRunScan = page.getByTestId('first-run-scan');
  if (await firstRunScan.isVisible().catch(() => false)) {
    await shot('01-home.png');
    await firstRunScan.click();
  } else {
    const skip = page.getByTestId('first-run-skip');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await page.waitForTimeout(400);
    await shot('01-home.png');
    await page.getByTestId('hero-banner-press').click();
  }

  await page.waitForTimeout(1000);
  await page.getByTestId('dev-fixture-review-link').click();
  await page.waitForTimeout(1000);
  await page.getByTestId('review-summary').waitFor({ timeout: 10000 });
  await shot('02-add-review.png');

  await page.getByTestId('expiration-date-picker').locator('input[type="date"]').fill('2027-09-15');
  await page.getByTestId('save-button').click();
  await page.waitForTimeout(4500);
  await shot('03-product-detail.png');

  console.log('DONE');
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
