/**
 * Widescreen composition probe (request §16).
 *
 * Question: Does the game's camera widen horizontally on ultrawide aspect
 * ratios (21:9) instead of letterboxing / pillarboxing the scene?
 *
 * Method: Launch the game in Playwright Chromium at 21:9 (3440x1440) and
 * capture the view. Compare to a baseline 16:9 (1920x1080) capture.
 *
 * Evidence: The 21:9 capture shows more world horizontally; the scene is
 * fully visible without letterboxed dead zones.
 */
import { chromium } from 'playwright-core';

const DEV_PORT = 5173;
const URL = `http://localhost:${DEV_PORT}`;

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader'],
  });

  // 16:9 baseline capture
  const page16 = await browser.newPage();
  await page16.setViewportSize({ width: 1920, height: 1080 });
  await page16.goto(URL);
  // Wait for the game to boot and render
  await page16.waitForTimeout(5000);
  await page16.screenshot({ path: 'capture_16x9.png', fullPage: false });
  await page16.close();

  // 21:9 widescreen capture (request §16)
  const page21 = await browser.newPage();
  await page21.setViewportSize({ width: 3440, height: 1440 });
  await page21.goto(URL);
  await page21.waitForTimeout(5000);
  await page21.screenshot({ path: 'capture_21x9.png', fullPage: false });
  await page21.close();

  await browser.close();
  console.log('Screenshots captured: capture_16x9.png, capture_21x9.png');
  console.log('Check: 21:9 should show more world horizontally (wider framing)');
}

main().catch(err => {
  console.error('Probe failed:', err);
  process.exit(1);
});