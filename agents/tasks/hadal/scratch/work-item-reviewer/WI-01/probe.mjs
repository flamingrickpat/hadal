// WI-01 reviewer boot probe (independent of the implementer's probe).
// Question answered: does the committed scaffold really boot a WebGL2
// frame at 1920x1080 with a clean console in a fresh browser profile,
// does the production build also boot, and is the simulation cadence
// independent of requestAnimationFrame timing (work item criteria 2, 3)?
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const browserExe =
  'C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const devPort = 5210;
const previewPort = 5211;
const out = (name) => path.join(here, 'output', name);
mkdirSync(path.join(here, 'output'), { recursive: true });

const watchdog = setTimeout(() => {
  console.error('PROBE TIMEOUT (watchdog 150s)');
  process.exit(2);
}, 150000);

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

// In-page measurement: centroid Y of the bright boot marker (a 115x77 px
// box centred on screen x=960, bobbing on the simulation clock), plus the
// delivered-rAF counter installed by addInitScript.
async function sampleMarkerY(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const gl = canvas && canvas.getContext('webgl2');
    if (!gl) return { ok: false };
    // Schedule through the (possibly throttled) page rAF so the buffer is
    // read on a tick where the game itself rendered.
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        const d = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, d);
        let sum = 0;
        let sumY = 0;
        let min = 255;
        let max = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 880; x < 1040; x++) {
            const i = (y * w + x) * 4;
            const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
            if (lum < min) min = lum;
            if (lum > max) max = lum;
            if (lum > 60) {
              sumY += y;
              sum += 1;
            }
          }
        }
        resolve({
          ok: true,
          centroidY: sum > 0 ? sumY / sum : null,
          brightPixels: sum,
          lumRange: max - min,
          buffer: { w, h },
        });
      });
    });
  });
}

