// Implementer browser probe for WI-06 Finding 1 (item-implementer, attempt 2).
//
// The review (reviews/WI-06-sonar-signal-bus-review.md) found the sonar render
// layer expressed only the *slower* half of "larger/slower pulses from massive
// objects" (request §18): the echo/tag point size was fixed, so a tagged
// massive object rendered the same pixel size as a small one. This probe
// verifies the fix in a REAL WebGL context (not a mock), reusing the live Vite
// dev server and the product modules:
//   Part 1 — in the live game page, dynamically import the product
//     `SonarSystem` + `SonarVisuals` (plus the same pre-bundled `three` the
//     game uses) and render a standalone scene with a normal (size 1) and a
//     massive (size 8) object; confirm the massive object's echo / tag renders
//     LARGER than the normal one's (per-vertex size attribute), no console error.
//   Part 2 — the real game boots with the sonar wired in, crafts sonar-1,
//     fires Q, and the ring + echoes render with no console exception
//     (regression check that the new shader did not break the render path).
//
// Run: node agents/tasks/hadal/scratch/item-implementer/WI-06/probe.mjs
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const PORT = Number(process.env.HADAL_IMPL_PORT || 55150);
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

// The scene code, run in the live page. Reuses the same pre-bundled `three`
// the product `SonarVisuals` imports (threeUrl), so the objects are compatible.
const sceneScript = `
  const idx = (sonar, size) => sonar.echoes.indexOf(sonar.echoes.find((e) => e.active && e.size === size));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03070a);
  document.querySelectorAll('canvas').forEach((c) => { c.style.display = 'none'; });
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(960, 720);
  const el = renderer.domElement;
  el.style.position = 'fixed';
  el.style.top = '0';
  el.style.left = '0';
  el.style.zIndex = '99999';
  document.body.appendChild(el);
  const camera = new THREE.OrthographicCamera(-480, 480, 360, -360, 0.1, 100000);
  camera.position.set(0, 0, 1000);
  const terrain = [vec2(-60, 0), vec2(0, 40), vec2(60, 0), vec2(0, -40)];
  const objects = [
    { x: 250, y: 0, size: 1, resource: false },
    { x: 360, y: 0, size: 8, resource: false },
  ];
  const sonar = new SonarSystem(new WorldSignalBus(), terrain, objects);
  const visuals = new SonarVisuals(scene, sonar);
  sonar.fire(vec2(0, 0), 0);
  const FRAME = 1 / 60;
  let time = 0;
  // 42 frames = 0.7 s: the ring has passed both objects (d=250, d=360) and
  // both echoes are active and bright (the massive one is larger and brighter).
  for (let i = 0; i < 42; i += 1) {
    time += FRAME;
    sonar.update(FRAME, time);
    visuals.update(time);
    renderer.render(scene, camera);
  }
  return {
    ready: true,
    activeEchoes: sonar.echoes.filter((e) => e.active).length,
    normalEchoSize: visuals.echoSize[idx(sonar, 1)],
    massiveEchoSize: visuals.echoSize[idx(sonar, 8)],
    normalTagSize: visuals.tagSize[idx(sonar, 1)],
    massiveTagSize: visuals.tagSize[idx(sonar, 8)],
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
    // Extract the exact pre-bundled three URL the product sonar module uses.
    const sonarSrc = await (await fetch(`http://localhost:${PORT}/src/render/sonar.ts`, { signal: AbortSignal.timeout(3000) })).text();
    const m = sonarSrc.match(/import \* as THREE from "([^"]+)"/);
    const threeUrl = m ? m[1] : '/node_modules/.vite/deps/three.js';

    // ---- Part 1: standalone render of the product sonar with a massive object
    const ctx1 = await browser.newContext({ viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 });
    const page1 = await ctx1.newPage();
    const errs1 = [];
    page1.on('pageerror', (e) => errs1.push(String(e)));
    page1.on('console', (msg) => { if (msg.type() === 'error') errs1.push('console:' + msg.text()); });
    await page1.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
    await page1.waitForSelector('canvas', { timeout: 15000 });
    const probe = await page1.evaluate(async ({ threeUrl, sceneScript }) => {
      const threeMod = await import(threeUrl);
      const THREE = (threeMod && threeMod.Scene) ? threeMod : (threeMod && threeMod.default) || threeMod;
      const { SonarSystem } = await import('/src/systems/SonarSystem.ts');
      const { SonarVisuals } = await import('/src/render/sonar.ts');
      const { WorldSignalBus } = await import('/src/creatures/senses.ts');
      const { vec2 } = await import('/src/util/math.ts');
      const fn = new Function('THREE', 'SonarSystem', 'SonarVisuals', 'WorldSignalBus', 'vec2', sceneScript);
      return fn(THREE, SonarSystem, SonarVisuals, WorldSignalBus, vec2);
    }, { threeUrl, sceneScript });
    await page1.waitForTimeout(150);
    await page1.screenshot({ path: path.join(outDir, 'sonar-massive-vs-normal.png'), clip: { x: 0, y: 0, width: 960, height: 720 } });
    report(probe.activeEchoes >= 2, 'both the normal and massive objects produced active echoes', `active=${probe.activeEchoes}`);
    report(probe.massiveEchoSize > probe.normalEchoSize, 'a massive object (size 8) renders a LARGER echo than a normal one (size 1)', `normal=${probe.normalEchoSize} massive=${probe.massiveEchoSize}`);
    report(probe.normalEchoSize > 5.9 && probe.normalEchoSize < 6.1, 'a size-1 object renders at the base echo size (~6px, no visual change)', `normal=${probe.normalEchoSize}`);
    report(probe.massiveTagSize > probe.normalTagSize, 'a massive object renders a LARGER tag than a normal one', `normal=${probe.normalTagSize} massive=${probe.massiveTagSize}`);
    report(errs1.length === 0, 'the standalone sonar render produced no console/page exceptions (shader compiled)', errs1.join(' | ') || 'clean');
    await ctx1.close();

    // ---- Part 2: the real game still renders the sonar (regression)
    const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page2 = await ctx2.newPage();
    const errs2 = [];
    page2.on('pageerror', (e) => errs2.push(String(e)));
    await page2.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
    await page2.waitForSelector('canvas', { timeout: 15000 });
    await page2.waitForTimeout(1800);
    report(errs2.length === 0, 'the real game boots with the sonar wired in and no console exceptions', errs2.join(' | ') || 'clean');
    for (let i = 0; i < 6; i += 1) {
      await page2.click('.debug-give-resources');
      await page2.waitForTimeout(120);
    }
    await page2.waitForTimeout(400);
    const after = await page2.evaluate(() => {
      for (const card of Array.from(document.querySelectorAll('.recipe-card'))) {
        const name = card.querySelector('.recipe-name')?.textContent || '';
        if (name.includes('Sonar')) {
          const btn = card.querySelector('.recipe-craft');
          if (btn && !btn.disabled) btn.click();
          return 'clicked';
        }
      }
      return 'not-found';
    });
    await page2.waitForTimeout(400);
    report(after === 'clicked', 'the sonar-1 upgrade is crafted in the real game', `result=${after}`);
    await page2.keyboard.down('KeyQ');
    await page2.waitForTimeout(700);
    await page2.screenshot({ path: path.join(outDir, 'real-game-sonar-ring.png') });
    await page2.keyboard.up('KeyQ');
    for (let i = 0; i < 4; i += 1) {
      await page2.keyboard.down('KeyQ');
      await page2.waitForTimeout(150);
      await page2.keyboard.up('KeyQ');
      await page2.waitForTimeout(250);
    }
    report(errs2.length === 0, 'firing the sonar (Q) in the real game produces no runtime exceptions', errs2.join(' | ') || 'clean');
    await ctx2.close();
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
  console.log(failing === 0 ? 'IMPLEMENTER PROBE PASS' : 'IMPLEMENTER PROBE FAIL (' + failing + ' failing)');
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify({ pass: failing === 0, failures: failing, results }, null, 2));
  process.exitCode = failing === 0 ? 0 : 1;
})();
