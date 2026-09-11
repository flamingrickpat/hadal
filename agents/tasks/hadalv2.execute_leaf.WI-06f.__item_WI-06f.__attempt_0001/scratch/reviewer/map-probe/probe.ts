/**
 * Reviewer's independent logic probe for WI-06f: build the map view model
 * and structurally verify no creature data leaks.
 */
import { createSimulation, makeSimWorld, emptyInput } from '../../../../../../src/sim/Simulation';
import { buildMapViewModel } from '../../../../../../src/ui/mapView';

const sim = createSimulation(makeSimWorld(), 1);
// Step a few times to ensure discoveredChunks has entries
for (let i = 0; i < 10; i++) {
  sim.step(emptyInput(), 0.1);
}

const model = buildMapViewModel(sim);

// Check for creature field names
const json = JSON.stringify(model);
const hasCreatureField = /"creature"/.test(json);
const hasSpawnField = /"spawns?"/.test(json);
const hasCreaturePositions = /"creaturePositions?"/.test(json);

console.log(`exploredChunks: ${model.exploredChunks.length}`);
console.log(`landmarks: ${model.landmarks.length}`);
console.log(`beacon: ${model.beacon ? 'present' : 'absent'}`);
console.log(`player position: (${model.playerPosition.x}, ${model.playerPosition.y})`);
console.log(`base position: (${model.base.position.x}, ${model.base.position.y})`);
console.log(`has "creature" in JSON: ${hasCreatureField}`);
console.log(`has "spawn" in JSON: ${hasSpawnField}`);
console.log(`has "creaturePosition" in JSON: ${hasCreaturePositions}`);

let failures = 0;
if (hasCreatureField) { console.log('FAIL: creature field leaked'); failures++; }
if (hasSpawnField) { console.log('FAIL: spawn field leaked'); failures++; }
if (hasCreaturePositions) { console.log('FAIL: creaturePosition field leaked'); failures++; }
if (model.exploredChunks.length === 0) { console.log('FAIL: no explored chunks'); failures++; }

console.log(failures === 0 ? 'PROBE PASSED' : `PROBE FAILED (${failures})`);
process.exit(failures);
