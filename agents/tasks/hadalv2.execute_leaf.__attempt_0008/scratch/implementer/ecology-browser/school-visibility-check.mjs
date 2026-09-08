// WI-02c browser check (request §20, §48): boots the real `npm run dev` page
// in headless Chromium, injects the school fixture next to the player through
// the real simulation, and asserts the school is VISIBLE (renderer visuals
// exist and track the sim positions), stays flocked, and parts when a
// predator is injected nearby (the flee reaction through the bus).
//
// Question answered: are the schools visible in the real running game, and
// does a predator signal make them part?
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54431);

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base + ' — set HADAL_BROWSER to a chrome.exe');
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

const SCHOOL = 5;

(async () => {
  const browserExe = resolveBrowser();
  const { child, getLog } = startServer();
  let browser;
  try {
    await waitReady();
    browser = await chromium.launch({
      executablePath: browserExe,
      headless: true,
      args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
    });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 15000 });
    assert.ok(await page.$('canvas'), 'the game booted');

    // Inject the school next to the player through the real simulation.
    const injected = await page.evaluate(async () => {
      const game = window.__HADAL_GAME__;
      if (!game) return { ok: false, reason: 'window.__HADAL_GAME__ not present (need ?debug=1)' };
      const sim = game.sim;
      const { Creature } = await import('/src/creatures/Creature.ts');
      const { SCHOOLER } = await import('/src/creatures/fixtures.ts');
      const p = game.player.position;
      for (let i = 0; i < 5; i += 1) {
        const c = new Creature(SCHOOLER, { x: p.x + 160 + i * 20, y: p.y - 60 }, sim.signals, () => 0.5);
        // One shared home for the whole school: a foraging member then seeks
        // the same point its neighbors seek, so the bounded flock force
        // (separation/cohesion/alignment) dominates their motion instead of
        // every member pinning to its own spawn slot.
        c.home = { x: p.x + 180, y: p.y - 60 };
        sim.creatures.push(c);
        sim.schoolMembers.push(c);
      }
      return { ok: true, player: { x: p.x, y: p.y } };
    });
    assert.ok(injected.ok, 'the debug game handle is present (' + (injected.reason || '') + ')');
    await page.waitForTimeout(300);

    const sample = () =>
      page.evaluate(() => {
        const game = window.__HADAL_GAME__;
        const sim = game.sim;
        const renderer = game.creatureRenderer;
        const schoolers = sim.creatures.filter((c) => c.def.id === 'fixture-schooler');
        const out = { school: [], predators: [], time: sim.state.timeSec };
        for (const c of schoolers) {
          const v = renderer.visuals.get(c);
          out.school.push({
            visual: v !== undefined,
            group: v === undefined ? null : { x: v.group.position.x, y: v.group.position.y },
            simPos: { x: c.position.x, y: c.position.y },
            vel: { x: c.velocity.x, y: c.velocity.y },
            state: c.state,
            active: c.active,
          });
        }
        for (const c of sim.creatures) {
          if (c.def.id === 'fixture-predator') out.predators.push({ x: c.position.x, y: c.position.y, state: c.state });
        }
        return out;
      });

    const s1 = await sample('pre');
    await page.waitForTimeout(2500); // ~150 sim steps: the school must have flocked and drifted
    const s2 = await sample('pre-late');

    assert.equal(s2.school.length, SCHOOL, 'the sim holds the injected school');
    assert.ok(s2.time > s1.time, 'the simulation clock advanced');
    assert.ok(
      s2.school.every((c) => c.visual),
      `every schooler has a renderer visual (got ${JSON.stringify(s2.school.map((c) => c.visual))})`,
    );
    assert.ok(
      s2.school.every((c) => c.active),
      `every schooler is active in the sim (got ${JSON.stringify(s2.school.map((c) => c.active))})`,
    );
    // The visuals track the simulated positions exactly.
    for (const c of s2.school) {
      assert.ok(
        Math.abs(c.group.x - c.simPos.x) < 0.01 && Math.abs(c.group.y - c.simPos.y) < 0.01,
        `schooler visual tracks the sim (${JSON.stringify(c.group)} vs ${JSON.stringify(c.simPos)})`,
      );
    }
    // Live, not frozen: with no signal on the bus the bounded flock forces
    // settle into a slow equilibrium — the members' individual velocities
    // stay non-trivial (they orbit their equilibrium point, so net
    // displacement over the window is small by construction). A live school
    // is confirmed by the DISCRIMINATING check below: it parts when a
    // predator is injected (the PREDATOR_TAG flee reaction).
    assert.ok(
      s2.school.every((c) => Math.hypot(c.vel.x, c.vel.y) > 1),
      `the school members have live velocities (vels ${JSON.stringify(s2.school.map((c) => c.vel))})`,
    );
    // Cohesion: bounded spread (FLOCK_RADIUS neighborhood keeps them together).
    const cc = {
      x: s2.school.reduce((a, c) => a + c.simPos.x, 0) / SCHOOL,
      y: s2.school.reduce((a, c) => a + c.simPos.y, 0) / SCHOOL,
    };
    const spread = Math.max(...s2.school.map((c) => Math.hypot(c.simPos.x - cc.x, c.simPos.y - cc.y)));
    assert.ok(spread < 350, `the school stays cohesive (spread ${spread.toFixed(0)}u)`);

    await page.screenshot({ path: 'agents/tasks/hadalv2.execute_leaf.__attempt_0008/scratch/implementer/ecology-browser/school-visible.png' });

    // Inject a predator 300u from the school center: the flock must part.
    const pred = await page.evaluate(async () => {
      const game = window.__HADAL_GAME__;
      const sim = game.sim;
      const { Creature } = await import('/src/creatures/Creature.ts');
      const { PREDATOR } = await import('/src/creatures/fixtures.ts');
      const schoolers = sim.creatures.filter((c) => c.def.id === 'fixture-schooler');
      const cx = schoolers.reduce((a, c) => a + c.position.x, 0) / schoolers.length;
      const cy = schoolers.reduce((a, c) => a + c.position.y, 0) / schoolers.length;
      const c = new Creature(PREDATOR, { x: cx + 300, y: cy }, sim.signals, () => 0.5);
      // Put the injected predator on the hunt: only hunting predators emit
      // the PREDATOR_TAG noise signal the school's flee reaction reads. In
      // the game loop the predator would have been alerted by the school's
      // own noise; here the probe drives the reaction directly.
      c.state = 'stalk';
      c.target = { x: cx, y: cy };
      sim.creatures.push(c);
      return { x: c.position.x, y: c.position.y, center: { x: cx, y: cy } };
    });
    const before = await sample('predator-injected');
    await page.waitForTimeout(1500); // ~90 sim steps: the flee reaction must steer the flock away
    const after = await sample('parted');

    // Parting measured from the flock's own center at injection time: the
    // mean member must move away from where the predator was placed (the
    // PREDATOR_TAG flee reaction, on top of the slow flock drift).
    const distFromCenter = (s) =>
      s.school
        .map((c) => Math.hypot(c.simPos.x - pred.center.x, c.simPos.y - pred.center.y))
        .reduce((a, b) => a + b, 0) / s.school.length;
    const dBefore = distFromCenter(before);
    const dAfter = distFromCenter(after);
    assert.ok(
      dAfter > dBefore + 50,
      `the school parts away from the injected predator (mean member distance from injection center ${dBefore.toFixed(0)} -> ${dAfter.toFixed(0)}u)`,
    );
    const predLate = after.predators[0];
    assert.ok(predLate !== undefined, 'the predator is still in the sim');

    await page.screenshot({ path: 'agents/tasks/hadalv2.execute_leaf.__attempt_0008/scratch/implementer/ecology-browser/school-parted.png' });

    assert.equal(pageErrors.length, 0, `no page exceptions: ${pageErrors.join(' | ') || 'clean'}`);
    assert.equal(consoleErrors.length, 0, `no console errors: ${consoleErrors.join(' | ') || 'clean'}`);

    console.log('PASS school is visible, flocked, and parts around the predator in the real game');
    console.log(JSON.stringify({ pred, dBefore, dAfter, predState: predLate.state }, null, 2));
  } catch (err) {
    console.error('FAIL', err && err.stack ? err.stack : err);
    if (browser) await browser.close().catch(() => {});
    stopServer(child);
    console.error('--- dev server log tail ---');
    console.error(getLog().slice(-2000));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    stopServer(child);
  }
})();
