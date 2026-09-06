// WI-02 re-verification probe (item-implementer role, 2026 re-dispatch).
// Independent re-confirmation that the already-committed WI-02 implementation
// still meets its acceptance criteria on the current baseline: inertial swim
// (not frictionless), circle-vs-segment terrain blocking, the greybox world,
// the minimal O2/HP/depth/tool HUD, and the debug teleport. Drives the real
// `npm run dev` page through real keyboard/mouse events and the DOM readout.
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
const port = 5199;

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
const ok = (name, cond, detail) => {
  checks[name] = !!cond;
  trace.push(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
};

function parseReadout(text) {
  const m = text.match(
    /x\s+(-?\d+(?:\.\d+)?)\s+depth\s+(-?\d+(?:\.\d+)?)\s+o2\s+(\d+)s\s+hp\s+(\d+)\s+facing\s+(-?\d+(?:\.\d+)?)/,
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

  // Criterion 3 + 5 — boot: HUD and debug panel visible, player at the start.
  const hudVisible = await page.$eval('#hud-root', (el) => getComputedStyle(el).display !== 'none');
  const panelVisible = await page.$eval('#debug-panel', (el) => getComputedStyle(el).display !== 'none');
  const a = await readout();
  ok('greybox world boots: HUD root present and visible', hudVisible);
  ok('debug panel visible via ?debug=1', panelVisible);
  ok('player starts at x 1300 / depth 100', !!a && Math.abs(a.x - 1300) < 2 && Math.abs(a.depth - 100) < 2, a && `x=${a.x} depth=${a.depth}`);
  const toolText = await page.$eval('#hud-tool-text', (el) => el.textContent);
  ok('HUD shows the selected tool (starter knife)', toolText.includes('Salvage Knife'), `tool=${toolText}`);
  ok('HUD shows O2, HP and DEPTH readouts', (await page.$eval('#hud-o2', (el) => el.textContent)).trim().startsWith('O2') && (await page.$eval('#hud-hp', (el) => el.textContent)).trim().startsWith('HP') && (await page.$eval('#hud-depth-text', (el) => el.textContent)).trim().endsWith('m'));
  await page.screenshot({ path: path.join(outDir, 'A-boot.png') });

  // Criterion 1 — inertial dive: 3 s of S, then a coast that keeps rising.
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(3000);
  const b = await readout();
  ok('inertial dive: 3 s of S reaches depth 600–1050', !!b && b.depth >= 600 && b.depth <= 1050, b && `depth=${b.depth}`);
  await page.keyboard.up('KeyS');
  await page.waitForTimeout(1500);
  const c = await readout();
  ok('not frictionless: depth keeps rising > 100 after release (coast)', !!c && !!b && c.depth - b.depth > 100, b && c && `+${(c.depth - b.depth).toFixed(1)}`);

  // Criterion 2 — terrain blocking: sinking to the seabed saturates at one radius.
  const d = await holdUntilSaturated('KeyS', 15000);
  ok('seabed blocks the player: depth saturates at 1330–1410', d >= 1330 && d <= 1410, `depth=${d}`);
  await page.screenshot({ path: path.join(outDir, 'D-seabed.png') });

  // Criterion 7 — debug teleport to an arbitrary x/depth.
  await teleport(2000, 150);
  const e0 = await readout();
  ok('debug teleport moves the player to x 2000 / depth 150', !!e0 && Math.abs(e0.x - 2000) < 2 && Math.abs(e0.depth - 150) < 2, e0 && `x=${e0.x} depth=${e0.depth}`);

  // Criterion 5 — HUD tool quick-select 1–4 (request §6).
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(350);
  const i1 = await page.$eval('#hud-tool-text', (el) => el.textContent);
  ok('Digit2 selects the work light in the HUD', i1.includes('Work Light'), `tool=${i1}`);
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(350);
  const i2 = await page.$eval('#hud-tool-text', (el) => el.textContent);
  ok('Digit1 reselects the salvage knife', i2.includes('Salvage Knife'), `tool=${i2}`);

  const consoleErrors = consoleMsgs.filter((m) => m.type === 'error');
  ok('no page exceptions', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  ok('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).map((m) => m.text).join(' | '));

  await page.screenshot({ path: path.join(outDir, 'Z-final.png') });
  writeFileSync(path.join(outDir, 'console.json'), JSON.stringify({ consoleMsgs, pageErrors }, null, 2));
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ checks, trace, pageErrors }, null, 2));
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
  spawn('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
  await new Promise((r) => setTimeout(r, 2000));
  if (server.exitCode === null) server.kill('SIGKILL');
}
