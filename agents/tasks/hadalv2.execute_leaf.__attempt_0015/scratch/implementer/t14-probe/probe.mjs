// Question: after the T-14 net snap, where is the player? (delta was exactly
// 0 despite the drag + damage applying). Real dependency: production sim.
import { vec2 } from '../../../../../../src/util/math.ts';
import { emptyInput } from '../../../../../../src/sim/Simulation.ts';
import { Scenario } from '../../../../../../src/sim/scenario.ts';
import { GREYBOX_WORLD, BASE } from '../../../../../../src/world/worldData.ts';

const world = {
  chunks: GREYBOX_WORLD.map((c, i) =>
    i === 0
      ? { ...c, creatureSpawns: [{ id: 't14-a', creature: 'T-14', position: vec2(1700, -300) }] }
      : c,
  ),
  base: BASE,
  currentFields: [],
};
const sc = new Scenario(201, world);
const c = sc.sim.creatures[0];
sc.swimTo(vec2(1650, -280), 40, 6000);
console.log('after approach', c.state, sc.sim.player.position, 'hp', sc.sim.player.health);
sc.sim.teleportTo(1600, 300);
console.log('after teleport', c.state, sc.sim.player.position, 'vel', sc.sim.player.velocity);
sc.sim.player.capabilities.add('sonar');
sc.step({ ...emptyInput(), sonar: true });
console.log('after sonar', c.state, sc.sim.player.position, 'hp', sc.sim.player.health);
for (let i = 0; i < 120; i += 1) {
  sc.step(emptyInput());
  if ((i + 1) % 30 === 0) {
    console.log(`t+${((i + 1) / 60).toFixed(1)}s`, c.state, sc.sim.player.position, 'hp', sc.sim.player.health);
  }
}
console.log('terrain near x=1380:', GREYBOX_WORLD[0].terrain.map((t) => t.points.slice(0, 3).map((p) => `(${p.x},${p.y})`)).slice(0, 4));
