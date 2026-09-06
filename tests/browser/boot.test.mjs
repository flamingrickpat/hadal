// Shared browser harness (request §44/§70): boots the real `npm run dev`
// page in a headless Chromium and verifies the §70 "Boot" + "Save" checklist
// items that are observable without a GPU. It is kept separate from the
// headless `npm test` (Vitest) suite and is the `test:browser` command.
//
// Runs: `npm run test:browser`. Set HADAL_BROWSER to override the Chromium
// binary, HADAL_BROWSER_PORT to override the dev-server port.
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54321);

// The installed ms-playwright Chromium may be a different revision than the
// one playwright-core defaults to, so resolve the newest present binary.
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

// A fresh page == a fresh browser profile (empty localStorage).
async function freshPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2500);
  return { ctx, page, pageErrors, consoleErrors };
}

// The game booted == the WebGL canvas exists; otherwise surface the page errors.
async function assertBooted(page, pageErrors) {
  try {
    await page.waitForSelector('canvas', { timeout: 15000 });
  } catch {
    assert.equal(pageErrors.length, 0, 'the game did not boot; page exceptions: ' + (pageErrors.join(' | ') || '(none logged)'));
  }
  assert.ok(await page.$('canvas'), 'the renderer canvas is present (the game booted)');
}

const readX = (page) =>
  page.$eval('.debug-readout', (el) => {
    const m = el.textContent.match(/x\s+(-?\d+\.?\d*)/);
    return m ? Number(m[1]) : NaN;
  });

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('fresh boot: canvas + HUD + debug panel present, no page exception (§70 Boot)', async ({ page, pageErrors, consoleErrors }) => {
  await assertBooted(page, pageErrors);
  assert.ok(await page.$('#hud-root'), 'the HUD root is present');
  assert.ok(await page.$('.debug-panel'), 'the debug panel is present (?debug=1)');
  const context = consoleErrors.length ? ` (console: ${consoleErrors.join(' | ')})` : '';
  assert.equal(pageErrors.length, 0, `no page exceptions (console exceptions): ${pageErrors.join(' | ') || 'clean'}${context}`);
});

test('keyboard input reaches the simulation and moves the player (§70 Boot)', async ({ page, pageErrors }) => {
  await assertBooted(page, pageErrors);
  const before = await readX(page);
  assert.ok(!Number.isNaN(before), 'the debug readout shows an x position');
  await page.keyboard.down('d');
  await page.waitForTimeout(700);
  await page.keyboard.up('d');
  await page.waitForTimeout(400);
  const after = await readX(page);
  assert.ok(after > before, `pressing D moves the player right (x ${before} -> ${after})`);
});

test('resize produces a usable layout (§70 Boot)', async ({ page, pageErrors }) => {
  await assertBooted(page, pageErrors);
  await page.setViewportSize({ width: 2560, height: 1080 });
  await page.waitForTimeout(500);
  const size = await page.$eval('canvas', (c) => ({ w: c.clientWidth, h: c.clientHeight }));
  assert.ok(size.w >= 2000, `the canvas width tracks the window after resize (w=${size.w})`);
  assert.ok(await page.$('#hud-root'), 'the HUD is still present after resize');
  assert.equal(pageErrors.length, 0, 'no page exceptions after resize: ' + pageErrors.join(' | '));
});

test('the storage adapter preserves state across an actual page reload (§70 Save)', async ({ page, pageErrors }) => {
  await assertBooted(page, pageErrors);
  // Leave the base (debug-teleport fixture) so the base-return autosave edge can fire.
  await page.fill('.debug-teleport-x', '1300');
  await page.fill('.debug-teleport-depth', '400');
  await page.click('.debug-teleport');
  await page.waitForTimeout(500);
  // Return to the base -> onBaseReturn -> autosave -> localStorage.
  await page.fill('.debug-teleport-x', '1300');
  await page.fill('.debug-teleport-depth', '0');
  await page.click('.debug-teleport');
  await page.waitForTimeout(500);
  const saved = await page.evaluate(() => localStorage.getItem('hadal.save.v1'));
  assert.ok(saved, 'a save was written to localStorage (hadal.save.v1)');
  const parsed = JSON.parse(saved);
  assert.equal(parsed.version, 1, 'the save is version 1');
  assert.ok(parsed.world.storyFlags.length >= 1, 'the base-return progression persisted (storyFlags)');
  // Reload: the save must survive and the game must boot from it.
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(2000);
  assert.equal(await page.evaluate(() => localStorage.getItem('hadal.save.v1') !== null), true, 'the save survived the reload');
  assert.ok(await page.$('canvas'), 'the game booted after the reload');
  assert.equal(pageErrors.length, 0, 'no page exceptions across the reload: ' + pageErrors.join(' | '));
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
  console.log(failures === 0 ? 'BROWSER SUITE PASS' : `BROWSER SUITE FAIL (${failures} failing)`);
  process.exitCode = failures === 0 ? 0 : 1;
})();
