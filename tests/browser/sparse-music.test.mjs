// Shared browser harness for the sparse music feature (request §58):
// boots the real `npm run dev` page in headless Chromium and verifies
// that the music moment definitions are correctly wired and that
// the AudioSystem is instantiated. It cannot verify actual audio
// playback (browser autoplay rules require user interaction) but
// it verifies the data seam and the AudioSystem wiring.
//
// Runs: `npm run test:browser -- tests/browser/sparse-music.test.mjs`
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54322);

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base + ' — set HADAL_BROWSER to a chrome.exe');
  const dirs = readdirSync(base).filter(
    (d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')),
  );
  const versioned = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  if (versioned.length === 0) throw new Error('no chromium-*/chrome-win64/chrome.exe under ' + base);
  return path.join(base, versioned[versioned.length - 1].d, 'chrome-win64', 'chrome.exe');
}

function startServer() {
  const child = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(PORT), '--strictPort'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  return { child, getLog: () => log };
}

async function waitReady() {
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('dev server did not become ready within 60s');
}

function stopServer(child) {
  spawnSync('taskkill', ['/t', '/f', '/pid', String(child.pid)], { stdio: 'ignore', windowsHide: true });
  child.kill('SIGKILL');
}

async function freshPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2500);
  return { ctx, page, pageErrors };
}

async function assertBooted(page, pageErrors) {
  try {
    await page.waitForSelector('canvas', { timeout: 15000 });
  } catch {
    assert.equal(pageErrors.length, 0, 'the game did not boot; page exceptions: ' + (pageErrors.join(' | ') || '(none logged)'));
  }
  assert.ok(await page.$('canvas'), 'the renderer canvas is present (the game booted)');
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('MUSIC_MOMENTS data is exposed on the window in debug mode', async ({ page, pageErrors }) => {
  await assertBooted(page, pageErrors);
  const moments = await page.evaluate(() => {
    return window.MUSIC_MOMENTS;
  });
  assert.ok(Array.isArray(moments), 'MUSIC_MOMENTS is exposed as an array');
  assert.ok(moments.length > 0, 'MUSIC_MOMENTS is non-empty');
  // Verify the story cues are present
  const cueIds = moments.map((m) => m.cueId);
  assert.ok(cueIds.includes('beat-s1-lights'), 'beat-s1-lights cue is present');
  assert.ok(cueIds.includes('beat-s2-creak'), 'beat-s2-creak cue is present');
  assert.ok(cueIds.includes('beat-s3-pulse'), 'beat-s3-pulse cue is present');
  assert.ok(cueIds.includes('beat-s4-heartbeat'), 'beat-s4-heartbeat cue is present');
  assert.ok(cueIds.includes('beat-s5-plates'), 'beat-s5-plates cue is present');
  assert.ok(cueIds.includes('ending-triggered'), 'ending-triggered cue is present');
});

test('AudioSystem is instantiated and the master volume slider is present', async ({ page, pageErrors }) => {
  await assertBooted(page, pageErrors);
  const hasAudio = await page.evaluate(() => {
    return window.__HADAL_AUDIO__ !== undefined;
  });
  assert.ok(hasAudio, 'AudioSystem is instantiated and exposed on window.__HADAL_AUDIO__');
  const hasSlider = await page.$('#audio-volume');
  assert.ok(hasSlider, 'the master volume slider is present');
});

test('audio unlocks on user interaction', async ({ page, pageErrors }) => {
  await assertBooted(page, pageErrors);
  // Trigger a pointer down to unlock audio
  await page.mouse.click(500, 500);
  await page.waitForTimeout(500);
  const unlocked = await page.evaluate(() => {
    return window.__HADAL_AUDIO__.snapshot().unlocked;
  });
  assert.ok(unlocked, 'audio context is unlocked after user interaction');
});

test('depth band transition plays the depth motif (no error)', async ({ page, pageErrors }) => {
  await assertBooted(page, pageErrors);
  // Unlock audio
  await page.mouse.click(500, 500);
  await page.waitForTimeout(500);
  // Teleport to band 1 (depth >= 1600)
  await page.fill('.debug-teleport-x', '1300');
  await page.fill('.debug-teleport-depth', '2000');
  await page.click('.debug-teleport');
  await page.waitForTimeout(1000);
  // Check that no error was thrown
  const snapshot = await page.evaluate(() => {
    return window.__HADAL_AUDIO__.snapshot();
  });
  assert.ok(snapshot.unlocked, 'audio is still unlocked after teleport');
  assert.equal(snapshot.contextState, 'running', 'audio context is still running');
  assert.equal(pageErrors.length, 0, 'no page exceptions after depth transition: ' + pageErrors.join(' | '));
});

(async () => {
  const browserExe = resolveBrowser();
  const { child, getLog } = startServer();
  let browser;
  let failures = 0;
  try {
    await waitReady();
    browser = await chromium.launch({
      executablePath: browserExe,
      args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
    });
    for (const { name, fn } of tests) {
      const page = await freshPage(browser);
      try {
        await fn(page);
        console.log('PASS: ' + name);
      } catch (err) {
        failures += 1;
        console.log('FAIL: ' + name);
        console.log('      ' + (err && err.message ? err.message : String(err)));
      } finally {
        await page.ctx.close();
      }
    }
  } catch (err) {
    failures += 1;
    console.log('HARNESS ERROR: ' + (err && err.stack ? err.stack : String(err)));
    console.log('\n--- dev server log (tail) ---\n' + getLog().slice(-2000));
  } finally {
    if (browser) await browser.close();
    stopServer(child);
  }
  console.log('');
  console.log(failures === 0 ? 'SPARSE MUSIC SUITE PASS' : `SPARSE MUSIC SUITE FAIL (${failures} failing)`);
  process.exitCode = failures === 0 ? 0 : 1;
})();
