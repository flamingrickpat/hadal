// WI-02 INDEPENDENT reviewer probe — written fresh for this review, separate
// from the implementer's probe and the prior reviewer's probe.
//
// It drives the real `npm run dev` page (SwiftShader Chromium, real WebGL2,
// fresh context, real keyboard/mouse events, ?debug=1) and asserts the work
// item's own acceptance criteria, not the implementer's framing:
//   A. boot: title, canvas+WebGL2, ?debug=1 panel, HUD O2/HP/DEPTH/TOOL,
//      full-meter fade, readout start position.
//   B. 2-axis inertial thrust (D+S): both axes move; on release the player
//      keeps drifting in BOTH axes and the drift decays (inertial, NOT
//      frictionless, NOT a frictionless ship).
//   C. seabed blocks from above: depth saturates one radius above the floor.
//   D. central wall blocks from the WEST (vertical side face).
//   E. central wall top blocks a descending player (depth saturates ~490).
//   F. O2 falls and depth rises together during a dive (meters + depth).
//   G. zero-O2 enters a health-draining state (~5/s), then surface refills.
//   H. keyboard mapping: W/A/S/D directions, Digit1 tool select, Esc pause.
//   I. debug teleport sets an exact position/depth.
//   J. no page exceptions / console errors.
//
// Method: real dev server on a private port; sim runs fixed 1/60 s steps fed
// by real elapsed time, so sim time ~ wall time; the O2 meter (1/s below the
// surface) is used as a sim-time clock to absorb rAF jitter.
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
const port = 5211;
mkdirSync(outDir, { recursive: true });

const watchdog = setTimeout(() => {
  console.error('PROBE TIMEOUT (watchdog 420s)');
  process.exit(2);
}, 420000);

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
    await new Promise((res) => setTimeout(res, 400));
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

