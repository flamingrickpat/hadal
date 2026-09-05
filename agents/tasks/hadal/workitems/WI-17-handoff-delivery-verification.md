# WI-17: Spoiler-safe handoff, README, and real-user-path delivery verification

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium
- Dependencies: WI-16

## Goal

Write the spoiler-safe public README, run a final spoiler audit, and execute the real user path (the request §70 checklist) end-to-end in a real desktop browser, recording `application_verification.md` and repairing any defects found within the stated seams — so the game is verified completable and handed off without spoiling the player.

## Vision Link

Request §69 (spoiler-safe README: install/build/run/preview, controls, browser requirements, expected playtime, save location, a clearly separated developer section for debug mode; no creature list or story synopsis beyond the starting premise), §68 (progress reporting must not spoil), §45 (MVP acceptance), §70 (the testing checklist — boot, core loop, progression, creatures, save, ending), §34 (60 FPS in the largest encounter). This is the final proof the whole game works as one piece.

## Acceptance Criteria

- [ ] A spoiler-safe `README.md` exists with install (`npm install` / `npm run dev`), production build (`npm run build` / `npm run preview`), controls, browser requirements, expected playtime, save location (`localStorage`), and a clearly separated developer section describing debug mode — with no creature list and no story synopsis beyond the starting premise (request §69, §68).
- [ ] A final spoiler audit confirms no creature name, late-zone visual, lore truth, MacGuffin nature, final-encounter mechanic, or ending variant appears in any commit summary, progress report, README, or player-facing doc (request §0, §12, §68).
- [ ] The full request §70 checklist passes in a real desktop browser (recorded in `application_verification.md`):
  - Boot: fresh profile starts; audio after input; resize works; no console exceptions.
  - Core loop: collect first resource; surface; craft first upgrade; upgrade changes capability; oxygen refills; death respawns.
  - Progression: each depth gate understandable; all required materials exist; final zone reachable from a fresh save; no softlock; shortcut flags persist after reload.
  - Creatures: no impossible-terrain aggro; no visible teleporting; friendly creatures not permanently stuck; offscreen AI throttled; largest encounter above the performance target.
  - Save: reload after each major tier, at base, after death; malformed save resets or backs up gracefully.
  - Ending: MacGuffin trigger cannot fire twice; final sequence works after save reload; credits/restart works.
- [ ] The largest creature encounter holds ~60 FPS at 1080p (request §34, §45).
- [ ] Defects found during the run are repaired within the stated seams (not deferred); any defect that cannot be repaired in-seam is reported as a blocker, not papered over.
- [ ] All in-browser acceptance evidence is recorded as manual observations in `application_verification.md` (no automation exists in this checkout; do not substitute a mock or a dummy path).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Spoiler-safe README | workflow (design review) | `README.md` present; reviewer confirms no hidden-content vocabulary |
| Final spoiler audit | workflow (design review) | a spot-check of commit summaries, reports, and player-facing docs confirms no hidden-content leakage |
| §70 boot checklist | manual (browser) | fresh profile boots; audio after input; resize works; no console exceptions — recorded in `application_verification.md` |
| §70 core-loop + progression + creatures + save + ending | manual (browser) | each sub-item observed and recorded in `application_verification.md` |
| Largest encounter ~60 FPS | manual (browser) | FPS observed in the largest encounter, recorded in `application_verification.md` |
| Defects repaired in-seam | workflow (code + review) | the repaired defects are in the committed diff within stated seams |

## Tests To Write First

- A Vitest run over the full suite (`npx vitest run`) confirms all logic tests (validators, save, RNG, resource/gate) pass before the manual run.

## Live Or External Verification

In a real desktop browser (fresh profile): execute the entire request §70 checklist end-to-end and record each observation in `application_verification.md`. This is the real user path (title → dive → harvest → craft → deeper → MacGuffin → ending); no automation exists in this checkout, so the evidence is manual observation, supported by the debug panel (§33) and telemetry (§71).

## Infrastructure Required

- Start: `npm run dev` (or `npm run build` + `npm run preview`)
- Restart: re-run the same command; state persists in `localStorage`
- Health: fresh profile boots with no console exceptions; audio after first input
- Timeout: a full playthrough (90–120 min) for the timed criterion
- Endpoint or MCP: none (manual observation; debug panel + telemetry are the measurement channels)

## File Pointers

- `README.md` (request §69), `application_verification.md` (new artifact under the task folder), `src/util/debug.ts` (§33), `src/game/constants.ts` + `src/content/` (in-seam repairs), `agents/projects/hadal/` (update BUILD.md/TEST.md if commands changed)
- request §0, §12, §34, §45, §68, §69, §70

## Architecture And Integration Constraints

This work item is the delivery gate: it does not add new systems; it verifies the whole game and repairs defects within the seams already built (WI-01..WI-16). It records `application_verification.md` as the real-user-path evidence (TEST.md "Delivery Verification"). Spoiler containment (request §68) governs the README and any report. If a defect requires a change that would invalidate an earlier work item's seam, repair it in-seam and note it; if the seam is absent, report a blocker rather than papering over it.

## Forbidden Substitute Success
- A README or report that spoils hidden content (request §68/§69) — the primary failure this work item must avoid.
- Reporting the §70 checklist as passed without having run it in a real browser (request §45).
- Substituting a mock/dummy path or unit tests for the end-to-end manual run (no automation exists in this checkout).
- Deferring a found defect instead of repairing it in-seam or reporting it as a blocker.

## Expected Project Knowledge Update

Update `agents/projects/hadal/` (PROJECT.md product maturity, BUILD.md commands, TEST.md) to reflect the finished, verified game; add a short note if any final command or control changed. Do not describe hidden content.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
