// Diagnostic: inspect the live browser sim state to find why T-11 is frozen.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..', '..', '..', '..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54323);

function resolveBrowser() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const dirs = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')));
  const versioned = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  return path.join(base, versioned[versioned.length - 1].d, 'chrome-win64', 'chrome.exe');
}

const server = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(PORT), '--strictPort'], { cwd: repoRoot, stdio: 'ignore' });
try {
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  const browser = await chromium.launch({ executablePath: resolveBrowser(), headless: true, args: ['--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(1500);
  // Teleport the player next to the hold, like the probe does, and watch.
  await page.fill('.debug-teleport-x', '13400');
  await page.fill('.debug-teleport-depth', '5100');
  await page.click('.debug-teleport');
  // Instrument the live loop: log the creature's state each step.
  await page.evaluate(() => {
    const g = window.__HADAL_GAME__;
    const c = g.sim.creatures.find((cr) => cr.def.id === 'T-11');
    window.__T11_LOG__ = [];
    const origStep = g.sim.step.bind(g.sim);
    g.sim.step = (input, dt) => {
      const before = { x: c.position.x, y: c.position.y, v: { ...c.velocity }, st: c.state, tgt: c.target ? { ...c.target } : null, act: c.active };
      origStep(input, dt);
      window.__T11_LOG__.push({ t: g.sim.state.timeSec, before, after: { x: c.position.x, y: c.position.y, v: { ...c.velocity }, st: c.state, tgt: c.target ? { ...c.target } : null } });
      if (window.__T11_LOG__.length > 2000) window.__T11_LOG__.shift();
    };
  });
  const snap = await page.evaluate(async () => {
    await new Promise((r) => setTimeout(r, 15000)); // let it run 15 sim s
    const g = window.__HADAL_GAME__;
    const log = window.__T11_LOG__ ?? [];
    const c = g.sim.creatures.find((cr) => cr.def.id === 'T-11');
    // Summarize: first, mid, last few steps, and where y stopped changing.
    // Find the last step with any vertical movement, then dump a window.
    let lastMove = 0;
    for (let i = 1; i < log.length; i++) {
      if (Math.abs(log[i].after.y - log[i].before.y) > 1e-6) lastMove = i;
    }
    const win = log.slice(Math.max(0, lastMove - 2), lastMove + 3).map((r) => ({
      t: +r.t.toFixed(3), yb: +r.before.y.toFixed(2), ya: +r.after.y.toFixed(2),
      vyb: +r.before.v.y.toFixed(2), vla: +r.after.v.y.toFixed(2), tgt: r.before.tgt ? r.before.tgt.y : null,
    }));
    // For candidate T-11 locations, rise a root-radius-34 probe from the spawn
    // upward and report how many clear units of headroom there are before a
    // solid. Need >= 300 (the hold offset) plus margin.
    const clearance = (x, yStart) => {
      let clear = 0;
      for (let dy = 0; dy <= 420; dy += 2) {
        const p = { x, y: yStart + dy };
        const v = { x: 0, y: 40 };
        const r = g.sim.terrain.resolveCircle(p, 34, v);
        if (Math.hypot(r.x - x, r.y - (yStart + dy)) > 1e-6) break;
        clear = dy;
      }
      return clear;
    };
    const cands = [
      { x: 13400, y: -5400, note: 'current' },
      { x: 14500, y: -6200 }, { x: 14500, y: -5900 }, { x: 14500, y: -5600 },
      { x: 16000, y: -6200 }, { x: 16000, y: -5900 }, { x: 16000, y: -5600 },
      { x: 11800, y: -5900 }, { x: 11800, y: -5600 }, { x: 9400, y: -5900 }, { x: 9400, y: -5600 },
    ];
    const sweep = cands.map((cd) => ({ ...cd, clear: clearance(cd.x, cd.y) }));
    return { steps: log.length, lastMove, now: { pos: { ...c.position }, target: c.target ? { ...c.target } : null, vel: { ...c.velocity }, state: c.state }, clearance: sweep };
  });
  console.log(JSON.stringify(snap, null, 2));
  await browser.close();
} finally {
  spawnSync('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
  server.kill('SIGKILL');
}
