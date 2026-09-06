# Review: WI-06 Sonar System and World-Signal Bus

Status: findings

Reviewed commit: `9e62246` (10 product files + 4 task artifacts; `state.md` untouched,
working tree clean). The work item is otherwise excellent — every acceptance
criterion is met with real, re-run evidence. One low-severity render-fidelity
gap is reported below.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Expanding ring + brief outline + echo particles on `Q` (§18) | passed | `SonarSystem.test.ts` (ring expands + deactivates, lines 39–57); browser probe screenshots show the expanding ring + scattered echo dots; `SonarVisuals` draws the ring (LineLoop) + echo Points, pooled. |
| Resource signatures + larger/slower pulses from massive objects; not a minimap (§18) | passed (see Finding 1) | `SonarSystem.test.ts` lines 59–84 (resource node `lastHit` set, `SIGNATURE_TIME > TAG_FLASH_TIME`), 104–122 (massive object `tagDuration` > small, echo life scales with size), 86–102 (tag fades → transient). Not a permanent minimap: tags are transient. |
| World-signal bus carries `noise`/`light`/`sonar`/`injury`; player emits from tools/boost/sonar (§63) | passed | `senses.ts` `WorldSignal` union (all four types, reusing the §63 shape); `senses.test.ts` test 4 (all four channels on their own channel). Player emission: `Simulation.emitPlayerSignals` (boost `noise`, tools `noise`/`light`) + `SonarSystem.fire` (sonar + noise). |
| Nearby recent signals queryable — the WI-10 seam (§63) | passed | `WorldSignalBus.queryNear` / `perceive` (allocation-free `perceive` fills a caller `Percept`); `senses.test.ts` tests 5–7 (radius gating, summation, fixture creature reacts to nearby sonar but not a distant one). |
| Sonar creates a detectable sound that can affect fauna (§18, §63) | passed | `SonarSystem.fire` emits both a `sonar` and a `noise` side-effect signal (lines 75–80); `SonarSystem.test.ts` tests 1–2 + 158–177 (fixture creature reacts to a nearby real sonar fire); `scenarios.test.ts` (player Q pulse → nearby fixture creature perceives it). |
| No per-frame allocation in the ring/tagging system (§34) | passed | `SonarSystem.test.ts` test 9 (pool arrays identical by reference across 300 updates); `update` mutates only existing slots (`lastHit`, `spawnEcho` into a pre-allocated pool); `SonarVisuals` uses fixed `Float32Array` buffers + non-reallocated geometry, `needsUpdate` only. |

## Findings

1. **Low — the render layer does not scale the echo/tag size by object size, so "larger pulses from massive objects" is only half rendered.**
   - `src/render/sonar.ts:31,41` — the echo `PointsMaterial` is a fixed `size: 6` and the tag `PointsMaterial` a fixed `size: 4`. The renderer writes per-echo alpha (`echoArr[i*3+3]`) but never per-echo size.
   - `src/systems/SonarSystem.ts:71` — `spawnEcho` sets `echo.size = 1 + Math.min(target.size, 4) * 0.5` (scaling with object size), and `tagDuration` scales the *life* with size (test 7 passes). So the simulation models a **larger *and* slower** pulse, but the render expresses only the *slower* half (longer fade). A massive object's echo renders at the same 6 px as a small object's.
   - Why it matters: the work item's own browser evidence for this criterion is "shows larger pulses from large objects" (request §18, §52 technique E "sonar scale"). That is not visually expressed today. It is masked for now because the greybox has no large objects yet (only size-1 resource nodes; real large objects arrive with the WI-10 creature roster), so the gap only becomes visible once a massive creature is sonar-tagged.
   - What would satisfy it: drive the rendered echo size from `echo.size` (e.g. a per-vertex size attribute, or a per-object-size material), so a tagged massive object reads as a *larger* echo. Cheap to fix now, before WI-10 makes the gap visible.

No other findings. In particular, none of the forbidden-substitute-success cases apply:
the sonar is a real expanding ring + per-target echo/tagging system (not a static
sprite), and the signal bus is genuinely queryable by subscribers (not a
decorative emitter).

## Impact Check

