// WI-02 reviewer probe — independent adversarial verification, separate from
// the implementer's probe.
//
// Questions answered (work item criteria + request sections):
//   1. In the real dev-server page, is movement inertial per request §6
//      (thrust builds bounded velocity; on release the player keeps drifting
//      but decays; NOT frictionless)?
//   2. Does circle-vs-segment terrain collision block the player against the
//      seabed and both walls (request §31, §17), from the outside?
//   3. Is the greybox world swimmable end to end (west end to east end)?
//   4. Does O2 deplete below the surface, and does zero O2 enter a
//      health-draining state; does the surface refill O2/HP (request §7)?
//   5. Does the minimal HUD show O2 / health / depth / tool and fade when
//      full (request §26)?
//   6. Does the §6 keyboard mapping hold in the real page (WASD via the
//      dive test, 1-4 tool select, Esc pause freezing the sim) and does the
//      body face the mouse aim (request §6)?
//   7. Does ?debug=1 show the debug panel and does backtick+F2 toggle it,
//      with teleport setting exact position/depth (request §33)?
//   8. No page exceptions / console errors (request §70).
//
// Method: real `npm run dev` server on a private port, local ms-playwright
// Chromium (SwiftShader, real WebGL2), fresh context, real keyboard/mouse
// events. Simulation runs at fixed 1/60 s steps fed by real elapsed time, so
// sim time ~ wall time; tolerances absorb <= 1 step of jitter.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const outDir = path.join(here, 'output');
const browserExe =
  'C:/Users/rick/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const port = 5196;
mkdirSync(outDir, { recursive: true });

const watchdog = setTimeout(() => {
  console.error('PROBE TIMEOUT (watchdog 480s)');
  process.exit(2);
}, 480000);

function startServer(p) {
  const server = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(p), '--strictPort'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
  return { server, log: () => log };
}

