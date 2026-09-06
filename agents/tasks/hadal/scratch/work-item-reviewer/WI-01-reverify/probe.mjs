// WI-01 re-verification probe (independent of the implementer's and the
// first reviewer's probes). Questions answered at the accepted revision:
//  1. Does the committed scaffold really boot a WebGL2 frame at 1920x1080
//     with a clean console in a fresh browser profile (criterion 2)?
//  2. Is the simulation cadence independent of requestAnimationFrame timing
//     (criterion 3)? Measured by sinking the player (hold S) and comparing
//     the #hud-depth-text advance over an identical 3 s window under an
//     rAF throttle vs unthrottled. The scene's WI-01 boot marker was
//     replaced by a static player mesh, so depth (a pure function of the
//     sim clock) is the observable, not marker position.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const browserExe =
  'C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const devPort = 5310;
const previewPort = 5311;
const WINDOW_MS = 3000;
const out = (name) => path.join(here, 'output', name);
mkdirSync(path.join(here, 'output'), { recursive: true });

const watchdog = setTimeout(() => {
  console.error('PROBE TIMEOUT (watchdog 180s)');
  process.exit(2);
}, 180000);

function startServer(cmd, port) {
  const server = spawn('cmd', ['/c', ...cmd, '--', '--port', String(port), '--strictPort'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
  return { server, log: () => log };
}

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

// rAF pump: the page's rAF callbacks are queued; the pump (running on the
// real rAF every vsync) delivers them all, or — when throttled — only every
// 4th vsync. Delivered callbacks receive the real wall clock at invocation,
// so an accumulator loop advances simulation at real-time speed while a
// frame-tied loop would advance at ~1/4 speed.
const rafInit = (throttle) =>
  `
  (() => {
    const orig = window.requestAnimationFrame.bind(window);
    window.__raf = { delivered: 0, scheduled: 0 };
    const queue = [];
    let tick = 0;
    const pump = () => {
      tick += 1;
      if (!${throttle} || tick % 4 === 0) {
        for (const cb of queue.splice(0)) {
          window.__raf.delivered += 1;
          cb(performance.now());
        }
      }
      orig(pump);
    };
    window.requestAnimationFrame = (cb) => {
      window.__raf.scheduled += 1;
      queue.push(cb);
      return window.__raf.scheduled;
    };
    orig(pump);
  })();
  `;

const readDepth = (page) =>
  page.evaluate(() => {
    const el = document.getElementById('hud-depth-text');
    if (!el) return null;
    const m = el.textContent.match(/(-?\d+)\s*m/);
    return m ? Number(m[1]) : null;
  });

// Read pixels over many rAF ticks and take the max luminance range, so a
// single present/swap that clears the back buffer cannot make the frame look
// blank. The game renders inside its rAF callback; our callbacks run after it
// in the same tick, so the buffer we read has just been drawn.
const readSample = (page) =>
  page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas && canvas.getContext('webgl2');
    if (!gl) return { ok: false };
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const d = new Uint8Array(w * h * 4);
    let best = 0;
    let ticks = 0;
    const step = () => {
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, d);
      let min = 255;
      let max = 0;
      for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (lum < min) min = lum;
        if (lum > max) max = lum;
      }
      if (max - min > best) best = max - min;
      ticks += 1;
      if (ticks < 45) window.requestAnimationFrame(step);
      else resolve2({ ok: true, lumRange: best, buffer: { w, h }, raf: window.__raf ? window.__raf.delivered : -1, ticks });
    };
    let resolve2;
    return new Promise((res) => {
      resolve2 = res;
      window.requestAnimationFrame(step);
    });
  });

const failures = [];
const report = { phases: {} };
const check = (name, cond, detail) => {
  if (!cond) failures.push(`${name}: ${detail}`);
  report[name] = { pass: cond, detail };
};

let browser;
const dev = startServer(['npm', 'run', 'dev'], devPort);
const preview = startServer(['npm', 'run', 'preview'], previewPort);

async function runPhase(throttle, port) {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  await ctx.addInitScript(rafInit(throttle));
  const page = await ctx.newPage();
  const consoleMsgs = [];
  const pageErrors = [];
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(`http://localhost:${port}/`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000); // settle; player at rest at depth ~100
  const d0 = await readDepth(page);
  await page.keyboard.down('s'); // hold S -> sink straight down
  const r0 = await page.evaluate(() => window.__raf.delivered);
  await page.waitForTimeout(WINDOW_MS);
  const d1 = await readDepth(page);
  const r1 = await page.evaluate(() => window.__raf.delivered);
  await page.screenshot({ path: out(throttle ? 'B-throttled-1920x1080.png' : 'A-dev-1920x1080.png') });
  const sample = await readSample(page);
  const result = {
    title: await page.title(),
    hasCanvas: await page.evaluate(() => !!document.querySelector('canvas')),
    hasWebGL2: sample.ok,
    buffer: sample.buffer,
    lumRange: sample.lumRange,
    d0,
    d1,
    depthDelta: d0 !== null && d1 !== null ? d1 - d0 : null,
    rafWindow: r1 - r0,
    pageErrors,
    consoleErrors: consoleMsgs.filter((m) => m.type === 'error'),
    consoleWarnings: consoleMsgs.filter((m) => m.type !== 'error'),
    localStorageFresh: await page.evaluate(() => window.localStorage.length),
  };
  await ctx.close();
  return result;
}

