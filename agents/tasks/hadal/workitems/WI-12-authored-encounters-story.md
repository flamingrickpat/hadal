# WI-12: Authored encounters, environmental story, motifs, and foreshadowing

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: high
- Dependencies: WI-11, WI-07

## Goal

Author the five-plus "surprise" spectacle beats and the environmental story sequence (radio messages, text fragments, story props, landmarks, world-state reactions, motifs, foreshadowing, and a few environmental puzzles), so the world tells its story through evidence and behavior rather than exposition, with set pieces that are authored (not randomly spawned) and preserve player control.

## Vision Link

Request §11.4/§52 (≥5 spectacle beats via staging grammar), §22 (four story channels; no final exposition dump; allow contradictions; ecology implies history), §37 (3–5 recurring motifs), §38 (environmental storytelling budget: 8–12 radio, 10–16 fragments, 6–10 props, 3–5 landmarks, 1–2 deep contradictions), §51 (2–4 earlier traces per major reveal), §60 (world-state reactions), §66 (3–5 environmental puzzles), §67 (set pieces partially scripted but player control preserved), §57 (narrative tone), §53 (first-10-minute tutorial). §45 "at least 5 authored surprise beats".

## Acceptance Criteria

- [ ] At least five deliberate "surprise" spectacle beats are authored inside gameplay (not cutscenes), using the §11.4/§52 staging grammar (partial anatomy, parallax crossing, foreground pass, environment reaction, sonar scale, speed mismatch, no-center framing) (request §11.4, §52, §45).
- [ ] The environmental story sequence exists at the §38 budget: 8–12 contract/radio messages, 10–16 optional text fragments (each 40–100 words, serving foreshadowing/explanation/recontextualization/hint/emotion), 6–10 no-text story props, 3–5 major landmarks with visible history, and 1–2 deep discoveries contradicting the official timeline (request §22, §38).
- [ ] 3–5 recurring motifs appear in different contexts and the final reveal connects at least two without explaining all of them (request §37); every major late-game reveal has 2–4 earlier traces that do not name the reveal (request §51).
- [ ] After major milestones, earlier areas subtly change (world-state reactions: migrations, fewer animals, changed lights, shifted debris, a friendly organism near base, odd interference, deep sound in the shallows) via cheap flags/spawn tables (request §60).
- [ ] 3–5 environmental puzzle moments exist (reroute power, cut a restraint, carry an object with current, sonar reveals a path, lure a creature, change light/noise to pass) — no abstract symbol-matching panels (request §66).
- [ ] Set pieces are partially scripted for timing/entrance/camera/reactions/escape path but preserve player control (no long cutscenes, no sub-3-second cinematic unless unavoidable) (request §67); story is delivered through the four §22 channels with no final exposition dump (request §22).
- [ ] Narrative tone is restrained, competent, slightly bureaucratic, and increasingly uneasy (request §57); the first-10-minute tutorial loop (request §53) is intact.
- [ ] Spoiler containment: no late-zone visuals, lore truth, or reveal detail appears in chat, a commit summary, a screenshot, or a progress report (request §68).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| ≥5 authored spectacle beats | manual (browser) + workflow | reviewer confirms ≥5 beats staged via §11.4/§52 grammar; in-game, the beats occur |
| §38 environmental story budget | workflow (design review) + manual | reviewer counts radio/fragments/props/landmarks/contradictions; in-game, they are encountered |
| Motifs + foreshadowing + world-state reactions | workflow (design review) + manual | ≥3 motifs recur; each major reveal has ≥2 traces; earlier areas change after milestones |
| 3–5 environmental puzzles | manual (browser) | each puzzle is solvable in-game without a symbol-matching panel |
| Scripted set pieces preserve control | manual (browser) | a set piece is timed but the player retains control; no long cutscene |
| Spoiler containment | workflow (design review) | a spot-check of the commit summary and report confirms no hidden-content vocabulary leaked |

## Tests To Write First

- A Vitest test that every `EncounterTrigger`, story prop, fragment, and radio message ID referenced by the world data resolves (supports `validateWorld()`, request §32).
- A Vitest test that a scripted set piece's trigger conditions and actions fire in the expected order (request §36, §67).

## Live Or External Verification

In a real desktop browser: play through the zones and confirm the spectacle beats occur, the environmental story is encountered in the authored order, earlier areas change after milestones, and each puzzle is solvable.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: spectacle beats and story fire in order; puzzles solvable; world-state reactions trigger; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/content/dialogue.ts` (radio/fragments, request §22/§38), `src/content/landmarks.ts` (request §38), `src/world/triggers.ts` (request §36), `src/world/worldData.ts` (props, triggers, world-state flags), `src/systems/TriggerSystem.ts`
- `design_private/` (encounter beats + lore — source of truth)
- request §11.4, §22, §37, §38, §51, §53, §57, §60, §66, §67, §68, §52

## Architecture And Integration Constraints

Author the encounters on the WI-07 trigger system (reuse `EncounterTrigger`, never clone it) and the WI-11 roster. Set pieces are authored, not random (request §67); the most important moments must not depend on RNG (request §61). Story is evidence-first (request §22); the optional scanner (request §56) provides only fragmentary observations, never definitive hidden-cosmology statements. This work item is spoiler-safe by construction: it names criteria and file locations, not content.

## Forbidden Substitute Success
- Randomly spawned "surprise" moments instead of authored set pieces (request §67).
- A final exposition dump explaining every anomaly (request §22).
- Pure-filler diary entries with no foreshadowing/explanatory purpose (request §38).
- Any leakage of late-zone visuals or lore truth into a commit summary, report, or screenshot (request §68) — the primary failure this work item must avoid.

## Expected Project Knowledge Update

No project note may describe story/reveal content (spoiler risk). Note only that the environmental story is authored in `src/content/dialogue.ts`/`landmarks.ts` + `src/world/triggers.ts`, with IDs that resolve via `validateWorld()`, without content details.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
