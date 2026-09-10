// Tier-4 browser spot-check (WI-03d2, request §70 focused browser layer,
// presentation only): one large organism (internal id T-19) and one colossal
// presence (T-23) render on the WI-02b spine pipeline through the section 52
// passes (background crossing layer, partial anatomy, foreground occluder,
// no center framing, sonar-scale readout), and the largest tier-4 scene stays
// smooth in a focused inspection (request §34). No browser-reachability
// proof (request §70 layers): all behavior evidence is headless in WI-03d1.
//
// The tier-4 production world placement lands in WI-03d3, so this probe
// injects the organisms through the real `Creature` class and real content
// defs (imported from the running dev server's module graph) into the live
// production simulation via the debug seam (§33). Everything observed — the
// sim stepping, the WI-02b renderer, the foreground pass, the page — is the
// production pipeline; only the spawn placement is a stand-in.
//
// Bounded: every wait has a timeout; the probe stops only the dev server it
// started (by PID) and exits.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..', '..', '..', '..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54322);
const OUT = path.join(here, 'out');
mkdirSync(OUT, { recursive: true });

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found — set HADAL_BROWSER to a chrome.exe');
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

function stopServer(child) {
  spawnSync('taskkill', ['/t', '/f', '/pid', String(child.pid)], { stdio: 'ignore', windowsHide: true });
  child.kill('SIGKILL');
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

// The open-water hadal lane (the production T-06/T-31 spawn water) and an
// open abyss spot (the production T-08 spawn) — injection positions.
const HADAL_LANE = { x: 19500, y: -9500 };
const HADAL_PLAYER = { x: 19500, depth: 9650 };
const ABYSS_SPOT = { x: 18700, y: -8900 };

const server = startServer();
let browser;
try {
  await waitReady();
  browser = await chromium.launch({
    executablePath: resolveBrowser(),
    headless: true,
    args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // ---- Phase A: one LARGE organism (T-19) on the playable plane ---------
  const a = await page.evaluate(async (spot) => {
    const g = window.__HADAL_GAME__;
    const [mod, fx, rngMod, math] = await Promise.all([
      import('/src/creatures/Creature.ts'),
      import('/src/creatures/fixtures.ts'),
      import('/src/util/rng.ts'),
      import('/src/util/math.ts'),
    ]);
    const c = new mod.Creature(fx.CREATURE_BY_ID['T-19'], math.vec2(spot.x, spot.y), g.sim.signals, rngMod.createRng(11));
    g.sim.creatures.push(c);
    g.sim.teleportTo(spot.x + 350, -spot.y);
    let v = null;
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 500));
      v = g.creatureRenderer.visuals.get(c);
      if (v && c.active && v.group.visible) break;
    }
    const span = (vis) => {
      const pos = vis.bodyGeom.attributes.position.array;
      let max = 0;
      for (let i = 0; i < pos.length; i += 3) max = Math.max(max, Math.hypot(pos[i], pos[i + 1]));
      return max;
    };
    return {
      active: c.active,
      visible: v ? v.group.visible : false,
      kind: v ? v.kind : null,
      spineNodes: v ? v.spine.rest.length : 0,
      groupZ: v ? v.group.position.z : null,
      span: v ? span(v) : 0,
      cleanFullBody: g.sim.hasCleanFullBody(c),
    };
  }, ABYSS_SPOT);
  check('the large organism renders on the spine pipeline', !!(a && a.active && a.visible && a.kind === 'spine'), a ? `active=${a.active} kind=${a.kind}` : '');
  check('the large body uses moderate spine segments (§34)', !!(a && a.spineNodes >= 3 && a.spineNodes <= 12), a ? `nodes=${a.spineNodes}` : '');
  check('the large organism sits on the playable plane (not the crossing layer)', !!(a && a.groupZ === 10), a ? `z=${a.groupZ}` : '');
  check('the large organism reads as large (the body is a big silhouette, not a mote)', !!(a && a.span >= 400), a ? `body span=${a ? a.span.toFixed(0) : '?'}` : '');
  await page.screenshot({ path: path.join(OUT, 't19-large.png') });

  // ---- Phase B: one COLOSSAL presence (T-23) through the §52 passes -----
  const b = await page.evaluate(async (args) => {
    const { lane, pl } = args;
    const g = window.__HADAL_GAME__;
    const [mod, fx, rngMod, math] = await Promise.all([
      import('/src/creatures/Creature.ts'),
      import('/src/creatures/fixtures.ts'),
      import('/src/util/rng.ts'),
      import('/src/util/math.ts'),
    ]);
    const c = new mod.Creature(fx.CREATURE_BY_ID['T-23'], math.vec2(lane.x, lane.y), g.sim.signals, rngMod.createRng(441));
    g.sim.creatures.push(c);
    // Drop the diver into the hadal lane: the crossing releases within
    // the sim's release radius and the fauna-announcement fires first.
    g.sim.teleportTo(pl.x, pl.depth);
    let v = null;
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 500));
      v = g.creatureRenderer.visuals.get(c);
      if (v && c.active && v.group.visible) break;
    }
    // Sample the crossing for ~8 s: the sim's visibility state and the
    // realized anatomy must never present the body whole.
    let cleanSim = false;
    let samples = 0;
    let minRealized = Infinity;
    let maxRealized = 0;
    for (let i = 0; i < 16; i += 1) {
      await new Promise((r) => setTimeout(r, 500));
      if (g.sim.hasCleanFullBody(c)) cleanSim = true;
      const vis = g.creatureRenderer.visuals.get(c);
      if (!vis || !vis.group.visible) continue;
      const pos = vis.bodyGeom.attributes.position.array;
      let realized = 0;
      const n = vis.spine.rest.length;
      for (let k = 0; k < n; k += 1) {
        const dx = pos[k * 6] - pos[k * 6 + 3];
        const dy = pos[k * 6 + 1] - pos[k * 6 + 4];
        if (Math.hypot(dx, dy) > 4) realized += 1;
      }
      samples += 1;
      minRealized = Math.min(minRealized, realized);
      maxRealized = Math.max(maxRealized, realized);
    }
    const v2 = g.creatureRenderer.visuals.get(c);
    return {
      active: c.active,
      visible: v2 ? v2.group.visible : false,
      kind: v2 ? v2.kind : null,
      spineNodes: v2 ? v2.spine.rest.length : 0,
      groupZ: v2 ? v2.group.position.z : null,
      renderOrder: v2 ? v2.group.renderOrder : null,
      cleanSim,
      samples,
      minRealized,
      maxRealized,
      nNodes: v2 ? v2.spine.rest.length : 0,
    };
  }, { lane: HADAL_LANE, pl: HADAL_PLAYER });
  check('the colossal presence renders on the spine pipeline', !!(b && b.active && b.visible && b.kind === 'spine'), b ? `active=${b.active} kind=${b.kind}` : '');
  check('the colossal body uses moderate spine segments (§34)', !!(b && b.spineNodes >= 3 && b.spineNodes <= 12), b ? `nodes=${b.spineNodes}` : '');
  check('the colossal presence is on the background crossing layer (technique B)', !!(b && b.groupZ === -20), b ? `z=${b.groupZ} order=${b.renderOrder}` : '');
  check('the player never gets a clean full-body view (AC-roster-large)', !!(b && b.samples > 0 && b.cleanSim === false), b ? `${b.samples} samples, cleanSim=${b.cleanSim}` : '');
  check('the body is only ever partially realized on screen (technique A)', !!(b && b.maxRealized < b.nNodes && b.minRealized >= 1), b ? `realized ${b.minRealized}..${b.maxRealized} of ${b.nNodes}` : '');
  await page.screenshot({ path: path.join(OUT, 't23-colossal.png') });

  // ---- The foreground occluder pass is live in the page ------------------
  const fg = await page.evaluate(() => {
    const g = window.__HADAL_GAME__;
    return {
      count: g.foreground.slabs.length,
      z: g.foreground.slabs.map((s) => s.position.z),
    };
  });
  check('the foreground occluder pass is live, in front of the playable plane (technique C)', !!(fg && fg.count >= 4 && fg.z.every((z) => z === 14)), fg ? `slabs=${fg.count} z=[${fg.z}]` : '');

  // ---- The sonar-scale readout (technique E): echo at impossible scale ---
  // The sim registers massive sonar objects at construction from its
  // creatures; the injected stand-ins are not in that registry (their
  // production placement is WI-03d3), so verify the sim's scale formula on
  // the real content def — the readout's rendering of that scale is asserted
  // in the node suite (tier4Render.test.ts, technique E).
  const sonar = await page.evaluate(async () => {
    const fx = await import('/src/creatures/fixtures.ts');
    const cmod = await import('/src/creatures/CreatureDef.ts');
    const consts = await import('/src/game/constants.ts');
    return { size: cmod.bodyExtent(fx.CREATURE_BY_ID['T-23']) / consts.SONAR_MASSIVE_REF };
  });
  check("the colossal presence's sonar readout is at impossible scale (technique E)", !!(sonar && sonar.size >= 4), sonar ? `size=${sonar ? sonar.size.toFixed(1) : '?'}` : '');

  // ---- §34 performance guard: the largest tier-4 scene stays smooth ------
  const perf = await page.evaluate(async (args) => {
    const { lane, spot } = args;
    const g = window.__HADAL_GAME__;
    const [mod, fx, rngMod, math] = await Promise.all([
      import('/src/creatures/Creature.ts'),
      import('/src/creatures/fixtures.ts'),
      import('/src/util/rng.ts'),
      import('/src/util/math.ts'),
    ]);
    // The full tier-4 roster in the hadal scene: the two already injected
    // (T-19 far, T-23 in the lane) plus the remaining three species.
    const spots = { 'T-19': spot, 'T-20': { x: lane.x + 220, y: lane.y + 150 }, 'T-22': { x: lane.x - 260, y: lane.y + 100 }, 'T-25': { x: lane.x + 350, y: lane.y + 20 } };
    for (const [id, p] of Object.entries(spots)) {
      const c = new mod.Creature(fx.CREATURE_BY_ID[id], math.vec2(p.x, p.y), g.sim.signals, rngMod.createRng(7));
      g.sim.creatures.push(c);
    }
    // Let the frame loop build the new visuals (a one-time allocation, not a
    // per-frame one), then measure growth over the steady-state window.
    await new Promise((r) => setTimeout(r, 1500));
    const beforeSet = new Set(g.renderer.scene.children);
    const before = g.renderer.scene.children.length;
    const dts = [];
    await new Promise((resolve) => {
      let last = performance.now();
      const tick = (now) => {
        dts.push(now - last);
        last = now;
        if (dts.length < 150) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    const after = g.renderer.scene.children.length;
    const added = g.renderer.scene.children
      .filter((ch) => !beforeSet.has(ch))
      .map((ch) => ({ ctor: ch.constructor.name, name: ch.name, type: ch.type, x: Math.round(ch.position.x), y: Math.round(ch.position.y), z: ch.position.z }));
    dts.sort((x, y) => x - y);
    const med = (a) => a[Math.floor(a.length / 2)];
    const first = med(dts.slice(0, Math.floor(dts.length / 2)));
    const second = med(dts.slice(Math.floor(dts.length / 2)));
    return { medianMs: med(dts), first, second, before, after, active: g.sim.creatures.filter((c) => c.active).length, added };
  }, { lane: HADAL_LANE, spot: ABYSS_SPOT });
  check('the largest tier-4 scene renders without per-frame scene growth (§34)', !!(perf && perf.before === perf.after), perf ? `children ${perf.before} -> ${perf.after}, active=${perf.active}` : '');
  check('the largest tier-4 scene stays smooth in the focused inspection (§34)', !!(perf && perf.medianMs < 100 && perf.second <= perf.first * 1.5 + 8), perf ? `median=${perf ? perf.medianMs.toFixed(1) : '?'}ms first=${perf ? perf.first.toFixed(1) : '?'}ms second=${perf ? perf.second.toFixed(1) : '?'}ms` : '');
  await page.screenshot({ path: path.join(OUT, 'tier4-scene.png') });

  check('no page exceptions', pageErrors.length === 0, pageErrors.join(' | ') || 'clean');
  check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | ') || 'clean');
} finally {
  if (browser) await browser.close();
  stopServer(server.child);
}

const failed = results.filter((r) => !r.ok);
writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ port: PORT, results, failed: failed.length }, null, 2));
console.log(failed.length === 0 ? '\nALL CHECKS PASSED' : `\n${failed.length} CHECK(S) FAILED`);
process.exit(failed.length === 0 ? 0 : 1);
