import { describe, it, expect } from 'vitest';
import { TelemetryCollector } from './telemetry';

describe('TelemetryCollector', () => {
  it('measures FPS correctly', () => {
    const collector = new TelemetryCollector();
    const inv = {};
    const banked = {};

    // Step 1 at t=0
    collector.onStepStart(0, inv, banked, false, 0);
    collector.onStepEnd(0, 'zone-1', 100, 100, 0, inv, banked, 100, 100, false, 0, [], 1 / 60);

    // Step 2 at t=1/60
    collector.onStepStart(1 / 60, inv, banked, false, 0);
    collector.onStepEnd(1 / 60, 'zone-1', 100, 100, 0, inv, banked, 100, 100, false, 0, [], 1 / 60);

    // ... run 60 steps to reach 1 second
    let t = 1 / 60;
    for (let i = 2; i <= 60; i++) {
      collector.onStepStart(t, inv, banked, false, 0);
      t += 1 / 60;
      collector.onStepEnd(t, 'zone-1', 100, 100, 0, inv, banked, 100, 100, false, 0, [], 1 / 60);
    }

    const snap = collector.snapshot();
    expect(snap.frames).toBe(61); // 1 initial + 60
    // After 1 second at 60 FPS, fps should be close to 60
    expect(snap.fps).toBeGreaterThan(55);
    expect(snap.fps).toBeLessThan(65);
  });

  it('tracks max depth', () => {
    const collector = new TelemetryCollector();
    const inv = {};
    const banked = {};

    collector.onStepStart(0, inv, banked, false, 0);
    collector.onStepEnd(0, 'zone-1', 100, 100, 0, inv, banked, 100, 100, false, 0, [], 1 / 60);

    collector.onStepStart(1, inv, banked, false, 0);
    collector.onStepEnd(1, 'zone-2', 500, 500, 0, inv, banked, 80, 100, false, 0, [], 1 / 60);

    const snap = collector.snapshot();
    expect(snap.maxDepth).toBe(500);
  });
});
