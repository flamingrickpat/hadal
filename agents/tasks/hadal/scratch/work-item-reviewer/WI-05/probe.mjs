// Reviewer independent adversarial probe for WI-05 (work-item-reviewer).
//
// Boots the real `npm run dev` page in headless Chromium and inspects the LIVE
// WebAudio node values (not just the AudioSystem.snapshot() field) so it can
// distinguish the literal request from the implementation's interpretation:
//   - the AudioContext is constructed ONLY after the first user gesture
//   - the ambient graph is actually built (layer gains non-null) after input
//   - there is no long looping music track (drone bed is oscillator-based)
//   - descending changes the node parameters (high-cut drops, reverb rises)
//   - the volume slider changes the actual masterGain node value
//
// Run: node agents/tasks/hadal/scratch/work-item-reviewer/WI-05/probe.mjs
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const PORT = Number(process.env.HADAL_REVIEWER_PORT || 54323);
const outDir = path.join(here, 'output');
mkdirSync(outDir, { recursive: true });

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base);
  const dirs = readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')))
    .map((d) => ({ d, n: Number(d.slice('chromium-'.length)) }))
    .sort((a, b) => a.n - b.n);
  if (dirs.length === 0) throw new Error('no chromium under ' + base);
  return path.join(base, dirs[dirs.length - 1].d, 'chrome-win64', 'chrome.exe');
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
      /* not ready yet */
    }
    await new Promise((res) => setTimeout(res, 400));
  }
  throw new Error('dev server not ready within 60s');
}

function stopServer(child) {
  spawnSync('taskkill', ['/t', '/f', '/pid', String(child.pid)], { stdio: 'ignore', windowsHide: true });
  child.kill('SIGKILL');
}

const INIT_SCRIPT = `
  window.__AC_COUNT = 0;
  window.__AC_INSTANCES = [];
  window.__BS = [];
  window.__OSC = [];
  const RealAC = window.AudioContext;
  function HookedAC(...args) {
    const inst = new RealAC(...args);
    window.__AC_COUNT += 1;
    window.__AC_INSTANCES.push(inst);
    return inst;
  }
  HookedAC.prototype = RealAC.prototype;
  HookedAC.name = 'AudioContext';
  window.AudioContext = HookedAC;
  const realCBS = RealAC.prototype.createBufferSource;
  RealAC.prototype.createBufferSource = function (...args) {
    const node = realCBS.apply(this, args);
    window.__BS.push(node);
    return node;
  };
  const realCO = RealAC.prototype.createOscillator;
  RealAC.prototype.createOscillator = function (...args) {
    const node = realCO.apply(this, args);
    window.__OSC.push(node);
    return node;
  };
`;

