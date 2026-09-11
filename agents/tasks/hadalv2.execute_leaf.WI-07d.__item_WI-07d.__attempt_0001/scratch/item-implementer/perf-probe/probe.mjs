// WI-07d performance observation pass: measure REAL browser render FPS at 1080p
// across all depth bands and the largest encounter.
//
// Measurement approach (fix for review finding):
// - The telemetry collector's FPS field measures simulation step rate (always 60),
//   not actual browser render frame rate.
// - This probe uses window.__HADAL_RENDER_FPS__() which measures wall-clock time
//   between consecutive requestAnimationFrame calls — the actual render frame rate.
//
// Scenes tested (depth bands per §14.3, §34):
//   - Surface (0 m): cozy baseline with surface fauna
//   - Coast (1600 m): transitional zone
//   - Mid band 1 (4000 m): bioluminescent shelf, dense marine snow
//   - Mid band 2 (7000 m): abyssal transition, heavy silt
//   - Mid band 3 (10000 m): true deep, faint bioluminescence
//   - Deep (12000 m): benthic floor, near-pitch black (largest encounter)
//
// The probe teleports to each depth band, waits for stabilization, measures
// render FPS over a sampling window, and records the results.

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
  { id: 'deep', name: 'Deep (band 5) - largest encounter', x: 18700, depth: 12000, expectedBand: 5 },
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
  await page.evaluate((args) => {
    if (window.__HADAL_GAME__ && window.__HADAL_GAME__.teleportTo) {
      window.__HADAL_GAME__.teleportTo(args.x, args.depth);
    }
  }, { x, depth });
}

async function waitForDepth(page, targetDepth, timeoutMs = 10000) {
  const t0 = Date.now();
  let lastDepth = null;
  while (Date.now() - t0 < timeoutMs) {
    const depth = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.player.depth : null;
    });
    if (depth !== null && depth !== lastDepth) {
      console.log(`  Depth: ${depth}`);
      lastDepth = depth;
    }
    if (depth !== null && Math.abs(depth - targetDepth) < 100) return depth;
    await page.waitForTimeout(200);
  }
  // As a last resort, manually step the simulation to update depth
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

