// Question: what is the burst envelope of the cornered-charge organism (max
// distance from home, per-second travel) so the visible-motion assertion is
// tuned to real behavior? Real dependency: the production Simulation.
import { vec2 } from '../../../../../../src/util/math.ts';
import { emptyInput } from '../../../../../../src/sim/Simulation.ts';
import { Scenario } from '../../../../../../src/sim/scenario.ts';
import { GREYBOX_WORLD, BASE } from '../../../../../../src/world/worldData.ts';

const world = {
  chunks: GREYBOX_WORLD.map((c, i) =>
    i === 0 ? { ...c, creatureSpawns: [{ id: 't15-b', creature: 'T-15', position: vec2(1700, -300) }] } : c,
  ),
  base: BASE,
  currentFields: [],
};
const sc = new Scenario(203, world);
const c = sc.sim.creatures[0];
const home = vec2(c.position.x, c.position.y);
let maxFromHome = 0;
let prev = vec2(c.position.x, c.position.y);
for (let s = 0; s < 12 * 60; s += 1) {
  sc.step(emptyInput());
  maxFromHome = Math.max(maxFromHome, Math.hypot(c.position.x - home.x, c.position.y - home.y));
  if ((s + 1) % 60 === 0) {
    const perSec = Math.hypot(c.position.x - prev.x, c.position.y - prev.y);
    console.log(`t=${((s + 1) / 60).toFixed(0)}s st=${c.state} fromHome=${Math.hypot(c.position.x - home.x, c.position.y - home.y).toFixed(0)} perSec=${perSec.toFixed(0)} maxFromHome=${maxFromHome.toFixed(0)}`);
  }
  prev = vec2(c.position.x, c.position.y);
}