(async () => {
  const browserExe = resolveBrowser();
  const { child, getLog } = startServer();
  let browser;
  const results = [];
  const report = (ok, name, detail) => {
    results.push({ ok: !!ok, name, detail });
    console.log((ok ? 'PASS' : 'FAIL') + ': ' + name + (detail ? '  [' + detail + ']' : ''));
  };
  try {
    await waitReady();
    browser = await chromium.launch({
      executablePath: browserExe,
      args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'],
    });
    const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript(INIT_SCRIPT);
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e)));
    await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(1500);

    // 1. BEFORE any gesture: the AudioContext must NOT have been constructed.
    const before = await page.evaluate(() => ({
      snap: window.__HADAL_AUDIO__ && window.__HADAL_AUDIO__.snapshot(),
      acCount: window.__AC_COUNT,
      bs: window.__BS.length,
      osc: window.__OSC.length,
    }));
    report(
      before.acCount === 0,
      'no AudioContext is constructed before the first user input (lazy init)',
      'acCount=' + before.acCount,
    );
    report(
      before.bs === 0 && before.osc === 0,
      'no ambient graph nodes exist before the first user input',
      'bufferSources=' + before.bs + ' oscillators=' + before.osc,
    );
    report(
      !!before.snap && before.snap.unlocked === false && before.snap.contextState === 'not-created',
      'snapshot reports locked / not-created before input',
      'unlocked=' + (before.snap && before.snap.unlocked) + ' state=' + (before.snap && before.snap.contextState),
    );

    // 2. Fire a real user gesture (a mouse click, not a key, so the debug panel stays open).
    await page.mouse.click(30, 30);
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => ({
      snap: window.__HADAL_AUDIO__ && window.__HADAL_AUDIO__.snapshot(),
      acCount: window.__AC_COUNT,
    }));
    report(
      after.acCount === 1,
      'exactly one AudioContext is constructed after the first user input',
      'acCount=' + after.acCount,
    );
    report(
      !!after.snap && after.snap.unlocked === true && after.snap.contextState === 'running',
      'the AudioContext is unlocked and running after input',
      'unlocked=' + (after.snap && after.snap.unlocked) + ' state=' + (after.snap && after.snap.contextState),
    );

    // 3. The ambient graph is actually built: every layer gain is non-null.
    const layers = await page.evaluate(() => {
      const a = window.__HADAL_AUDIO__;
      return {
        worldBus: !!a.worldBus,
        worldLowpass: !!a.worldLowpass,
        reverbSend: !!a.reverbSend,
        convWet: !!a.convWet,
        masterGain: !!a.masterGain,
        oceanBedGain: !!a.oceanBedGain,
        currentGain: !!a.currentGain,
        subRumbleGain: !!a.subRumbleGain,
        hullGain: !!a.hullGain,
        breathGain: !!a.breathGain,
        droneGain: !!a.droneGain,
      };
    });
    const layerNames = Object.keys(layers);
    report(
      layerNames.every((k) => layers[k]),
      'the ambient graph is built after input (all layer nodes present)',
      layerNames.map((k) => (layers[k] ? k : 'MISSING:' + k)).join(' '),
    );

    // 4. No long looping music track: every looping BufferSource is a short
    //    noise bed; the drone bed is oscillator-based (request §58).
    const music = await page.evaluate(() => {
      const bs = window.__BS;
      const looping = bs.filter((n) => n.loop === true);
      const maxLoopingDur = looping.reduce((m, n) => Math.max(m, n.buffer ? n.buffer.duration : 0), 0);
      const hasLongLoop = looping.some((n) => n.buffer && n.buffer.duration >= 30);
      return {
        totalBufferSources: bs.length,
        loopingBufferSources: looping.length,
        maxLoopingDuration: maxLoopingDur,
        hasLongLoop,
        totalOscillators: window.__OSC.length,
      };
    });
    report(
      !music.hasLongLoop,
      'no looping music track of 30 s or longer exists (request §58)',
      'looping=' + music.loopingBufferSources + ' maxLoopingDuration=' + music.maxLoopingDuration.toFixed(2) + 's',
    );
    report(
      music.loopingBufferSources >= 1 && music.totalOscillators >= 3,
      'ambient beds are looping noise + the drone bed is oscillator-based',
      'loopingNoise=' + music.loopingBufferSources + ' oscillators=' + music.totalOscillators,
    );

    // 5. Descending changes the LIVE node parameters (LFO-free nodes).
    const toDepth = async (depth) => {
      await page.fill('.debug-teleport-x', '1300');
      await page.fill('.debug-teleport-depth', String(depth));
      await page.click('.debug-teleport');
      await page.waitForTimeout(1500);
      return page.evaluate(() => ({
        depth: window.__HADAL_AUDIO__.lastProfile ? window.__HADAL_AUDIO__.lastProfile.depth : -1,
        low: window.__HADAL_AUDIO__.worldLowpass.frequency.value,
        reverbSend: window.__HADAL_AUDIO__.reverbSend.gain.value,
        convWet: window.__HADAL_AUDIO__.convWet.gain.value,
        hull: window.__HADAL_AUDIO__.hullGain.gain.value,
      }));
    };
    const shallow = await toDepth(0);
    const deep = await toDepth(7000);
    report(
      deep.low < shallow.low,
      'the global high-cut node frequency drops with depth',
      'worldLowpass ' + shallow.low.toFixed(0) + ' -> ' + deep.low.toFixed(0),
    );
    report(
      deep.reverbSend > shallow.reverbSend && deep.convWet > shallow.convWet,
      'the reverb/delay node mix rises with depth',
      'reverbSend ' + shallow.reverbSend.toFixed(3) + ' -> ' + deep.reverbSend.toFixed(3) +
        ' convWet ' + shallow.convWet.toFixed(3) + ' -> ' + deep.convWet.toFixed(3),
    );
    report(
      deep.hull < shallow.hull,
      'the hull/equipment node gain recedes with depth (further from base)',
      'hull ' + shallow.hull.toFixed(4) + ' -> ' + deep.hull.toFixed(4),
    );

    // 6. The volume slider changes the ACTUAL masterGain node value (request §43).
    const masterBefore = await page.evaluate(() => window.__HADAL_AUDIO__.masterGain.gain.value);
    await page.$eval('.audio-volume-slider', (el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, 0.3);
    await page.waitForTimeout(400);
    const masterAfter = await page.evaluate(() => window.__HADAL_AUDIO__.masterGain.gain.value);
    report(
      masterAfter < masterBefore && masterAfter < 0.45,
      'the volume slider changes the actual masterGain node value',
      'masterGain.gain ' + masterBefore.toFixed(3) + ' -> ' + masterAfter.toFixed(3),
    );

    report(pageErrors.length === 0, 'no page exceptions during the probe', pageErrors.join(' | ') || 'clean');
  } catch (err) {
    results.push({ ok: false, name: 'HARNESS ERROR', detail: (err && err.stack ? err.stack : String(err)).slice(0, 800) });
    console.log('HARNESS ERROR: ' + (err && err.stack ? err.stack : String(err)));
    console.log('\n--- dev server log (tail) ---\n' + getLog().slice(-2000));
  } finally {
    if (browser) await browser.close();
    stopServer(child);
  }
  const failing = results.filter((r) => !r.ok).length;
  console.log('');
  console.log(failing === 0 ? 'REVIEWER PROBE PASS' : 'REVIEWER PROBE FAIL (' + failing + ' failing)');
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ pass: failing === 0, failures: failing, results }, null, 2));
  process.exitCode = failing === 0 ? 0 : 1;
})();
