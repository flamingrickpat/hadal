# Review: WI-01-scaffold-project

Status: pass

Reviewed: 2026-09-05, commit `184d348` (item-implementer, task `hadal`).
Reviewed against: `workitems/WI-01-scaffold-project.md` (contract),
`agents/tasks/hadal/request.md` §12/§16/§28/§29/§30/§69 (source of truth),
`agents/projects/hadal/` project docs, and the implementer's result note
`implementation/WI-01-implementation.md`.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` exist; `npm install` and `npm run build` exit 0 | passed | All four files at repo root. Fresh verification: deleted `node_modules`, re-ran `npm install` (exit 0, 47 packages from committed lockfile) and `npm run build` (exit 0: `tsc --noEmit` via native tsc 7.0.2, then Vite 8.2.2 build, 11 modules, `dist/index.html` + 513.93 kB chunk emitted; the chunk-size notice is a Vite warning, not an error). `npx tsc --noEmit` run independently also exits 0. |
| `src/main.ts` boots `WebGLRenderer` + minimal 3D scene + orthographic camera; a frame renders at 1920×1080 in a real browser with no console exceptions | passed | Code: `src/render/Renderer.ts:21` constructs `THREE.WebGLRenderer`, `:20` exposes the `Scene`, `:22` constructs `THREE.OrthographicCamera` (fixed 2000-unit view width, resize handler); `src/main.ts:21-23` assembles and starts. Behavior: independent reviewer probe (`scratch/work-item-reviewer/WI-01/probe.mjs`, fresh Chromium profile at 1920×1080 dpr 1 against `npm run dev` on port 5210) — title `HADAL`, canvas present, WebGL2 context live, drawing buffer 1920×1080, pixel luminance range 125 (non-blank; `output/A-dev-1920x1080.png` shows the boot marker on the dark scene), zero page exceptions, zero console errors. The production build boots identically via `npm run preview` (port 5211, `output/C-preview-1920x1080.png`, zero console messages at all). |
| Fixed 1/60 s timestep, accumulator pattern, simulation not tied to frame rate | passed | Code: `src/game/Game.ts:67-79` — real dt clamped to `MAX_FRAME_DT` (0.1, `constants.ts:15`), added to `accumulator`, drained by `while (accumulator >= FIXED_DT) { update(FIXED_DT); accumulator -= FIXED_DT; }`, then exactly one `render(accumulator / FIXED_DT)` per display frame; `FIXED_DT = 1/60` (`constants.ts:14`). This is request §30's pseudo-code verbatim in structure. Behavior: reviewer probe throttled the page's delivered rAF callbacks to 1/4 (111 delivered frames over the 3 s window vs 380 unthrottled) and measured the boot marker — whose position is a function of the simulation clock `GameState.timeSec` (`Game.ts:58`), not frame time — moving +12.0 px under throttle vs +11.5 px unthrottled (within 4.3%). A frame-tied simulation would have moved ~4× slower under throttle. See `scratch/work-item-reviewer/WI-01/output/result.json`. |
| `Game` orchestrator owns `update(FIXED_DT)` / `render` + the fixed-step frame loop | passed | `Game.ts` (coordinator L1+L2) owns the rAF loop, accumulator, `start`/`stop`, `update` (single simulation seam, always called with `FIXED_DT`), and `render(alpha)`; `main.ts` only assembles (lines 21-23). `GameState` is a pure clock holder; `constants.ts` a pure data holder — matches the work item's declared archetypes. |
| `src/game/` core (`Game.ts`, `GameState.ts`, `constants.ts`) and `src/render/Renderer.ts` exist | passed | All four files present with L1+L2 contracts matching the spec's L1 lines (verified file-by-file). `src/util/rng.ts` (+ `rng.test.ts`) also present, as the "Tests To Write First" section required. |
| `.gitignore` extended with `design_private/` and node build artifacts | passed | `.gitignore:7-8` `node_modules/` + `dist/`, `:14` `design_private/`, `:11` scratch probe node_modules. Ran the work item's exact command: `git check-ignore design_private/probe` → `.gitignore:14:design_private/  design_private/probe`, exit 0. |
| Vitest configured; ≥1 deterministic logic test passes via `npx vitest run` | passed | `vitest.config.ts` (node environment, `src/**/*.test.ts`). Ran `npx vitest run` → exit 0, 1 file, 4/4 tests in `src/util/rng.test.ts` (seed determinism, seed sensitivity, known-vector pin, [0,1) range). The test asserts real behavior, not crash-freedom. |
| `README.md` skeleton with install/build/run/dev commands, noting WI-17 | passed | `README.md` at root: install / run (dev) / build / preview / test commands, and an explicit note that the full spoiler-safe README (request §69) arrives with WI-17. |
| Node LTS version recorded in `agents/projects/hadal/BUILD.md` | passed | `BUILD.md` "Toolchain Resolved (WI-01, 2026-09-05)": Node 24 "Krypton" LTS, verified on v24.15.0/npm 11.12.1; locked toolchain (three 0.185.1, vite 8.2.2, typescript 7.0.2, vitest 5.0.0, @types/three 0.185.4). I re-fetched `nodejs.org/dist/index.json`: v24 is the newest LTS line (codename Krypton, latest v24.20.0; no newer LTS line exists). All locked versions match `package-lock.json` exactly. My verification ran on the same v24.15.0/npm 11.12.1 runtime. |

## Findings

None. No defect, missing evidence, or contract violation found.

Observations (non-findings, recorded for the audit trail):

1. The implementer's commit also appends an "Implementer Handoff (from WI-01)"
   section to `workitems/WI-02-player-swim-terrain-oxygen.md` (spec body
   unchanged). This is append-only per the workflow's artifact rules and
   carries forward the single-seam constraint; it is not a spec change.
2. `Game.render(alpha)` takes the §30-specified leftover-frame fraction and
   documents its future consumer (camera rig, request §16) without using it
   yet — spec-conformant, justified in the implementer's Shrink/Flatten
   report.
3. `vite.config.ts` sets `base: './'` so the built app serves from any
   path; verified working against `npm run preview` (probe phase C).
4. The one console warning in both the implementer's and the reviewer's
   probes ("GPU stall due to ReadPixels", warning type) is caused by the
   probes' own same-frame `readPixels` under SwiftShader, not by the page;
   the criterion "no console exceptions" (zero page exceptions, zero
   console error messages) holds in both runs.

## Impact Check

- Every symbol changed in this work item is new (greenfield repository);
  there is no pre-existing code whose callers could be silently broken. The
  only pre-existing files modified are `.gitignore` and
  `agents/projects/hadal/BUILD.md`, both append-only and behavior-neutral.
- `codegraph_impact` / `codegraph_callers` could not be run: the codegraph
  index (`.codegraph/codegraph.db`, last built 17:40) predates the
  implementer's commit (18:23) and returns "No relevant code found" for all
  product symbols (`Game`, `mulberry32 rng createRng`, boot-loop queries).
  As a substitute I ran a whole-repo caller grep (`rg "from './game|…"` over
  `src/` plus a repo-wide search for `new Game|new Renderer|createRng|FIXED_DT`):
  the complete import graph is `index.html → src/main.ts → Game, Renderer`;
  `Game → Renderer, constants (FIXED_DT, MAX_FRAME_DT), GameState`;
  `Renderer → constants (CAMERA_VIEW_WIDTH), three`; `rng.test.ts → rng`.
  No cycles, no consumers outside `src/`, no forbidden dependencies (no
  React, no ECS, no physics engine — request §28). For a 7-file new tree
  this is the complete impact surface.

## Independent Adversarial Probes

All under `scratch/work-item-reviewer/WI-01/` (own script, own server ports
5210/5211, own playwright-core install; the local ms-playwright
chromium-1234 engine is the only browser engine available in this
checkout). Probe exit 0; `output/result.json` + three screenshots are the
durable artifacts.

1. **Fresh install from lockfile.** Deleted `node_modules`, ran
   `npm install` (exit 0) and `npm run build` (exit 0). Could falsify: a
   warm-cache-only build that does not reproduce from the committed
   lockfile. Observed: reproduced; `dist/` emitted.
2. **Dev-server boot, fresh profile** (phase A). New browser context
   (empty `localStorage`, verified length 0), 1920×1080 dpr 1: title,
   canvas, WebGL2 context, 1920×1080 drawing buffer, luminance range 125,
   zero page exceptions, zero console errors. Could falsify: criterion 2 if
   the frame were blank, the canvas not WebGL2, or the console dirty in a
   clean profile. Observed: all pass.
3. **Frame-rate-independence** (phase B, the key adversarial check).
   A vsync pump installed via `addInitScript` delivered the page's rAF
   callbacks on only 1 of every 4 vsyncs (111 vs 380 delivered frames over
   the identical 3 s window — throttle effectiveness asserted, so the test
   cannot pass vacuously). The marker's 3 s screen displacement: +12.0 px
   throttled vs +11.5 px unthrottled (within 4.3%). A simulation tied to
   rAF timing would have displaced ~4× less. Could falsify: criterion 3
   ("forbidden substitute success" #2). Observed: cadence independent of
   frame rate.
4. **Production build in a browser** (phase C). `npm run build` then
   `npm run preview` on port 5211: page boots, WebGL2 1920×1080 frame
   renders, zero console messages. Could falsify: "forbidden substitute
   success" #1 (a Node-only build that skips rendering) or the `base:
   './'` config choice. Observed: production bundle renders.
5. **Known-vector recompute.** Standalone Node recomputation of the
   mulberry32 sequence for seed `0xdeadbeef`:
   `0.9413696140982211, 0.26719574979506433, 0.772033357527107` — matches
   the pin in `rng.test.ts:17-21`. Could falsify: a test pin copied from
   the implementation rather than a stable reference value.
6. **Node LTS claim.** Re-fetched `nodejs.org/dist/index.json`: v24
   (Krypton) is the newest LTS line, latest v24.20.0; BUILD.md's "Node 24
   Krypton is the current LTS line" is current fact.
7. **Exact evidence commands.** Ran the work item's own evidence commands:
   `git check-ignore design_private/probe` (returns the path, exit 0),
   `npx vitest run` (exit 0, 4/4), `npx tsc --noEmit` (exit 0).

## What I Could Not Verify

- **Visual verification on a real GPU desktop browser.** This checkout has
  no browser-automation tooling for a headed GPU session; both probes ran
  headless Chromium (SwiftShader software GL), which is the same browser
  engine as a desktop install and exercises the real `WebGLRenderer`.
  Criterion 2 as written requires only "a frame renders at 1920×1080 …
  no console exceptions", which the probe verifies; the full request §70
  checklist and §34/§14.3 GPU observations remain manual and are deferred
  to WI-17 per the implementer's recorded assumption. I accept that
  deferral: the work item's own live-verification section scopes to
  frame + clean console.
- **codegraph-based impact analysis.** The index is stale (built before
  this work item's product code; `codegraph_explore` returns "No relevant
  code found" for product symbols). Substituted with the complete import
  graph via repo-wide grep, which is exhaustive for a 7-file new tree.
  Recommend the controller rebuild the index before the next role.
- **Headed human observation.** "Manual (browser)" evidence type: no human
  observed the page in this unattended run; the automated headless probe is
  the strongest observation available here and matches the work item's
  stated live-verification requirement.

## Assumptions

- **A-R1 ("real browser" = the real Chromium engine, headless).** The
  work item's live-verification section asks to "open the dev-server URL
  in a real desktop browser at 1920×1080; confirm a frame renders and the
  console is clean." No headed browser is automatable in this checkout.
  I took the reading: the real Chromium engine at the exact required
  viewport, driving the real dev server and real `WebGLRenderer`,
  satisfies the criterion; a DOM-only assertion would have been the
  forbidden substitute. Rejected: skipping the browser check entirely (the
  work item requires it) or treating SwiftShader as a fake dependency (it
  is the same engine's GL backend, and the frame is a real rendered
  WebGL2 buffer).
- **A-R2 ("no console exceptions").** Interpreted as zero `pageerror`
  events plus zero console messages of type `error`. Warnings are not
  exceptions; the single observed warning is probe-induced (see
  Findings #4) and reproduces in both the implementer's and the
  reviewer's independent probes.
- **A-R3 (implementer's WI-02 handoff append).** Read as an append-only
  handoff note, consistent with the workflow's artifact rules (recorded
  results append; specs are never rewritten). The WI-02 acceptance
  criteria, evidence table, and scope are byte-identical to the planner's
  version except for the appended section.
