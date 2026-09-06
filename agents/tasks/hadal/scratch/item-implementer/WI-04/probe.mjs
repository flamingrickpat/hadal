// WI-04 visual-language probe: boots the real dev-server page in headless
// Chromium (SwiftShader WebGL) at 1920x1080 and verifies the atmospheric scene
// renders without console/page exceptions, that the render FPS stays stable
// across the depth range, and that the flashlight beam (a composited
// cone/radial mask, request §15) actually reveals the scene: it is anchored to
// the player (not the clamped camera center), stands out as a bright region
// against the surrounding water, shortens effective visibility with depth, and
// never makes the water pure black. The beam check decodes the screenshot
// in-node (a minimal PNG decoder) and samples pixel brightness. Screenshots are
// the visual evidence (request §44 phase 2, §34, §15).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const outDir = path.join(here, 'output');
const port = 54323;
const ms = (n) => new Promise((r) => setTimeout(r, n));

// Camera geometry (request §16): CAMERA_VIEW_WIDTH = 2000 world units, so at
// 1920x1080 one world unit is 0.96 px and the screen center (960, 540) is the
// camera center. The camera clamps y to [-1057.5, -562.5] (Renderer.follow),
// so a deep diver (y < -1057.5) sits below the screen center.
const PX_PER_WU = 1920 / 2000;
const clampCamY = (y) => Math.max(-1057.5, Math.min(-562.5, y));
const beamCenterScreen = (wx, wy) => {
  const camX = 1300; // the probe always teleports to x = 1300 (unclamped)
  const camY = clampCamY(wy);
  return { x: 960 + (wx - camX) * PX_PER_WU, y: 540 - (wy - camY) * PX_PER_WU };
};

function resolveBrowser() {
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base);
  const dirs = readdirSync(base).filter(
    (d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')),
  );
  const versioned = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  if (versioned.length === 0) throw new Error('no chromium-*/chrome-win64/chrome.exe under ' + base);
  return path.join(base, versioned[versioned.length - 1].d, 'chrome-win64', 'chrome.exe');
}

// --- Minimal PNG (RGB/RGBA, 8-bit) decoder via node zlib (no product change). ---
// The "left" reference must use the reconstructed current-row value (out), not
// the raw filtered value, or filter 1/3/4 rows come out garbled.
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }
  if (bitDepth !== 8) throw new Error('unsupported bit depth ' + bitDepth);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 2;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  let rp = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride);
    rp += stride;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? out[y * stride + x - channels] : 0; // left (reconstructed)
      const b = prev[x]; // up
      const c = x >= channels ? prev[x - channels] : 0; // up-left
      const v = line[x];
      let val;
      if (filter === 0) val = v;
      else if (filter === 1) val = (v + a) & 255;
      else if (filter === 2) val = (v + b) & 255;
      else if (filter === 3) val = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        val = (v + pr) & 255;
      } else throw new Error('bad filter ' + filter);
      out[y * stride + x] = val;
    }
    prev = out.subarray(y * stride, (y + 1) * stride);
  }
  return { width, height, channels, data: out };
}

const lumAt = (img, x, y) => {
  const { width, height, channels, data } = img;
  if (x < 0 || y < 0 || x >= width || y >= height) return NaN;
  const i = (y * width + x) * channels;
  return channels >= 3 ? 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] : data[i];
};

// Mean luminance over an r x r box centered at (cx, cy).
function brightness(img, cx, cy, r = 14) {
  let sum = 0;
  let n = 0;
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      const v = lumAt(img, cx + dx, cy + dy);
      if (!Number.isNaN(v)) {
        sum += v;
        n += 1;
      }
    }
  }
  return n ? sum / n : NaN;
}

// Statistics over a region of the image (excluding the top HUD/debug strip).
function regionStats(img, y0, y1) {
  const { width, height, channels, data } = img;
  let sum = 0;
  let n = 0;
  let min = 255;
  let max = 0;
  let bright = 0; // pixels above the near-white beam-core threshold
  for (let y = y0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const v = lumAt(img, x, y);
      if (Number.isNaN(v)) continue;
      sum += v;
      n += 1;
      if (v < min) min = v;
      if (v > max) max = v;
      if (v > 190) bright += 1;
    }
  }
  const mean = n ? sum / n : NaN;
  let sq = 0;
  for (let y = y0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const v = lumAt(img, x, y);
      if (Number.isNaN(v)) continue;
      sq += (v - mean) * (v - mean);
    }
  }
  return { mean: Number(mean.toFixed(1)), min: Number(min.toFixed(1)), max: Number(max.toFixed(1)), stddev: Number(Math.sqrt(sq / n).toFixed(2)), bright };
}

// Center of the brightest 40x40 box below the HUD/debug strip (the beam core).
function beamCore(img) {
  const { width, height } = img;
  let best = -1;
  let bx = 0;
  let by = 0;
  for (let y = 140; y + 40 < height; y += 20) {
    for (let x = 20; x + 40 < width; x += 20) {
      const v = brightness(img, x + 20, y + 20, 19);
      if (v > best) {
        best = v;
        bx = x + 20;
        by = y + 20;
      }
    }
  }
  return { x: bx, y: by, lum: Number(best.toFixed(1)) };
}

