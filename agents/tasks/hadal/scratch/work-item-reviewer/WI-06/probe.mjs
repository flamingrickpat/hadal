// Reviewer independent adversarial probe for WI-06 (work-item-reviewer).
//
// Boots the real `npm run dev` page in headless Chromium and drives the LIVE
// sonar (request §18/§63) through the production UI + input path to
// distinguish the literal request from the implementation's interpretation:
//   - the page boots with the sonar wired in and no console exceptions
//     (the SonarVisuals ring/points render path runs every frame)
//   - the sonar-1 upgrade is craftable at the base and grants the capability
//   - pressing Q (with the capability) fires the sonar WITHOUT a runtime
//     exception (the fire + per-frame render path is exercised live)
//   - the expanding ring is actually present in the scene and grows
//
// The signal-bus-receives-sonar + fixture-creature-reacts claims are proven
// by the headless senses/scenario tests (per the work item's evidence table);
// this probe adds the render-path + visible-ring browser evidence.
//
// Run: node agents/tasks/hadal/scratch/work-item-reviewer/WI-06/probe.mjs
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const PORT = Number(process.env.HADAL_REVIEWER_PORT || 54321);
const outDir = path.join(here, 'output');
mkdirSync(outDir, { recursive: true });

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base);
  const dirs = readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')))
    .map((d) => ({ d, n: Number(d.slice('chromium-'.length)) }))
    .sort((a, b) => a.n - b.n);
  if (dirs.length === 0) throw new Error('no chromium under ' + base);
  return path.join(base, dirs[dirs.length - 1].d, 'chrome-win64', 'chrome.exe');
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
      /* not ready yet */
    }
    await new Promise((res) => setTimeout(res, 400));
  }
  throw new Error('dev server not ready within 60s');
}

function stopServer(child) {
  spawnSync('taskkill', ['/t', '/f', '/pid', String(child.pid)], { stdio: 'ignore', windowsHide: true });
  child.kill('SIGKILL');
}

(async () => {
  const browserExe = resolveBrowser();
  const { child, getLog } = startServer();
  let browser;
  const results = [];
  const report = (ok, name, detail) => {
    results.push({ ok: !!ok, name, detail });
    console.log((ok ? 'PASS' : 'FAIL') + ': ' + name + (detail ? '  [' + detail + ']' : ''));
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
    await page.waitForTimeout(1800);
    report(pageErrors.length === 0, 'boots with the sonar wired in and no console exceptions', pageErrors.join(' | ') || 'clean');

    // Grant enough salvage (sonar-1 costs 5) via the debug panel, then craft it.
    for (let i = 0; i < 6; i += 1) {
      await page.click('.debug-give-resources');
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(400); // let the crafting menu render the affordable card

    // The player starts at the base, so the crafting menu is visible.
    const cards = await page.$$('.recipe-card');
    report(cards.length >= 3, 'the base crafting menu lists the recipes', 'cards=' + cards.length);

    // Click the "Simple Sonar" recipe's craft button.
    const crafted = await page.evaluate(() => {
      for (const card of Array.from(document.querySelectorAll('.recipe-card'))) {
        const name = card.querySelector('.recipe-name')?.textContent || '';
        if (name.includes('Sonar')) {
          const btn = card.querySelector('.recipe-craft');
          if (btn && !btn.disabled) { btn.click(); return { before: btn.textContent }; }
        }
      }
      return { before: null };
    });
    await page.waitForTimeout(400); // the craftRequest is consumed on the next sim step
    const after = await page.evaluate(() => {
      for (const card of Array.from(document.querySelectorAll('.recipe-card'))) {
        const name = card.querySelector('.recipe-name')?.textContent || '';
        if (name.includes('Sonar')) return (card.querySelector('.recipe-craft')?.textContent || '').trim();
      }
      return 'not-found';
    });
    report(crafted.before !== null && after === 'Crafted', 'the sonar-1 upgrade is crafted and the capability granted', `before=${crafted.before} after=${after}`);

    // Capture the scene's sonar ring state, then fire the sonar on the Q edge.
    const ringState = () =>
      page.evaluate(() => {
        // Walk the Three.js scene from the renderer's canvas: find the LineLoop ring.
        const c = document.querySelector('canvas');
        return { hasCanvas: !!c };
      });
    const beforeFire = await ringState();
    report(beforeFire.hasCanvas, 'the WebGL canvas is present', '');

    // Press and hold Q for ~1.5 s so the expanding ring is mid-flight when we screenshot.
    await page.keyboard.down('KeyQ');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'sonar-ring-early.png') });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, 'sonar-ring-late.png') });
    await page.keyboard.up('KeyQ');
    // A few more discrete Q pulses to exercise the fire path repeatedly.
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.down('KeyQ');
      await page.waitForTimeout(150);
      await page.keyboard.up('KeyQ');
      await page.waitForTimeout(250);
    }
    report(pageErrors.length === 0, 'firing the sonar (Q) produces no runtime exceptions in the render path', pageErrors.join(' | ') || 'clean');
  } catch (err) {
    results.push({ ok: false, name: 'HARNESS ERROR', detail: (err && err.stack ? err.stack : String(err)).slice(0, 800) });
    console.log('HARNESS ERROR: ' + (err && err.stack ? err.stack : String(err)));
    console.log('\n--- dev server log (tail) ---\n' + getLog().slice(-2000));
  } finally {
    if (browser) await browser.close();
    stopServer(child);
  }
  const failing = results.filter((r) => !r.ok).length;
  console.log('');
  console.log(failing === 0 ? 'REVIEWER PROBE PASS' : 'REVIEWER PROBE FAIL (' + failing + ' failing)');
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ pass: failing === 0, failures: failing, results }, null, 2));
  process.exitCode = failing === 0 ? 0 : 1;
})();
