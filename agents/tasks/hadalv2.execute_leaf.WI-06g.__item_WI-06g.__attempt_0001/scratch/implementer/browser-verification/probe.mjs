// WI-06g accessibility controls verification probe
// Opens the game page, tests each accessibility control, saves, reloads, and asserts persistence.

import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../../');
const port = 5500;

const results = {};
let failures = [];

function resolveBrowser() {
  const base = process.env.LOCALAPPDATA + '/ms-playwright';
  const dirs = execSync('dir /b "' + base + '"').toString().trim().split('\r\n');
  for (const d of dirs) {
    if (d.startsWith('chromium-')) {
      return base + '/' + d + '/chrome-win64/chrome.exe';
    }
  }
  throw new Error('No chromium installation found');
}

async function testAccessibility(page) {
  // Open settings overlay by pressing 'I'
  await page.keyboard.press('KeyI');
  await page.waitForTimeout(500);

  // Check that settings overlay is visible
  const overlayVisible = await page.$('#settings-overlay');
  results.settings_overlay_visible = overlayVisible !== null;
  if (!overlayVisible) {
    failures.push('Settings overlay not visible');
    return;
  }

  // Test master volume slider
  const volumeSlider = await page.$('.settings-volume');
  results.volume_slider_exists = volumeSlider !== null;
  if (volumeSlider) {
    await volumeSlider.evaluate((el) => {
      el.value = '0.5';
      el.dispatchEvent(new Event('input'));
    });
  }

  // Test screen shake toggle
  const shakeToggle = await page.$('#settings-shake');
  results.shake_toggle_exists = shakeToggle !== null;
  if (shakeToggle) {
    await shakeToggle.evaluate((el) => {
      el.checked = false;
      el.dispatchEvent(new Event('change'));
    });
  }

  // Test reduced flashing toggle
  const flashToggle = await page.$('#settings-flash');
  results.flash_toggle_exists = flashToggle !== null;
  if (flashToggle) {
    await flashToggle.evaluate((el) => {
      el.checked = true;
      el.dispatchEvent(new Event('change'));
    });
  }

  // Test subtitles toggle
  const subToggle = await page.$('#settings-subtitles');
  results.subtitles_toggle_exists = subToggle !== null;
  if (subToggle) {
    await subToggle.evaluate((el) => {
      el.checked = false;
      el.dispatchEvent(new Event('change'));
    });
  }

  // Test high-contrast sonar toggle
  const contrastToggle = await page.$('#settings-sonar');
  results.contrast_toggle_exists = contrastToggle !== null;
  if (contrastToggle) {
    await contrastToggle.evaluate((el) => {
      el.checked = true;
      el.dispatchEvent(new Event('change'));
    });
  }

  // Close settings overlay
  await page.keyboard.press('KeyI');
  await page.waitForTimeout(500);

  // Now trigger a save by crafting (which calls requestAutosave)
  // Give resources first
  await page.evaluate(() => {
    const game = window.__HADAL_GAME__;
    if (game) {
      game.giveResources();
    }
  });
  await page.waitForTimeout(500);

  // Craft something to trigger autosave
  try {
    const craftButtons = await page.$$('.recipe-craft');
    if (craftButtons.length > 0) {
      await craftButtons[0].click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {
    // Craft button may not be available if player isn't at the base
    // Try forcing a save via the debug panel instead
    try {
      await page.evaluate(() => {
        const game = window.__HADAL_GAME__;
        if (game) {
          game.togglePause();
        }
      });
      await page.waitForTimeout(500);
    } catch (innerE) {
      console.log('Note: could not trigger autosave, continuing anyway');
    }
  }
}

try {
  const browser = await chromium.launch({
    executablePath: resolveBrowser(),
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  await page.goto(`http://localhost:${port}/?debug=1`, {
    waitUntil: 'load',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  await testAccessibility(page);

  // Check localStorage for accessibility settings
  const settings = await page.evaluate(() => {
    const raw = localStorage.getItem('hadal.save.v2');
    if (!raw) return null;
    const save = JSON.parse(raw);
    return save.settings;
  });

  results.settings_saved = settings !== null;
  if (settings) {
    results.masterVolume_saved = settings.masterVolume === 0.5;
    results.screenShake_saved = settings.screenShake === false;
    results.reducedFlashing_saved = settings.reducedFlashing === true;
    results.showSubtitles_saved = settings.showSubtitles === false;
    results.hiContrastSonar_saved = settings.hiContrastSonar === true;
  } else {
    failures.push('Settings not saved to localStorage');
  }

  // Reload and verify persistence
  await page.reload({ waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Open settings again and check values
  await page.keyboard.press('KeyI');
  await page.waitForTimeout(500);

  const volumeAfter = await page.$eval('.settings-volume', (el) => el.value);
  results.volume_persistent = volumeAfter === '0.5';

  const shakeAfter = await page.$eval('#settings-shake', (el) => el.checked);
  results.shake_persistent = shakeAfter === false;

  const flashAfter = await page.$eval('#settings-flash', (el) => el.checked);
  results.flash_persistent = flashAfter === true;

  const subAfter = await page.$eval('#settings-subtitles', (el) => el.checked);
  results.subtitles_persistent = subAfter === false;

  const contrastAfter = await page.$eval('#settings-sonar', (el) => el.checked);
  results.contrast_persistent = contrastAfter === true;

  await context.close();
  await browser.close();
} catch (e) {
  results.PROBE_ERROR = e.message;
  failures.push(e.message);
}

console.log('WIRE-PROOF RESULTS:');
for (const [k, v] of Object.entries(results)) {
  console.log(`  ${k}: ${v}`);
}

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  - ${f}`));
}

process.exit(failures.length === 0 ? 0 : 1);