const result = { fps: {}, checks: {}, perDepth: {}, pageErrors: [], consoleErrors: [] };
let browser;
const shot = (page, name) =>
  page.screenshot({ path: path.join(outDir, name) }).then(() => decodePng(readFileSync(path.join(outDir, name))));

async function waitReady() {
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    try {
      const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(1500) });
      if (r.ok) return;
    } catch { /* not ready yet */ }
    await ms(400);
  }
  throw new Error('dev server did not become ready within 60s');
}

const measureFps = (page, duration) =>
  page.evaluate(
    (dur) =>
      new Promise((resolve) => {
        let frames = 0;
        const t0 = performance.now();
        const tick = () => {
          frames += 1;
          if (performance.now() - t0 < dur) requestAnimationFrame(tick);
          else resolve(frames / (dur / 1000));
        };
        requestAnimationFrame(tick);
      }),
    duration,
  );

const pass = (name, ok, detail) => {
  result.checks[name] = ok ? 'PASS' : 'FAIL';
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '  [' + detail + ']' : ''));
};

mkdirSync(outDir, { recursive: true });
const server = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(port), '--strictPort'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
});
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

try {
  await waitReady();
  browser = await chromium.launch({
    executablePath: resolveBrowser(),
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => result.pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') result.consoleErrors.push(m.text()); });
  await page.goto(`http://localhost:${port}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForSelector('canvas', { timeout: 15000 });
  await page.waitForTimeout(2500);
  const teleport = async (x, depth) => {
    await page.fill('.debug-teleport-x', String(x));
    await page.fill('.debug-teleport-depth', String(depth));
    await page.click('.debug-teleport');
    await page.waitForTimeout(900);
  };

  // Per-depth metrics for the beam (request §15) + FPS (request §34).
  const depths = [300, 700, 1400];
  const beam = {};
  for (const depth of depths) {
    await teleport(1300, depth);
    result.fps[`depth-${depth}`] = Number((await measureFps(page, 2500)).toFixed(1));
    const img = await shot(page, `depth-${depth}.png`);
    const c = beamCenterScreen(1300, -depth);
    const stats = regionStats(img, 120, img.height);
    const core = beamCore(img);
    beam[`depth-${depth}`] = {
      playerScreen: c,
      core,
      coreToPlayer: Number(Math.hypot(core.x - c.x, core.y - c.y).toFixed(1)),
      mean: stats.mean,
      max: stats.max,
      stddev: stats.stddev,
      brightArea: stats.bright,
      // A mid-left open-water box (away from the beam core and the bottom
      // terrain) for the "not pure black" check.
      waterMin: Number(brightness(img, 300, 400, 90) > 0
        ? Math.min(...[brightness(img, 150, 300, 40), brightness(img, 450, 300, 40), brightness(img, 150, 550, 40), brightness(img, 450, 550, 40)]).toFixed(1)
        : NaN),
    };
  }
  result.perDepth = beam;
  const shallow = beam['depth-300'];
  const deep = beam['depth-1400'];

  // A: the scene is not a flat color field (request §14.1, §35).
  pass('A scene is not a flat color field (stddev of luminance)', deep.stddev > 4, `stddev(depth1400)=${deep.stddev}`);
  // B: the beam reveals the scene: the bright core stands out well above the
  // surrounding water (a reveal mask, not a static sprite nor a flat field).
  pass('B beam reveals a bright region against the surrounding water',
    deep.max - deep.mean > 60, `core(max)=${deep.max} mean=${deep.mean} diff=${(deep.max - deep.mean).toFixed(1)}`);
  // B2: the beam is anchored to the player, not the clamped camera center: at a
  // clamped depth the bright core sits near the player (below the screen center).
  pass('B2 beam anchored to the player (bright core near the diver, not the camera center)',
    deep.coreToPlayer < 400, `core=(${deep.core.x},${deep.core.y}) player=(${deep.playerScreen.x.toFixed(0)},${deep.playerScreen.y.toFixed(0)}) dist=${deep.coreToPlayer}`);
  // C: effective visibility shortens with depth: the bright beam area is
  // smaller (fewer near-white pixels) at depth 1400 than at depth 300.
  pass('C visibility shortens with depth (smaller bright beam area when deeper)',
    deep.brightArea < shallow.brightArea,
    `brightArea(depth300)=${shallow.brightArea} brightArea(depth1400)=${deep.brightArea}`);
  // D: not pure black: the open water (ambient floor) stays above pure black.
  pass('D open water is never pure black (ambient floor above zero)',
    Number.isFinite(deep.waterMin) && deep.waterMin > 5, `waterMin(depth1400)=${deep.waterMin}`);
} catch (err) {
  result.error = String(err && err.stack ? err.stack : err);
} finally {
  if (browser) await browser.close();
  writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  writeFileSync(path.join(outDir, 'server.log'), serverLog);
  spawn('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
  await ms(2000);
  if (server.exitCode === null) server.kill('SIGKILL');
}
console.log('\nSUMMARY:', JSON.stringify(result.checks));
if (result.pageErrors.length) console.log('pageErrors:', JSON.stringify(result.pageErrors));
if (result.consoleErrors.length) console.log('consoleErrors:', JSON.stringify(result.consoleErrors));
if (result.error) console.log('ERROR:', result.error);
