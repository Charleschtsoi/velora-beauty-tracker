/**
 * Headless Playwright walkthrough for Add Product review polish (web).
 * Saves screenshots under /opt/cursor/artifacts/.
 */
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = '/opt/cursor/artifacts';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 420, height: 900 },
  recordVideo: { dir: OUT, size: { width: 420, height: 900 } },
});
const page = await context.newPage();

page.on('dialog', async (dialog) => {
  console.log('ALERT:', dialog.message());
  fs.writeFileSync(path.join(OUT, 'validation-alert.txt'), dialog.message());
  await dialog.accept();
});

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: true });
  console.log('SHOT', file);
}

try {
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2500);

  // Welcome carousel → Get started
  for (let i = 0; i < 5; i++) {
    const getStarted = page.getByText('Get started', { exact: true });
    const next = page.getByText('Next', { exact: true });
    if (await getStarted.isVisible().catch(() => false)) {
      await getStarted.click();
      break;
    }
    if (await next.isVisible().catch(() => false)) {
      await next.click();
      await page.waitForTimeout(400);
      continue;
    }
    break;
  }

  await page.waitForTimeout(1500);
  await shot('01-home.png');

  // Open Scan
  const scanCta = page.getByTestId('first-run-scan').or(page.getByText('Scan product'));
  if (await scanCta.first().isVisible().catch(() => false)) {
    await scanCta.first().click();
  } else {
    // Fallback: look for scan hero / text
    const alt = page.getByText(/Scan/i).first();
    await alt.click();
  }
  await page.waitForTimeout(1500);
  await shot('02-scan-idle.png');

  const fixture = page.getByTestId('dev-fixture-review-link').or(
    page.getByText(/Dev: open review form with fixture AI fields/i),
  );
  await fixture.first().click();
  await page.waitForTimeout(1500);

  // Expect review summary
  await page.getByTestId('review-summary').waitFor({ timeout: 10000 });
  await shot('03-add-product-review-summary.png');

  // Save without expiration → validation alert
  await page.getByTestId('save-button').click();
  await page.waitForTimeout(1000);
  await shot('04-after-validation-attempt.png');

  // Fill expiration via web date input inside expiration-date-picker
  const expiry = page.getByTestId('expiration-date-picker').locator('input[type="date"]');
  await expiry.fill('2027-09-15');
  await page.waitForTimeout(400);
  await shot('05-expiry-filled.png');

  await page.getByTestId('save-button').click();
  await page.waitForTimeout(2500);
  await shot('06-after-save.png');

  const bodyText = await page.locator('body').innerText();
  fs.writeFileSync(path.join(OUT, 'final-page-text.txt'), bodyText.slice(0, 4000));
  console.log('DONE');
} catch (err) {
  console.error('DEMO_FAILED', err);
  await shot('error-state.png');
  process.exitCode = 1;
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    const vpath = await video.path();
    const dest = path.join(OUT, 'add-product-review-demo.webm');
    fs.renameSync(vpath, dest);
    console.log('VIDEO', dest);
  }
}