- `codegraph_explore` (query `WorldSignalBus SonarSystem perceive queryNear emitPlayerSignals Simulation sonar senses`): the new symbols (`WorldSignalBus`, `SonarSystem`, `SonarVisuals`, `emitPlayerSignals`) are consumed only by `Simulation` (owns `signals` + `sonar`), `Game` (drives `SonarVisuals` + the audio ping), and the tests. No other caller.
- `codegraph_explore` (query `Simulation step createSimulation … callers`): the modified `Simulation` constructor/`step` are consumed by `Game.update`, the `Scenario` harness, and `createSimulation` / `createSimulationFromSave` — all exercised by the passing suite. Existing symbols (`Player`, `PlayerController`, `Player`) are unchanged in signature; the `step` symbol hits in the blast-radius list are local test helpers, not the `Simulation.step`.
- `Simulation.step` now calls `sonar.update` + `emitPlayerSignals` every step (O(signal pool) + O(sonar targets) ≈ O(64) + O(~200) in the greybox), and `Game.renderVisuals` calls `sonarVisuals.update` once per display frame (O(targets) + O(echo pool)). Allocation-free; well within the §34 budget. No silent breakage: `tsc --noEmit` + `vite build` pass (exit 0) and the full suite is green.

## Independent Adversarial Probes

1. **Ran the real suite + build myself.** `npx vitest run` → 15 files / 103 tests pass (incl. `senses.test.ts` 7, `SonarSystem.test.ts` 10, `scenarios.test.ts` 8). `npm run build` → `tsc --noEmit && vite build`, exit 0 (the >500 kB chunk is the three.js bundle, documented in `BUILD.md`).
2. **Decay math — did not trust the tests' own assertions.** Hand-checked `distanceGain` (`src/util/audio.ts:96`): `(ref/(ref+d))^2` with `ref = SIGNAL_RANGE_REF = 1500`. At d=0 → 1.0; at d=750 → ≈0.44; at d=12000 (8×ref) → ≈0.012 < 0.02. Combined with the linear temporal ramp `1 − age/SIGNAL_HALF_LIFE` (3 s), the bus's spatial + temporal decay is real, and the fixture-creature threshold (≥0.2) separates the near (≈0.78) from the far (≈0) cases. The bus is a genuine perception seam, not a decorative emitter.
3. **Browser probe (`scratch/work-item-reviewer/WI-06/probe.mjs`).** Boots the real `npm run dev` page in headless Chromium (`?debug=1`), crafts `sonar-1` through the production workbench UI (recipe card flips `Craft` → `Crafted`), then fires Q through the production input path. Result: boots clean (no console exceptions), sonar-1 crafted + capability granted, repeated Q pulses produce no runtime exception in the render path, and the two screenshots show the **expanding ring** (radius ~450 units at ~0.5 s → ~900+ at ~1.4 s) with scattered **echo particles**. This distinguishes "the sonar renders and expands" from "the sonar is a static sprite".

## What I Could Not Verify

- **The terrain "outline" and resource "marking" in the browser.** In both screenshots the player is at depth ~100 and the seabed (depth ~1200–1450) is just below the visible area, so the terrain outline / resource tags are off-frame. They are verified by the unit tests instead (`SonarSystem.test.ts` 39–84: the ring stamps `lastHit` on terrain + resource points as it passes, and the tags are transient). The render code (`SonarVisuals`) writes the same target state to the tag Points, so it is consistent, but I did not capture a browser frame with the tags in view.
- **The "larger pulses" in the browser** (see Finding 1): the greybox has no large objects yet, so a "larger pulse from a massive object" cannot be demonstrated in the current world data; the simulation behavior is verified by the unit test.

## Assumptions

- **Sonar is gated on the `sonar` capability, not a starter tool.** The work item lists `Q` as a control (request §6) and sonar as never-cut (request §72), while the vision link and the `EquipmentDef` model (request §62, Tier 1 "simple sonar") make sonar a Tier 1 upgrade. The implementer documented this deviation in `implementation/WI-06-implementation.md` §Deviation. I took the documented reading: the `Q` input is always wired; the pulse fires only once the `sonar` capability is owned (via the `sonar-1` recipe). This matches §9 (Tier 1 "simple sonar" is not a Tier 0 starter) and is verified end-to-end by the `scenarios.test.ts` sonar scenario (inert before the upgrade, emits a world signal after). Rejected the "starter Q" reading only because it contradicts the upgrade model.
