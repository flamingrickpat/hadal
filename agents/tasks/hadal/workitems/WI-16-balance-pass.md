# WI-16: Balance pass toward the 90–120 minute blind playthrough

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium
- Dependencies: WI-13, WI-15

## Goal

Run full playthroughs with debug telemetry and tune the difficulty curve, resource scarcity, and traversal density toward a 90–120 minute blind first playthrough (55–75 min for a route-knowing expert) without grind, so the game is completable blind and feels well-paced.

## Vision Link

Request §3 (target playtime + pacing rule: something notable every 3–6 min; expert 55–75 min), §39 (difficulty curve: early forgiving, mid learn one avoidance rule, deep ecology/navigation tension, final altered-rules challenge), §40 (resource scarcity: 130–170% of critical materials, ≥2 locations, no rare random drop; reduce cost/add richer node if a route repeats), §41 (exploration rewards are memorable, not collectible chores), §49 (dense traversal; no three-minute empty corridors; return trips get shorter), §71 (balance telemetry), §44 phase 8 (run full playthroughs with debug instrumentation and record the listed metrics). §45 "a blind-ish playthrough can finish in under 2.5 hours without grind".

## Acceptance Criteria

- [ ] A timed near-blind playthrough finishes in 90–120 minutes (under 2.5 hours with margin); a route-knowing expert finishes in roughly 55–75 minutes (request §3).
- [ ] The pacing rule holds: something notable (new creature/environment behavior/sound/resource/ruin/route/tool/ecology/visual/story fragment/silhouette/water-behavior change) occurs approximately every 3–6 minutes; empty traversal is prevented (request §3).
- [ ] The difficulty curve is tuned: early deaths unlikely and predators telegraphed; mid-game forces learning one creature-specific avoidance rule and makes oxygen a route-planning constraint; deep zones derive tension from ecology/navigation (not a tiny O2 bar); the final challenge comes from altered rules, not maxed damage (request §39).
- [ ] No required permanent upgrade needs more than ~2–4 minutes of deliberate gathering once the appropriate zone is reached; a naturally exploring player usually has 60–80% of a recipe's materials on discovery (request §8); a player repeating the same resource route more than twice triggers a cost reduction or richer node (request §40).
- [ ] Traversal is dense: normal travel is 20–60 s, long dramatic transits are used sparingly, return trips shorten via upgrades/shortcuts, and no three-minute empty corridor exists (request §49).
- [ ] Exploration rewards are individually memorable (permanent minor upgrade, cache, shortcut, organism interaction, lore, cosmetic, alternate-ending info, safer route) with no collectible-count chores (request §41).
- [ ] Debug telemetry (play time, current zone, max depth, deaths, crafted upgrades, resources collected/spent, time since last unlock, O2 on surfacing, encounter timestamps) is displayed in debug mode or logged locally (request §71); the recorded metrics (time to first upgrade, time per depth band, deaths, resource shortages, time lost, repeated travel, final completion) are captured and the tuning is applied (request §44 phase 8).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| Blind playthrough 90–120 min (expert 55–75 min) | manual (timed browser) | a recorded timed near-blind playthrough with total + expert time |
| Pacing rule (notable every 3–6 min) | manual (telemetry) | encounter-timestamp log shows ~3–6 min spacing; empty-traversal gaps flagged |
| Difficulty curve tuned | manual (browser) | early/mid/deep/final tension matches §39; deaths recorded |
| Resource scarcity no grind | manual (telemetry) | gathering time per upgrade ≤2–4 min; no repeated route >2×; resource counts logged |
| Dense traversal | manual (browser) | travel times ~20–60 s; no 3-min empty corridor; return trips shorten |
| Telemetry present + metrics captured | manual (debug) | the §71 telemetry fields are shown/logged; the §44 phase-8 metrics are recorded |

## Tests To Write First

- A Vitest test (or telemetry assertion) that the critical-path material totals remain ≥130–170% after tuning (request §40), so balance changes do not reintroduce a deadlock.
- A Vitest test that the pacing-timestamp fixtures meet the ~3–6 min notable-event spacing on the critical path (request §3).

## Live Or External Verification

In a real desktop browser: run a full near-blind playthrough using the debug telemetry, record the §44 phase-8 metrics, apply tuning, and re-run to confirm the 90–120 minute target and expert 55–75 minute time.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: telemetry visible; a full playthrough completes in the target window; no softlock; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/util/debug.ts` (telemetry, request §71), `src/game/constants.ts` (tuning values), `src/content/` (costs, spawn totals), `src/world/worldData.ts` (traversal density, shortcuts), `src/systems/ResourceSystem.ts`
- request §3, §8, §39, §40, §41, §44 (phase 8), §49, §71

## Architecture And Integration Constraints

This work item tunes, not rebuilds: it adjusts constants, costs, spawn totals, and traversal density on the WI-08/§40 resource model and the WI-07 world (reuse existing seams; do not clone them). The §71 telemetry is the measurement channel; the §32 validators must stay green after every tuning change. The never-cut list (request §72) is respected — balance changes do not remove creature quality, sonar, atmosphere, spectacle beats, the final reveal, friendly fauna, or saves.

## Forbidden Substitute Success
- A "balance pass" that only edits a few numbers without a recorded playthrough (request §44 phase 8).
- Balancing by removing the difficulty (maxed O2, no creature avoidance, no scarcity) instead of tuning the curve (request §39).
- Reintroducing a critical-path deadlock while reducing costs (request §40/§4.4).

## Expected Project Knowledge Update

Record the final tuning values (tuning constants, material totals, target playtime) in a project note or the balance record, so the delivery work item (WI-17) starts from a known-good balance.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
