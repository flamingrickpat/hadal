// WI-01 boot probe: real-browser verification that the dev-server page
// boots a WebGL frame at 1920x1080 with a clean console.
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
  {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let serverLog = '';
server.stdout.on('data', (d) => {
  serverLog += d;
});
server.stderr.on('data', (d) => {
  serverLog += d;
});

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
  throw new Error('dev server did not become ready. Last server output:\n' + serverLog.slice(-2000));
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
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(4000); // let several rAF frames accumulate

  const state = await page.evaluate(async () => {
    const canvas = document.querySelector('canvas');
    const gl = canvas && canvas.getContext('webgl2');
    let px = null;
    if (gl) {
      // Read the drawing buffer within the same display frame as the
      // game's render (the game registered its rAF first).
      px = await new Promise((resolve) => {
        requestAnimationFrame(() => {
          const w = gl.drawingBufferWidth;
          const h = gl.drawingBufferHeight;
          const d = new Uint8Array(w * h * 4);
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, d);
          let min = 255;
          let max = 0;
          for (let i = 0; i < d.length; i += 4 * 101) {
            const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
            if (l < min) min = l;
            if (l > max) max = l;
          }
          resolve({ min, max, range: max - min, w, h });
        });
      });
    }
    return {
      title: document.title,
      hasCanvas: !!canvas,
      hasWebGL2: !!gl,
      px,
      canvasCss: canvas ? { w: canvas.clientWidth, h: canvas.clientHeight } : null,
    };
  });
  await page.screenshot({ path: path.join(outDir, 'boot-1920x1080.png') });
  writeFileSync(
    path.join(outDir, 'console.json'),
    JSON.stringify({ consoleMsgs, pageErrors }, null, 2),
  );

  const checks = {
    'page title is HADAL': state.title === 'HADAL',
    'canvas present': state.hasCanvas === true,
    'WebGL2 context on canvas': state.hasWebGL2 === true,
    'drawing buffer is 1920x1080 (dpr 1)':
      !!state.px && state.px.w === 1920 && state.px.h === 1080,
    'frame is not blank (pixel luminance range > 10)': !!state.px && state.px.range > 10,
    'no page exceptions': pageErrors.length === 0,
    'no console errors': !consoleMsgs.some((m) => m.type === 'error'),
  };
  const failures = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
  writeFileSync(
    path.join(outDir, 'result.json'),
    JSON.stringify({ checks, state, pageErrors, consoleMsgs }, null, 2),
  );
  console.log(JSON.stringify({ failures, state }, null, 2));
  if (failures.length) {
    process.exitCode = 1;
  } else {
    console.log('PROBE PASS: frame renders at 1920x1080 on WebGL2, console clean');
  }
} catch (err) {
  console.error('PROBE FAIL: ' + (err && err.stack ? err.stack : String(err)));
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
