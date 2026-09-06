# WI-01 Implementation Result — Scaffold the HADAL project and boot loop

Role: `item-implementer` — 2026-09-05.

## Codegraph Gate

First structural lookup this session: `codegraph_explore`
("Vite TypeScript Three.js boot main.ts Game Renderer fixed-step loop",
projectPath `C:\Temp\hadal`) → "No relevant code found". Consistent with
the greenfield state recorded in
`agents/projects/hadal/notes/20260210-understander-greenfield-repo-state.md`;
all product files below are new.

## Red Phase (Tests Written And Confirmed Failing)

- Wrote `src/util/rng.test.ts` against a `Math.random`-backed
  `createRng` stub (`src/util/rng.ts`).
- `npx vitest run` → exit 1, `1 failed | 2 passed (3)`:
  `createRng > gives identical sequences for identical seeds` failed
  (`AssertionError: expected [0.118…, …] to deeply equal [0.0428…, …]`)
  — the intended behavioral failure (non-determinism), not a compile
  failure.

## Acceptance Evidence Table

| Criterion | Evidence | Status |
|---|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` exist; `npm install` and `npm run build` exit 0 | Files at repo root; `npm install` exit 0 (fresh re-run); `npm run build` = `tsc --noEmit && vite build` exit 0 (vite 8.2.2, 11 modules, `dist/` emitted) | passed |
| `src/main.ts` boots: `WebGLRenderer`, minimal 3D scene, orthographic camera; a frame renders at 1920×1080 in a real browser, no console exceptions | Probe `agents/tasks/hadal/scratch/item-implementer/WI-01/probe.mjs`: headless Chromium (local ms-playwright binary, software GL) at 1920×1080 dpr 1 — canvas present, WebGL2 context live, drawing buffer 1920×1080, non-blank frame (luminance range 125), `output/boot-1920x1080.png` shows the boot marker on the dark water background, `output/console.json` has zero errors and zero page exceptions | passed |
| Fixed 1/60 s timestep, accumulator, not frame-tied | `src/game/Game.ts` `frame()`: clamped real dt added to `accumulator`; `while (accumulator >= FIXED_DT) update(FIXED_DT)`; `render(accumulator / FIXED_DT)`. Boot marker position is a function of `GameState.timeSec` (sim clock), not frame time | passed (code; reviewer confirms cadence) |
| `Game` orchestrator owns `update(FIXED_DT)` / `render` + fixed-step loop | `src/game/Game.ts` (coordinator, L1+L2 contract) owns the rAF loop, accumulator, and `start`/`stop`; `src/main.ts` only assembles | passed |
| `src/game/` core + `src/render/Renderer.ts` exist | `src/game/Game.ts`, `src/game/GameState.ts`, `src/game/constants.ts`, `src/render/Renderer.ts` (all with L1+L2 contracts and archetypes) | passed |
| `.gitignore` includes `design_private/` and node build artifacts | `git check-ignore -v design_private/probe` → `.gitignore:14:design_private/  design_private/probe` (exit 0); `node_modules/`, `dist/` also ignored | passed |
| Vitest configured; ≥1 deterministic logic test passes via `npx vitest run` | `vitest.config.ts` (node env, `src/**/*.test.ts`); `npx vitest run` exit 0, 4/4 in `src/util/rng.test.ts` (determinism, seed sensitivity, known-vector pin, [0,1) range) | passed |
| `README.md` skeleton with install/build/run/dev, noting WI-17 | `README.md` at repo root | passed |
| Node LTS recorded in BUILD.md | `agents/projects/hadal/BUILD.md` new section "Toolchain Resolved (WI-01, 2026-09-05)": Node 24 "Krypton" LTS (nodejs.org/dist/index.json), verified on v24.15.0/npm 11.12.1; locked toolchain versions; verified commands | passed |

## Live Or External Verification

**passed** — `node agents/tasks/hadal/scratch/item-implementer/WI-01/probe.mjs`
exit 0. The probe starts `npm run dev --port 5199 --strictPort` in the
repo root, opens the page in a real Chromium engine (local ms-playwright
Chromium, `--use-angle=swiftshader`) at 1920×1080, and asserts: title,
canvas, WebGL2 context, 1920×1080 drawing buffer, non-blank frame
(`readPixels` luminance range 125), zero page exceptions, zero console
errors. Artifacts: `output/boot-1920x1080.png`, `output/console.json`,
`output/result.json`, `output/server.log`.

Note on the one console warning in `console.json` ("GPU stall due to
ReadPixels"): it is caused by the probe's own same-frame `readPixels`
under SwiftShader, not by the page; a plain browser session does not
issue it.

## Tests To Write First — Delivered

- `src/util/rng.test.ts`: 4 deterministic tests, including a known-vector
  pin for seed `0xdeadbeef` that locks the sequence against accidental
  re-seeding. The seeded RNG is real product surface (request §61), not
  a test-only stub.

## Deviations From Plan

- Added an inline SVG favicon to `index.html`. Reason: the browser's
  automatic `GET /favicon.ico` 404 surfaces as a console error, which
  the "no console exceptions" criterion (§45 boot) forbids; the
  data-URI favicon avoids a new file and works in dev and prod
  identically.
- No other deviations. Assumption-ledger rows touched: A-C2 (the §29
  layout is viable — confirmed: every WI-01 path landed exactly as
  specified), A-C3 (Node LTS + npm scaffold Vite/TS/Three/Vitest —
  confirmed, see BUILD.md), A-C4 (`design_private/` git-ignorable —
  confirmed by `git check-ignore`), A-C7 (single 1/60 s loop —
  implemented as the sole seam; no counter-evidence found).

## Files Touched

New (product): `package.json`, `package-lock.json`, `tsconfig.json`,
`vite.config.ts`, `vitest.config.ts`, `index.html`, `README.md`,
`src/main.ts`, `src/game/Game.ts`, `src/game/GameState.ts`,
`src/game/constants.ts`, `src/render/Renderer.ts`, `src/util/rng.ts`,
`src/util/rng.test.ts`.
Modified: `.gitignore` (appended node artifacts, scratch probe
`node_modules`, `design_private/`), `agents/projects/hadal/BUILD.md`
(appended "Toolchain Resolved").
New (artifacts): `agents/tasks/hadal/implementation/AGENTS.md`, this
file, `agents/projects/hadal/notes/20260905-implementer-toolchain-boot-seam.md`
(+ index line in `notes/AGENTS.md`), scratch probe
`agents/tasks/hadal/scratch/item-implementer/WI-01/`
(`AGENTS.md`, `package.json`, `package-lock.json`, `probe.mjs`,
`run.ps1`, `output/`).

## Notes For Reviewer (Including Shrink/Flatten Report)

Shrink/Flatten pass (run after tests green, re-verified exit 0 for
tests and build):

- Removed `GameState.reset()` — unused hook; new-game reset belongs to
  the save system (WI-03), not the clock holder.
- Removed the `Math.random` stub path entirely (replaced by the real
  mulberry32 implementation — the red-phase target, not leftover).
- Considered and kept: `Game.stop()` (a loop owner without a stop seam
  is an incomplete contract; pause is a core control, request §6);
  `render(alpha)` (the §30 pseudo-code calls
  `game.render(accumulator / FIXED_DT)` — the parameter is spec, not
  an extension point; the contract names its consumer); the
  `if (this.running) return` guard in `start()` (idempotent boot, two
  lines); spec-section comments in `constants.ts` (they record the
  tuning source, not narrate code).
- No files were merged or split; every file has a one-sentence reason
  to exist (see L1 contracts).

Reviewer watch items:

- `Game.update` is the single simulation seam — WI-02 registers the
  player there; do not add a second tick.
- The boot marker in `Game` is deliberately trivial; replace it when
  the player lands, don't extend it.
- TS 7 native `tsc` is the build's type-checker; `vite build` alone
  does not type-check.
- Spoiler containment (request §0/§68) applies from the next work
  items onward; `design_private/` is already ignored so private
  content can land without touching diffs.

## Assumptions

- Node 24 "Krypton" is the chosen LTS line (it is the current active
  LTS per nodejs.org/dist/index.json; the machine runtime v24.15.0 sits
  on that line). Rejected: pinning Node 22 (maintenance phase by 2026)
  or leaving the runtime unpinned (the work item requires a recorded
  LTS).
- `three` 0.185 + `@types/three` 0.185: the registry's current
  versions; `WebGLRenderer` defaults to WebGL2, which headless
  Chromium (SwiftShader) supports, so no toolchain accommodation was
  needed. Rejected: an older three pin — no current user requires it.
- The headless-Chromium probe satisfies "a real desktop browser" for
  boot-level verification: it is the same browser engine (Chromium) at
  the required 1920×1080, exercising the real dev server and real
  `WebGLRenderer`; BUILD.md records that full §70/§34 observation
  remains manual in a GPU browser and is deferred to WI-17. Rejected:
  skipping the browser check (the work item's live-verification
  section requires it), or faking it with a DOM-only assertion
  (a real WebGL2 context + non-blank pixels were asserted instead).

## Result

Implemented: buildable Vite+TS+Three.js+Vitest scaffold with the
fixed-1/60-s boot loop (`index.html` → `src/main.ts` → `Game`);
`npx vitest run` 4/4, `npm run build` exit 0, boot probe exit 0 at
1920×1080 with a clean console; `design_private/` ignored; Node 24 LTS
and the locked toolchain recorded in BUILD.md.

## Re-verification (fresh workflow run, 2026-09-06)

This work item was re-selected by the controller in a fresh workflow run
(`state.md` shows `understanding -> plan -> select WI-01`; accepted
revision `2deabb0`). At that revision the repository already contains the
complete, reviewer-approved WI-01 implementation from the prior run
(`184d348`), so this run re-verified every acceptance criterion against
the live repository rather than re-deriving it. No product-code change was
needed: the scaffold is intact and correct.

Codegraph gate (re-run): `codegraph_explore` for the boot/game symbols
(projectPath `C:\Temp\hadal`) -> "No relevant code found". The
`.codegraph/` index is still stale for product symbols (unchanged from the
first gate above); per the documented project practice (`ARCHITECTURE.md`
"Reconnaissance Status", the WI-01 reviewer note) structural facts rest on
direct file reads, not codegraph queries.

Evidence re-run against the live repo at `2deabb0` (2026-09-06):

| Check | Command | Result |
|---|---|---|
| install | `npm install` | exit 0, 0 vulnerabilities |
| build | `npm run build` (`tsc --noEmit && vite build`) | exit 0; the 555.74 kB three.js chunk notice is informational, not an error |
| tests | `npx vitest run` | exit 0; 4 files / 31 tests pass, incl. `src/util/rng.test.ts` (4 deterministic tests, known-vector pin for seed `0xdeadbeef`) |
| browser boot | `node agents/tasks/hadal/scratch/item-implementer/WI-01/probe.mjs` | exit 0; HADAL title, WebGL2 canvas, drawing buffer 1920x1080, non-blank frame (luminance range 210), zero page exceptions, zero console errors; `output/boot-1920x1080.png` shows the player capsule + aim line + HUD (O2/HP/depth/tool) on the dark scene |
| gitignore | `git check-ignore -v design_private/probe` | `.gitignore:14:design_private/  design_private/probe` (exit 0); `node_modules/` and `dist/` also ignored |
| runtime | `node --version` / `npm --version` | v24.15.0 / npm 11.12.1 (Node 24 "Krypton" LTS, as recorded in BUILD.md) |

The scratch `output/` files (`result.json`, `console.json`, `server.log`,
`boot-1920x1080.png`) were regenerated by this re-run. `console.json`
carries the same single benign "GPU stall due to ReadPixels" *warning*
from the probe's own `readPixels` under SwiftShader (no page error, no
console error). The re-run screenshot is larger than the first (it now
captures the player mesh and HUD in the frame, not just the boot marker).

All nine acceptance criteria in the table above remain **passed** at
`2deabb0`. The seeded-RNG logic test required by "Tests To Write First"
(`src/util/rng.test.ts`) is present and passing. No deviation, no scope
change, no product-code edit in this run.

Result: **implemented** (re-verified) — the WI-01 scaffold is present and
correct at the accepted revision; every criterion re-confirmed by the
commands above.
