---
tags: [review, probes, vite-node, browser-probe, reviewer]
symbols: [vite-node, probe.mjs, tier4-logic, tier4-browser]
---

# Reviewer probe patterns (WI-03d2 review)

Reusable patterns for work-item-reviewer re-verification in this repo.

## Headless logic probes without touching product tests

- `npx vite-node <script.ts>` runs a scratch TypeScript script against the
  production modules (vite resolution: extensionless relative imports
  work, so importing `src/render/...` directly is fine). Node itself
  cannot (type stripping needs explicit extensions). Put the probe under
  `agents/tasks/<task>/scratch/reviewer/<purpose>/probe.ts` and import
  `../../../../../../src/...` from six levels up.
- The probe is a good falsification instrument: re-derive the claimed
  invariants with your own assertions instead of re-running the
  implementer's tests. During the WI-03d2 review this caught a probe-side
  error — the crossing presence is drawn at `center + 0.35*(pos-center)`,
  so "far away in world space" is NOT "far away on screen"; placement for
  partial-anatomy probes must be computed in projected space.

## Live browser re-checks

- Copying the implementer's browser probe to a reviewer scratch dir at the
  **same tree depth** keeps its `path.resolve(here, ... '../../')`
  repo-root math working; run it with a different `HADAL_BROWSER_PORT`
  (e.g. 54323) so it never collides with a running server; the probe
  starts and kills only its own dev server (by PID).
- Re-run numbers matched the committed run to animation noise (body span
  474 vs 475) — spot-check values are deterministic enough to compare.

## Gotchas

- `three` prints `THREE.Material: parameter 'alphaMap' has value of
  undefined` warnings under node (no canvas for the fin texture) —
  pre-existing, harmless, appears in every render test run.
- Commit mojibake check: `tier4Render.test.ts` landed with double-encoded
  UTF-8 in 3 lines (`Â§`, `â€”`); verify non-ASCII at the byte level
  (`[System.IO.File]::ReadAllBytes` + UTF8 decode) before trusting or
  reporting file contents.
