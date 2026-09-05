# WI-11: Implement the hidden creature roster (18–24 organisms)

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: high
- Dependencies: WI-09, WI-10

## Goal

Implement the 18–24-organism roster selected in `design_private/` on the creature framework (WI-10), placed in the authored world (WI-07) with their behaviors, sounds, ecology, and foreshadowing, so the roster meets every request §11/§46/§47 requirement — without revealing the content in chat, commits, screenshots, or reports.

## Vision Link

Request §11.1 (roster distribution + all 13 minimum requirements), §11.2 (anti-cliché), §10 (predator fairness: every predator has a readable rule), §21 (friendly creatures provide a practical advantage discovered organically), §55 (loot/harvesting philosophy), §46 (quality bar), §47 (awesomeness, ≥8 principles), §1.2 (ocean is the main character; some events exist only to provoke "what the hell was that"), §56 (optional fragmentary scanner entries). §45 requires 15+ creature types, 4+ non-chase behaviors, 2+ friendly, 3+ large-scale events.

## Acceptance Criteria

- [ ] At least 15 distinct creature types are implemented (target 18–24) in `src/content/secret/`, matching the §11.1 distribution (5–7 ambient/schooling, 4–6 useful/neutral, 4–6 predators/territorial, 2–4 huge set pieces, 2–3 colossal, with roles allowed to overlap) (request §11.1, §45).
- [ ] The roster satisfies all 13 §11.1 minimum requirements (two genuinely helpful species; one looks dangerous but is safe; one appears harmless but has a surprising second behavior; one non-chase hunter; one incorporates/repurposes industrial wreckage biologically; one "landmark" later revealed alive/partly alive; one large encounter with no clean full-body view; one colossal presence communicated first via changes to other fauna; one exploitable ecosystem relationship; one scale-misread with no visual reference; one beautiful rather than threatening organism; one using architecture/geology in its life cycle; at least one unclassifiable on Earth) (request §11.1).
- [ ] No generic shark/anglerfish/giant-squid/black-blob/humanoid-cultist/floating-eyeball/ancient-sleeping-god/neon-blue-everywhere/size-scaled-fish clichés remain (request §11.2); a familiar body plan is used only if one key biological assumption is radically different (request §11.2).
- [ ] Every predator has at least one readable rule the player can learn by observation (reacts to motion/light/sonar/blood/noise, attacks from cover, defends territory, mistakes a tool for a signal, dangerous only with another organism, etc., request §10); at least 4 behaviors are materially different from direct pursuit (request §45).
- [ ] At least 2 creatures are beneficial/friendly and provide a practical advantage discovered organically, without "press E to befriend" questification (request §21, §45).
- [ ] At least 3 large-scale creatures or creature events exist (request §45); the largest are not "bosses with HP bars" and the leviathan challenge comes from altered rules, not a number (request §1.5, §24).
- [ ] The §46 quality bar is met: replacing any major species with a same-size shark would change the scene; no colossal organism is "just very big"; every major encounter shows evidence before explanation.
- [ ] At least 8 of the §47 awesomeness principles are satisfied; loot philosophy (request §55) is respected — progression resources are not primarily from murder.
- [ ] Spoiler containment: no creature name, behavior, or description from the roster appears in chat, a commit summary, a screenshot, or a progress report (request §12 Step G, §68).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| ≥15 creature types, §11.1 distribution | workflow (design review) + manual | reviewer counts distinct implemented types and maps them to the §11.1 distribution and all 13 minimum requirements |
| Anti-cliché + quality bar | workflow (design review) | reviewer checks each major species against §11.2 and the §46 "replace with a shark" test |
| Predator readability + ≥4 non-chase behaviors | manual (browser) | play through; each predator's rule is learnable; ≥4 non-chase behaviors observed |
| ≥2 friendly, ≥3 large-scale | manual (browser) + workflow | a friendly advantage is discoverable organically; ≥3 large-scale events occur |
| §47 awesomeness ≥8 + loot philosophy | workflow (design review) | reviewer maps the implemented roster to ≥8 §47 principles and checks §55 |
| Spoiler containment | workflow (design review) | a spot-check of the commit summary and report confirms no hidden-content vocabulary leaked |

## Tests To Write First

- A Vitest test that the roster data (creature IDs, species defs) resolves against the framework and that every referenced ID exists (supports `validateWorld()`, request §32).
- A Vitest test for at least one predator's readability rule (e.g., a motion-reacting predator ignores a stationary player) if factored as logic.

## Live Or External Verification

In a real desktop browser: play through the zones; confirm the roster plays out as designed (distribution, readability, friendliness, large-scale events), and that the frame rate stays smooth during the largest creature event (request §34, §45).

## Infrastructure Required

- Start: `npm run dev`
- Restart: re-run `npm run dev`
- Health: roster plays out; IDs resolve; smoothest during the largest event; no console exceptions
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `src/content/secret/hiddenCreatures.ts` (request §29), `src/creatures/creatureFactory.ts`, `src/creatures/behaviors/`, `src/creatures/spineRenderer.ts`, `src/world/worldData.ts` (creature spawns per chunk)
- `design_private/` (the selected roster — source of truth)
- request §1.2, §10, §11.1, §11.2, §11.4, §21, §45, §46, §47, §55, §56, §68

## Architecture And Integration Constraints

Implement the roster on the WI-10 framework (reuse `CreatureDef`, steering, spine renderer, senses — never clone them) and place it in the WI-07 world (chunk `creatureSpawns`). The roster content comes from `design_private/`; this work item is spoiler-safe by construction: it names criteria and file locations, not content. The largest creature event must hold the performance target (request §34, §72) — this is where throttling/instancing from WI-10 is load-bearing.

## Forbidden Substitute Success

- A roster of generic, size-scaled fish (request §11.2/§46).
- "Press E to befriend" questified friendly creatures (request §21).
- A leviathan that is a boss with an HP bar (request §1.5, §24).
- Any leakage of roster content into a commit summary, report, or screenshot (request §68) — the primary failure this work item must avoid.

## Expected Project Knowledge Update

No project note may describe roster content (spoiler risk). Note only that `src/content/secret/hiddenCreatures.ts` is the implemented roster, with IDs that resolve via `validateWorld()`, without any content details.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
