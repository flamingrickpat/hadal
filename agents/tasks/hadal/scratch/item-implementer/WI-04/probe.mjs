// WI-04 visual-language probe: boots the real dev-server page in headless
// Chromium (SwiftShader WebGL) at 1920x1080 and verifies the atmospheric scene
// (water gradient, silhouettes, flashlight, parallax, particles) renders without
// console/page exceptions, and that the render FPS stays stable across the
// depth range (the pooled-particle / parallax load does not collapse the frame
// rate). Screenshots are the visual evidence (request §44 phase 2, §34).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const outDir = path.join(here, 'output');
const port = 54322;
const ms = (n) => new Promise((r) => setTimeout(r, n));

function resolveBrowser() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base);
  const dirs = readdirSync(base).filter(
    (d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')),
  );
  const versioned = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  if (versioned.length === 0) throw new Error('no chromium-*/chrome-win64/chrome.exe under ' + base);
  return path.join(base, versioned[versioned.length - 1].d, 'chrome-win64', 'chrome.exe');
}

mkdirSync(outDir, { recursive: true });
const server = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(port), '--strictPort'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

async function waitReady() {
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return;
    } catch {
      // not ready yet
    }
    await ms(400);
  }
  throw new Error('dev server did not become ready within 60s\n' + serverLog.slice(-2000));
}

// Count requestAnimationFrame frames over `duration` ms -> fps.
const measureFps = (page, duration) =>
  page.evaluate(
    (dur) =>
      new Promise((resolve) => {
        let frames = 0;
        const t0 = performance.now();
        const tick = () => {
          frames += 1;
          if (performance.now() - t0 < dur) requestAnimationFrame(tick);
          else resolve(frames / (dur / 1000));
        };
        requestAnimationFrame(tick);
      }),
    duration,
  );

const result = { fps: {}, pageErrors: [], consoleErrors: [] };
let browser;
try {
  await waitReady();
  browser = await chromium.launch({
    executablePath: resolveBrowser(),
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => result.pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') result.consoleErrors.push(m.text());
  });
  await page.goto(`http://localhost:${port}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(2500);
  const teleport = async (x, depth) => {
    await page.fill('.debug-teleport-x', String(x));
    await page.fill('.debug-teleport-depth', String(depth));
    await page.click('.debug-teleport');
    await page.waitForTimeout(600);
  };

  const depths = [100, 700, 1400];
  for (const depth of depths) {
    await teleport(1300, depth);
    result.fps[`depth-${depth}`] = Number((await measureFps(page, 3000)).toFixed(1));
    await page.screenshot({ path: path.join(outDir, `depth-${depth}.png`) });
  }

  // The scene must not be a flat fill: sample a few pixels across the canvas
  // via a screenshot-free DOM check is not possible (WebGL buffer), so the
  // screenshots are the evidence; here we only assert the canvas is present.
  const canvas = await page.$('canvas');
  result.canvasPresent = !!canvas;
} catch (err) {
  result.error = String(err && err.stack ? err.stack : err);
} finally {
  if (browser) await browser.close();
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  writeFileSync(path.join(outDir, 'server.log'), serverLog);
  spawn('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
  await ms(2000);
  if (server.exitCode === null) server.kill('SIGKILL');
}
console.log(JSON.stringify(result, null, 2));
