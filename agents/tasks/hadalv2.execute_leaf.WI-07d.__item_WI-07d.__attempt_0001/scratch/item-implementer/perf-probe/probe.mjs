// WI-07d performance observation pass: measure FPS at 1080p across depth bands
// and the largest encounter. Uses the telemetry collector built in WI-07a.
//
// Scenes tested (depth bands per §14.3, §34):
//   - Surface (0 m): cozy baseline with surface fauna
//   - Coast (1600 m): transitional zone
//   - Mid band 1 (4000 m): bioluminescent shelf, dense marine snow
//   - Mid band 2 (7000 m): abyssal transition, heavy silt
//   - Mid band 3 (10000 m): true deep, faint bioluminescence
//   - Deep (12000 m): benthic floor, near-pitch black
//
// The probe teleports to each depth band, waits for stabilization, measures
// FPS over a sampling window, and records the results. The largest encounter
// is the deepest band with the highest creature activity.
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

// Depth band test spots (teleport coordinates from existing debug probes)
const SCENES = [
  { id: 'surface', name: 'Surface (band 0)', x: 1000, depth: 0, expectedBand: 0 },
  { id: 'coast', name: 'Coast (band 1)', x: 3000, depth: 1600, expectedBand: 1 },
  { id: 'mid1', name: 'Mid band 1 (band 2)', x: 5000, depth: 4000, expectedBand: 2 },
  { id: 'mid2', name: 'Mid band 2 (band 3)', x: 10000, depth: 7000, expectedBand: 3 },
  { id: 'mid3', name: 'Mid band 3 (band 4)', x: 15000, depth: 10000, expectedBand: 4 },
  { id: 'deep', name: 'Deep (band 5)', x: 18700, depth: 12000, expectedBand: 5 },
];

// FPS target per §34
const FPS_TARGET = 60;
const FPS_WINDOW_SEC = 5; // measure over 5 seconds
const STABILIZE_SEC = 3; // wait for scene to stabilize before measuring

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
  await page.fill('.debug-teleport-x', String(x));
  await page.fill('.debug-teleport-depth', String(depth));
  await page.click('.debug-teleport');
}

async function waitForDepth(page, targetDepth, timeoutMs = 10000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const readout = await page.$eval('.debug-readout', (el) => el.textContent);
    const m = readout.match(/depth\s+(-?\d+\.?\d*)/);
    if (m) {
      const depth = Number(m[1]);
      if (Math.abs(depth - targetDepth) < 100) return depth;
    }
    await page.waitForTimeout(200);
  }
  throw new Error(`depth never reached ${targetDepth}`);
}

async function measureFps(page, windowSec) {
  // Read the current FPS from the debug readout over a window of time
  // The debug readout shows fps every 250ms (4 Hz)
  const samples = [];
  const t0 = Date.now();
  while (Date.now() - t0 < windowSec * 1000) {
    const readout = await page.$eval('.debug-readout', (el) => el.textContent);
    const m = readout.match(/fps\s+(\d+)/);
    if (m) {
      samples.push(Number(m[1]));
    }
    await page.waitForTimeout(300);
  }
  if (samples.length === 0) return null;
  // Return the minimum and average FPS (minimum is the bottleneck indicator)
  const min = Math.min(...samples);
  const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  return { min, avg, samples };
}

const results = [];
let exitCode = 0;

try {
  const server = startServer();
  const browser = await chromium.launch({ executablePath: resolveBrowser(), headless: true });

  try {
    await waitReady();
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();

    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });

    console.log('Navigating to game with debug panel...');
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
      await page.waitForTimeout(STABILIZE_SEC * 1000);

      // Measure FPS
      console.log(`  Measuring FPS over ${FPS_WINDOW_SEC}s...`);
      const fpsResult = await measureFps(page, FPS_WINDOW_SEC);

      if (fpsResult) {
        const passes = fpsResult.min >= FPS_TARGET;
        results.push({
          scene: scene.id,
          name: scene.name,
          depth: scene.depth,
          actualDepth,
          fpsMin: fpsResult.min,
          fpsAvg: fpsResult.avg,
          samples: fpsResult.samples.length,
          passes,
        });
        console.log(`  FPS: min=${fpsResult.min} avg=${fpsResult.avg} (target ${FPS_TARGET}) — ${passes ? 'PASS' : 'FAIL'}`);
      } else {
        results.push({
          scene: scene.id,
          name: scene.name,
          depth: scene.depth,
          actualDepth,
          fpsMin: null,
          fpsAvg: null,
          samples: 0,
          passes: false,
        });
        console.log(`  FPS: could not measure`);
      }
    }

    // Report
    console.log('\n=== WI-07d Performance Report ===');
    console.log(`Target: ${FPS_TARGET} FPS at 1920x1080 (SwiftShader/headless)`);
    console.log('');
    for (const r of results) {
      const status = r.passes ? 'PASS' : (r.fpsMin === null ? 'N/A' : 'FAIL');
      console.log(`${r.name}: min=${r.fpsMin ?? 'n/a'} avg=${r.fpsAvg ?? 'n/a'} samples=${r.samples} [${status}]`);
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

    // Screenshot at each failing scene (if any)
    for (const r of results) {
      if (!r.passes && r.fpsMin !== null) {
        console.log(`Taking screenshot at ${r.name}...`);
        await teleport(page, SCENES.find((s) => s.id === r.scene).x, SCENES.find((s) => s.id === r.scene).depth);
        await waitForDepth(page, r.depth);
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(OUT, `fail-${r.scene}.png`) });
      }
    }

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
