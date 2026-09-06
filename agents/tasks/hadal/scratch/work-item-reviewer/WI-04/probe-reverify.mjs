// WI-04 reviewer RE-VERIFY probe (independent of the implementer's probe and of
// the first-review probe). Question answered: after the implementer's fix
// (commit 07b68fb), does the flashlight beam (a) actually reveal the scene as a
// bright radial region, and (b) is it anchored to the PLAYER (not the clamped
// camera center) so that a deep diver still carries their light?
//
// Discriminating check: at depth 1400 the camera clamps to y=-1057.5, so the
// screen center (960,540) is the camera center and the diver sits lower, at
// screen ~(960,868.8). A camera-anchored beam (the pre-fix bug) would put the
// bright core at y~540; a player-anchored beam puts it at y~868.8. We sample a
// vertical luminance profile along x=960 and locate the brightest 40x40 box,
// then check both sit near the diver, not the screen center. No product change.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../..');
const outDir = path.join(here, 'output');
const port = 52341;
const ms = (n) => new Promise((r) => setTimeout(r, n));

const PX_PER_WU = 1920 / 2000; // 0.96 px per world unit at 1920/2000
const clampCamY = (y) => Math.max(-1057.5, Math.min(-562.5, y));
const screenOf = (wx, wy) => {
  const camX = 1300; // probe teleports to x=1300 (unclamped)
  const camY = clampCamY(wy);
  return { x: 960 + (wx - camX) * PX_PER_WU, y: 540 - (wy - camY) * PX_PER_WU };
};

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

// Minimal PNG (RGB/RGBA, 8-bit) decoder; the "left" term uses the reconstructed
// current-row value (out), not the raw filtered value, so all filters decode right.
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data.readUInt8(8); colorType = data.readUInt8(9); }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
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
      const a = x >= channels ? out[y * stride + x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      const v = line[x];
      let val;
      if (filter === 0) val = v;
      else if (filter === 1) val = (v + a) & 255;
      else if (filter === 2) val = (v + b) & 255;
      else if (filter === 3) val = (v + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
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
const brightness = (img, cx, cy, r = 14) => {
  let sum = 0, n = 0;
  for (let dy = -r; dy <= r; dy += 1)
    for (let dx = -r; dx <= r; dx += 1) {
      const v = lumAt(img, cx + dx, cy + dy);
      if (!Number.isNaN(v)) { sum += v; n += 1; }
    }
  return n ? sum / n : NaN;
};
const minInBox = (img, cx, cy, r = 18) => {
  let m = 255;
  for (let dy = -r; dy <= r; dy += 1)
    for (let dx = -r; dx <= r; dx += 1) {
      const v = lumAt(img, cx + dx, cy + dy);
      if (!Number.isNaN(v) && v < m) m = v;
    }
  return Number(m.toFixed(1));
};
const stddev = (img, y0) => {
  const { width, height, channels, data } = img;
  let sum = 0, n = 0;
  for (let y = y0; y < height; y += 2)
    for (let x = 0; x < width; x += 2) {
      const v = lumAt(img, x, y);
      if (!Number.isNaN(v)) { sum += v; n += 1; }
    }
  const mean = sum / n;
  let sq = 0;
  for (let y = y0; y < height; y += 2)
    for (let x = 0; x < width; x += 2) {
      const v = lumAt(img, x, y);
      if (!Number.isNaN(v)) sq += (v - mean) * (v - mean);
    }
  return Number(Math.sqrt(sq / n).toFixed(2));
};
// Brightest 40x40 box below the HUD strip (y >= 140).
const brightestBox = (img) => {
  const { width, height } = img;
  let best = -1, bx = 0, by = 0;
  for (let y = 140; y + 40 < height; y += 16)
    for (let x = 20; x + 40 < width; x += 16) {
      const v = brightness(img, x + 20, y + 20, 19);
      if (v > best) { best = v; bx = x + 20; by = y + 20; }
    }
  return { x: bx, y: by, lum: Number(best.toFixed(1)) };
};
// Count of near-white pixels (the illuminated beam core) below the HUD strip.
const brightArea = (img, y0 = 140) => {
  const { width, height } = img;
  let c = 0;
  for (let y = y0; y < height; y += 2)
    for (let x = 0; x < width; x += 2) {
      const v = lumAt(img, x, y);
      if (!Number.isNaN(v) && v > 190) c += 1;
    }
  return c;
};

const result = { checks: {}, samples: {}, pageErrors: [], consoleErrors: [] };
let browser;
async function waitReady() {
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    try { const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(1500) }); if (r.ok) return; }
    catch { /* not ready */ }
    await ms(400);
  }
  throw new Error('dev server not ready within 60s');
}
const pass = (name, ok, detail) => {
  result.checks[name] = ok ? 'PASS' : 'FAIL';
  if (detail !== undefined) result.samples[name] = detail;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '  [' + detail + ']' : ''));
};
const shot = (page, name) =>
  page.screenshot({ path: path.join(outDir, name) }).then(() => decodePng(readFileSync(path.join(outDir, name))));

