// WI-02b focused browser check (request §13, §30, §34): boots the real
// `npm run dev` page in headless Chromium, injects the two WI-02a fixture
// organisms next to the player, and asserts that the creature renderers draw
// the simulation state — the spine visual tracks the simulated position, the
// body geometry animates over time, and there are no page/console errors.
//
// Question answered: does the render layer follow the sim in the real
// running game, with no console errors?
import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../..');
const PORT = Number(process.env.HADAL_BROWSER_PORT || 54331);

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

    // Inject the two WI-02a fixtures next to the player through the real
    // simulation (same construction path the world authoring uses).
    const injected = await page.evaluate(async () => {
      const game = window.__HADAL_GAME__;
      if (!game) return { ok: false, reason: 'window.__HADAL_GAME__ not present (need ?debug=1)' };
      const sim = game.sim;
      const { Creature } = await import('/src/creatures/Creature.ts');
      const { SCHOOLER, FORAGER } = await import('/src/creatures/fixtures.ts');
      const p = game.player.position;
      const schooler = new Creature(SCHOOLER, { x: p.x + 200, y: p.y - 60 }, sim.signals, () => 0.5);
      const forager = new Creature(FORAGER, { x: p.x + 400, y: p.y + 40 }, sim.signals, () => 0.5);
      sim.creatures.push(schooler, forager);
      return { ok: true, player: { x: p.x, y: p.y } };
    });
    assert.ok(injected.ok, 'the debug game handle is present (' + (injected.reason || '') + ')');
    await page.waitForTimeout(300); // let a few rAF frames run so update() builds visuals

    // Read the renderer's view of the scene from the real scene graph.
    const sample = () =>
      page.evaluate(() => {
        const game = window.__HADAL_GAME__;
        const sim = game.sim;
        const renderer = game.creatureRenderer;
        const out = { visuals: [], creatures: sim.creatures.length, time: sim.state.timeSec };
        for (const [c, v] of renderer.visuals) {
          const body = v.bodyGeom.attributes.position.array;
          let min = Infinity;
          let max = -Infinity;
          for (let i = 0; i < body.length; i += 3) {
            if (body[i] < min) min = body[i];
            if (body[i] > max) max = body[i];
          }
          out.visuals.push({
            id: c.def.id,
            active: c.active,
            group: { x: v.group.position.x, y: v.group.position.y },
            simPos: { x: c.position.x, y: c.position.y },
            bodyXMin: min,
            bodyXMax: max,
            bodyFirst: body.slice(0, 3).map((n) => Math.round(n * 100) / 100),
            partCount: v.partMeshes.length,
            finCount: v.finMeshes.length,
          });
        }
        return out;
      });

    const s1 = await sample();
    await page.waitForTimeout(900); // ~54 sim steps: the bodies must have moved
    const s2 = await sample();

    const byId = (s, id) => s.visuals.find((v) => v.id === id);
    const schooler1 = byId(s1, 'fixture-schooler');
    const forager1 = byId(s1, 'fixture-forager');
    assert.ok(schooler1 && forager1, `both fixture visuals exist (got ${JSON.stringify(s1.visuals.map((v) => v.id))})`);
    assert.equal(s1.creatures, 2, 'the sim holds both injected creatures');

    // The spine group tracks the simulated position exactly (request §13.2).
    assert.ok(
      Math.abs(forager1.group.x - forager1.simPos.x) < 0.01 && Math.abs(forager1.group.y - forager1.simPos.y) < 0.01,
      `the forager visual sits at its simulated position (visual ${JSON.stringify(forager1.group)} vs sim ${JSON.stringify(forager1.simPos)})`,
    );
    // The forager is the spine kind: a real body ribbon, plates, and fins.
    assert.ok(forager1.bodyXMax - forager1.bodyXMin > 40, `the forager body ribbon spans its trunk (x range ${Math.round(forager1.bodyXMax - forager1.bodyXMin)})`);
    assert.ok(forager1.partCount >= 2, `the forager shows its plates (partCount ${forager1.partCount})`);
    assert.ok(forager1.finCount >= 1, `the forager shows fins (finCount ${forager1.finCount})`);
    // The small-body schooler renders as a compact polygon, no trunk ribbon.
    assert.ok(schooler1.bodyXMax - schooler1.bodyXMin < 80, `the schooler body is compact (x range ${Math.round(schooler1.bodyXMax - schooler1.bodyXMin)})`);

    // The sim clock must have advanced between samples: the animation below
    // is driven by `sim.state.timeSec`, so this proves the game loop ran.
    assert.ok(s2.time > s1.time, `the simulation clock advanced (${s1.time} -> ${s2.time})`);

    // Animation: the body geometry must differ between samples (§13.5 —
    // noise modulated, not static, and the sim advanced in between).
    const forager2 = byId(s2, 'fixture-forager');
    const schooler2 = byId(s2, 'fixture-schooler');
    const bodyMoved = forager1.bodyFirst[0] !== forager2.bodyFirst[0] || forager1.bodyFirst[1] !== forager2.bodyFirst[1];
    const schoolerMoved = schooler1.bodyFirst[0] !== schooler2.bodyFirst[0] || schooler1.bodyFirst[1] !== schooler2.bodyFirst[1];
    assert.ok(bodyMoved || schoolerMoved, 'the body geometry animates between samples (§13.5)');

    // No console errors, in or out of the beam (request §15 readability is a
    // visual property; the error-free requirement is observable here).
    assert.equal(pageErrors.length, 0, `no page exceptions: ${pageErrors.join(' | ') || 'clean'}`);
    assert.equal(consoleErrors.length, 0, `no console errors: ${consoleErrors.join(' | ') || 'clean'}`);

    console.log('PASS creature renders track the sim in the real game');
    console.log(JSON.stringify({ s1, s2 }, null, 2));
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