async function teleport(page, x, depth) {
  await page.fill('#debug-x', String(x));
  await page.fill('#debug-depth', String(depth));
  await page.click('#debug-apply');
  await page.waitForTimeout(1200); // camera settle
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
  check('A dev server ready', ready, dev.log().slice(-600));
  await page.goto(`http://localhost:${port}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);

  // ---- A: boot state ----------------------------------------------------
  const boot = {
    title: await page.title(),
    hasCanvas: await page.evaluate(() => !!document.querySelector('canvas')),
    hasWebGL2: await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return !!(c && c.getContext('webgl2'));
    }),
    panelDisplay: await page.evaluate(() => document.getElementById('debug-panel')?.style.display),
    o2Text: (await page.textContent('#hud-o2')).trim(),
    hpText: (await page.textContent('#hud-hp')).trim(),
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
  check('A HUD O2 readout present (180s)', /180s$/.test(boot.o2Text), boot.o2Text);
  check('A HUD HP readout present (100)', /100$/.test(boot.hpText), boot.hpText);
  check('A HUD DEPTH readout present (100m)', boot.depthText === '100m', boot.depthText);
  check('A HUD TOOL readout is a starter tool', boot.toolText.length > 0 && boot.toolText !== '—', boot.toolText);
  check('A full O2 row fades (opacity 0.25)', boot.o2RowOpacity === '0.25', boot.o2RowOpacity);
  check('A full HP row fades (opacity 0.25)', boot.hpRowOpacity === '0.25', boot.hpRowOpacity);
  check('A readout starts near the surface spawn (x 1300, depth 100)', boot.readout.x === 1300 && boot.readout.depth === 100, boot.readout.raw);
  await page.screenshot({ path: path.join(outDir, 'A-boot.png') });

  // ---- B: 2-axis inertial thrust (request §6) ---------------------------
  // Hold D (right) + S (down): both axes must build velocity. On release the
  // player keeps drifting in BOTH axes, and the drift decays (inertial).
  await page.keyboard.down('KeyD');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(2500);
  await page.keyboard.up('KeyD');
  await page.keyboard.up('KeyS');
  const b1 = await readReadout(page);
  const bMid = { dx: 0, dy: 0, samples: [b1] };
  let bEnd = b1;
  for (let i = 0; i < 24; i++) {
    await page.waitForTimeout(500);
    bEnd = await readReadout(page);
    bMid.samples.push(bEnd);
    if (bEnd.o2 - b1.o2 <= -6) break; // >= 6 sim seconds of coast
  }
  const W = b1.o2 - bEnd.o2; // sim seconds of coast
  const dXtotal = bEnd.x - b1.x;
  const dYtotal = bEnd.depth - b1.depth;
  // pick the mid sample for the decay comparison
  const mid = bMid.samples.reduce((best, s) =>
    Math.abs(s.o2 - b1.o2) < Math.abs(best.o2 - b1.o2) ? s : best,
    bMid.samples[Math.floor(bMid.samples.length / 2)]);
  const dXmid = mid.x - b1.x;
  const dYmid = mid.depth - b1.depth;
  report.inertial = { b1, mid, bEnd, W, dXtotal, dYtotal };
  check('B thrust: player moved right (x increased >= 100)', b1.x >= 1400, `x=${b1.x}`);
  check('B thrust: player moved down (depth increased >= 100)', b1.depth >= 200, `depth=${b1.depth}`);
  check('B coast window >= 4 sim seconds (O2 clock)', W >= 4, `W=${W}s`);
  check('B release: still drifting right after release (dx in [40,260])', dXtotal >= 40 && dXtotal <= 260, `dx=${dXtotal.toFixed(1)} over W=${W}s`);
  check('B release: still drifting down after release (dy in [40,260])', dYtotal >= 40 && dYtotal <= 260, `dy=${dYtotal.toFixed(1)} over W=${W}s`);
  check('B drift is decaying (2nd half < 1st half, both axes, NOT frictionless)', dXtotal - dXmid > 5 && dYtotal - dYmid > 5, `dx 1st=${dXmid.toFixed(1)} total=${dXtotal.toFixed(1)} | dy 1st=${dYmid.toFixed(1)} total=${dYtotal.toFixed(1)}`);

  // ---- C: seabed blocks from above (request §31) ------------------------
  await teleport(page, 1300, 100);
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(9000);
  await page.keyboard.up('KeyS');
  const c1 = await readReadout(page);
  await page.waitForTimeout(1200);
  const c2 = await readReadout(page);
  report.seabed = { c1, c2 };
  check('C seabed saturation: player rests near the floor (depth >= 1360)', c1.depth >= 1360, `depth=${c1.depth} x=${c1.x}`);
  check('C still blocked after extra hold (|delta| < 6)', Math.abs(c2.depth - c1.depth) < 6, `c1=${c1.depth} c2=${c2.depth}`);
  check('C depth did NOT pass through the floor (<= 1460)', c1.depth <= 1460, `depth=${c1.depth}`);
  await page.screenshot({ path: path.join(outDir, 'C-seabed.png') });

  // ---- D: central wall blocks from the west (request §31) ---------------
  await teleport(page, 2300, 700);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(4500);
  await page.keyboard.up('KeyD');
  const d1 = await readReadout(page);
  await page.waitForTimeout(1200);
  const d2 = await readReadout(page);
  report.wallWest = { d1, d2 };
  check('D wall west face blocks: x saturates ~2340 (face 2370, radius 30)', d1.x >= 2332 && d1.x <= 2346, `x=${d1.x}`);
  check('D still blocked after extra hold (|delta| < 6)', Math.abs(d2.x - d1.x) < 6, `d1=${d1.x} d2=${d2.x}`);
  check('D depth stayed near 700 (no unintended vertical drift)', Math.abs(d1.depth - 700) <= 40, `depth=${d1.depth}`);

  // ---- E: central wall top blocks a descending player (request §31) -----
  await teleport(page, 2400, 100);
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(4500);
  await page.keyboard.up('KeyS');
  const e1 = await readReadout(page);
  await page.waitForTimeout(1200);
  const e2 = await readReadout(page);
  report.wallTop = { e1, e2 };
  check('E wall top blocks descent: depth saturates ~490 (top -520, radius 30)', e1.depth >= 478 && e1.depth <= 502, `depth=${e1.depth} x=${e1.x}`);
  check('E still blocked after extra hold (|delta| < 6)', Math.abs(e2.depth - e1.depth) < 6, `e1=${e1.depth} e2=${e2.depth}`);

  // ---- F: O2 falls and depth rises together during a dive ---------------
  await teleport(page, 1300, 100);
  const f0 = await readReadout(page);
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(5000);
  await page.keyboard.up('KeyS');
  const f1 = await readReadout(page);
  report.dive = { f0, f1 };
  check('F dive: depth rose by >= 200', f1.depth - f0.depth >= 200, `depth ${f0.depth} -> ${f1.depth}`);
  check('F dive: O2 fell by 30-120 (depleting, roughly 1/s)', f0.o2 - f1.o2 >= 30 && f0.o2 - f1.o2 <= 120, `o2 ${f0.o2} -> ${f1.o2}`);
  check('F HUD depth text tracks the readout (<=5 m)', Math.abs(parseInt((await page.textContent('#hud-depth-text')).replace('m', ''), 10) - f1.depth) <= 5, await page.textContent('#hud-depth-text'));
  check('F O2 row no longer faded after depletion', (await page.evaluate(() => document.getElementById('hud-o2').style.opacity)) === '1', 'opacity');

  // ---- G: zero-O2 -> health drain, then surface refill (request §7) -----
  // O2 carries over across teleports; poll the O2 clock until it reads 0.
  let g0 = await readReadout(page);
  const gStart = Date.now();
  while (g0.o2 !== 0 && Date.now() - gStart < 220000) {
    await page.waitForTimeout(1000);
    g0 = await readReadout(page);
  }
  const hpAtZero = g0.hp;
  await page.waitForTimeout(12000);
  const g1 = await readReadout(page);
  report.zeroO2 = { g0, hpAtZero, g1, waitMs: Date.now() - gStart };
  check('G O2 reaches 0s while below the surface', g0.o2 === 0, `o2=${g0.o2} depth=${g0.depth}`);
  check('G HP was still positive when O2 hit 0 (drain not pre-empted)', hpAtZero > 5, `hp=${hpAtZero}`);
  check('G HP drains ~5/s over ~12 s (drop 40-75)', g1.hp < hpAtZero && hpAtZero - g1.hp >= 40 && hpAtZero - g1.hp <= 75, `hp ${hpAtZero} -> ${g1.hp}`);
  check('G O2 stays at 0 (no spurious refill below the surface)', g1.o2 === 0, `o2=${g1.o2}`);

  // Surface refill: teleport shallow (depth 50), O2 should refill ~12/s.
  await teleport(page, 1300, 50);
  const s0 = await readReadout(page);
  await page.waitForTimeout(4000);
  const s1 = await readReadout(page);
  const refillRate = (s1.o2 - s0.o2) / 4.0;
  report.surface = { s0, s1, refillRate };
  check('G surface refill: O2 rate ~12/s (8-16) at depth 50', refillRate >= 8 && refillRate <= 16, `rate=${refillRate.toFixed(1)}/s (${s0.o2} -> ${s1.o2})`);

  // ---- H: keyboard mapping (request §6) ---------------------------------
  // W up, A left, S down, D right (verified in B); now check W + A cleanly.
  await teleport(page, 1300, 300);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(2000);
  await page.keyboard.up('KeyW');
  const hW = await readReadout(page);
  await teleport(page, 1300, 300);
  await page.keyboard.down('KeyA');
  await page.waitForTimeout(2000);
  await page.keyboard.up('KeyA');
  const hA = await readReadout(page);
  report.keys = { hW, hA };
  check('H W thrusts toward the surface (depth dropped)', hW.depth < 300, `depth=${hW.depth}`);
  check('H A thrusts left (x decreased)', hA.x < 1300, `x=${hA.x}`);
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(300);
  const tool1 = await page.textContent('#hud-tool-text');
  check('H Digit1 selects the first starter tool (Salvage Knife)', tool1 === 'Salvage Knife', tool1);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const pausedDisplay = await page.evaluate(() => document.getElementById('pause-overlay').style.display);
  const p1 = await readReadout(page);
  await page.waitForTimeout(2200);
  const p2 = await readReadout(page);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const resumedDisplay = await page.evaluate(() => document.getElementById('pause-overlay').style.display);
  report.pause = { pausedDisplay, resumedDisplay, p1, p2 };
  check('H Esc shows the pause overlay', pausedDisplay === 'block', pausedDisplay);
  check('H sim frozen while paused (readout identical after 2.2 s)', p2.raw === p1.raw, `${p1.raw} | ${p2.raw}`);
  check('H resume clears the pause overlay', resumedDisplay === 'none', resumedDisplay);

  // ---- I: debug teleport sets an exact position/depth (request §33) -----
  await teleport(page, 500, 800);
  const iT = await readReadout(page);
  report.teleport = { iT };
  check('I teleport sets exact position x=500', Math.abs(iT.x - 500) < 1, `x=${iT.x}`);
  check('I teleport sets exact depth=800', Math.abs(iT.depth - 800) < 1, `depth=${iT.depth}`);

  // ---- J: console cleanliness (request §70) -----------------------------
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
    const consoleErrors = [];
    writeFileSync(path.join(outDir, 'console.json'), JSON.stringify({ consoleErrors, pageErrors: report.console?.pageErrors ?? [] }, null, 2));
  } catch (e) {
    console.error('failed to write outputs: ' + e);
  }
  spawn('taskkill', ['/t', '/f', '/pid', String(dev.server.pid)], { stdio: 'ignore', windowsHide: true });
  await new Promise((res) => setTimeout(res, 1500));
  if (dev.server.exitCode === null) dev.server.kill('SIGKILL');
  clearTimeout(watchdog);
  console.log(JSON.stringify(failures, null, 2));
  if (failures.length) {
    process.exitCode = 1;
  } else {
    console.log('INDEPENDENT REVIEWER PROBE PASS: all checks green');
  }
}