// vsync pump: page rAF callbacks are queued; the pump (running on the real
// rAF every vsync) delivers them all, or — when throttled — only every 4th
// vsync. Delivered callbacks get the real wall clock at invocation time, so
// an accumulator-style loop still advances simulation at real-time speed
// while a frame-tied loop advances at ~1/4 speed.
const rafInit = (throttle) =>
  `
  (() => {
    const orig = window.requestAnimationFrame.bind(window);
    window.__rafOrig = orig;
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

const failures = [];
const report = { phases: {} };
const check = (name, cond, detail) => {
  if (!cond) failures.push(`${name}: ${detail}`);
  report[name] = { pass: cond, detail };
};

let browser;
const dev = startServer(['npm', 'run', 'dev'], devPort);
const preview = startServer(['npm', 'run', 'preview'], previewPort);

try {
  browser = await chromium.launch({
    executablePath: browserExe,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  // ---- Phase A: dev server, unthrottled, fresh profile ------------------
  {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    await ctx.addInitScript(rafInit(false));
    const page = await ctx.newPage();
    const consoleMsgs = [];
    const pageErrors = [];
    page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    const ready = await waitReady(devPort, 90000);
    check('dev server ready on port 5210', ready, dev.log().slice(-800));
    await page.goto(`http://localhost:${devPort}/`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
    const a0 = await sampleMarkerY(page);
    const rafA0 = await page.evaluate(() => window.__raf.delivered);
    await page.waitForTimeout(3000);
    const a1 = await sampleMarkerY(page);
    const rafA1 = await page.evaluate(() => window.__raf.delivered);
    await page.screenshot({ path: out('A-dev-1920x1080.png') });
    const lsLen = await page.evaluate(() => window.localStorage.length);
    report.phases.A = {
      title: await page.title(),
      hasCanvas: await page.evaluate(() => !!document.querySelector('canvas')),
      hasWebGL2: a0.ok,
      a0,
      a1,
      markerDeltaY: a0.ok && a1.ok ? a1.centroidY - a0.centroidY : null,
      rafDeliveredWindow: rafA1 - rafA0,
      rafTotal: rafA1,
      pageErrors,
      consoleErrors: consoleMsgs.filter((m) => m.type === 'error'),
      consoleWarnings: consoleMsgs.filter((m) => m.type !== 'error'),
      localStorageFresh: lsLen,
    };
    await ctx.close();
  }

  // ---- Phase B: dev server, rAF throttled to ~1/4 -----------------------
  {
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    await ctx.addInitScript(rafInit(true));
    const page = await ctx.newPage();
    const consoleMsgs = [];
    const pageErrors = [];
    page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.goto(`http://localhost:${devPort}/`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);
    const b0 = await sampleMarkerY(page);
    const rafB0 = await page.evaluate(() => window.__raf.delivered);
    await page.waitForTimeout(3000);
    const b1 = await sampleMarkerY(page);
    const rafB1 = await page.evaluate(() => window.__raf.delivered);
    await page.screenshot({ path: out('B-dev-throttled-1920x1080.png') });
    report.phases.B = {
      title: await page.title(),
      hasCanvas: await page.evaluate(() => !!document.querySelector('canvas')),
      hasWebGL2: b0.ok,
      b0,
      b1,
      markerDeltaY: b0.ok && b1.ok ? b1.centroidY - b0.centroidY : null,
      rafDeliveredWindow: rafB1 - rafB0,
      pageErrors,
      consoleErrors: consoleMsgs.filter((m) => m.type === 'error'),
    };
    await ctx.close();
  }

  // ---- Phase C: production build via npm run preview --------------------
  {
    const ready = await waitReady(previewPort, 30000);
    check('preview server ready on port 5211', ready, preview.log().slice(-800));
    const ctx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    const consoleMsgs = [];
    const pageErrors = [];
    page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.goto(`http://localhost:${previewPort}/`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2500);
    const c0 = await sampleMarkerY(page);
    await page.screenshot({ path: out('C-preview-1920x1080.png') });
    report.phases.C = {
      title: await page.title(),
      hasCanvas: await page.evaluate(() => !!document.querySelector('canvas')),
      hasWebGL2: c0.ok,
      c0,
      pageErrors,
      consoleErrors: consoleMsgs.filter((m) => m.type === 'error'),
      consoleWarnings: consoleMsgs.filter((m) => m.type !== 'error'),
    };
    await ctx.close();
  }

  // ---- Cross-phase assertions -------------------------------------------
  const { A, B, C } = report.phases;
  check('A title is HADAL', A.title === 'HADAL', A.title);
  check('A canvas present (dev)', A.hasCanvas === true, String(A.hasCanvas));
  check('A WebGL2 context (dev)', A.hasWebGL2 === true, JSON.stringify(A.a0));
  check('A drawing buffer 1920x1080 (dev, dpr 1)', A.a0?.buffer?.w === 1920 && A.a0?.buffer?.h === 1080, JSON.stringify(A.a0?.buffer));
  check('A frame non-blank (luminance range > 10)', (A.a0?.lumRange ?? 0) > 10, String(A.a0?.lumRange));
  check('A fresh profile (empty localStorage)', A.localStorageFresh === 0, String(A.localStorageFresh));
  check('A no page exceptions', A.pageErrors.length === 0, JSON.stringify(A.pageErrors));
  check('A no console errors', A.consoleErrors.length === 0, JSON.stringify(A.consoleErrors));
  check('B no page exceptions', B.pageErrors.length === 0, JSON.stringify(B.pageErrors));
  check('B no console errors', B.consoleErrors.length === 0, JSON.stringify(B.consoleErrors));
  check('C title is HADAL (production build)', C.title === 'HADAL', C.title);
  check('C canvas present (production build)', C.hasCanvas === true, String(C.hasCanvas));
  check('C WebGL2 context (production build)', C.hasWebGL2 === true, JSON.stringify(C.c0));
  check('C frame non-blank (production build)', (C.c0?.lumRange ?? 0) > 10, String(C.c0?.lumRange));
  check('C no page exceptions (production build)', C.pageErrors.length === 0, JSON.stringify(C.pageErrors));
  check('C no console errors (production build)', C.consoleErrors.length === 0, JSON.stringify(C.consoleErrors));

  // Cadence: the marker bobs on the simulation clock (sin of timeSec). If
  // simulation were tied to rAF delivery, throttling rAF to ~1/4 would cut
  // the marker's 3 s displacement by ~4x. It must not.
  check('A marker moves (|deltaY| > 4 px over 3 s)', Math.abs(A.markerDeltaY ?? 0) > 4, String(A.markerDeltaY));
  check(
    'B throttle was effective (delivered rAF < 60% of A)',
    (B.rafDeliveredWindow ?? 9999) < 0.6 * (A.rafDeliveredWindow ?? 1),
    `A=${A.rafDeliveredWindow} B=${B.rafDeliveredWindow}`,
  );
  check(
    'B simulation cadence independent of rAF timing (deltaY within 35% of A)',
    Math.abs(B.markerDeltaY - A.markerDeltaY) <= 0.35 * Math.max(Math.abs(A.markerDeltaY), 4),
    `A=${A.markerDeltaY} B=${B.markerDeltaY}`,
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
    spawn('taskkill', ['/t', '/f', '/pid', String(s.server.pid)], {
      stdio: 'ignore',
      windowsHide: true,
    });
    await new Promise((r) => setTimeout(r, 1500));
    if (s.server.exitCode === null) s.server.kill('SIGKILL');
    writeFileSync(out(s === dev ? 'dev-server.log' : 'preview-server.log'), s.log());
  }
  clearTimeout(watchdog);
  console.log(JSON.stringify({ failures, phases: report.phases }, null, 2));
  if (failures.length) {
    process.exitCode = 1;
  } else {
    console.log('REVIEWER PROBE PASS: dev+production boot at 1920x1080, clean console, cadence independent of rAF');
  }
}
