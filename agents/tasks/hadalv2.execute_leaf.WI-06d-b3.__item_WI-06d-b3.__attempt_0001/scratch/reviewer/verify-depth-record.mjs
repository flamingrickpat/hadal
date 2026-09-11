// Independent verification probe: depth record tick fires exactly once per new record.
import { Scenario } from '/src/sim/scenario.ts';
import { emptyInput } from '/src/sim/Simulation.ts';

// Test 1: New record fires cue
let s = new Scenario(1);
let sim = s.sim;
console.log(`Initial: newDepthRecord=${sim.player.newDepthRecord}, maxDepth=${sim.player.maxDepth}`);

// Dive to set new record
let diveInput = emptyInput();
diveInput.thrustY = -1;
s.stepFor(10, diveInput);
console.log(`After dive: newDepthRecord=${sim.player.newDepthRecord}, depth=${Math.round(sim.player.depth)}, maxDepth=${Math.round(sim.player.maxDepth)}`);

// Consume the flag (as HUD would)
if (sim.player.newDepthRecord) {
  console.log("CUE FIRED");
  sim.player.newDepthRecord = false;
}

// Test 2: Swimming shallower does not re-fire
let upInput = emptyInput();
upInput.thrustY = 1;
s.stepFor(5, upInput);
console.log(`After swimming up: newDepthRecord=${sim.player.newDepthRecord}, depth=${Math.round(sim.player.depth)}, maxDepth=${Math.round(sim.player.maxDepth)}`);

// Test 3: Swimming at same depth does not re-fire
let neutralInput = emptyInput();
s.stepFor(5, neutralInput);
console.log(`After neutral: newDepthRecord=${sim.player.newDepthRecord}, depth=${Math.round(sim.player.depth)}, maxDepth=${Math.round(sim.player.maxDepth)}`);

console.log("Probe complete.");