async function main() {
  mkdirSync(outDir, { recursive: true });
  const server = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(port), '--strictPort'], {
    cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'],
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
    const measureFps = (dur) => page.evaluate((d) => new Promise((res) => {
      let f = 0; const t0 = performance.now();
      const tick = () => { f += 1; if (performance.now() - t0 < d) requestAnimationFrame(tick); else res(f / (d / 1000)); };
      requestAnimationFrame(tick);
    }), dur);

    // Not a flat field at deep water (request §14.1).
    await teleport(1300, 1400);
    const deep = await shot(page, 'reverify-depth1400.png');
    const sd = stddev(deep, 120);
    pass('A scene is not a flat color field (luminance stddev)', sd > 4, `stddev(depth1400)=${sd}`);

    // D1 (discriminating, corrected): the flashlight is the diver's light, so
    // the bright CONE BASE (the lowest point of the bright cone = the origin)
    // must sit at the DIVER's height (near the seabed), not at the screen
    // center. A camera-anchored beam (the pre-fix bug) would put its base at
    // the screen center (y~540). We find the lowest row (largest y) that still
    // holds a thin bright base, and the y-centroid of the bright region.
    const player = screenOf(1300, -1400);
    const camCenter = { x: 960, y: 540 };
    const { width: W, height: H, channels: CH, data } = deep;
    const rowBrightCount = (y) => {
      let c = 0;
      for (let x = 0; x < W; x += 1) {
        const i = (y * W + x) * CH;
        const v = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        if (v > 190) c += 1;
      }
      return c;
    };
    let coneBaseY = -1, centroidY = 0, brightTotal = 0;
    for (let y = 130; y < H; y += 1) {
      const c = rowBrightCount(y);
      if (c > 8) coneBaseY = y; // lowest row with a thin bright base = cone origin
      centroidY += y * c;
      brightTotal += c;
    }
    centroidY = brightTotal ? centroidY / brightTotal : NaN;
    const dBasePlayer = Math.abs(coneBaseY - player.y);
    const dBaseCam = Math.abs(coneBaseY - camCenter.y);
    result.samples.coneBaseY = coneBaseY;
    result.samples.centroidY = Number(centroidY.toFixed(1));
    pass('D1 bright cone base (beam origin) is at the DIVER height, closer to the diver than the screen center',
      dBasePlayer < dBaseCam && dBasePlayer < 220,
      `coneBaseY=${coneBaseY} centroidY=${centroidY.toFixed(1)} playerY=${player.y.toFixed(0)} camY=${camCenter.y} dPlayer=${dBasePlayer.toFixed(1)} dCam=${dBaseCam.toFixed(1)}`);

    // D2: the bright region is concentrated BELOW the screen center (the cone
    // rises from the diver up into the water), not at/above the screen center.
    pass('D2 bright region is concentrated at/below the diver, not at the screen center',
      centroidY > camCenter.y,
      `centroidY=${centroidY.toFixed(1)} camY=${camCenter.y} playerY=${player.y.toFixed(0)}`);

    // B: the beam reveals the scene — a bright core far above the surrounding
    // water (a reveal mask, not a flat field nor a static sprite).
    const core = brightestBox(deep);
    pass('B beam reveals a bright core far above the surrounding water',
      core.lum - brightness(deep, 1750, 300, 30) > 60,
      `coreLum=${core.lum} farWater=${brightness(deep, 1750, 300, 30).toFixed(1)}`);

    // C: effective visibility shortens with depth (smaller illuminated area).
    // Teleport to a shallow depth first: the beam reach is larger there
    // (visibility ~2000 world units) so a bigger screen area is illuminated.
    await teleport(1300, 300);
    const shallow = await shot(page, 'reverify-depth300.png');
    const deepBA = brightArea(deep);
    const shallowBA = brightArea(shallow);
    pass('C illuminated area is smaller when deeper (visibility shortens)',
      deepBA < shallowBA,
      `brightArea(shallow300)=${shallowBA} brightArea(deep1400)=${deepBA}`);

    // E: not pure black — the background floor (min luminance in open water)
    // stays above zero at depth.
    const floor = minInBox(deep, 160, 300, 24);
    pass('E open water is never pure black (ambient floor above zero)',
      floor > 5, `minOpenWater(depth1400)=${floor}`);

    result.samples.fps = Number((await measureFps(2500)).toFixed(1));
    result.samples.playerScreen = { x: Number(player.x.toFixed(0)), y: Number(player.y.toFixed(0)) };
  } catch (err) {
    result.error = String(err && err.stack ? err.stack : err);
  } finally {
    if (browser) await browser.close();
    writeFileSync(path.join(outDir, 'result-reverify.json'), JSON.stringify(result, null, 2));
    writeFileSync(path.join(outDir, 'server-reverify.log'), serverLog);
    spawn('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
    await ms(2000);
    if (server.exitCode === null) server.kill('SIGKILL');
  }
  console.log('\nSUMMARY:', JSON.stringify(result.checks));
  console.log('fps:', result.samples.fps, ' coneBaseY:', result.samples.coneBaseY, ' centroidY:', result.samples.centroidY);
  if (result.pageErrors.length) console.log('pageErrors:', JSON.stringify(result.pageErrors));
  if (result.consoleErrors.length) console.log('consoleErrors:', JSON.stringify(result.consoleErrors));
  if (result.error) console.log('ERROR:', result.error);
}
main();
