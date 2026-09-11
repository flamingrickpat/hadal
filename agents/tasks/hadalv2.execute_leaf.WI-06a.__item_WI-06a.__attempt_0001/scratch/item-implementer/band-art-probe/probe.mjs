// WI-06a band art pass probe: verify surface and coast bands are visually distinct,
// and that returning to surface after a deep dive creates relief (request §59).
// Uses Playwright to drive the real npm dev page, teleport via debug panel, and
// capture screenshots at three depths: surface (0), coast (800), deep (5000).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../..');
const outDir = path.join(here, 'output');
const browserExe = process.env.PROBE_BROWSER || 'C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const port = 5181;

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
const trace = [];
const ok = (name, cond, detail) => {
  trace.push(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
  return !!cond;
};

function parseReadout(text) {
  const m = text.match(/x\s+(-?\d+(?:\.\d+)?)\s+depth\s+(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  return { x: Number(m[1]), depth: Number(m[2]) };
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

  const readout = async () => parseReadout(await page.$eval('.debug-readout', (el) => el.textContent));
  const teleport = async (x, depth) => {
    // The debug panel uses CSS classes, not IDs: debug-teleport-x, debug-teleport-depth, debug-teleport
    await page.fill('.debug-teleport-x', String(x));
    await page.fill('.debug-teleport-depth', String(depth));
    await page.click('.debug-teleport');
    await page.waitForTimeout(600);
  };

  // 1. Surface band (depth 0) — should be bright, cozy, clear
  await teleport(1300, 0);
  const surfaceReadout = await readout();
  ok('surface: player at depth 0', !!surfaceReadout && Math.abs(surfaceReadout.depth) < 5,
     surfaceReadout && `depth=${surfaceReadout.depth}`);
  await page.screenshot({ path: path.join(outDir, 'surface-band.png') });
  console.log('Captured surface band screenshot');

  // 2. Coast band (depth 800) — transitional, darker than surface
  await teleport(1300, 800);
  const coastReadout = await readout();
  ok('coast: player at depth 800', !!coastReadout && Math.abs(coastReadout.depth - 800) < 20,
     coastReadout && `depth=${coastReadout.depth}`);
  await page.screenshot({ path: path.join(outDir, 'coast-band.png') });
  console.log('Captured coast band screenshot');

  // 3. Deep band (depth 5000) — dark, dense, alien
  await teleport(1300, 5000);
  const deepReadout = await readout();
  ok('deep: player at depth 5000', !!deepReadout && Math.abs(deepReadout.depth - 5000) < 20,
     deepReadout && `depth=${deepReadout.depth}`);
  await page.screenshot({ path: path.join(outDir, 'deep-band.png') });
  console.log('Captured deep band screenshot');

  // 4. Return to surface — should feel like relief (brighter, clearer)
  await teleport(1300, 0);
  const returnReadout = await readout();
  ok('return: player at depth 0', !!returnReadout && Math.abs(returnReadout.depth) < 5,
     returnReadout && `depth=${returnReadout.depth}`);
  await page.screenshot({ path: path.join(outDir, 'return-to-surface.png') });
  console.log('Captured return-to-surface screenshot');

  const consoleErrors = consoleMsgs.filter((m) => m.type === 'error');
  ok('no page exceptions', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  ok('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).map((m) => m.text).join(' | '));

  writeFileSync(path.join(outDir, 'console.json'), JSON.stringify({ consoleMsgs, pageErrors }, null, 2));
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ trace, pageErrors }, null, 2));
  writeFileSync(path.join(outDir, 'trace.txt'), trace.join('\n') + '\n');
  console.log(trace.join('\n'));
  const failed = trace.filter((l) => l.startsWith('FAIL'));
  if (failed.length) {
    console.log('PROBE FAIL: ' + failed.length + ' checks failed');
    process.exitCode = 1;
  } else {
    console.log('PROBE PASS: all ' + trace.length + ' checks green');
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
