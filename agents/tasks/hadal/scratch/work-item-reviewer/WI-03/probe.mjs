// WI-03 INDEPENDENT reviewer probe — verifies the browser actually boots.
//
// The implementer's claim: "npm run test:browser exit 0" (which is just
// `vite build`) and "npm run build exit 0". Neither loads a real page.
// This probe drives the real `npm run dev` page in SwiftShader Chromium
// (real WebGL2, fresh context, ?debug=1) and checks:
//   A. the page does NOT throw a page-level exception on boot.
//   B. the renderer canvas is present (the game booted, not a blank page).
//   C. the HUD root is present.
//   D. the ?debug=1 debug panel is present.
// This specifically targets the main.ts `document.getElementById('app')`
// vs index.html `#game` container mismatch (a suspected boot break).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../');
const outDir = path.join(here, 'output');
const browserExe =
  process.env.PROBE_BROWSER ||
  'C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const port = 5311;

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
        // not up yet
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('dev server did not become ready. Last output:\n' + serverLog.slice(-2000));
}

const consoleMsgs = [];
const pageErrors = [];
let browser;

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
  await page.waitForTimeout(3000);

  const canvas = await page.$('canvas');
  const hudRoot = await page.$('#hud-root');
  const debugPanel = await page.$('#debug-panel');
  const bodyText = (await page.$eval('body', (el) => el.textContent)) || '';

  const checks = {
    A_no_page_exception: pageErrors.length === 0,
    B_renderer_canvas_present: !!canvas,
    C_hud_root_present: !!hudRoot,
    D_debug_panel_present: !!debugPanel,
  };

  writeFileSync(path.join(outDir, 'console.json'), JSON.stringify({ consoleMsgs, pageErrors }, null, 2));
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(checks, null, 2));
  console.log('CHECKS:');
  for (const [name, pass] of Object.entries(checks)) {
    console.log(`  ${pass ? 'PASS' : 'FAIL'}: ${name}`);
  }
  if (pageErrors.length) {
    console.log('\nPAGE ERRORS:');
    for (const e of pageErrors) console.log('  ' + e);
  }
  const consoleErrs = consoleMsgs.filter((m) => m.type === 'error');
  if (consoleErrs.length) {
    console.log('\nCONSOLE ERRORS:');
    for (const m of consoleErrs) console.log('  ' + m.text);
  }
  console.log('\nbody has text: ' + bodyText.length);
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([n]) => n);
  if (failed.length) {
    console.log('\nPROBE FAIL: ' + failed.join('; '));
    process.exitCode = 1;
  } else {
    console.log('\nPROBE PASS: all checks green (the game booted)');
  }
} catch (err) {
  console.error('PROBE ERROR: ' + (err && err.stack ? err.stack : String(err)));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  writeFileSync(path.join(outDir, 'server.log'), serverLog);
  spawn('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
  await new Promise((r) => setTimeout(r, 1500));
  if (server.exitCode === null) server.kill('SIGKILL');
}
