// WI-02 swim probe: drives the real dev-server page through the inertial
// swim loop, terrain blocking, meters, mouse aim, tool select, pause, and
// the debug teleport — all through real keyboard/mouse events and DOM.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const outDir = path.join(here, 'output');
const browserExe =
  process.env.PROBE_BROWSER ||
  'C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const port = 5197;

mkdirSync(outDir, { recursive: true });

const server = spawn(
  'cmd',
  ['/c', 'npm', 'run', 'dev', '--', '--port', String(port), '--strictPort'],
  { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] },
);
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

async function waitReady(ms) {
  const urls = [`http://localhost:${port}/`, `http://127.0.0.1:${port}/`];
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    for (const url of urls) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
        if (r.ok) return;
      } catch {
        // not up yet on this host
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('dev server did not become ready. Last output:\n' + serverLog.slice(-2000));
}

const consoleMsgs = [];
const pageErrors = [];
let browser;
const checks = {};
const trace = [];
let fail = (name) => {
  checks[name] = false;
  trace.push('FAIL: ' + name);
};
const ok = (name, cond, detail) => {
  checks[name] = !!cond;
  trace.push(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
};

function parseReadout(text) {
  const m = text.match(
    /x\s+(-?\d+(?:\.\d+)?)\s+depth\s+(\d+(?:\.\d+)?)\s+o2\s+(\d+)s\s+hp\s+(\d+)\s+facing\s+(-?\d+(?:\.\d+)?)/,
  );
  if (!m) return null;
  return { x: Number(m[1]), depth: Number(m[2]), o2: Number(m[3]), hp: Number(m[4]), facing: Number(m[5]) };
}

try {
  await waitReady(60000);
  browser = await chromium.launch({
    executablePath: browserExe,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(`http://localhost:${port}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#hud-root', { timeout: 10000 });
  await page.waitForTimeout(3500);

  const readout = async () => parseReadout(await page.$eval('#debug-readout', (el) => el.textContent));
  const teleport = async (x, depth) => {
    await page.fill('#debug-x', String(x));
    await page.fill('#debug-depth', String(depth));
    await page.click('#debug-apply');
    await page.waitForTimeout(450);
  };
  const holdUntilSaturated = async (key, timeoutMs) => {
    await page.keyboard.down(key);
    const t0 = Date.now();
    let last = -1;
    let stable = 0;
    let depth = 0;
    while (Date.now() - t0 < timeoutMs) {
      await page.waitForTimeout(350);
      const r = await readout();
      depth = r ? r.depth : depth;
      if (last >= 0 && Math.abs(depth - last) < 1.5) stable += 1;
      else stable = 0;
      last = depth;
      if (stable >= 3) break;
    }
    await page.keyboard.up(key);
    await page.waitForTimeout(350);
    const r = await readout();
    return r ? r.depth : depth;
  };

  // Phase A — boot: HUD visible, debug panel visible via ?debug=1, depth 100.
  const hudVisible = await page.$eval('#hud-root', (el) => getComputedStyle(el).display !== 'none');
  const panelVisible = await page.$eval('#debug-panel', (el) => getComputedStyle(el).display !== 'none');
  const a = await readout();
  ok('HUD readout root is present and visible', hudVisible);
  ok('debug panel visible via ?debug=1', panelVisible);
  ok('player starts at depth 100 (y = -100)', !!a && Math.abs(a.depth - 100) < 2, a && `depth=${a.depth}`);
  ok('player starts at x 1300', !!a && Math.abs(a.x - 1300) < 2, a && `x=${a.x}`);
  ok('tool readout shows the starter knife', (await page.$eval('#hud-tool-text', (el) => el.textContent)).includes('Salvage Knife'));
  await page.screenshot({ path: path.join(outDir, 'A-boot.png') });

  // Phase B — 3 s of S: inertial dive, depth in [650, 1000], O2 ~177.
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(3000);
  const b = await readout();
  ok('3 s dive reaches depth 650–1000 (inertial, floor not yet hit)', !!b && b.depth >= 650 && b.depth <= 1000, b && `depth=${b.depth}`);
  ok('O2 reads ~177 s after 3 s of dive', !!b && b.o2 >= 174 && b.o2 <= 178, b && `o2=${b.o2}`);
  await page.keyboard.up('KeyS');

  // Phase C — coast: depth keeps rising after release.
  await page.waitForTimeout(1500);
  const c = await readout();
  ok('coast after release: depth rose by > 100 (inertia, not frictionless)', !!c && !!b && c.depth - b.depth > 100, b && c && `+${(c.depth - b.depth).toFixed(1)}`);

  // Phase D — keep sinking to the seabed: blocked by terrain, depth ~1386.
  const d = await holdUntilSaturated('KeyS', 15000);
  ok('seabed blocks the player: depth saturates at 1330–1400 (floor ~1416, radius 30)', d >= 1330 && d <= 1400, `depth=${d}`);
  await page.screenshot({ path: path.join(outDir, 'D-seabed.png') });

  // Phase E — teleport above the wall, cross east, wall top is passable from above.
  await teleport(2000, 150);
  const e0 = await readout();
  ok('debug teleport moves the player to x 2000, depth 150', !!e0 && Math.abs(e0.x - 2000) < 2 && Math.abs(e0.depth - 150) < 2, e0 && `x=${e0.x} depth=${e0.depth}`);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(3500);
  const e = await readout();
  await page.keyboard.up('KeyD');
  ok('swimming east crosses the central wall (x > 2700)', !!e && e.x > 2700, e && `x=${e.x}`);

  // Phase F — wall top blocks descent: teleport onto the wall, sink, saturate ~490.
  await teleport(2400, 100);
  const f = await holdUntilSaturated('KeyS', 15000);
  ok('wall top blocks descent: depth saturates at 450–510 (top -520)', f >= 450 && f <= 510, `depth=${f}`);

  // Phase G — east of the wall: sink, slide down the rising slope to the
  // flat floor (y = -1450) east of the wall's west edge.
  await teleport(3000, 100);
  const g = await holdUntilSaturated('KeyS', 15000);
  const gr = await readout();
  ok('east floor reachable: depth saturates at 1390–1430 (flat floor -1450)', g >= 1390 && g <= 1430, `depth=${g}`);
  ok('player ended east of the wall (x > 2400)', !!gr && gr.x > 2400, gr && `x=${gr.x}`);
  await page.screenshot({ path: path.join(outDir, 'G-east-floor.png') });

  // Phase H — mouse aim rotates the body (facing in the readout).
  await page.mouse.move(300, 200); // upper-left of the view
  await page.waitForTimeout(2500);
  const h1 = await readout();
  ok('body faces the mouse: aiming upper-left gives facing > 2.2', !!h1 && h1.facing > 2.2, h1 && `x=${h1.x} depth=${h1.depth} facing=${h1.facing}`);
  await page.mouse.move(1800, 540); // right of the view
  await page.waitForTimeout(2500);
  const h2 = await readout();
  ok('body follows the mouse back right: |facing| < 0.6', !!h2 && Math.abs(h2.facing) < 0.6, h2 && `x=${h2.x} depth=${h2.depth} facing=${h2.facing}`);

  // Phase I — tool quick-select 1–4.
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(350);
  const i1 = await page.$eval('#hud-tool-text', (el) => el.textContent);
  ok('Digit2 selects the work light', i1.includes('Work Light'), `tool=${i1}`);
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(350);
  const i2 = await page.$eval('#hud-tool-text', (el) => el.textContent);
  ok('Digit1 selects the salvage knife', i2.includes('Salvage Knife'), `tool=${i2}`);

  // Phase J — Esc pauses: overlay shows, depth freezes, Esc resumes.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const jShown = await page.$eval('#pause-overlay', (el) => getComputedStyle(el).display !== 'none');
  const j1 = await readout();
  await page.waitForTimeout(1200);
  const j2 = await readout();
  ok('Esc shows the pause overlay', jShown);
  ok('paused simulation freezes the player', !!j1 && !!j2 && j1.depth === j2.depth && j1.x === j2.x, j1 && j2 && `depth ${j1.depth} -> ${j2.depth}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const jHidden = await page.$eval('#pause-overlay', (el) => getComputedStyle(el).display === 'none');
  ok('second Esc hides the overlay (resumes)', jHidden);

  const z = await readout();
  ok('O2 fell across the whole dive (177 at 3 s, now lower)', !!z && !!b && z.o2 < b.o2 - 5, z && `o2=${z.o2} (was ${b.o2})`);
  ok('health still 100 (no damage sources yet)', !!z && z.hp === 100, z && `hp=${z.hp}`);

  const consoleErrors = consoleMsgs.filter((m) => m.type === 'error');
  ok('no page exceptions', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  ok('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).map((m) => m.text).join(' | '));

  await page.screenshot({ path: path.join(outDir, 'Z-final.png') });
  writeFileSync(path.join(outDir, 'console.json'), JSON.stringify({ consoleMsgs, pageErrors }, null, 2));
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ checks, trace, pageErrors, consoleMsgs }, null, 2));
  writeFileSync(path.join(outDir, 'trace.txt'), trace.join('\n') + '\n');
  console.log(trace.join('\n'));
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([n]) => n);
  if (failed.length) {
    console.log('PROBE FAIL: ' + failed.join('; '));
    process.exitCode = 1;
  } else {
    console.log('PROBE PASS: all ' + Object.keys(checks).length + ' checks green');
  }
} catch (err) {
  console.error('PROBE FAIL: ' + (err && err.stack ? err.stack : String(err)));
  writeFileSync(path.join(outDir, 'error.txt'), String(err && err.stack ? err.stack : err));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  writeFileSync(path.join(outDir, 'server.log'), serverLog);
  // Kill the whole tree (cmd -> npm -> vite) so no child holds the pipe.
  spawn('taskkill', ['/t', '/f', '/pid', String(server.pid)], {
    stdio: 'ignore',
    windowsHide: true,
  });
  await new Promise((r) => setTimeout(r, 2000));
  if (server.exitCode === null) server.kill('SIGKILL');
}
