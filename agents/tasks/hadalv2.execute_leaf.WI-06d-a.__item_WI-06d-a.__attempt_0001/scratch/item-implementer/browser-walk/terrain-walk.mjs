// WI-06d-a browser critical-path walk probe
// Walks all depth bands and takes screenshots to verify organic terrain.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../../..');
const PORT = 54323;
const outDir = path.join(here, 'output');
mkdirSync(outDir, { recursive: true });

function resolveBrowser() {
  if (process.env.HADAL_BROWSER && existsSync(process.env.HADAL_BROWSER)) return process.env.HADAL_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  if (!existsSync(base)) throw new Error('ms-playwright dir not found at ' + base);
  const dirs = readdirSync(base).filter(
    (d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')),
  );
  const versioned = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  if (versioned.length === 0) throw new Error('no chromium-*/chrome-win64/chrome.exe under ' + base);
  return path.join(base, versioned[versioned.length - 1].d, 'chrome-win64', 'chrome.exe');
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

// Critical-path areas to walk (internal ids, per §70 spoiler rules)
const walkPoints = [
  { id: 'band1-coast-start', x: 1300, depth: 100, band: 1, name: 'coast start area' },
  { id: 'band1-west-wall', x: -2500, depth: 800, band: 1, name: 'west wall slab' },
  { id: 'band1-wall-slab', x: 2400, depth: 800, band: 1, name: 'wall slab area' },
  { id: 'band1-ridge-slab', x: 4750, depth: 800, band: 1, name: 'ridge slab area' },
  { id: 'band1-seal-slab', x: -1200, depth: 1000, band: 1, name: 'sealed pocket wall' },
  { id: 'band2-shelf', x: 1300, depth: 500, band: 2, name: 'shelf band' },
  { id: 'band3-slope', x: 1300, depth: 2000, band: 3, name: 'slope band' },
  { id: 'band4-abyssal', x: 1300, depth: 4500, band: 4, name: 'abyssal plain band' },
  { id: 'band5-hadal', x: 1300, depth: 7000, band: 5, name: 'hadal band' },
  { id: 'band1-base', x: 1300, depth: 0, band: 1, name: 'surface base' },
];

async function teleport(page, x, depth) {
  await page.fill('.debug-teleport-x', String(x));
  await page.fill('.debug-teleport-depth', String(depth));
  await page.click('.debug-teleport');
  await page.waitForTimeout(1000);
}

const result = {
  visited: [],
  screenshots: [],
};

function pass(name, ok, detail = '') {
  console.log((ok ? 'PASS' : 'FAIL') + ': ' + name + (detail ? ' — ' + detail : ''));
  return ok;
}

async function main() {
  const browserExe = resolveBrowser();
  let browser;
  let failures = 0;

  try {
    console.log('Connecting to dev server on port', PORT);
    try {
      await waitReady();
      console.log('Dev server ready');
    } catch (e) {
      console.log('Dev server may not be ready:', e.message);
    }

    browser = await chromium.launch({
      executablePath: browserExe,
      args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
    });

    for (const point of walkPoints) {
      const ctx = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      const pageErrors = [];
      page.on('pageerror', (e) => pageErrors.push(String(e)));

      try {
        console.log(`\nVisiting ${point.name} (band ${point.band}, depth ${point.depth}m)`);
        await page.goto(`http://localhost:${PORT}/?debug=1`, { waitUntil: 'load', timeout: 30000 });
        await page.waitForSelector('canvas', { timeout: 15000 });
        await page.waitForTimeout(2500);

        await teleport(page, point.x, point.depth);

        // Take screenshot as evidence of organic terrain
        const screenshotPath = path.join(outDir, `${point.id}.png`);
        await page.screenshot({ path: screenshotPath });
        result.screenshots.push({ area: point.name, id: point.id, band: point.band, path: screenshotPath });
        result.visited.push({ id: point.id, name: point.name, band: point.band });
        console.log(`  Screenshot saved: ${screenshotPath}`);
        console.log(`  Visit recorded`);

        if (pageErrors.length > 0) {
          failures++;
          pass('no page errors', false, pageErrors.join(' | '));
        } else {
          pass('no page errors', true);
        }
      } catch (err) {
        failures++;
        pass('visit', false, err.message);
      } finally {
        await ctx.close();
      }
    }
  } catch (err) {
    failures++;
    console.log('HARNESS ERROR: ' + err.message);
  } finally {
    if (browser) await browser.close();
    writeFileSync(path.join(outDir, 'result.json'), JSON.stringify(result, null, 2));
  }

  console.log('\n\n=== SUMMARY ===');
  console.log(`Visited ${result.visited.length} areas`);
  console.log(`Screenshots: ${result.screenshots.length}`);

  process.exitCode = failures === 0 ? 0 : 1;
}

main();