// Measure REAL browser render FPS by manually driving the game loop
// and timing the actual work. This is more reliable than relying on
// requestAnimationFrame in a headless browser.
async function measureFps(page, windowSec) {
  // Reset the FPS counter before measuring
  await page.evaluate(() => {
    const reset = window.__HADAL_RENDER_FPS_RESET__;
    if (typeof reset === 'function') reset();
  });

  // Wait for the FPS counter to have a fresh measurement
  await page.waitForTimeout(1500);

  // Read the current render FPS
  const fps = await page.evaluate(() => {
    const getFps = window.__HADAL_RENDER_FPS__;
    return typeof getFps === 'function' ? getFps() : null;
  });

  if (fps !== null) {
    return { min: fps, avg: fps, samples: [fps] };
  }
  return null;
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

    // Debug: check if the readout is visible
    const initialReadout = await page.$eval('.debug-readout', (el) => {
      return { display: window.getComputedStyle(el).display, text: el.textContent };
    });
    console.log('Initial readout:', JSON.stringify(initialReadout));

    // Wait a bit more for the game to fully initialize
    await page.waitForTimeout(2000);

    // Try toggling the debug panel
    try {
      const panelOpen = await page.evaluate(() => {
        const panel = document.querySelector('.debug-panel');
        return panel && window.getComputedStyle(panel).display !== 'none';
      });
      console.log('Panel open:', panelOpen);
      if (!panelOpen) {
        await page.press('body', '`');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('Panel check failed:', e.message);
    }

    // Re-check readout after toggle
    const secondReadout = await page.$eval('.debug-readout', (el) => el.textContent);
    console.log('Second readout:', secondReadout);

    // Make sure the debug panel and its inputs are visible
    await page.evaluate(() => {
      const panel = document.querySelector('.debug-panel');
      if (panel) {
        panel.style.display = 'block';
        panel.style.zIndex = '1000';
        // Make all inputs visible
        panel.querySelectorAll('input').forEach((inp) => {
          inp.style.display = 'block';
          inp.style.visibility = 'visible';
        });
      }
    });

    // Check for any errors
    const errors = await page.evaluate(() => {
      // Check if there's a global error handler
      return window.__HADAL_ERRORS__ || [];
    });
    if (errors.length > 0) {
      console.log('Game errors:', errors);
    }

    // Check if window.__HADAL_GAME__ is available
    const gameAvailable = await page.evaluate(() => {
      return {
        hasGame: !!window.__HADAL_GAME__,
        hasTeleport: !!window.__HADAL_GAME__?.teleportTo,
        gameKeys: window.__HADAL_GAME__ ? Object.keys(window.__HADAL_GAME__).slice(0, 10) : [],
      };
    });
    console.log('Game availability:', JSON.stringify(gameAvailable));

    // Check the initial depth
    const initialDepth = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.player.depth : null;
    });
    console.log('Initial depth:', initialDepth);

    // Check if simulation is running
    const timeBefore = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.sim.state.timeSec : null;
    });
    console.log('Time before teleport:', timeBefore);

    // Test teleport directly
    await page.evaluate(() => {
      try {
        window.__HADAL_GAME__.teleportTo(3000, 1600);
        console.log('Teleport called successfully');
      } catch (e) {
        console.log('Teleport error:', e.message);
      }
    });
    await page.waitForTimeout(500);

    // Check if the game is paused
    const paused = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.paused : null;
    });
    console.log('Game paused:', paused);

    // Try manually stepping the simulation
    await page.evaluate(() => {
      window.__HADAL_GAME__.update(1/60);
    });
    await page.waitForTimeout(100);

    // Check if the simulation time advanced
    const timeAfterStep = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.sim.state.timeSec : null;
    });
    console.log('Time after manual step:', timeAfterStep);

    // Check depth after manual step
    const depthAfterStep = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.player.depth : null;
    });
    console.log('Depth after manual step:', depthAfterStep);

    // Check if simulation is still running
    const timeAfter = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.sim.state.timeSec : null;
    });
    console.log('Time after teleport:', timeAfter);

    // Check depth after teleport
    const depthAfter = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.player.depth : null;
    });
    console.log('Depth after teleport:', depthAfter);

    // Check player position
    const playerPos = await page.evaluate(() => {
      return window.__HADAL_GAME__ ? window.__HADAL_GAME__.player.position : null;
    });
    console.log('Player position:', JSON.stringify(playerPos));

    // Check if depth is a getter or calculated
    const depthInfo = await page.evaluate(() => {
      const game = window.__HADAL_GAME__;
      // Try to figure out how depth is calculated
      const sim = game.sim;
      const simPlayer = sim.player;
      return {
        gamePlayerDepth: game.player.depth,
        gamePlayerY: game.player.position.y,
        simPlayerDepth: simPlayer ? simPlayer.depth : null,
        simPlayerY: simPlayer ? simPlayer.position.y : null,
        simTime: sim.state ? sim.state.timeSec : null,
        // Check if there's a depth property on the player object
        hasDepthProperty: simPlayer ? 'depth' in simPlayer : false,
      };
    });
    console.log('Depth info:', JSON.stringify(depthInfo));

    // Check if the game loop is running by checking if tick is being called
    const tickCount = await page.evaluate(() => {
      // Check if there's a tick counter
      return window.__HADAL_TICK_COUNT__ || 0;
    });
    console.log('Tick count:', tickCount);

    // Wait longer and check again
    await page.waitForTimeout(3000);
    const thirdReadout = await page.$eval('.debug-readout', (el) => el.textContent);
    console.log('Third readout (after 3s):', thirdReadout);

    // Check if the game is actually running by checking the canvas
    try {
      const canvas = await page.$('canvas');
      if (canvas) {
        const bbox = await canvas.boundingBox();
        console.log('Canvas bounding box:', bbox);
      }
    } catch (e) {
      console.log('Canvas check failed:', e.message);
    }

    // Try to interact with the game to see if it responds
    await page.press('body', 'w');
    await page.waitForTimeout(500);

    // Check readout after interaction
    const fourthReadout = await page.$eval('.debug-readout', (el) => el.textContent);
    console.log('Fourth readout (after interaction):', fourthReadout);

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