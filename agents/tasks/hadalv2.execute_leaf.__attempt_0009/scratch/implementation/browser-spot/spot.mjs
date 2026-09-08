// WI-03a browser spot-check (presentation layer, request §70): boot the real
// `npm run dev` page in headless Chromium, teleport the player to the
// t01-shelf tier-1 spawn via the ?debug=1 panel, and verify the game boots,
// no console/page errors occur, and the rendered scene is alive.
//
// Reuses the resolution + server strategy of tests/browser/boot.test.mjs.
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54322);
const SHOT_DIR = here;

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base + ' — set HADAL_BROWSER');
  const dirs = readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')))
    .map((d) => ({ d, n: Number(d.slice('chromium-'.length)) }))
    .sort((a, b) => a.n - b.n);
  if (dirs.length === 0) throw new Error('no chromium-*/chrome-win64/chrome.exe under ' + base);
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

const readPos = (page) =>
  page.$eval('.debug-readout', (el) => {
    const m = el.textContent.match(/x\s+(-?\d+\.?\d*)\s+depth\s+(-?\d+\.?\d*)/);
    return m ? { x: Number(m[1]), depth: Number(m[2]) } : null;
  });

// Liveness probe over the raw PNG streams: identical pixels would compress
// to nearly identical streams, so a large byte divergence plus different
// stream sizes means the rendered scene changed between the two captures.
async function pixelsDiffer(aBuffer, bBuffer) {
  const a = Buffer.from(aBuffer);
  const b = Buffer.from(bBuffer);
  const n = Math.min(a.length, b.length);
  let diff = Math.abs(a.length - b.length);
  for (let i = 0; i < n; i += 1) {
    if (a[i] !== b[i]) diff += 1;
  }
  return diff;
}

const server = startServer();
const browser = await chromium.launch({ executablePath: resolveBrowser(), headless: true });
let exitCode = 0;
try {
  await waitReady();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(2500);
  assert.ok(await page.$('.debug-panel'), 'the debug panel is present (?debug=1)');

  // Teleport the player onto the t01-shelf tier-1 spawn (x 7000, depth 3500).
  await page.fill('.debug-teleport-x', '7000');
  await page.fill('.debug-teleport-depth', '3500');
  await page.click('.debug-teleport');
  // The camera has ~0.15 s follow lag; wait for the readout to land near the target.
  const deadline = Date.now() + 8000;
  let pos = null;
  while (Date.now() < deadline) {
    await page.waitForTimeout(400);
    pos = await readPos(page);
    if (pos && Math.abs(pos.x - 7000) < 400 && pos.depth > 3400) break;
  }
  assert.ok(pos, 'the debug readout reports a position');
  // The player is adrift after teleport (no input) and the band currents
  // move it, so allow a wide band around the spawn point.
  assert.ok(Math.abs(pos.x - 7000) < 400, `player teleported near x 7000 (readout x ${pos.x})`);
  assert.ok(pos.depth > 3400, `player teleported to depth 3500 (readout depth ${pos.depth})`);

  // Let the chunk's creatures populate and settle, then capture two frames.
  await page.waitForTimeout(4000);
  const shot1 = await page.screenshot({ path: path.join(SHOT_DIR, 'frame-1.png') });
  await page.waitForTimeout(2500);
  const shot2 = await page.screenshot({ path: path.join(SHOT_DIR, 'after-teleport.png') });
  const diff = await pixelsDiffer(shot1, shot2);
  assert.ok(diff > 0, `the rendered scene is alive (2.5 s apart, ${diff} differing PNG bytes)`);

  await page.waitForTimeout(1500);
  assert.equal(pageErrors.length, 0, `no page exceptions: ${pageErrors.join(' | ') || 'clean'}`);
  assert.equal(consoleErrors.length, 0, `no console errors: ${consoleErrors.join(' | ') || 'clean'}`);

  console.log('SPOT PASS — canvas booted, teleported to x ' + pos.x + ' depth ' + pos.depth +
    ', scene alive (' + diff + ' differing bytes), zero page exceptions, zero console errors');
} catch (e) {
  exitCode = 1;
  console.error('SPOT FAIL — ' + (e && e.message ? e.message : e));
  try {
    writeFileSync(path.join(SHOT_DIR, 'server.log'), server.getLog());
  } catch {
    // log capture is best-effort
  }
} finally {
  await browser.close().catch(() => {});
  stopServer(server.child);
}
process.exit(exitCode);
