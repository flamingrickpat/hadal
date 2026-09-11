# WI-06f Implementation Result

## Summary

Built the section 26 bathymetry map overlay. Tab opens/closes the overlay, pauses the game while open, and renders explored chunk silhouettes, player position, base, and discovered landmarks using the existing discoveredChunks state. The death beacon path is present but only fires when a 'death-beacon' story flag is set (no story adds this yet, so no placeholder beacon).

## Tests (TDD)

Wrote failing tests first in `src/ui/mapView.test.ts`:

1. View model exposes player position — **PASS**
2. View model exposes explored chunk silhouettes — **PASS**
3. View model exposes the base — **PASS**
4. View model exposes discovered landmarks only (no creature data) — **PASS**
5. View model does not expose creature data (structural, checked via JSON serialization) — **PASS**
6. Death beacon is absent without beacon state — **PASS**

## Implementation

**Files created:**
- `src/ui/mapView.ts` — read-only view model builder (`buildMapViewModel`); consumes `Simulation.discoveredChunks`, `chunks`, `player.position`, `base`, `storyFlags` (for beacon); never exposes creature positions
- `src/ui/mapOverlay.ts` — full-screen canvas overlay; opens on Tab, renders bathymetric silhouettes with depth-tinted blocks for explored chunks, blue square for base, tan circles for landmarks, red beacon, and a pulsing blue player marker
- `src/ui/mapView.test.ts` — Node tests (6 passing)

**Files modified:**
- `src/game/Game.ts` — imports and instantiates `MapOverlay`, adds Tab key handler, pauses game while map is open, updates map view model each frame when open
- `src/ui/hud.ts` — removed stale WI-15 comment (now references `MapOverlay` by name)

**Shrink/Flatten pass:** No pass-through methods, no one-use interfaces, no defensive branches for impossible internal states. All files have independent ownership.

**Browser verification:** The map opens on Tab, pauses the game (verified via the shared browser harness), and renders the overlay with the expected content.

## Evidence

| Criterion | Artifact | Status |
|-----------|----------|--------|
| AC-art-map: map opens on Tab and pauses | `src/game/Game.ts` Tab handler + `update()` pause logic | verified in browser |
| AC-art-map: shows player position | `src/ui/mapView.ts` + `mapOverlay.ts` render loop | verified in browser |
| AC-art-map: shows explored chunk silhouettes | `src/ui/mapView.ts` reads `discoveredChunks` | verified in browser |
| AC-art-map: shows base | `src/ui/mapView.ts` reads `sim.base` | verified in browser |
| AC-art-map: shows discovered landmarks | `src/ui/mapView.ts` reads chunk props with `kind: 'landmark'` | verified in browser |
| AC-art-map: shows death beacon only if tracked | `src/ui/mapView.ts` checks for 'death-beacon' story flag | verified (absent when no flag) |
| AC-art-map: never shows creature locations | `src/ui/mapView.test.ts` (structural test) | test passing |
| Stale WI-15 comment in hud.ts removed | `src/ui/hud.ts` | verified |
| Node test suite green | `npm run test` | 361 tests, 2 pre-existing failures unrelated to map |
