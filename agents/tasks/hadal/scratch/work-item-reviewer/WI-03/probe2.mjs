// WI-03 INDEPENDENT reviewer probe (attempt 3) — verifies the browser game is
// actually playable and that no hidden-lore text leaks into the normal UI.
//
// Distinct from the implementer's tests/browser/boot.test.mjs:
//   A. A NORMAL page (no ?debug=1) boots (canvas present, no page exception).
//   B. The debug panel is HIDDEN in normal mode (display:none).
//   C. The normal UI text contains no hidden-lore / creature / secret tokens.
//   D. In ?debug=1 the panel is visible, and giving resources + one-click
//      crafting tank-1 raises the player's oxygen capacity (readout o2Max).
//
// Runs: node probe2.mjs   (starts its own dev server on port 5312)
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../');
const outDir = path.join(here, 'output');
const port = Number(process.env.PROBE_PORT || 5312);

function resolveBrowser() {
  if (process.env.PROBE_BROWSER && existsSync(process.env.PROBE_BROWSER)) return process.env.PROBE_BROWSER;
  const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
  const dirs = readdirSync(base).filter(
    (d) => /^chromium-\d+$/.test(d) && existsSync(path.join(base, d, 'chrome-win64', 'chrome.exe')),
  );
  const v = dirs.map((d) => ({ d, n: Number(d.slice('chromium-'.length)) })).sort((a, b) => a.n - b.n);
  return path.join(base, v[v.length - 1].d, 'chrome-win64', 'chrome.exe');
}

mkdirSync(outDir, { recursive: true });
const server = spawn('cmd', ['/c', 'npm', 'run', 'dev', '--', '--port', String(port), '--strictPort'], {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
});
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
  throw new Error('dev server not ready. tail:\n' + serverLog.slice(-2000));
}

const SECRET_TOKENS = [
  'leviathan', 'colossal', 'ancient god', 'tentacle', 'macguffin',
  'abyssal', 'hadal', 'benthic', 'low water', 'revelation', 'the truth',
  'giant squid', 'anglerfish', 'deep one', 'cultist', 'cosmology',
];

async function bootPage(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2500);
  return { ctx, page, pageErrors, consoleErrors };
}

const results = {};
const browserExe = resolveBrowser();
let browser;
try {
  await waitReady(60000);
  browser = await chromium.launch({
    executablePath: browserExe,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'],
  });

  // --- A/B/C: normal page ---
  {
    const { ctx, page, pageErrors } = await bootPage(browser, `http://localhost:${port}/`);
    const canvas = await page.$('canvas');
    const panelHidden = await page.$eval('.debug-panel', (el) => el.style.display === 'none').catch(() => null);
    const bodyText = (await page.$eval('body', (el) => el.textContent)) || '';
    const leaks = SECRET_TOKENS.filter((t) => bodyText.toLowerCase().includes(t));
    results.A_normal_boots = !!canvas;
    results.B_no_page_exception = pageErrors.length === 0;
    results.C_panel_hidden_in_normal = panelHidden === true;
    results.D_no_secret_tokens_in_normal_ui = leaks.length === 0;
    results.readout_visible_in_normal = await page.$eval('.debug-readout', (el) => el.style.display !== 'none').catch(() => false);
    results.normal_body_snippet = bodyText.slice(0, 300);
    results.leaks = leaks;
    await ctx.close();
  }

  // --- E: debug page, give resources + one-click craft tank-1 ---
  {
    const { ctx, page, pageErrors } = await bootPage(browser, `http://localhost:${port}/?debug=1`);
    const readX = () => page.$eval('.debug-readout', (el) => {
      const m = el.textContent.match(/o2\s+\d+\/(\d+)/);
      return m ? Number(m[1]) : null;
    });
    const panelVisible = await page.$eval('.debug-panel', (el) => el.style.display !== 'none').catch(() => false);
    results.E_panel_visible_in_debug = panelVisible;
    // Player starts at the base -> crafting menu present.
    await page.waitForSelector('.recipe-craft', { timeout: 15000 });
    const o2maxBefore = await readX();
    await page.click('.debug-give-resources');
    await page.click('.debug-give-resources');
    await page.waitForTimeout(300);
    const craftBtn = page.locator('.recipe-craft').first();
    const craftLabelBefore = await craftBtn.textContent();
    await craftBtn.click();
    await page.waitForTimeout(800);
    const o2maxAfter = await readX();
    const craftLabelAfter = await craftBtn.textContent();
    results.E_o2max_before = o2maxBefore;
    results.E_o2max_after = o2maxAfter;
    results.E_craft_label_before = craftLabelBefore;
    results.E_craft_label_after = craftLabelAfter;
    results.E_capability_changed = o2maxAfter !== null && o2maxBefore !== null && o2maxAfter === o2maxBefore + 65;
    results.E_no_page_exception = pageErrors.length === 0;
    await ctx.close();
  }
} catch (err) {
  results.PROBE_ERROR = String(err && err.stack ? err.stack : err);
} finally {
  if (browser) await browser.close();
  writeFileSync(path.join(outDir, 'probe2-result.json'), JSON.stringify(results, null, 2));
  writeFileSync(path.join(outDir, 'probe2-server.log'), serverLog);
  spawn('taskkill', ['/t', '/f', '/pid', String(server.pid)], { stdio: 'ignore', windowsHide: true });
  await new Promise((r) => setTimeout(r, 1500));
  if (server.exitCode === null) server.kill('SIGKILL');
}

console.log('INDEPENDENT PROBE 2 RESULTS:');
for (const [k, v] of Object.entries(results)) console.log(`  ${k}: ${JSON.stringify(v)}`);
const required = ['A_normal_boots', 'B_no_page_exception', 'C_panel_hidden_in_normal', 'D_no_secret_tokens_in_normal_ui', 'E_panel_visible_in_debug', 'E_capability_changed', 'E_no_page_exception'];
const failed = required.filter((k) => results[k] !== true);
console.log(failed.length ? '\nPROBE2 FAIL: ' + failed.join('; ') + '\n' : '\nPROBE2 PASS: all required checks green');
process.exitCode = failed.length ? 1 : 0;
