// WI-04 reviewer adversarial probe (independent of the implementer's probe).
// Question answered: is the rendered scene (a) NOT a flat color field,
// (b) actually brightened by the flashlight beam (a reveal mask, not a static
//     sprite), and (c) does a background parallax silhouette shift at a
//     different rate than the main terrain when the camera depth changes?
// Method: boot the real dev page (SwiftShader WebGL, 1920x1080, ?debug=1),
// teleport to depths, capture screenshots, decode the PNG in-node, and sample
// pixel brightness. No product code is modified.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const outDir = path.join(here, 'output');
const port = 53341;
const ms = (n) => new Promise((r) => setTimeout(r, n));

function resolveBrowser() {
  const base = process.env.PROBE_BROWSER
    ? path.join(process.env.PROBE_BROWSER, 'chrome-win64', 'chrome.exe')
    : undefined;
  if (base && existsSync(base)) return base;
  const root = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(root)) throw new Error('ms-playwright dir not found at ' + root);
  const dirs = readdirSync(root).filter(
    (d) => /^chromium-\d+$/.test(d) && existsSync(path.join(root, d, 'chrome-win64', 'chrome.exe')),
  );
  const vers = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  if (vers.length === 0) throw new Error('no chromium-*/chrome-win64/chrome.exe under ' + root);
  return path.join(root, vers[vers.length - 1].d, 'chrome-win64', 'chrome.exe');
}

// --- Minimal PNG (RGB/RGBA, 8-bit) decoder via node zlib ---
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
      const a = x >= channels ? line[x - channels] : 0; // left
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

function brightness(img, cx, cy, r = 16) {
  // Mean luminance over an r x r box centered at (cx, cy).
  const { width, height, channels, data } = img;
  let sum = 0;
  let n = 0;
  for (let dy = -r; dy <= r; dy += 1) {
    for (let dx = -r; dx <= r; dx += 1) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const i = (y * width + x) * channels;
      if (channels >= 3) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      else sum += data[i];
      n += 1;
    }
  }
  return n ? sum / n : NaN;
}

function stddev(img) {
  const { channels, data } = img;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += channels * 7) {
    const v = channels >= 3 ? 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] : data[i];
    sum += v;
    n += 1;
  }
  const mean = sum / n;
  let sq = 0;
  for (let i = 0; i < data.length; i += channels * 7) {
    const v = channels >= 3 ? 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] : data[i];
    sq += (v - mean) * (v - mean);
  }
  return Math.sqrt(sq / n);
}

const result = { checks: {}, pageErrors: [], consoleErrors: [], samples: {} };
let browser;

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

function pass(name, ok, detail) {
  result.checks[name] = ok ? 'PASS' : 'FAIL';
  if (detail !== undefined) result.samples[name] = detail;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '  [' + detail + ']' : ''));
}

const shot = (page, name) =>
  page.screenshot({ path: path.join(outDir, name) }).then(() => decodePng(readFileSync(path.join(outDir, name))));

