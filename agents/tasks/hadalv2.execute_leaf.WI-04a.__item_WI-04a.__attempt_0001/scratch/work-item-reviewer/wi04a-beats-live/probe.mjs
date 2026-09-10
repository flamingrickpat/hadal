// WI-04a reviewer browser probe (work-item-reviewer role, fresh session).
//
// Question answered: do the five authored spectacle beats fire, in the
// authored sequence, through the real trigger system inside the LIVE game
// page (production simulation + real render loop), with each beat's authored
// presentation state (camera modifier / audio cue / environmental-reaction
// ambient params) present in the live sim, the authored organism
// repositioned, player control preserved after a beat, and no console errors?
//
// The physical no-noclip route is proven headlessly (src/sim/
// beatScenario.test.ts — re-run by the reviewer before this probe). This
// probe positions the player with the request §33 debug teleport (a
// development measurement channel, not gameplay) and lets each beat fire
// through the live simulation, then reads the live sim state from the page
// (window.__HADAL_GAME__.sim, exposed under ?debug=1).
//
// Beat slot ids and internal roster ids only (request §0/§68): s1..s5 are
// the private reveal map's spectacle slot ids; T-NN are the stable ST-03
// internal organism ids. No private names are quoted anywhere here.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
// here = <repo>/agents/tasks/<child>/scratch/work-item-reviewer/<probe dir>: six levels up is the repo root.
const repoRoot = path.resolve(here, '..', '..', '..', '..', '..', '..');
const browserExe =
  process.env.PROBE_BROWSER ||
  'C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const port = 5223;
const outDir = path.join(here, 'output');
mkdirSync(outDir, { recursive: true });

const watchdog = setTimeout(() => {
  console.error('PROBE TIMEOUT (watchdog 240s)');
  process.exit(2);
}, 240000);

const server = spawn(
  'cmd',
  ['/c', 'npm', 'run', 'dev', '--', '--port', String(port), '--strictPort'],
  { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] },
);
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

async function waitReady(ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('dev server did not become ready. Last output:\n' + serverLog.slice(-2000));
}

const checks = {};
const trace = [];
const ok = (name, cond, detail) => {
  checks[name] = !!cond;
  trace.push(`${cond ? 'PASS' : 'FAIL'}: ${name}${detail ? ' — ' + detail : ''}`);
};

const consoleMsgs = [];
const pageErrors = [];
let browser;

