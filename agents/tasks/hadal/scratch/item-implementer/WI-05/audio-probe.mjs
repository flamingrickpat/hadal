// Scratch probe for WI-05 (item-implementer): verifies the procedural
// WebAudio system in a real (headless) Chromium. Reuses the boot.test.mjs
// harness pattern (spawn `npm run dev`, launch Chromium, fresh context).
//
// Run: node agents/tasks/hadal/scratch/item-implementer/WI-05/audio-probe.mjs
// Env: HADAL_BROWSER (chrome.exe path), HADAL_BROWSER_PORT (dev port).
//
// Question answered: does audio stay silent until the first input, unlock and
// run after input, change the soundscape with depth, and respond to the volume
// slider? (request §27/§43/§58/§14.3). Verified via the debug
// `window.__HADAL_AUDIO__` snapshot handle, since headless output is silent.
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54322);

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base);
  const dirs = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')));
  const versioned = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  if (versioned.length === 0) throw new Error('no chromium under ' + base);
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
    await new Promise((res) => setTimeout(res, 400));
  }
  throw new Error('dev server not ready within 60s');
}

function stopServer(child) {
  spawnSync('taskkill', ['/t', '/f', '/pid', String(child.pid)], { stdio: 'ignore', windowsHide: true });
  child.kill('SIGKILL');
}

const snap = (page) => page.evaluate(() => window.__HADAL_AUDIO__ && window.__HADAL_AUDIO__.snapshot());

(async () => {
  const browserExe = resolveBrowser();
  const { child, getLog } = startServer();
  let browser;
  let failures = 0;
  const report = (ok, name, detail) => {
    console.log((ok ? 'PASS' : 'FAIL') + ': ' + name + (detail ? '  [' + detail + ']' : ''));
    if (!ok) failures += 1;
  };
  try {
    await waitReady();
    browser = await chromium.launch({
      executablePath: browserExe,
      args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'],
    });
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(1500);

    // 1. Silent until the first input: the AudioContext is not created yet.
    const before = await snap(page);
    report(!!before && before.unlocked === false, 'audio is locked before any input (no AudioContext)', 'unlocked=' + (before && before.unlocked) + ' state=' + (before && before.contextState));

    // 2. A real user gesture unlocks + runs the context. A mouse click (not a
    // key) is used so the ?debug=1 panel — which toggles on any keydown — stays
    // open for the teleports below.
    await page.mouse.click(30, 30);
    await page.waitForTimeout(800);
    const after = await snap(page);
    report(!!after && after.unlocked === true, 'audio unlocks after the first input', 'unlocked=' + (after && after.unlocked) + ' state=' + (after && after.contextState));
    report(!!after && after.contextState === 'running', 'the AudioContext is running after input', 'state=' + (after && after.contextState));

    // 3. The volume slider is present.
    const hasSlider = await page.$('.audio-volume-slider');
    report(!!hasSlider, 'the master volume slider is present in the DOM', '');

    // 4. Descending changes the soundscape (highs fall, low rumble rises).
    const toDepth = async (depth) => {
      await page.fill('.debug-teleport-x', '1300');
      await page.fill('.debug-teleport-depth', String(depth));
      await page.click('.debug-teleport');
      await page.waitForTimeout(900);
      return snap(page);
    };
    const shallow = await toDepth(0);
    const deep = await toDepth(7000);
    report(
      !!shallow && !!deep && deep.highCutoff < shallow.highCutoff,
      'high frequencies drop with depth',
      'highCutoff ' + (shallow && shallow.highCutoff) + ' -> ' + (deep && deep.highCutoff),
    );
    report(
      !!shallow && !!deep && deep.lowRumble > shallow.lowRumble,
      'low pressure rumble rises with depth',
      'lowRumble ' + (shallow && shallow.lowRumble) + ' -> ' + (deep && deep.lowRumble),
    );
    report(
      !!shallow && !!deep && deep.reverb > shallow.reverb && deep.drone < shallow.drone,
      'reverb/delay grows and the music bed recedes with depth',
      'reverb ' + (shallow && shallow.reverb) + ' -> ' + (deep && deep.reverb) + '  drone ' + (shallow && shallow.drone) + ' -> ' + (deep && deep.drone),
    );

    // 5. The volume slider changes the master gain.
    const volBefore = await snap(page);
    const setVol = async (v) => {
      await page.$eval('.audio-volume-slider', (el, vol) => {
        el.value = String(vol);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, v);
      await page.waitForTimeout(300);
      return snap(page);
    };
    const volAfter = await setVol(0.3);
    report(
      !!volBefore && !!volAfter && volAfter.masterVolume < volBefore.masterVolume,
      'moving the volume slider lowers the master gain',
      'masterVolume ' + (volBefore && volBefore.masterVolume) + ' -> ' + (volAfter && volAfter.masterVolume),
    );

    report(pageErrors.length === 0, 'no page exceptions during the probe', pageErrors.join(' | ') || 'clean');
  } catch (err) {
    failures += 1;
    console.log('HARNESS ERROR: ' + (err && err.stack ? err.stack : String(err)));
    console.log('\n--- dev server log (tail) ---\n' + getLog().slice(-2000));
  } finally {
    if (browser) await browser.close();
    stopServer(child);
  }
  console.log('');
  console.log(failures === 0 ? 'AUDIO PROBE PASS' : 'AUDIO PROBE FAIL (' + failures + ' failing)');
  process.exitCode = failures === 0 ? 0 : 1;
})();
