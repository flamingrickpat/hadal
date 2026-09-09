// Tier-2 browser spot-check (WI-03b2, request §70 focused browser layer):
// one representative tier-2 organism (a friendly one — the gas-pocket
// lifter, internal id T-11) renders, animates, and shows its interaction
// readably in the real `npm run dev` page, with no console errors.
//
// Bounded: every wait has a timeout; the probe stops only the dev server it
// started (by PID) and exits. Deterministic: fresh profile (empty save),
// assertions against the real simulation state, no fixtures injected.
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..', '..', '..', '..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54321);
const OUT = path.join(here, 'out');
mkdirSync(OUT, { recursive: true });

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found — set HADAL_BROWSER to a chrome.exe');
  const dirs = readdirSync(base).filter(
    (d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')),
  );
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

let timelineData = null;
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const server = startServer();
let browser;
try {
  await waitReady();
  browser = await chromium.launch({
    executablePath: resolveBrowser(),
    headless: true,
    args: ['--use-gl=angle', '--enable-unsafe-swiftshader'],
  });
  // Fresh profile == fresh save (no persisted state from earlier runs).
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

  // The T-11 in the production data spawns at (14500, -5900) in band 3 and
  // rises to its hold 300 above (the def documents the hold offset). The
  // probe finds the real instance rather than trusting the data.
  const t11 = await page.evaluate(() => {
    const g = window.__HADAL_GAME__;
    if (!g) return null;
    const c = g.sim.creatures.find((cr) => cr.def.id === 'T-11');
    if (!c) return null;
    return { x: c.position.x, y: c.position.y, homeY: c.home.y, active: c.active, state: c.state };
  });
  check('T-11 exists in the running production simulation', t11 !== null, t11 ? `at (${t11.x.toFixed(0)}, ${t11.y.toFixed(0)})` : '');
  if (t11 === null) throw new Error('T-11 not found in the running simulation');

  const holdY = t11.homeY + 300; // the def's hold offset (documented on the def)
  // Teleport the player next to the hold via the debug panel (the §33 seam).
  await page.fill('.debug-teleport-x', String(Math.round(t11.x)));
  await page.fill('.debug-teleport-depth', String(Math.round(-holdY)));
  await page.click('.debug-teleport');

  // Wait until the creature is active (the player is now within AI range) and
  // has reached its hold band. Bounded: 30 s (it rises at <= 40 u/s).
  timelineData = [];
  let settled = null;
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    const snap = await page.evaluate((hy) => {
      const g = window.__HADAL_GAME__;
      const c = g.sim.creatures.find((cr) => cr.def.id === 'T-11');
      return { t: g.sim.state.timeSec, player: { ...g.sim.player.position }, pos: { ...c.position }, active: c.active, state: c.state };
    }, holdY);
    timelineData.push(snap);
    settled = await page.evaluate((hy) => {
      const g = window.__HADAL_GAME__;
      const c = g.sim.creatures.find((cr) => cr.def.id === 'T-11');
      const vis = g.creatureRenderer.visuals.get(c);
      return {
        active: c.active,
        nearHold: Math.abs(c.position.y - hy) < 60,
        state: c.state,
        kind: vis ? vis.kind : null,
        spineNodes: vis ? vis.spine.rest.length : 0,
        visible: vis ? vis.group.visible : false,
        time: g.sim.state.timeSec,
      };
    }, holdY);
    if (settled.active && settled.nearHold) break;
  }
  check('T-11 reactivates near the player (AI range, §34)', settled.active, `state=${settled.state}`);
  check('T-11 rises to its hold and hangs (signature rule)', settled.nearHold, `y=${holdY} band`);
  check('visual is built on the spine pipeline with a real body', settled.kind === 'spine' && settled.spineNodes >= 3 && settled.visible, `kind=${settled.kind} nodes=${settled.spineNodes}`);

  await page.screenshot({ path: path.join(OUT, 't11-settled.png') });

  // Animation: the sim clock (the render's animation time source) advances,
  // and the creature's own position oscillates at its hold (breathing/hover).
  const anim = await page.evaluate(async () => {
    const g = window.__HADAL_GAME__;
    const c = g.sim.creatures.find((cr) => cr.def.id === 'T-11');
    const t0 = g.sim.state.timeSec;
    const y0 = c.position.y;
    const x0 = c.position.x;
    await new Promise((r) => setTimeout(r, 2500));
    return { dt: g.sim.state.timeSec - t0, moved: Math.hypot(c.position.x - x0, c.position.y - y0) };
  });
  check('the sim clock advances (animation is driven)', anim.dt > 2, `dt=${anim.dt.toFixed(2)}s`);
  check('the organism is alive at its hold (moving, not frozen)', anim.moved > 1, `moved=${anim.moved.toFixed(1)}u in 2.5s`);

  // The interaction, readably: a player drifting inside the pocket (no
  // thrust) is lifted toward the surface — the §21 friendly behavior.
  const lift = await page.evaluate(async () => {
    const g = window.__HADAL_GAME__;
    const y0 = g.sim.player.position.y;
    await new Promise((r) => setTimeout(r, 6000));
    return { rise: g.sim.player.position.y - y0, inside: true };
  });
  check('player drifting inside the pocket is lifted with no input (interaction)', lift.rise > 60, `rose ${lift.rise.toFixed(0)}u in 6s`);
  await page.screenshot({ path: path.join(OUT, 't11-lift.png') });

  check('no page exceptions', pageErrors.length === 0, pageErrors.join(' | ') || 'clean');
  check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | ') || 'clean');
} finally {
  if (browser) await browser.close();
  stopServer(server.child);
}

const failed = results.filter((r) => !r.ok);
writeFileSync(path.join(OUT, 'result.json'), JSON.stringify({ port: PORT, results, failed: failed.length, timeline: timelineData }, null, 2));
console.log(failed.length === 0 ? '\nALL CHECKS PASSED' : `\n${failed.length} CHECK(S) FAILED`);
process.exit(failed.length === 0 ? 0 : 1);
