// WI-06b browser inspection: capture screenshots of the mid bands at different depths
// to verify the distinct visual identity per section 14.3.

const { chromium } = require('playwright');

async function captureBands() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  // Bands to capture: surface, coast, mid1 (4000), mid2 (7000), mid3 (10000), deep (12000)
  const bands = [
    { name: 'surface', depth: 0 },
    { name: 'coast', depth: 1600 },
    { name: 'mid1-4000', depth: 4000 },
    { name: 'mid2-7000', depth: 7000 },
    { name: 'mid3-10000', depth: 10000 },
    { name: 'deep-12000', depth: 12000 },
  ];
  
  for (const band of bands) {
    try {
      // Reset to a fresh page for each band
      await page.goto('http://localhost:5173/?debug=1');
      await page.waitForTimeout(2000); // wait for game to initialize
      
      // Fill teleport inputs
      await page.fill('.debug-teleport-x', '0');
      await page.fill('.debug-teleport-depth', String(band.depth));
      
      // Click teleport
      const teleportBtn = page.locator('.debug-teleport');
      await teleportBtn.click();
      
      // Wait for teleport and render
      await page.waitForTimeout(1500);
      
      // Take screenshot
      const screenshotPath = `band_${band.name}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Captured ${band.name} at depth ${band.depth}: ${screenshotPath}`);
      
    } catch (e) {
      console.log(`Failed to capture ${band.name}: ${e.message}`);
    }
  }
  
  await browser.close();
}

captureBands();
