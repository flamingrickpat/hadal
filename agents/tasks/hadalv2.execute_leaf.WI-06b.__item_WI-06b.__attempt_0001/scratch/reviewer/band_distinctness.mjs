// Independent probe: verify each mid band differs from adjacent bands
// using the actual test logic from src/render/band.test.ts

// Authored BAND_STOPS values from src/render/band.ts
const stops = [
  { depth: 0, waterTop: [0.3, 0.55, 0.7], visibility: 1800, particleSize: 2.4, snowCount: 40, moteCount: 30, currentSpeed: 10 },
  { depth: 1600, waterTop: [0.12, 0.3, 0.5], visibility: 1200, particleSize: 2.0, snowCount: 120, moteCount: 80, currentSpeed: 20 },
  { depth: 4000, waterTop: [0.06, 0.14, 0.12], visibility: 650, particleSize: 2.0, snowCount: 180, moteCount: 110, currentSpeed: 30 },
  { depth: 7000, waterTop: [0.04, 0.02, 0.09], visibility: 480, particleSize: 1.4, snowCount: 60, moteCount: 200, currentSpeed: 46 },
  { depth: 10000, waterTop: [0.015, 0.04, 0.03], visibility: 380, particleSize: 1.0, snowCount: 30, moteCount: 230, currentSpeed: 56 },
  { depth: 12000, waterTop: [0.003, 0.005, 0.015], visibility: 240, particleSize: 0.6, snowCount: 12, moteCount: 260, currentSpeed: 68 },
];

// Same logic as src/render/band.test.ts distinctFactorCount
function distinctFactorCount(a, b) {
  let count = 0;
  const palDiff = Math.abs(a.waterTop[0] - b.waterTop[0]) +
                  Math.abs(a.waterTop[1] - b.waterTop[1]) +
                  Math.abs(a.waterTop[2] - b.waterTop[2]);
  if (palDiff > 0.08) count++;
  if (Math.abs(a.visibility - b.visibility) > 150) count++;
  if (Math.abs(a.particleSize - b.particleSize) > 0.3) count++;
  if (Math.abs(a.snowCount - b.snowCount) > 30 || Math.abs(a.moteCount - b.moteCount) > 30) count++;
  if (Math.abs(a.currentSpeed - b.currentSpeed) > 10) count++;
  return count;
}

console.log('Mid band distinctiveness (same logic as band.test.ts):');
console.log('------------------------------------------------------');

// Mid1 vs Coast and Mid1 vs Mid2
const f1_above = distinctFactorCount(stops[1], stops[2]);
const f1_below = distinctFactorCount(stops[2], stops[3]);
console.log(`Mid1 (4000m) vs Coast (1600m): ${f1_above} factors`);
console.log(`Mid1 (4000m) vs Mid2 (7000m): ${f1_below} factors`);

// Mid2 vs Mid1 and Mid2 vs Mid3
const f2_above = distinctFactorCount(stops[2], stops[3]);
const f2_below = distinctFactorCount(stops[3], stops[4]);
console.log(`Mid2 (7000m) vs Mid1 (4000m): ${f2_above} factors`);
console.log(`Mid2 (7000m) vs Mid3 (10000m): ${f2_below} factors`);

// Mid3 vs Mid2 and Mid3 vs Deep
const f3_above = distinctFactorCount(stops[3], stops[4]);
const f3_below = distinctFactorCount(stops[4], stops[5]);
console.log(`Mid3 (10000m) vs Mid2 (7000m): ${f3_above} factors`);
console.log(`Mid3 (10000m) vs Deep (12000m): ${f3_below} factors`);

let pass = true;
if (f1_above < 2 || f1_below < 2 || f2_above < 2 || f2_below < 2 || f3_above < 2 || f3_below < 2) {
  console.log('FAIL: some mid band has < 2 factors from an adjacent band');
  pass = false;
}

// Palette family check (same as test)
const d12 = Math.abs(stops[2].waterTop[0] - stops[3].waterTop[0]) +
            Math.abs(stops[2].waterTop[1] - stops[3].waterTop[1]) +
            Math.abs(stops[2].waterTop[2] - stops[3].waterTop[2]);
const d23 = Math.abs(stops[3].waterTop[0] - stops[4].waterTop[0]) +
            Math.abs(stops[3].waterTop[1] - stops[4].waterTop[1]) +
            Math.abs(stops[3].waterTop[2] - stops[4].waterTop[2]);
console.log(`\nMid1 vs Mid2 palette distance: ${d12} (need > 0.1)`);
console.log(`Mid2 vs Mid3 palette distance: ${d23} (need > 0.1)`);
if (d12 < 0.1 || d23 < 0.1) {
  console.log('FAIL: palette families too close');
  pass = false;
}

console.log(`\n${pass ? 'PASS' : 'FAIL'}`);
