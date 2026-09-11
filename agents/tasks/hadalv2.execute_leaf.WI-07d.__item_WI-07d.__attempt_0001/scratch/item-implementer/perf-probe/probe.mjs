// WI-07d performance observation pass: measure REAL browser render FPS at 1080p
// across all depth bands and the largest encounter.
//
// Measurement approach:
// - Uses window.__HADAL_RENDER_FPS__() which measures wall-clock time between
//   consecutive requestAnimationFrame calls — the actual render frame rate.
// - Takes multiple samples over a 5-second window to establish sustained FPS.
// - Verifies the frame loop is actually running by checking that FPS values
//   change over time (not stuck at default).
//
// Scenes tested (depth bands per §14.3, §34):
//   - Surface (0 m): cozy baseline with surface fauna
//   - Coast (1600 m): transitional zone
//   - Mid band 1 (4000 m): bioluminescent shelf, dense marine snow
//   - Mid band 2 (7000 m): abyssal transition, heavy silt
//   - Mid band 3 (10000 m): true deep, faint bioluminescence
//   - Deep (12000 m): benthic floor, near-pitch black (largest encounter)

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..', '..', '..');
const PORT = Number(process.env.HADAL_PERF_PORT || 54567);
const OUT = path.join(here, 'output');
mkdirSync(OUT, { recursive: true });

// Depth band test spots (teleport coordinates)
const SCENES = [
  { id: 'surface', name: 'Surface (band 0)', x: 1000, depth: 0, expectedBand: 0 },
  { id: 'coast', name: 'Coast (band 1)', x: 3000, depth: 1600, expectedBand: 1 },
  { id: 'mid1', name: 'Mid band 1 (band 2)', x: 5000, depth: 4000, expectedBand: 2 },
  { id: 'mid2', name: 'Mid band 2 (band 3)', x: 10000, depth: 7000, expectedBand: 3 },
  { id: 'mid3', name: 'Mid band 3 (band 4)', x: 15000, depth: 10000, expectedBand: 4 },
  { id: 'deep', name: 'Deep (band 5) - largest encounter', x: 18700, depth: 12000, expectedBand: 5 },
];

// FPS target per §34
const FPS_TARGET = 60;
const FPS_MEASURE_WINDOW_MS = 5000; // measure over 5 seconds
const SAMPLE_INTERVAL_MS = 1000; // take a sample every second
const STABILIZE_MS = 3000; // wait for scene to stabilize before measuring

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found — set HADAL_BROWSER');
  const dirs = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')));
  const versioned = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  if (versioned.length === 0) throw new Error('no chromium-*/chrome-win64/chrome.exe under ' + base);
  return path.join(base, versioned[versioned.length - 1].d, 'chrome-win64', 'chrome.exe');
}

function startServer() {
  const child = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(PORT), '--strictPort'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => (log += d));
  child.stderr.on('data', (d) => (log += d));
  return { child, getLog: () => log };
}

function stopServer(server) {
  spawnSync('taskkill', ['/t', '/f', '/pid', String(server.child.pid)], { stdio: 'ignore', windowsHide: true });
  if (server.child.exitCode === null) server.child.kill('SIGKILL');
}

async function waitReady() {
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('dev server did not become ready within 60s');
}

async function teleport(page, x, depth) {
  await page.evaluate((args) => {
    if (window.__HADAL_GAME__ && window.__HADAL_GAME__.teleportTo) {
      window.__HADAL_GAME__.teleportTo(args.x, args.depth);
    }
  }, { x, depth });
}

async function waitForDepth(page, targetDepth, timeoutMs = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const depth = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.player.depth : null;
    });
    if (depth !== null && Math.abs(depth - targetDepth) < 100) return depth;
    await page.waitForTimeout(200);
  }
  // Fallback: manual step
  await page.evaluate(() => {
    window.__HADAL_GAME__.update(1/60);
  });
  await page.waitForTimeout(100);
  const finalDepth = await page.evaluate(() => {
    return window.__HADAL_GAME__ ? window.__HADAL_GAME__.player.depth : null;
  });
  if (finalDepth !== null && Math.abs(finalDepth - targetDepth) < 100) return finalDepth;
  throw new Error(`depth never reached ${targetDepth}`);
}

