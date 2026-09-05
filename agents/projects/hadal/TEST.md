# Testing

## Frameworks

Target: Vitest for small deterministic logic tests (request §28) —
world validation, critical-path simulation, recipe/gate consistency,
seeded RNG. Not installed yet: this revision has no `package.json`.

## Full Test Command

Target, once Vitest is configured:

```bash
npx vitest run
```

## Focused Test Commands

```bash
npx vitest run src/util       # one area
npx vitest run -t <test name> # one test
```

## Integration And Live Tests

The game itself has no unit-test surface; verification is in-browser.
The request §70 checklist is the integration contract:

- Boot: fresh browser profile starts; audio after input; resize works;
  no console exceptions.
- Core loop: collect first resource; surface; craft first upgrade;
  upgrade changes capability; oxygen refills; death respawns.
- Progression: each depth gate understandable; required materials exist;
  final zone reachable from a fresh save; no softlock; shortcut flags
  persist after reload.
- Creatures: no impossible-terrain aggro; no visible teleporting;
  friendly creatures not permanently stuck; offscreen AI throttled;
  largest encounter above the performance target.
- Save: reload after each major tier, at base, after death; malformed
  save fails gracefully by resetting or backing up.
- Ending: MacGuffin trigger cannot fire twice; final sequence works
  after save reload; credits/restart works.

In-engine validators (request §32), reachable from the debug panel
(request §33):

- `validateWorld()` — chunk exits valid, critical chunks connected,
  required resource nodes present, story triggers and recipe/creature
  IDs resolve.
- `simulateCriticalPath()` — start capabilities -> guaranteed materials
  -> craftable upgrades -> reachable gates, repeated until the final
  objective is reachable.

## Fixtures

None yet. Once created, keep them under the test files: deterministic
seeded-RNG fixtures (request §61) and world-validation fixtures for the
validators above.

## Manual End-User Verification

- Fresh browser profile; audio starts after input; resize works; no
  console exceptions (request §70).
- Timed near-blind playthrough toward 90–120 minutes using debug
  telemetry (request §71, §44 phase 8): time to first upgrade, time per
  depth band, deaths, resource shortages, time lost, repeated travel,
  final completion.
- Visual/atmosphere pass is unautomatable here: observe per-band
  palettes, particles, lighting, and large-creature reveals at
  1920x1080 in a real browser (request §14, §34).

## Delivery Verification

- Startup/readiness: `npm run dev` (or `npm run build` +
  `npm run preview`) in a real desktop browser; fresh profile boots
  with no console exceptions.
- Primary user flow: title -> surface platform -> dive -> harvest ->
  surface -> craft -> deeper (request §53), through to MacGuffin
  retrieval and the ending beat (request §23, §24).
- Persistence boundary: reload after base return, after each major
  tier, and after death; malformed `localStorage` save resets or backs
  up gracefully (request §25, §42).
- Visual assertion: largest encounter holds ~60 FPS at 1080p; depth
  bands are visually and aurally distinct (request §14.3, §34).
- Tool used: no automation exists in this checkout — manual observation
  in a real browser, supported by the in-engine debug panel (request
  §33) and balance telemetry (request §71).
