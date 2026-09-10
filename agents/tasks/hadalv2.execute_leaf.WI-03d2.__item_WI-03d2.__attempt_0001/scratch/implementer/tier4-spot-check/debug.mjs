// Quick debug: load the ?debug=1 page, report page errors and whether the
// sim clock advances (i.e. the game loop is alive).
import { spawn, spawnSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..', '..', '..', '..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54323);
function resolveBrowser() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const dirs = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')));
  const versioned = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  return path.join(base, versioned[versioned.length - 1].d, 'chrome-win64', 'chrome.exe');
}
const server = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(PORT), '--strictPort'], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
try {
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  const browser = await chromium.launch({ executablePath: resolveBrowser(), headless: true, args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errs.push('console: ' + m.text());
  });
  await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(3000);
  const t1 = await page.evaluate(() => window.__HADAL_GAME__ && window.__HADAL_GAME__.sim.state.timeSec);
  await page.waitForTimeout(1000);
  const t2 = await page.evaluate(() => window.__HADAL_GAME__ && window.__HADAL_GAME__.sim.state.timeSec);
  console.log('timeSec samples:', t1, t2, '-> advancing:', t2 > t1);
  console.log('errors:', JSON.stringify(errs, null, 2));
  await browser.close();
} finally {
  spawnSync('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
  console.log('--- server log tail ---');
  console.log(serverLog.slice(-800));
}
