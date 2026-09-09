// Tier-3 browser spot-check (WI-03c2, request §70 focused browser layer,
// presentation only): one representative tier-3 predator (the burst
// interceptor, internal id T-15) renders on the WI-02b spine pipeline in the
// real `npm run dev` page, telegraphs/commits visibly (the commit state
// widens the body and spreads the fins, request §48/§13.5), and the page runs
// with no console errors. No browser-reachability proof (request §70 layers).
//
// Bounded: every wait has a timeout; the probe stops only the dev server it
// started (by PID) and exits. Deterministic: fresh profile (empty save).
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..', '..', '..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54322);
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

  // Find the band-3 (twilight) T-15 in the running production simulation.
  const found = await page.evaluate(() => {
    const g = window.__HADAL_GAME__;
    if (!g) return null;
    const c = g.sim.creatures.find((cr) => cr.def.id === 'T-15' && cr.position.y > -8000 && cr.position.y < -4800);
    if (!c) return null;
    return { x: c.position.x, y: c.position.y };
  });
  check('the tier-3 burst interceptor exists in the running production simulation', found !== null, found ? `at (${found.x.toFixed(0)}, ${found.y.toFixed(0)})` : '');
  if (found === null) throw new Error('T-15 (band 3) not found in the running simulation');

  // Teleport the player next to it via the debug panel (the §33 seam).
  await page.fill('.debug-teleport-x', String(Math.round(found.x + 60)));
  await page.fill('.debug-teleport-depth', String(Math.round(-found.y)));
  await page.click('.debug-teleport');

  // Wait until the creature is active (the player is now within AI range, §34)
  // and its visual is built. Bounded: 30 s.
  let vis = null;
  for (let i = 0; i < 60; i += 1) {
    await page.waitForTimeout(500);
    vis = await page.evaluate(() => {
      const g = window.__HADAL_GAME__;
      const c = g.sim.creatures.find((cr) => cr.def.id === 'T-15' && cr.position.y > -8000 && cr.position.y < -4800);
      if (!c) return null;
      const v = g.creatureRenderer.visuals.get(c);
      return {
        active: c.active,
        visible: v ? v.group.visible : false,
        kind: v ? v.kind : null,
        spineNodes: v ? v.spine.rest.length : 0,
        playerHealth: g.sim.player.health,
        playerO2: g.sim.player.o2,
      };
    });
    if (vis && vis.active && vis.visible) break;
  }
  check('the predator is active and visible (AI range, §34)', !!(vis && vis.active && vis.visible), vis ? `state active=${vis.active} hp=${vis.playerHealth} o2=${vis.playerO2.toFixed(0)}` : '');
  check('the body is built on the spine pipeline with the tier-3 silhouette', !!(vis && vis.kind === 'spine' && vis.spineNodes >= 4), vis ? `kind=${vis.kind} nodes=${vis.spineNodes}` : '');
  await page.screenshot({ path: path.join(OUT, 't15-rest.png') });

  // Telegraph/commit visibility (request §48/§13.5): drive the real renderer
  // directly with the creature in its rest vs commit (charge) state at a fixed
  // time. The renderer is a pure adapter, so this reads exactly what the
  // browser draws; the commit widens the body and spreads the fins.
  const posture = await page.evaluate(() => {
    const g = window.__HADAL_GAME__;
    const c = g.sim.creatures.find((cr) => cr.def.id === 'T-15' && cr.position.y > -8000 && cr.position.y < -4800);
    const profile = { ambient: 0.5 };
    const finRange = (state) => {
      c.state = state;
      let lo = Infinity;
      let hi = -Infinity;
      for (let t = 0; t < 1.0; t += 0.05) {
        g.creatureRenderer.update([c], t, profile);
        const fin = g.creatureRenderer.visuals.get(c).finMeshes[0];
        lo = Math.min(lo, fin.rotation.z);
        hi = Math.max(hi, fin.rotation.z);
      }
      return hi - lo;
    };
    const span = (state) => {
      c.state = state;
      g.creatureRenderer.update([c], 0.3, profile);
      const pos = g.creatureRenderer.visuals.get(c).bodyGeom.attributes.position.array;
      let max = 0;
      for (let i = 0; i < pos.length; i += 3) max = Math.max(max, Math.hypot(pos[i], pos[i + 1]));
      return max;
    };
    const restFins = finRange('wander');
    const commitFins = finRange('attack');
    const restSpan = span('wander');
    const commitSpan = span('attack');
    c.state = 'attack'; // leave it in the committed pose for the screenshot
    g.creatureRenderer.update([c], 0.3, profile);
    return { restFins, commitFins, restSpan, commitSpan };
  });
  check('the commit widens the body silhouette (visible posture change)', posture.commitSpan > posture.restSpan, `rest=${posture.restSpan.toFixed(1)} commit=${posture.commitSpan.toFixed(1)}`);
  check('the commit spreads the fins (the pre-contact telegraph)', posture.commitFins > posture.restFins * 1.2, `rest=${posture.restFins.toFixed(2)} commit=${posture.commitFins.toFixed(2)}`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, 't15-commit.png') });

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
