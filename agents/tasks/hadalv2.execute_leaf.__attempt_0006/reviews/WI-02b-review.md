# Review: WI-02b — Procedural creature rendering

Status: pass

Date: 2026-09-08
Role: work-item-reviewer
Reviewed commit: `938fc1b` ([render][creatures] add procedural creature renderers driven by sim state)
Base revision: `92b89e55240b451861ba8fd903a91349cbb49087`

Codegraph note (structural lookup gate): the first structural lookup this
session was `codegraph_explore` on `Simulation creatures state timeSec Creature
bandProfileAtDepth BandProfile ambient` (projectPath `C:\Temp\hadal-v2`), which
located `src/render/band.ts` (BandProfile.ambient), `src/sim/Simulation.ts`
(creatures array, state), and `src/game/Game.ts` (renderVisuals seam).
Subsequent calls located the fixture defs, `makeFillGeometry`/`makeEdgeGeometry`
(World.ts), and the `renderVisuals` caller graph. All seam facts below were
confirmed from codegraph-located source, not from the implementer's prose.

## Contract established before diff review

`request.md` / work item / understanding agree on AC-cf-render: a reusable
spine renderer plus small-body and rigid renderers draw **creature state from
the simulation** in the Three.js layer, **without changing gameplay rules**.
Verification: a focused browser check that a WI-02a organism renders,
animates, and follows its simulated spine with no console errors, plus a node
test asserting renderer output derives only from sim state. The work item
scopes to "New files under `src/render/`" reading state `Game.ts` already
syncs, defers the real palette to ST-06, and names the two WI-02a fixtures
(`SCHOOLER`, `FORAGER`) as the only test subjects.

Decision table for the overloaded "body shape" branch:

| Fixture | `body.chainCircles` | Renderer dispatch | Verified |
|---|---|---|---|
| `fixture-forager` | two circles at ±40 | `spine` kind: trunk-pinned ribbon + rigid per-circle parts | yes (node test + browser) |
| `fixture-schooler` | none (radius only) | `small` kind: synthetic 4-segment tapered ribbon, no parts | yes (node test + browser) |

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-cf-render: spine + small + rigid renderers draw sim state in Three.js, no gameplay change | passed | Re-ran `npx vitest run src/render/creatureRender.test.ts` (12 pass), `npm test` (23 files / 168 pass), `npx tsc --noEmit` (exit 0), the focused browser check (PASS), and `npm run test:browser` (4/4 BROWSER SUITE PASS). Code read confirms the renderer reads `position`/`velocity`/`state`/`active`/`target`/`def` only — no steering, no state transition, no collision. |
| §13.2 head driven by simulated position | passed | group position set to `creature.position` each frame (`creatureRender.ts:383-384`); browser check asserted the forager visual group equals its sim position (1700,-60 == 1700,-60). See Finding 1 for the head-vs-trunk nuance. |
| §13.2 constrained nodes at fixed segment distance | passed | `solveSpine` taut pass at `spine.segDist`; node test `pins the trunk node ... and holds fixed segment distances` asserts each segment to 3 decimals. Re-ran, passes. |
| §13.2 body geometry from left/right normals | passed | `spineRenderer.ts` computes unit left-normal per node; ribbon vertices offset along the normal by width; node test `computes unit normals perpendicular to each node tangent` re-ran green. |
| §13.2 attachment points for fins / plates / tendrils / lights / debris / appendages | passed (with note) | Fins, rigid per-circle parts, and carried found debris each ride a spine node at `normal * width`. The generic `FoundAttachment` (node/side/distance) is the attachment-point primitive. See Finding 2: no dedicated tendril/light meshes are rendered, only the generic host. |
| §13.1 small-creature renderer (ShapeGeometry, polygon meshes, translucent fins, outline lines, CanvasTexture masks, 3-8 segments) | passed (with note) | Polygon ribbon (BufferGeometry + indices), translucent fin material sharing one CanvasTexture radial-alpha mask, a LineLoop outline that shares the ribbon's position buffer, and a 4-segment synthetic spine (node test asserts 3–8). See Finding 3: uses a BufferGeometry ribbon, not a literal THREE.ShapeGeometry. |
| §13.3 rigid/semi-rigid hierarchy: parts on different time scales, bodies can exceed screen bounds | passed | `PartRec.rate = 1/(1+0.5*i)` gives each part its own slower scale; no view clamping anywhere in the module. Node test `lets rigid bodies exceed the screen bounds without clamping` (±1500 leviathan, maxDist > 1300) re-ran green. |
| §13.4 found-object attachment hook | passed (with note) | `attachFoundObject`/`detachFoundObjects` accept any THREE.Object3D and ride a spine node; node test `carries a found object that rides its attachment point` re-ran green. See Findings 3 and 4 on geometry-library reuse and note accuracy. |
| §13.5 non-periodic animation: noise modulation, pauses, breathing, asymmetric appendage motion, alert posture | passed | `n1` (two-partial wave, not a single sine), `flapEnvelope` (held pause plateau), per-node breathing width cycle, per-fin asymmetric phase, `alert` widens fin swing and body posture. Node test `animates deterministically` (left vs right fins differ) re-ran green. |
| §15 lighting interplay: readable in/out of beam; large bodies as separate illuminated pieces | passed (deferred palette) | MeshBasicMaterial bodies tinted per frame by `profile.ambient`; each rigid part gets its own slight tint variation, so a long body reads as separately lit pieces. The real depth-band palette and the beam are explicitly ST-06's / `lighting`'s job, and the work item says to keep materials neutral — the neutral greybox family is correct here, not a defect. |
| §30 pure render adapter: reads sim, writes nothing back | passed | Node test `derives output only from sim state: the creature is never mutated` snapshots position/velocity/state/active/home/target before and after multiple `update` calls and asserts byte-identical. Re-ran green. `update` only reads `creature.*` fields. |
| §34 performance: moderate segment counts, reused geometry/materials, no per-frame allocation | passed | Segment count = spine nodes (3–8 small, chain+1 spine). One shared finMat/edgeMat, shared fin geometry, body ribbon pre-allocated as a Float32Array filled in place, solveSpine mutates pre-allocated frame buffers in place. Verified by reading stepVisual/solveSpine — no `new` in the per-frame path (allocation only on first-frame buildVisual per creature). The sim never removes creatures from `sim.creatures` (only deactivates), so the visuals map stays bounded. |
| No gameplay rules moved into the render layer | passed | Renderer reads position/active/def/velocity/target/state only; steering, state, and collision remain in src/creatures and src/sim. |

