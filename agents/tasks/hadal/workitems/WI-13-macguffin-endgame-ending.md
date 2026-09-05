# WI-13: MacGuffin, endgame, and ending variants

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: high
- Dependencies: WI-12, WI-11

## Goal

Implement the MacGuffin retrieval, the non-boss endgame, and at least two ending variants, so the final 5–10 minutes feel mechanically different from the approach and the player's retrieval changes the environment, creature behavior, or the return journey — without revealing the MacGuffin's nature or the ending details in chat, commits, screenshots, or reports.

## Vision Link

Request §23 (MacGuffin: visually memorable despite simple rendering; clearly important before understood; tied to ≥2 earlier foreshadows; retrieval changes environment/behavior/perception/return; forces one final decision; final 5–10 min mechanically different; avoid "pick up glowing orb, fade to credits"), §24 (non-arena endgame; ≥2 ending variants; a decision plus different final state/text/shot is enough), §70 (MacGuffin trigger cannot fire twice; final sequence works after save reload), §25/§42 (autosave before final descent). §45 "the MacGuffin can be reached and retrieved; retrieval changes the final sequence".

## Acceptance Criteria

- [ ] The MacGuffin is visually memorable despite simple rendering and is clearly important before the player fully understands why (request §23).
- [ ] The MacGuffin is tied to at least two earlier pieces of environmental foreshadowing (request §23, §51) and can be reached and retrieved from a fresh save (request §45).
- [ ] Retrieval changes at least one of: the environment, creature behavior, the player's perception, or the return journey (request §23); carrying it can change what can perceive the player (request §24).
- [ ] The final 5–10 minutes feel mechanically different from the approach — the challenge comes from altered rules/context, not maximized numerical damage (request §23, §24, §39).
- [ ] Retrieval forces one final decision, interpretation, or escape sequence (request §23); the endgame is not a conventional arena boss (request §24).
- [ ] At least two ending variants exist (a decision plus a different final state/text/shot is sufficient) (request §24); the final sequence works after a save reload (request §70).
- [ ] The MacGuffin trigger cannot fire twice (request §70); autosave occurs before the final descent (request §25); a credits/restart path works (request §70).
- [ ] Spoiler containment: the MacGuffin's true nature, the final-encounter mechanics, and the ending variants are not named in chat, a commit summary, a screenshot, or a progress report (request §12 Step G, §68).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| MacGuffin memorable + important + reachable | manual (browser) | from a fresh save, reach and retrieve the MacGuffin; it reads as important |
| Retrieval changes the final sequence | manual (browser) | after retrieval, the environment/behavior/perception/return changes; the final 5–10 min differ mechanically |
| Non-boss endgame + final decision | manual (browser) | the endgame is not an arena boss; a final decision is forced |
| ≥2 ending variants + works after reload | manual (browser) | both endings are reachable; reloading mid-final-sequence and continuing works |
| Trigger fires once + autosave before descent | manual (browser) + workflow | the MacGuffin trigger fires once; autosave exists before the final descent |
| Spoiler containment | workflow (design review) | a spot-check of the commit summary and report confirms no hidden-content vocabulary leaked |

## Tests To Write First

- A Vitest test that the MacGuffin trigger fires exactly once and sets the corresponding story flag (request §70).
- A Vitest test that the final-sequence state (and chosen ending) survives a save serialize/deserialize round-trip (request §42, §70).

## Live Or External Verification

In a real desktop browser: from a fresh save, reach the MacGuffin, retrieve it, and observe the changed final sequence and both ending variants; reload at the base and before the final descent and confirm the final sequence still works; confirm the trigger fires once.

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: MacGuffin reachable/retrievable; final sequence + both endings work after reload; trigger fires once; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/content/secret/hiddenLore.ts` / `hiddenEncounters.ts` (request §29), `src/world/triggers.ts`, `src/world/gates.ts`, `src/content/dialogue.ts` (ending text), `src/game/save.ts` (final-descent autosave, ending flag)
- `design_private/` (MacGuffin nature + endings — source of truth)
- request §23, §24, §25, §39, §42, §51, §70, §68

## Architecture And Integration Constraints

Implement the MacGuffin/endgame on the WI-07/08 world and gate system (reuse `EncounterTrigger`, `EquipmentDef`/`Capability`, never clone them) and the WI-11 roster. The endgame challenge comes from altered rules/context (request §24, §39), not higher damage numbers. The MacGuffin trigger is idempotent (fires once, request §70) and its flag + chosen ending persist in the versioned save (request §42). This work item is spoiler-safe by construction: it names criteria and file locations, not the MacGuffin's nature or the endings.

## Forbidden Substitute Success
- "Pick up glowing orb, fade to credits" with no decision or environmental change (request §23).
- A conventional arena boss as the final encounter (request §24).
- The MacGuffin trigger firing more than once, or the final sequence breaking after a reload (request §70).
- Any leakage of the MacGuffin's nature, final-encounter mechanics, or ending variants into a commit summary, report, or screenshot (request §68) — the primary failure this work item must avoid.

## Expected Project Knowledge Update

No project note may describe the MacGuffin's nature or the endings (spoiler risk). Note only that the MacGuffin/endgame is authored in `src/content/secret/` with an idempotent trigger and a versioned-save flag, without content details.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
