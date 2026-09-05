# WI-09: Private creative design pass (produce `design_private/`)

## Identity

- Task: hadal
- Story: implicit
- Owner role: `item-implementer`
- Complexity: medium (design) / high (creative quality)
- Dependencies: WI-08

## Goal

Run the private creative design pass defined in request §12 and record the results in `design_private/`, so the hidden world, creature roster, reveals, MacGuffin, and endings are decided before implementation and remain spoiler-safe (never named in chat, commit summaries, screenshots, or progress reports).

## Vision Link

Request §12 (private creative generation protocol, steps A–G; the six `design_private/` files), §11 (roster requirements), §23 (MacGuffin), §24 (endings), §1.6 (surprise is a production requirement), §68 (progress reporting must not spoil). This work item is the gate that selects the content WI-11/WI-12/WI-13 implement.

## Acceptance Criteria

- [ ] `design_private/` exists and contains the files `world_candidates.md`, `creature_candidates.md`, `final_selected_world.md`, `encounter_beats.md`, `lore_truth.md`, and `spoiler_map.md` (request §12).
- [ ] Step A: three substantially different hidden interpretations of the premise are generated, differing in what the deep ocean is, why the installation failed, what the MacGuffin is, how the ecology connects to the infrastructure, and the ending's emotional tone (request §12, Step A).
- [ ] Step B: each candidate is critiqued for genre clichés, exposition burden, whether the explanation reduces mystery, whether it supports visually weird creatures, whether it fits two hours, and whether the final reveal reinterprets earlier things; the weakest is rejected (request §12, Step B).
- [ ] Step C: the strongest candidate is hybridized by stealing exactly one excellent mechanism from another (not averaging all three into lore soup) (request §12, Step C).
- [ ] Step D: at least 30 rough creature concepts are generated and each scored 1–5 on silhouette novelty, ecological plausibility, gameplay distinction, procedural-animation ease, surprise potential, and cliché penalty; the best 18–24 are selected (request §12, Step D).
- [ ] The selected roster satisfies §11.1 (distribution + all 13 minimum organism requirements), §11.2 (anti-cliché constraints), §12 Step E (diversity: not >25% "swimming mouth attacks player"), and §46 (quality bar).
- [ ] Each selected major organism has documented answers to the §11.3 concept rubric (energy source, depth rationale, absent-player behavior, silhouette feature, distinct behavior, likely-wrong assumption, sound-before-sight, environmental evidence, hostile-vs-incompatible, cross-species interaction).
- [ ] At least five "holy shit" spectacle moments are designed via staging grammar (request §11.4, §52), and the roster satisfies at least eight of the §47 awesomeness principles.
- [ ] Step F: creature reveals and lore clues are mapped onto the 90–120 minute pacing timeline (request §12, Step F); at least two motifs are defined (request §37) with 2–4 earlier traces each (request §51).
- [ ] The MacGuffin's true nature is decided and tied to ≥2 earlier foreshadows, forces a final decision, and changes the environment/behavior/perception on retrieval (request §23); at least two ending variants are defined (request §24).
- [ ] Spoiler containment: none of the selected content (creature names, late-zone visuals, lore truth, MacGuffin nature, final-encounter mechanics, ending variants) appears in chat, a commit summary, a screenshot, or a progress report (request §12 Step G, §68); `design_private/` is git-ignored if the environment would otherwise expose it (request §12).

## Required Evidence

| Criterion | Evidence type | Command or artifact |
|---|---|---|
| design_private/ files present | automated | the six files exist under `design_private/` (or the equivalent in `src/content/secret/` per request §12) |
| 3 competing worlds + critique + hybridize | workflow (design review) | `world_candidates.md` shows 3 candidates, a critique, and a stated stolen mechanism |
| 30+ creature concepts scored, 18–24 selected | workflow (design review) | `creature_candidates.md` shows ≥30 scored concepts and the selected set meeting §11.1/§11.2/§12E/§46 |
| §11.3 rubric answered per major organism | workflow (design review) | each major organism's rubric answers are documented |
| ≥5 spectacle beats + ≥8 §47 principles + reveal map | workflow (design review) | `encounter_beats.md` shows ≥5 beats, ≥8 principles, and a timeline mapping |
| MacGuffin + ≥2 endings + motifs + foreshadows | workflow (design review) | `final_selected_world.md` / `lore_truth.md` document the MacGuffin nature, endings, motifs, and traces |
| Spoiler containment | workflow (design review) | a spot-check of the commit summary and any report confirms no hidden-content vocabulary leaked |

## Tests To Write First

- None (creative pass). The design outputs are consumed by WI-11/WI-12/WI-13; their tests will exercise the implemented content.

## Live Or External Verification

N/A (design artifact). Verification is by a design review of the `design_private/` files against the §12/§11/§23/§24/§37/§46/§47/§51 criteria.

## Infrastructure Required

- Start: n/a (no run)
- Restart: n/a
- Health: n/a
- Timeout: n/a
- Endpoint or MCP: none

## File Pointers

- `design_private/world_candidates.md`, `design_private/creature_candidates.md`, `design_private/final_selected_world.md`, `design_private/encounter_beats.md`, `design_private/lore_truth.md`, `design_private/spoiler_map.md` (request §12)
- `src/content/secret/` (target for the implemented content, request §29); `.gitignore` (add `design_private/` if not already)
- request §11, §12, §1.6, §23, §24, §37, §46, §47, §51, §52, §68

## Architecture And Integration Constraints

This work item produces design files, not gameplay code. The chosen world/roster/MacGuffin/endings are the single source of truth for WI-11 (roster), WI-12 (encounters/story), and WI-13 (MacGuffin/endgame). Spoiler containment is the governing constraint: describe the process and criteria here, never the content. If the environment makes ignored files inconvenient, store the equivalent content in `src/content/secret/` and still never quote it in chat (request §12).

## Forbidden Substitute Success

- A design pass that skips the 3-candidate / 30-concept / critique steps (request §12).
- A roster that is generic size-scaled fish or violates §11.2 anti-cliché constraints.
- Any leakage of hidden content into a commit summary, progress report, or screenshot (request §68) — this is the primary failure this work item must avoid.
- A MacGuffin that is "pick up glowing orb, fade to credits" with no final decision or environmental change (request §23).

## Expected Project Knowledge Update

No project note should describe the hidden content (spoiler risk). Note only the existence of `design_private/` as the content source of truth for WI-11/WI-12/WI-13, without any content details.

## Fresh-Session Handoff

Enter `item-implementer` mode for this exact work item. Read the task or story state from top to bottom, the project documentation, all passed gate artifacts, this work-item specification, and only then the listed source files.