## Findings

No blocking findings. Four non-blocking notes, none a contract violation:

1. **Head vs trunk node.** The trunk node is pinned at `creature.position`
   (verified in node and browser). The *head* visual is the front spine node,
   the node farthest along the heading, so it sits a small offset ahead of the
   pinned trunk node while the body ribbon fans out behind. This is consistent
   with §13.2 "head driven by the simulated position" in the sense that the
   whole assembly is anchored to and follows the sim position; the group
   itself tracks sim exactly. Acceptable.

2. **No dedicated tendril/light meshes.** §13.2 lists "tendrils, lights"
   among attachment points; §13.4/§15 imply carried debris and bioluminescent
   detail. The implementation provides the generic `FoundAttachment` host
   (node/side/distance) plus per-circle rigid parts, but does not itself
   instantiate tendril or point-light meshes. This is within the work item's
   scope (attachment *points*, and ST-06 owning the lit bioluminescent look),
   so it is a note, not a defect.

3. **ShapeGeometry wording.** §13.1 names "ShapeGeometry"; the small-body
   renderer uses a `BufferGeometry` ribbon with indices plus a `LineLoop`
   outline. This is a polygon mesh that reads the same way on screen; it does
   not use the literal `THREE.ShapeGeometry` class. Functionally satisfies the
   criterion; the literal class name was not required for the observable
   behavior, but the implementer's note (see Finding 4) overstates reuse.

4. **Note accuracy on "same geometry library as world wreckage."** The
   implementation result note claims `makeFoundPanel` reuses the
   "world-silhouette PlaneGeometry/LineLoop vocabulary." In fact the world
   wreckage silhouette fill is built by `World.makeFillGeometry`, which
   produces a `THREE.ShapeGeometry` (World.ts:121-129), and its edge is
   `makeEdgeGeometry` (BufferGeometry). `makeFoundPanel` uses a standalone
   `PlaneGeometry` + `LineLoop` with near-black fill + accent edge (a close
   visual family, but not the same geometry class). The "same geometry
   library" claim is slightly imprecise; the panel matches the world
   *silhouette visual family*, not the world's exact geometry constructors.
   This does not affect the §13.4 criterion (a creature carries an Object3D),
   so it is a documentation-accuracy note only.

## Impact Check

- `codegraph_explore` on `Game renderVisuals callers`: `renderVisuals`
  (Game.ts:127) has exactly one caller in `src/main.ts` (the frame loop), so
  adding `this.creatureRenderer.update(...)` there is a clean additive seam.
- `codegraph_explore` on `renderVisuals` / `update` blast radius: no other
  product code constructs `CreatureRenderer` or reads its internals; the
  `__HADAL_GAME__` debug handle is the only external reference.
- `rg` for `creatures` in `src/sim/Simulation.ts`: `creatures` is a
  `readonly Creature[]` (line 111) pushed at construction (line 185) and
  iterated (line 265); it is never removed from, so the renderer's `visuals`
  map keyed by creature id stays bounded (no leak as the sim deactivates far
  creatures).
- No changed symbol is imported by a consumer outside this work item's files.

## Independent Adversarial Probes

- Ran `npm run test:browser` (shared boot harness) independently → 4/4 PASS,
  confirming wiring the renderer into the real frame loop did not regress
  boot, input, resize, or save. This is the "real game path" evidence distinct
  from the agent-authored node tests.
- Ran the focused browser check
  `agents/tasks/hadalv2.execute_leaf.__attempt_0006/scratch/implementer/wi-02b-browser/creature-render-check.mjs`
  and read the full JSON: forager visual group equals sim position exactly;
  forager bodyXMin/bodyXMax -40..40, partCount 2, finCount 2; schooler
  partCount 0, finCount 4. This distinguishes "visuals derived from sim" from
  "visuals that merely animate."
- Read the two WI-02a fixtures directly (`src/creatures/fixtures.ts`) to
  confirm the dispatch branch: FORAGER has `chainCircles` (spine kind),
  SCHOOLER has only a radius (small kind). This checks the overloaded
  "body shape" branch the node tests alone do not fully pin down.
- Read `World.ts` `makeFillGeometry`/`makeEdgeGeometry` to adjudicate Finding
  4 (whether `makeFoundPanel` truly reuses the world geometry library).

## What I Could Not Verify

- I could not visually inspect the rendered WebGL output (no screenshot
  capture in this environment); the browser check asserts geometry
  positions/counts and the absence of console errors, not that the shapes
  look a particular way. The lighting-interplay criterion (§15) is therefore
  verified at the "tinted by profile.ambient, per-part variation" code level
  and left to ST-06 for the real palette, per the work item's own scoping.
- I did not re-author the renderer's internal algorithm; I confirmed the
  observable outputs (spine node positions, body geometry, found-object
  ride-along) via the implementer's tests re-run plus my own browser probes.
