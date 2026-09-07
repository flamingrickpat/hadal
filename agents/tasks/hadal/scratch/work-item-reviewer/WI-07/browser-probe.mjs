// WI-07 reviewer browser probe (attempt 2). Answers the browser half of the
// evidence table that the first review left open: does the dev build boot a
// clean WebGL scene in a fresh browser profile at 1920x1080 with no console
// exceptions, and does keyboard input reach the PRODUCTION simulation (the
// depth HUD only changes if sim.step ran on the input). The long five-band
// swim itself is proven headlessly (scenarios + probe.test.ts §11); per §70
// this browser probe is short and targeted, not a swim route.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const browserExe = 'C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const devPort = 5215;
const out = (name) => path.join(here, 'output', name);
mkdirSync(path.join(here, 'output'), { recursive: true });

const watchdog = setTimeout(() => {
  console.error('PROBE TIMEOUT (watchdog 90s)');
  process.exit(2);
}, 90000);

const server = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(devPort), '--strictPort'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

async function waitReady(port, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

const errors = [];
let exitCode = 1;
try {
  if (!(await waitReady(devPort, 30000))) throw new Error(`dev server did not come up:\n${serverLog}`);

  const browser = await chromium.launch({ executablePath: browserExe, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(`http://localhost:${devPort}/`, { waitUntil: 'load', timeout: 30000 });

  // A live WebGL2 canvas (the scene is actually rendering).
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas');
      return c && c.width > 500 && c.height > 300 && c.getContext('webgl2') !== null;
    },
    { timeout: 15000 },
  );
  console.log('webgl2 canvas: OK');

  // Let the first frames render, then read the HUD before input.
  await new Promise((r) => setTimeout(r, 1500));
  const hudBefore = await page.$$eval('.hud-value', (els) => els.map((e) => e.textContent));
  console.log('hud before input:', JSON.stringify(hudBefore));
  const readDepth = async () => {
    const t = await page.$eval('#hud-depth-text', (e) => e.textContent).catch(() => null);
    const m = /([\d.]+)/.exec(t ?? '');
    return m ? Number(m[1]) : null;
  };
  const depthBefore = await readDepth();

  // Keyboard -> production simulation: hold S (dive) and D (right) for 1.5 s.
  await page.keyboard.down('KeyS');
  await page.keyboard.down('KeyD');
  await new Promise((r) => setTimeout(r, 1500));
  await page.keyboard.up('KeyS');
  await page.keyboard.up('KeyD');
  await new Promise((r) => setTimeout(r, 300));
  const hudAfter = await page.$$eval('.hud-value', (els) => els.map((e) => e.textContent));
  console.log('hud after input: ', JSON.stringify(hudAfter));

  // The depth readout (#hud-depth-text) must show a positive depth after
  // diving: it only exists as simulation state, so a change proves input
  // reached sim.step.
  const depthAfter = await readDepth();
  const changed = hudBefore.some((t, i) => t !== hudAfter[i]);
  console.log(`hud changed=${changed}, depth before=${depthBefore}m after=${depthAfter}m`);
  if (!changed) errors.push('HUD did not change after keyboard input — input did not reach the simulation');
  if (depthAfter === null || depthAfter <= (depthBefore ?? 0)) {
    errors.push(`expected depth to increase after diving, got before=${depthBefore} after=${depthAfter}`);
  }

  await page.screenshot({ path: out('A-dev-boot-1920x1080.png') });
  await browser.close();

  if (errors.length) {
    console.error('BROWSER PROBE FAILURES:');
    for (const e of errors) console.error(' -', e);
  } else {
    console.log('BROWSER PROBE PASS: clean boot, webgl2 scene, keyboard reaches the simulation, no console errors');
    exitCode = 0;
  }
} catch (e) {
  console.error('BROWSER PROBE ERROR:', e.message);
} finally {
  clearTimeout(watchdog);
  server.kill('SIGTERM');
  writeFileSync(out('result.json'), JSON.stringify({ exitCode, errors }, null, 2));
}
process.exit(exitCode);
