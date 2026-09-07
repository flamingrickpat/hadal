---
id: WI-07d
kind: work_item
parent: ST-07
children: []
depends_on: ["WI-07a"]
criteria:
  AC-bal-perf: "The 60 FPS performance target holds at 1080p in the browser during the largest encounter and in every band's representative scene"
behavior: "Verify the 60 FPS target holds at 1080p in the browser during the largest encounter and in every band's representative scene using WI-07a's frame/FPS telemetry, and fix-forward within the section 34 performance rules, routing any gameplay-changing discovery to fix planning rather than redesigning in place"
subsystems: ["rendering and materials"]
verification: "Recorded frame data (FPS / frame delta / active entity count from WI-07a) for the largest encounter and for one representative scene per depth band, each sustaining 60 FPS at 1080p in the browser; any fix-forward changes (particle pooling, AI deactivation far from player, ambient count caps, geometry/material reuse, instancing, no per-frame allocations in hot loops, small DOM footprint) are evidenced with before/after frame data; a stuttering large-creature reveal is treated as a hard defect; the Node headless suite and build stay green"
---

# WI-07d — 60 FPS verification and fix-forward

## Goal

Hold the section 34 60 FPS target at 1080p where it matters most - the
largest encounter (a stuttering large-creature reveal is a hard defect, §34)
and a representative scene in each of the five depth bands. This leaf measures
with the frame/FPS telemetry WI-07a built, then applies narrow fix-forward
within the section 34 rules. It changes rendering/presentation performance,
not balance numbers (WI-07c) and not scarcity/reachability (WI-07b). It is the
named final proof owner of AC-bal-perf.

## Deliverables (checkable)

- A performance observation pass at 1080p (1920x1080) covering: the largest
  authored encounter, plus one representative scene per depth band (the same
  representative-scene set the ST-06 art pass used for inspection).
- Recorded frame data per scene from WI-07a's sampler: FPS, frame delta, and
  active entity count, sufficient to show the 60 FPS target holds (or to name
  the exact scene that does not).
- Fix-forward within the section 34 rules only, for any scene that misses:
  pool high-volume particles; deactivate AI far from the player; cap ambient
  creature counts; reuse geometries and materials; use instancing for repeated
  tiny particles / schools; avoid per-frame vector allocation in hot loops;
  avoid hundreds of DOM nodes (keep UI in a small number of elements); keep
  large procedural creatures to moderate segment counts.
- A recorded performance report: per-scene FPS with the section 34 technique
  applied where needed, and before/after frame data for any fix.

## Tests

- Browser (final proof owner of AC-bal-perf): in the largest encounter and in
  each band's representative scene at 1080p, record the frame data and assert
  sustained 60 FPS (or capture the failing scene's profile). Use the shared
  browser harness; this is a focused performance observation, not a long swim
  route.
- Node: any fix-forward is a performance change in `src/render/` / scene
  construction; the headless suite and build stay green and the visual output
  is unchanged (the reveal is not cut for speed - stutter is the defect, not
  the reveal).

## Constraints, assumptions, non-goals

- Avoid premature optimization (§34): measure first, then apply the specific
  section 34 technique that closes the gap - do not rewrite the render
  pipeline speculatively.
- Performance is less important than finishing the game (§34), but stutter in
  a large-creature reveal is a hard defect - fix that one.
- No gameplay changes: if a performance finding requires a design/content
  change (e.g. too many authored entities by design), file it through the
  normal fix-planning route as a fresh work item - do not redesign here.
- Depends on WI-07a (the frame/FPS telemetry it reads). It does not need
  WI-07c's tuning - frame rate is independent of the balance numbers - so it
  may run in parallel with the tuning.
- Spoiler rules (§§0, 12, 68): the report references encounters/scenes by
  internal id or band only, not by name.

## Fresh-session handoff

Read ST-07/plan.md (this is the final proof owner of AC-bal-perf), request
section 34 (targets and rules) and 52 (large-organism 2D techniques that set
the segment-count budget); WI-07a (the frame/FPS sampler and export you read).
Inspect `src/render/` (particle field, postfx, world/palette, spine renderer),
`src/game/Game.ts` (`renderVisuals` per-frame work, ambient scale), and the
band/encounter scene data. Record before/after frame data for any fix and
keep the headless suite green.