try {
  await waitReady(60000);
  browser = await chromium.launch({
    executablePath: browserExe,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(`http://localhost:${port}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('#hud-root', { timeout: 15000 });
  // First gesture: a pointer click unlocks audio (autoplay rules) without
  // touching a key — under ?debug every keydown also toggles the debug panel.
  await page.mouse.click(960, 540);
  await page.waitForFunction(
    () => {
      const g = window.__HADAL_GAME__;
      return !!(g && g.sim && g.sim.triggers && g.sim.triggers.firedIds);
    },
    { timeout: 10000 },
  );
  await page.waitForTimeout(1200);
  ok('live game boots with a clean page and the debug sim handle', true);

  const snap = () =>
    page.evaluate(() => {
      const sim = window.__HADAL_GAME__.sim;
      return {
        t: sim.state.timeSec,
        fired: [...sim.triggers.firedIds],
        flags: [...sim.storyFlags],
        tflags: [...sim.triggerState.storyFlags],
        camera: sim.triggerState.cameraModifier,
        cues: [...sim.triggerState.audioCues],
        ambient: { ...sim.triggerState.ambient },
        px: sim.player.position.x,
        py: sim.player.position.y,
        depth: sim.player.depth,
        o2: sim.player.o2,
        o2Max: sim.player.o2Max,
        hp: sim.player.health,
      };
    });
  const creaturePos = (id) =>
    page.evaluate((cid) => {
      const c = window.__HADAL_GAME__.sim.creatures.find((x) => x.def.id === cid);
      return c ? { x: c.position.x, y: c.position.y } : null;
    }, id);
  const teleport = async (x, depth) => {
    await page.fill('.debug-teleport-x', String(x));
    await page.fill('.debug-teleport-depth', String(depth));
    await page.click('.debug-teleport');
    await page.waitForTimeout(500);
  };
  const firstSeen = {};
  const waitForBeat = async (id, timeoutMs = 20000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const s = await snap();
      if (s.fired.includes(id)) {
        firstSeen[id] = s.t;
        return s;
      }
      await page.waitForTimeout(300);
    }
    throw new Error(`beat ${id} did not fire within ${timeoutMs}ms`);
  };
  // Bank at the surface between stops: O2 refills within 100 of y=0 (§7).
  const bankO2 = async () => {
    await teleport(1300, 60);
    for (let i = 0; i < 12; i += 1) {
      const s = await snap();
      if (s.o2 >= s.o2Max - 5) break;
      await page.waitForTimeout(500);
    }
  };

  // s1 (shelf band, slot S1): the light procession + driver entrance.
  const before1 = await snap();
  ok('s1 not fired before the player enters the shelf band', !before1.fired.includes('enc-beat-s1'));
  await teleport(7000, 3500);
  const s1 = await waitForBeat('enc-beat-s1');
  ok('s1 fires through the live trigger system on shelf entry', s1.fired.includes('enc-beat-s1'));
  ok('s1 completion flag set in the live sim', s1.flags.includes('beat-s1'));
  ok('s1 audio cue present in the live sim', s1.cues.includes('beat-s1-lights'));
  ok('s1 ambient darkening present in the live sim', (s1.ambient.dim ?? 1) < 1);
  const t03 = await creaturePos('T-03');
  ok(
    's1 the light procession repositioned to its authored spot',
    !!t03 && Math.hypot(t03.x - 8500, t03.y - -3500) < 900,
    t03 && `T-03 at (${t03.x.toFixed(0)},${t03.y.toFixed(0)})`,
  );
  const t09 = await creaturePos('T-09');
  ok(
    's1 the driver repositioned to its authored spot',
    !!t09 && Math.hypot(t09.x - 11000, t09.y - -4800) < 900,
    t09 && `T-09 at (${t09.x.toFixed(0)},${t09.y.toFixed(0)})`,
  );
  await page.screenshot({ path: path.join(outDir, 's1-shelf.png') });
  await bankO2();

  // s2 (abyss depth line, slot S2): the structure-bound organism shift.
  const before2 = await snap();
  ok('s2 not fired above its authored depth line', !before2.fired.includes('enc-beat-s2'));
  const t22pre = await creaturePos('T-22');
  await teleport(15800, 9300);
  const s2 = await waitForBeat('enc-beat-s2');
  ok('s2 fires at its authored depth line in the live game', s2.fired.includes('enc-beat-s2'));
  ok('s2 completion flag set in the live sim', s2.flags.includes('beat-s2'));
  ok('s2 creak cue present in the live sim', s2.cues.includes('beat-s2-creak'));
  ok('s2 ambient darkening present in the live sim', (s2.ambient.dim ?? 1) <= 0.75);
  const t22 = await creaturePos('T-22');
  ok(
    's2 the structure-bound organism shifted west, against the drift',
    !!t22 && !!t22pre && t22.x <= t22pre.x - 200,
    t22 && `x ${t22pre && t22pre.x.toFixed(0)} -> ${t22.x.toFixed(0)}`,
  );
  ok('player alive at the s2 deep stop', s2.hp > 0, `hp=${s2.hp.toFixed(0)}`);
  await page.screenshot({ path: path.join(outDir, 's2-abyss.png') });
  await bankO2();

  // s3 (strip entry, slot S3): the wide framing + pulse reaction.
  await teleport(19200, 9580);
  const s3 = await waitForBeat('enc-beat-s3');
  ok('s3 fires at its authored depth line in the live game', s3.fired.includes('enc-beat-s3'));
  ok('s3 did not pull s4 (the s4 line was not crossed)', !s3.fired.includes('enc-beat-s4'));
  ok('s3 completion flag set in the live sim', s3.flags.includes('beat-s3'));
  ok('s3 wide camera modifier present in the live sim', s3.camera === 'wide');
  ok('s3 pulse cue present in the live sim', s3.cues.includes('beat-s3-pulse'));
  ok('s3 ambient surge present in the live sim', (s3.ambient.surge ?? 1) > 1);
  await bankO2();

  // s4 (strip entry line, slot S4): the tight framing + heartbeat reaction.
  await teleport(19200, 9650);
  const s4 = await waitForBeat('enc-beat-s4');
  ok('s4 fires at its authored strip-entry line in the live game', s4.fired.includes('enc-beat-s4'));
  ok('s4 completion flag set in the live sim', s4.flags.includes('beat-s4'));
  ok('s4 tight camera modifier present in the live sim', s4.camera === 'tight');
  ok('s4 heartbeat cue present in the live sim', s4.cues.includes('beat-s4-heartbeat'));
  ok('s4 ambient darkening present in the live sim', (s4.ambient.dim ?? 1) <= 0.6);
  await page.screenshot({ path: path.join(outDir, 's4-strip.png') });
  await bankO2();

  // s5 (east end, slot S5): the approach-radius fire + the crossing + pullback.
  const t25pre = await creaturePos('T-25');
  const tx = Math.max(20100, Math.min(22400, (t25pre ? t25pre.x : 22900) - 700));
  await teleport(tx, 9650);
  const s5 = await waitForBeat('enc-beat-s5');
  ok('s5 fires inside its authored approach radius in the live game', s5.fired.includes('enc-beat-s5'));
  ok('s5 completion flag set in the live sim', s5.flags.includes('beat-s5'));
  ok('s5 pullback camera modifier present in the live sim', s5.camera === 'pullback');
  ok('s5 clink cue present in the live sim', s5.cues.includes('beat-s5-plates'));
  ok('s5 ambient surge present in the live sim', (s5.ambient.surge ?? 1) >= 1.8);
  const t25 = await creaturePos('T-25');
  ok(
    's5 the plate cluster crossed west, against the drift',
    !!t25 && !!t25pre && t25.x <= t25pre.x - 200,
    t25 && `x ${t25pre && t25pre.x.toFixed(0)} -> ${t25.x.toFixed(0)}`,
  );
  await page.screenshot({ path: path.join(outDir, 's5-strip.png') });

  // Player control preserved after a beat (request §67): 1 s of west thrust
  // moves the player — no control lock, no cutscene. West is open water from
  // any s5 stop position (room interior or the strip's west gap). Runs last:
  // under ?debug a keydown also toggles the debug panel, and no more
  // teleports are needed after this.
  const px0 = s5.px;
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(1000);
  await page.keyboard.up('KeyA');
  const after = await snap();
  ok(
    'player control preserved after the beats (1 s of thrust moved the player)',
    after.px < px0 - 50,
    `x ${px0.toFixed(0)} -> ${after.px.toFixed(0)}`,
  );

  // Evidence for the reviewer: which storyFlags array holds the beat flags
  // in the live game (sim.storyFlags is what toSave() persists; the sim
  // builds the trigger context from it too).
  const flagEvidence = await snap();
  trace.push(
    `INFO: sim.storyFlags=${JSON.stringify(flagEvidence.flags)}` +
      ` triggerState.storyFlags=${JSON.stringify(flagEvidence.tflags)}`,
  );

  // The authored sequence: s1 < s2 < s3 < s4 < s5 (sim time of first fire).
  const order = ['enc-beat-s1', 'enc-beat-s2', 'enc-beat-s3', 'enc-beat-s4', 'enc-beat-s5'];
  const seen = order.map((id) => firstSeen[id]).filter((t) => t !== undefined);
  const increasing = seen.every((t, i) => i === 0 || t > seen[i - 1]);
  ok(
    'the five beats fired in the authored sequence s1..s5',
    seen.length === 5 && increasing,
    `first-fire sim times: ${seen.map((t) => t.toFixed(1)).join(' < ')}`,
  );

  const consoleErrors = consoleMsgs.filter((m) => m.type === 'error');
  ok('no page exceptions', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  ok('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).map((m) => m.text).join(' | '));

  writeFileSync(
    path.join(outDir, 'result.json'),
    JSON.stringify({ checks, trace, firstSeen, pageErrors, flagEvidence }, null, 2),
  );
  writeFileSync(path.join(outDir, 'console.json'), JSON.stringify({ consoleMsgs, pageErrors }, null, 2));
  console.log(trace.join('\n'));
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([n]) => n);
  if (failed.length) {
    console.log('PROBE FAIL: ' + failed.join('; '));
    process.exitCode = 1;
  } else {
    console.log(`PROBE PASS: all ${Object.keys(checks).length} checks green`);
  }
} catch (err) {
  console.error('PROBE FAIL: ' + (err && err.stack ? err.stack : String(err)));
  writeFileSync(path.join(outDir, 'error.txt'), String((err && err.stack) || err));
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  if (browser) await browser.close();
  writeFileSync(path.join(outDir, 'server.log'), serverLog);
  spawn('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
  await new Promise((r) => setTimeout(r, 2000));
  if (server.exitCode === null) server.kill('SIGKILL');
}
