import { makeSimWorld } from '../../../../../src/sim/Simulation';

const world = makeSimWorld();
console.log('chunks:', world.chunks.length);
console.log('exits:', world.chunks.reduce((n, c) => n + (c.exits?.length || 0), 0));
console.log('resource nodes:', world.chunks.reduce((n, c) => n + (c.resourceNodes?.length || 0), 0));
console.log('creature spawns:', world.chunks.reduce((n, c) => n + (c.creatureSpawns?.length || 0), 0));
console.log('triggers:', world.chunks.reduce((n, c) => n + (c.triggers?.length || 0), 0));