try {
  browser = await chromium.launch({
    executablePath: browserExe,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  check('dev server ready on port 5310', await waitReady(devPort, 90000), dev.log().slice(-800));
  const A = await runPhase(false, devPort);
  report.phases.A = A;
  const B = await runPhase(true, devPort);
  report.phases.B = B;

  check('preview server ready on port 5311', await waitReady(previewPort, 30000), preview.log().slice(-800));
  const C = await runPhase(false, previewPort);
  report.phases.C = C;

  const { A: a, B: b, C: c } = report.phases;
  // Boot (criterion 2)
  check('A title is HADAL', a.title === 'HADAL', a.title);
  check('A canvas present (dev)', a.hasCanvas === true, String(a.hasCanvas));
  check('A WebGL2 context (dev)', a.hasWebGL2 === true, JSON.stringify(a));
  check('A drawing buffer 1920x1080 (dpr 1)', a.buffer?.w === 1920 && a.buffer?.h === 1080, JSON.stringify(a.buffer));
  check('A frame non-blank (lumRange > 10)', (a.lumRange ?? 0) > 10, String(a.lumRange));
  check('A fresh profile (empty localStorage)', a.localStorageFresh === 0, String(a.localStorageFresh));
  check('A no page exceptions', a.pageErrors.length === 0, JSON.stringify(a.pageErrors));
  check('A no console errors', a.consoleErrors.length === 0, JSON.stringify(a.consoleErrors));
  // Production build also boots (forbidden-substitute #1)
  check('C title is HADAL (production build)', c.title === 'HADAL', c.title);
  check('C WebGL2 context (production build)', c.hasWebGL2 === true, JSON.stringify(c.buffer));
  check('C frame non-blank (production build)', (c.lumRange ?? 0) > 10, String(c.lumRange));
  check('C no page exceptions (production build)', c.pageErrors.length === 0, JSON.stringify(c.pageErrors));
  check('C no console errors (production build)', c.consoleErrors.length === 0, JSON.stringify(c.consoleErrors));
  // Cadence (criterion 3): depth must advance at real-time speed under throttle.
  check('A player sank (|depthDelta| > 100 m over 3 s)', Math.abs(a.depthDelta ?? 0) > 100, String(a.depthDelta));
  check('B player sank (|depthDelta| > 100 m over 3 s)', Math.abs(b.depthDelta ?? 0) > 100, String(b.depthDelta));
  check('B throttle effective (delivered rAF < 60% of A)', (b.rafWindow ?? 9999) < 0.6 * (a.rafWindow ?? 1), `A=${a.rafWindow} B=${b.rafWindow}`);
  check('B throttled rate above clamp floor (>10 Hz, gap < MAX_FRAME_DT)', b.rafWindow / (WINDOW_MS / 1000) > 10, String(b.rafWindow));
  check(
    'B cadence independent of rAF timing (depthDelta within 40% of A)',
    Math.abs(b.depthDelta - a.depthDelta) <= 0.4 * Math.max(Math.abs(a.depthDelta), 100),
    `A=${a.depthDelta} B=${b.depthDelta}`,
  );
} catch (err) {
  failures.push('exception: ' + (err && err.stack ? err.stack : String(err)));
} finally {
  if (browser) await browser.close();
  try {
    writeFileSync(out('result.json'), JSON.stringify({ failures, report }, null, 2));
  } catch (e) {
    console.error('failed to write result.json: ' + e);
  }
  for (const s of [dev, preview]) {
    spawn('taskkill', ['/t', '/f', '/pid', String(s.server.pid)], { stdio: 'ignore', windowsHide: true });
    await new Promise((r) => setTimeout(r, 1500));
    if (s.server.exitCode === null) s.server.kill('SIGKILL');
    writeFileSync(out(s === dev ? 'dev-server.log' : 'preview-server.log'), s.log());
  }
  clearTimeout(watchdog);
  console.log(JSON.stringify({ failures, phases: report.phases }, null, 2));
  if (failures.length) {
    process.exitCode = 1;
  } else {
    console.log('REVERIFY PROBE PASS: dev+production boot at 1920x1080, clean console, depth cadence independent of rAF');
  }
}