// Take multiple FPS samples over a window to measure sustained performance.
// Verifies the frame loop is running by checking that FPS values change.
async function measureFps(page, windowMs = FPS_MEASURE_WINDOW_MS) {
  // Reset the FPS counter before measuring
  await page.evaluate(() => {
    const reset = window.__HADAL_RENDER_FPS_RESET__;
    if (typeof reset === 'function') reset();
  });

  const samples = [];
  const intervalMs = SAMPLE_INTERVAL_MS;
  let elapsed = 0;

  while (elapsed < windowMs) {
    // Wait for the FPS counter to have a fresh measurement
    await page.waitForTimeout(intervalMs);
    elapsed += intervalMs;

    // Read the current render FPS
    const fps = await page.evaluate(() => {
      const getFps = window.__HADAL_RENDER_FPS__;
      return typeof getFps === 'function' ? getFps() : null;
    });

    if (fps !== null) {
      samples.push(fps);
    }
  }

  if (samples.length === 0) return null;

  // Verify the frame loop is running: FPS values should vary over time.
  // If all values are identical, the loop may not be running or FPS is
  // stuck at the default value.
  const uniqueValues = new Set(samples);
  const isStuck = uniqueValues.size === 1 && samples[0] === 60;

  const min = Math.min(...samples);
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;

  return {
    min,
    avg: Math.round(avg * 10) / 10,
    samples,
    isStuck,
  };
}

const results = [];
let exitCode = 0;

try {
  const server = startServer();
  const browser = await chromium.launch({
    executablePath: resolveBrowser(),
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  try {
    await waitReady();
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    console.log('Navigating to game...');
    await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(3000);

    console.log('Game loaded. Testing each depth band...');

    for (const scene of SCENES) {
      console.log(`\nScene: ${scene.name} (depth ${scene.depth})`);

      // Teleport to the scene
      await teleport(page, scene.x, scene.depth);

      // Wait for the camera to settle at the target depth
      const actualDepth = await waitForDepth(page, scene.depth);
      console.log(`  Teleported to depth ${actualDepth}`);

      // Wait for the scene to stabilize (creatures, particles, lighting)
      await page.waitForTimeout(STABILIZE_MS);

      // Measure FPS over multiple samples
      console.log(`  Measuring FPS over ${FPS_MEASURE_WINDOW_MS / 1000}s...`);
      const fpsResult = await measureFps(page, FPS_MEASURE_WINDOW_MS);

      if (fpsResult) {
        const isLoopRunning = !fpsResult.isStuck;
        const passes = fpsResult.min >= FPS_TARGET;

        results.push({
          scene: scene.id,
          name: scene.name,
          depth: scene.depth,
          actualDepth,
          fpsMin: fpsResult.min,
          fpsAvg: fpsResult.avg,
          samples: fpsResult.samples,
          sampleCount: fpsResult.samples.length,
          isLoopRunning,
          passes,
        });

        console.log(`  Frame loop running: ${isLoopRunning}`);
        console.log(`  FPS samples: ${fpsResult.samples.join(', ')}`);
        console.log(`  FPS: min=${fpsResult.min} avg=${fpsResult.avg} (target ${FPS_TARGET}) — ${passes ? 'PASS' : 'FAIL'}`);
      } else {
        results.push({
          scene: scene.id,
          name: scene.name,
          depth: scene.depth,
          actualDepth,
          fpsMin: null,
          fpsAvg: null,
          samples: [],
          sampleCount: 0,
          isLoopRunning: false,
          passes: false,
        });
        console.log(`  FPS: could not measure`);
      }
    }

    // Report
    console.log('\n=== WI-07d Performance Report ===');
    console.log(`Target: ${FPS_TARGET} FPS at 1920x1080 (headless Chromium)`);
    console.log('');
    for (const r of results) {
      const status = r.passes ? 'PASS' : (r.fpsMin === null ? 'N/A' : 'FAIL');
      console.log(`${r.name}: min=${r.fpsMin ?? 'n/a'} avg=${r.fpsAvg ?? 'n/a'} samples=${r.sampleCount} loop=${r.isLoopRunning} [${status}]`);
    }
    console.log('');

    const allPass = results.every((r) => r.passes);
    if (allPass) {
      console.log('All scenes meet the 60 FPS target.');
    } else {
      console.log('Some scenes failed the 60 FPS target — see details above.');
      exitCode = 1;
    }

    // Write JSON results
    writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ target: FPS_TARGET, scenes: results, allPass }, null, 2));

  } finally {
    await browser.close();
    stopServer(server);
  }
} catch (e) {
  console.error('PROBE ERROR:', e.message);
  console.error(e.stack);
  exitCode = 2;
}

process.exit(exitCode);