async function main() {
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
      await page.waitForTimeout(800);
    };

    // A: the scene is not a flat color field (request §14.1, §35).
    await teleport(1300, 700);
    const mid = await shot(page, 'reviewer-depth700.png');
    const sd = Number(stddev(mid).toFixed(2));
    pass('A scene is not a flat color field (stddev of luminance)', sd > 4, `stddev=${sd}`);

    // B: the flashlight beam brightens the scene (request §15). At depth 1400
    // the camera is clamped (min y=-1057.5), so the player/beam sits at screen
    // ~(960, 864), NOT the screen center. Sample around the player: the beam
    // center should beat a far corner (beyond the per-band visibility reach),
    // and the facing side should beat the opposite side (a directional cone).
    await teleport(1300, 1400);
    const deep = await shot(page, 'reviewer-depth1400.png');
    const c = brightness(deep, 960, 800);
    const corner = brightness(deep, 1880, 120);
    const right = brightness(deep, 1350, 800);
    const left = brightness(deep, 570, 800);
    const centerVsCorner = Number((c - corner).toFixed(2));
    pass('B beam brightens the player region over a far corner (reveal, not a static sprite)', centerVsCorner > 20,
      `player=${c.toFixed(1)} corner=${corner.toFixed(1)} right=${right.toFixed(1)} left=${left.toFixed(1)} player-corner=${centerVsCorner}`);
    pass('B2 beam is a directional cone (one side brighter than the other)', Math.abs(right - left) > 6,
      `right=${right.toFixed(1)} left=${left.toFixed(1)} diff=${(right - left).toFixed(1)}`);

    // B3: radial brightness profile from the player (the beam center). The beam
    // is at (player.x, player.y); measure mean luminance at increasing screen
    // distances from it. A working beam (reach ~visibility world units) stays
    // bright out to several hundred px then falls; a 2-px beam falls off
    // almost immediately.
    const radialProfile = (img, cx, cy) => {
      const px = 0.96; // 1 world unit ~ 0.96 px at 1920/2000
      const out = {};
      for (const wu of [0, 100, 200, 400, 600, 900, 1200]) {
        const d = wu * px;
        out[`wu${wu}`] = Number((brightness(img, cx + d, cy, 12)).toFixed(1));
      }
      return out;
    };
    const beam = radialProfile(deep, 960, 864);
    result.samples.B3_radial_profile = beam;
    console.log('B3 radial profile from player:', JSON.stringify(beam));

    // B4: the beam is anchored to the camera center (screen center at the
    // clamped depth). Measure the MIN (background floor, not the particle
    // noise) luminance at the beam center vs 600px away. A real beam
    // (reach ~visibility world units) keeps the background floor bright over a
    // large region; a 2-px beam only lifts the floor at the exact center.
    const minInBox = (img, cx, cy, r = 20) => {
      const { width, height, channels, data } = img;
      let min = 255;
      for (let dy = -r; dy <= r; dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          const x = cx + dx;
          const y = cy + dy;
          if (x < 0 || y < 0 || x >= width || y >= height) continue;
          const i = (y * width + x) * channels;
          const v = channels >= 3 ? 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] : data[i];
          if (v < min) min = v;
        }
      }
      return Number(min.toFixed(1));
    };
    const centerMin = minInBox(deep, 960, 540);
    const awayMin = minInBox(deep, 1560, 540);
    pass('B4 beam lifts the background floor over a large region (reach ~ visibility, not a 2-px spot)',
      centerMin - awayMin > 15,
      `centerMin=${centerMin} awayMin=${awayMin} diff=${(centerMin - awayMin).toFixed(1)}`);

    // C: parallax moves at a different rate than the main terrain. The vertical
    // camera is clamped at these depths, so move the camera in x: teleport
    // x=1300 -> x=2300 at fixed depth 1400. The main terrain shifts ~960px in
    // screen x; a background parallax layer (rate < 1) shifts less. Measure the
    // x-position of the brightest terrain/edge feature in each capture.
    const colMax = (img) => {
      // In the lower third, the column with the highest mean luminance is the
      // terrain/edge line; return its x.
      const cols = [];
      const W = img.width;
      for (let x = 60; x < W - 60; x += 2) {
        cols.push({ x, b: brightness(img, x, 860, 90) });
      }
      return [...cols].sort((a, b2) => b2.b - a.b).slice(0, 3);
    };
    await teleport(1300, 1400);
    const xa = await shot(page, 'reviewer-parallax-x1300.png');
    await teleport(2300, 1400);
    const xb = await shot(page, 'reviewer-parallax-x2300.png');
    result.samples.C_cols_x1300 = colMax(xa);
    result.samples.C_cols_x2300 = colMax(xb);
    console.log('C cols x=1300:', JSON.stringify(colMax(xa)));
    console.log('C cols x=2300:', JSON.stringify(colMax(xb)));
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
}

main();