async function waitReady(p, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(`http://localhost:${p}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

const failures = [];
const report = {};
const check = (name, cond, detail) => {
  if (!cond) failures.push(`${name}: ${detail}`);
  report[name] = { pass: cond, detail: String(detail).slice(0, 500) };
};

const READOUT_RE =
  /x (-?\d+\.\d)  depth (-?\d+\.\d)  o2 (\d+)s  hp (\d+)  facing (-?\d+\.\d\d)  aim (-?\d+\.\d) (-?\d+\.\d)/;

async function readReadout(page) {
  const text = await page.textContent('#debug-readout');
  const m = text && text.match(READOUT_RE);
  if (!m) return { raw: text };
  return {
    raw: text,
    x: parseFloat(m[1]),
    depth: parseFloat(m[2]),
    o2: parseInt(m[3], 10),
    hp: parseInt(m[4], 10),
    facing: parseFloat(m[5]),
    aimX: parseFloat(m[6]),
    aimY: parseFloat(m[7]),
  };
}

const wrap = (a) => {
  let f = (a + Math.PI) % (2 * Math.PI);
  if (f < 0) f += 2 * Math.PI;
  return f - Math.PI;
};

async function teleport(page, x, depth) {
  await page.fill('#debug-x', String(x));
  await page.fill('#debug-depth', String(depth));
  await page.click('#debug-apply');
}

let browser;
const dev = startServer(port);

try {
  browser = await chromium.launch({
    executablePath: browserExe,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  const pageErrors = [];
  page.on('console', (m) => consoleMsgs.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => pageErrors.push(String(e)));

  const ready = await waitReady(port, 90000);
  check('dev server ready on port 5196', ready, dev.log().slice(-800));
  await page.goto(`http://localhost:${port}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);

  // ---- A: boot state -----------------------------------------------------
  const boot = {
    title: await page.title(),
    hasCanvas: await page.evaluate(() => !!document.querySelector('canvas')),
    hasWebGL2: await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return !!(c && c.getContext('webgl2'));
    }),
    panelDisplay: await page.evaluate(() => document.getElementById('debug-panel').style.display),
    o2Text: await page.textContent('#hud-o2'),
    hpText: await page.textContent('#hud-hp'),
    depthText: await page.textContent('#hud-depth-text'),
    toolText: await page.textContent('#hud-tool-text'),
    o2RowOpacity: await page.evaluate(() => document.getElementById('hud-o2').style.opacity),
    hpRowOpacity: await page.evaluate(() => document.getElementById('hud-hp').style.opacity),
    readout: await readReadout(page),
  };
  report.boot = boot;
  check('A title is HADAL', boot.title === 'HADAL', boot.title);
  check('A canvas + WebGL2 present', boot.hasCanvas === true && boot.hasWebGL2 === true, JSON.stringify(boot));
  check('A ?debug=1 shows the debug panel', boot.panelDisplay === 'block', boot.panelDisplay);
  check('A HUD shows O2 180s at start', boot.o2Text.trim().endsWith('180s'), boot.o2Text);
  check('A HUD shows HP 100 at start', boot.hpText.trim().endsWith('100'), boot.hpText);
  check('A HUD depth is 100m at start (player starts at depth 100)', boot.depthText === '100m', boot.depthText);
  check('A HUD tool is the starter knife', boot.toolText === 'Salvage Knife', boot.toolText);
  check('A full O2 row fades (opacity 0.25)', boot.o2RowOpacity === '0.25', boot.o2RowOpacity);
  check('A full HP row fades (opacity 0.25)', boot.hpRowOpacity === '0.25', boot.hpRowOpacity);
  check('A readout starts at x 1300 depth 100', boot.readout.x === 1300 && boot.readout.depth === 100, boot.readout.raw);
  await page.screenshot({ path: path.join(outDir, 'A-boot-reviewer.png') });

  // ---- B: inertial dive (request §6) -------------------------------------
  // O2 drains at exactly 1/s below depth 100, so it is a simulation-time
  // clock: headless rAF delivery varies, so measure in sim seconds, not wall.
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(3000);
  await page.keyboard.up('KeyS');
  const r1 = await readReadout(page);
  const d1 = r1.depth - 100;
  const samples = [r1];
  let rEnd = r1;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(500);
    rEnd = await readReadout(page);
    samples.push(rEnd);
    if (rEnd.o2 - r1.o2 <= -5) break; // >= 5 sim seconds of coast
  }
  const W = r1.o2 - rEnd.o2; // sim seconds between r1 and rEnd
  const rMid = samples.reduce((best, s) =>
    Math.abs(Math.abs(s.o2 - r1.o2) - W / 2) < Math.abs(Math.abs(best.o2 - r1.o2) - W / 2) ? s : best,
  samples[2]);
  const driftMid = rMid.depth - r1.depth;
  const driftTotal = rEnd.depth - r1.depth;
  const driftLate = driftTotal - driftMid;
  report.inertial = { r1, rMid, rEnd, W, d1, driftMid, driftLate, driftTotal };
  check('B 3 s S-dive reaches depth 400-850 (not 100, not unbounded)', d1 >= 400 && d1 <= 850, `depth=${r1.depth}`);
  check('B coast window covered >= 5 sim seconds (O2 clock)', W >= 5, `W=${W}s`);
  check('B release: player keeps drifting 60-200 units (inertial; frictionless would be ~275*W)', driftTotal >= 60 && driftTotal <= 200, `drift=${driftTotal.toFixed(1)} over W=${W}s`);
  check('B drift is decaying across the coast (2nd half < first half), i.e. NOT frictionless', driftLate < driftMid && driftLate > 5, `first=${driftMid.toFixed(1)} second=${driftLate.toFixed(1)}`);
  check('B O2 depleted below surface', rEnd.o2 <= 174, `o2=${rEnd.o2}`);
  check('B O2 row no longer faded after depletion', (await page.evaluate(() => document.getElementById('hud-o2').style.opacity)) === '1', 'opacity');
  check('B HUD depth text tracks the readout (<=5 m while moving)', Math.abs(parseInt((await page.textContent('#hud-depth-text')).replace('m', ''), 10) - rEnd.depth) <= 5, await page.textContent('#hud-depth-text'));

  // ---- C: seabed blocks (request §31) ------------------------------------
  // The floor between x 1000 and 1800 slopes (rising to the east); pressing
  // down slides the player tangentially west along it. The invariant is that
  // the player sits exactly one radius above the LOCAL floor.
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(8000);
  await page.keyboard.up('KeyS');
  const r3 = await readReadout(page);
  await page.waitForTimeout(1000);
  const r4 = await readReadout(page);
  report.seabed = { r3, r4 };
  const floorDepthAt = (x) => 1420 - (Math.min(Math.max(x, 1000), 1800) - 1000) * 0.0875;
  check('C seabed saturation: depth = local floor - 30 (one radius)', Math.abs(r3.depth - floorDepthAt(r3.x)) <= 2 && r3.depth >= 1380, `depth=${r3.depth} x=${r3.x} expected=${floorDepthAt(r3.x).toFixed(1)}`);
  check('C still blocked after 1 s of extra hold (|delta| < 5)', Math.abs(r4.depth - r3.depth) < 5, `r3=${r3.depth} r4=${r4.depth}`);
  check('C slide is westward along the slope or none (no eastward push, no horizontal input)', r3.x <= 1305 && r3.x >= 900, `x=${r3.x}`);
  check('C r4 also sits on the local floor (slide follows the terrain)', Math.abs(r4.depth - floorDepthAt(r4.x)) <= 2, `depth=${r4.depth} x=${r4.x} expected=${floorDepthAt(r4.x).toFixed(1)}`);
  await page.screenshot({ path: path.join(outDir, 'C-seabed-reviewer.png') });

  // ---- D: central wall blocks from the west (request §31) ---------------
  await teleport(page, 2200, 700);
  await page.waitForTimeout(1200); // camera settle
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(4000);
  await page.keyboard.up('KeyD');
  const r5 = await readReadout(page);
  await page.waitForTimeout(1000);
  const r6 = await readReadout(page);
  report.wall = { r5, r6 };
  check('D wall face blocks: x saturates at 2340 (wall face 2370, radius 30)', r5.x >= 2336 && r5.x <= 2344, `x=${r5.x}`);
  check('D still blocked after 1 s (|delta| < 5)', Math.abs(r6.x - r5.x) < 5, `r5=${r5.x} r6=${r6.x}`);
  check('D HUD depth text exact at rest: 700m', (await page.textContent('#hud-depth-text')) === '700m', await page.textContent('#hud-depth-text'));

  // ---- E: west wall blocks from the east (request §31) ------------------
  await teleport(page, -2300, 1000);
  await page.waitForTimeout(1200);
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(4000);
  await page.keyboard.up('KeyA');
  const r7 = await readReadout(page);
  report.westWall = { r7 };
  check('E west wall face blocks: x saturates at -2466 (face -2496, radius 30)', r7.x >= -2470 && r7.x <= -2462, `x=${r7.x}`);

  // ---- F: swimmable end to end (request §17) ----------------------------
  await teleport(page, -2950, 300);
  await page.waitForTimeout(1200);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(32000);
  await page.keyboard.up('KeyD');
  const r8 = await readReadout(page);
  report.endToEnd = { r8 };
  check('F east end face blocks: x saturates at 5570 (end 5600, radius 30) after full crossing', r8.x >= 5560 && r8.x <= 5572, `x=${r8.x}`);
  await page.screenshot({ path: path.join(outDir, 'F-east-reviewer.png') });

  // ---- G: zero O2 -> health-draining state (request §7) -----------------
  // O2 carries over from earlier phases (it is not reset by teleport), so
  // poll the O2 clock until it reads 0, then measure the HP drop over the
  // next ~10 wall seconds (7.5-11 sim seconds at observed rAF rates).
  await teleport(page, 1300, 150);
  let r9 = await readReadout(page);
  const gStart = Date.now();
  while (r9.o2 !== 0 && Date.now() - gStart < 200000) {
    await page.waitForTimeout(1000);
    r9 = await readReadout(page);
  }
  const hpAtZero = r9.hp;
  await page.waitForTimeout(10000);
  const r10 = await readReadout(page);
  report.zeroO2 = { r9, hpAtZero, r10, waitMs: Date.now() - gStart };
  check('G O2 reaches 0s while resting at depth 150', r9.o2 === 0, `o2=${r9.o2}`);
  check('G HP was still positive when O2 hit 0 (drain not pre-empted)', hpAtZero > 5, `hp=${hpAtZero}`);
  check('G HP keeps draining at ~5/s (drop 30-62 over 10 s)', r10.hp < hpAtZero && hpAtZero - r10.hp >= 30 && hpAtZero - r10.hp <= 62, `hp ${hpAtZero} -> ${r10.hp}`);
  check('G O2 stays at 0 (no spurious refill at depth 150)', r10.o2 === 0, `o2=${r10.o2}`);
  check('G HUD HP text matches readout', (await page.textContent('#hud-hp')).trim().endsWith(String(r10.hp)), await page.textContent('#hud-hp'));

  // ---- H: surface refill (request §7) ------------------------------------
  // O2 is at 0 entering this phase (from G), so the refill rate is directly
  // measurable. Sim time tracks wall time in this environment (verified in G),
  // so a 5 s wall interval is ~5 sim seconds.
  await teleport(page, 1300, 50);
  await page.waitForTimeout(300);
  const o0 = await readReadout(page);
  await page.waitForTimeout(5000);
  const o1 = await readReadout(page);
  const o2Rate = (o1.o2 - o0.o2) / 5.0;
  let r11 = o1;
  const hStart = Date.now();
  while (r11.hp !== 100 && Date.now() - hStart < 20000) {
    await page.waitForTimeout(1000);
    r11 = await readReadout(page);
  }
  report.surface = { o0, o1, o2Rate, r11, waitMs: Date.now() - hStart };
  check('H O2 starts near 0 at depth 50', o0.o2 <= 5, `o2=${o0.o2}`);
  check('H O2 refills near the surface at ~12/s (rate 8-16)', o2Rate >= 8 && o2Rate <= 16, `rate=${o2Rate.toFixed(1)}/s (${o0.o2} -> ${o1.o2})`);
  check('H HP heals back to 100 near the surface', r11.hp === 100, `hp=${r11.hp}`);

  // ---- I: tool select, pause, mouse aim, backtick+F2 (request §6/§33) ---
  await page.keyboard.press('Digit2');
  await page.waitForTimeout(300);
  const tool2 = await page.textContent('#hud-tool-text');
  await page.keyboard.press('Digit3');
  await page.waitForTimeout(300);
  const tool3 = await page.textContent('#hud-tool-text');
  await page.keyboard.press('Digit4');
  await page.waitForTimeout(300);
  const tool4 = await page.textContent('#hud-tool-text');
  report.tools = { tool2, tool3, tool4 };
  check('I Digit2 selects Work Light', tool2 === 'Work Light', tool2);
  check('I Digit3 selects Simple Harpoon', tool3 === 'Simple Harpoon', tool3);
  check('I Digit4 out of range: selection unchanged (slot 4 empty)', tool4 === 'Simple Harpoon', tool4);

  await page.mouse.move(100, 100); // top-left of screen
  await page.waitForTimeout(1500);
  const r12 = await readReadout(page);
  const tgt12 = wrap(Math.atan2(r12.aimY - -r12.depth, r12.aimX - r12.x));
  await page.mouse.move(1820, 980); // bottom-right
  await page.waitForTimeout(1500);
  const r13 = await readReadout(page);
  const tgt13 = wrap(Math.atan2(r13.aimY - -r13.depth, r13.aimX - r13.x));
  report.aim = { r12, tgt12, r13, tgt13 };
  check('I facing tracks mouse aim (top-left)', Math.abs(wrap(r12.facing) - tgt12) < 0.3, `facing=${r12.facing} target=${tgt12.toFixed(2)}`);
  check('I facing tracks mouse aim (bottom-right)', Math.abs(wrap(r13.facing) - tgt13) < 0.3, `facing=${r13.facing} target=${tgt13.toFixed(2)}`);

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const pausedDisplay = await page.evaluate(() => document.getElementById('pause-overlay').style.display);
  const r14 = await readReadout(page);
  await page.waitForTimeout(2100);
  const r15 = await readReadout(page);
  report.pause = { pausedDisplay, r14, r15 };
  check('I Esc shows the pause overlay', pausedDisplay === 'block', pausedDisplay);
  check('I sim frozen while paused (readout identical after 2.1 s)', r15.raw === r14.raw, `${r14.raw} | ${r15.raw}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(2500);
  const resumedDisplay = await page.evaluate(() => document.getElementById('pause-overlay').style.display);
  const r16 = await readReadout(page);
  report.pause.r16 = r16;
  report.pause.resumedDisplay = resumedDisplay;
  check('I resume clears overlay and sim continues (O2 refilled +15 or more)', resumedDisplay === 'none' && r16.o2 >= r15.o2 + 15, `display=${resumedDisplay} o2 ${r15.o2} -> ${r16.o2}`);

  await page.keyboard.press('Backquote');
  await page.waitForTimeout(100);
  await page.keyboard.press('F2');
  await page.waitForTimeout(300);
  const hidden = await page.evaluate(() => document.getElementById('debug-panel').style.display);
  await page.keyboard.press('Backquote');
  await page.waitForTimeout(100);
  await page.keyboard.press('F2');
  await page.waitForTimeout(300);
  const shown = await page.evaluate(() => document.getElementById('debug-panel').style.display);
  report.keyToggle = { hidden, shown };
  check('I backtick+F2 hides the panel', hidden === 'none', hidden);
  check('I backtick+F2 again shows it', shown === 'block', shown);

  await page.screenshot({ path: path.join(outDir, 'Z-final-reviewer.png') });

  // ---- J: console cleanliness (request §70) ------------------------------
  const consoleErrors = consoleMsgs.filter((m) => m.type === 'error');
  report.console = { errors: consoleErrors, pageErrors };
  check('J no page exceptions', pageErrors.length === 0, JSON.stringify(pageErrors));
  check('J no console errors', consoleErrors.length === 0, JSON.stringify(consoleErrors));
} catch (err) {
  failures.push('exception: ' + (err && err.stack ? err.stack : String(err)));
} finally {
  if (browser) await browser.close();
  try {
    writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ failures, report }, null, 2));
    writeFileSync(path.join(outDir, 'server.log'), dev.log());
  } catch (e) {
    console.error('failed to write outputs: ' + e);
  }
  spawn('taskkill', ['/t', '/f', '/pid', String(dev.server.pid)], { stdio: 'ignore', windowsHide: true });
  await new Promise((r) => setTimeout(r, 1500));
  if (dev.server.exitCode === null) dev.server.kill('SIGKILL');
  clearTimeout(watchdog);
  console.log(JSON.stringify(failures, null, 2));
  if (failures.length) {
    process.exitCode = 1;
  } else {
    console.log('REVIEWER PROBE PASS: all WI-02 checks green');
  }
}
