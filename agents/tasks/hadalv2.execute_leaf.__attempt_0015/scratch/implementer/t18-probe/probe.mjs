// Question: why do the T-03 prey not reach the T-18 field in the scenario?
// Real dependency: the production Simulation + greybox world (no mocks).
import { vec2 } from '../../../../../../src/util/math.ts';
import { emptyInput } from '../../../../../../src/sim/Simulation.ts';
import { Scenario } from '../../../../../../src/sim/scenario.ts';
import { GREYBOX_WORLD, BASE } from '../../../../../../src/world/worldData.ts';

const spawns = [
  { id: 't18-a', creature: 'T-18', position: vec2(1700, -300) },
  { id: 't03-a', creature: 'T-03', position: vec2(2000, -250) },
  { id: 't03-b', creature: 'T-03', position: vec2(2050, -350) },
  { id: 't03-c', creature: 'T-03', position: vec2(2100, -300) },
];
const world = { chunks: GREYBOX_WORLD.map((c, i) => (i === 0 ? { ...c, creatureSpawns: spawns } : c)), base: BASE, currentFields: [] };
const sc = new Scenario(211, world);
const herder = sc.sim.creatures.find((c) => c.def.id === 'T-18');
const prey = sc.sim.creatures.filter((c) => c.def.id === 'T-03');
const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
for (let s = 0; s < 40 * 60; s += 60 * 5) {
  sc.stepFor(5, emptyInput());
  console.log(
    `t=${sc.time.toFixed(0)}s herder=(${herder.position.x.toFixed(0)},${herder.position.y.toFixed(0)}) st=${herder.state} tgt=${herder.target ? 'yes' : 'no'}`,
    prey.map((o) => `p=(${o.position.x.toFixed(0)},${o.position.y.toFixed(0)}) st=${o.state} d=${d(o.position, herder.position).toFixed(0)}`).join(' | '),
  );
}
