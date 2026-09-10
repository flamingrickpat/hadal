---
id: WI-04b
kind: work_item
parent: ST-04
children: []
depends_on: []
criteria:
  AC-enc-story: "The environmental story sequence is delivered through 8-12 radio messages, 10-16 short text fragments, 6-10 no-text story props, 3-5 major landmarks with visible history, and 1-2 deep discoveries contradicting the official timeline"
behavior: "Deliver the section 22 four-channel story payload within the section 38 budget - radio messages on trigger fire, short text fragments, no-text story props, landmarks with visible history, and 1-2 timeline contradictions - with the section 51 foreshadow traces placed, every written fragment passing the keep-or-delete test"
subsystems: ["world content data", "trigger system", "headless scenario tests"]
verification: "Node content check that all four channel counts sit inside the section 38 budget and every fragment carries a keep-or-delete classification; fresh-save headless scenarios assert each radio trigger fires and the contradiction discoveries are reachable by physical route; spoiler audit that code, plan artifacts, evidence and commits reference content by id only (sections 0, 12, 68); final proof owner of AC-enc-story"
---

# WI-04b — Four-channel environmental story payload

## Goal

Author the story layer: every section 22 channel inside the section 38
budget, placed per the private reveal map, with the section 51 foreshadow
traces. Content data lands in the production world data
(`src/world/worldData.ts` plus the `TRIGGER_RADIO_LINES` text table the
simulation already reads); radio messages fire through `showRadio` trigger
entries.

## Deliverables (checkable)

- 8-12 contract/radio messages: terse, practical, sometimes evasive; each
  bound to a trigger entry (region, depth, return-through, or the beat /
  puzzle completion flags from WI-04a/WI-04d where the reveal map says
  so).
- 10-16 short text fragments (40-100 words max, section 38), each
  classified with a keep-or-delete reason: foreshadow gameplay, explain a
  human decision, recontextualize a place, hint at hidden lore, or provide
  emotional texture. Unclassifiable fragments are deleted, not kept.
- 6-10 no-text story props: environmental evidence only (the strongest
  channel per section 22), no label required.
- 3-5 major landmarks with history visible in their shape; their ids are
  what ST-06's section 26 map overlay consumes.
- 1-2 deep discoveries contradicting the official timeline;
  contradictions read as institutions misunderstanding or hiding things
  (section 22), no unreliable-narrator abuse.
- Section 51 foreshadowing: 2-4 earlier traces per major late reveal
  (wreck scars, aligned debris, sounds at other depths, related organisms,
  warning signage, repeated materials, resource anomalies, fauna behavior
  changes), none naming the reveal. The section 37 recurring motifs from
  the creative pass appear in this payload's props/landmarks; at least two
  stay connected by the final reveal (ST-05), not explained here.
- No final exposition dump (section 22 lore rule): the payload ends with
  the largest-scale implications unanswered.

## Tests (node, content checks, real simulation for delivery)

- Content check (node): channel counts within the section 38 budget; every
  fragment carries a keep-or-delete classification; every major late
  reveal has 2-4 earlier traces per the reveal map, none of the trace
  texts naming it.
- Delivery scenario (fresh save): each radio trigger fires on its authored
  condition; the contradiction discoveries are reachable by physical
  route.
- Spoiler audit: ids only in code, tests, plan artifacts and commits
  (sections 0, 12, 68); commit style "authored the story channel payload".

## Constraints, assumptions, non-goals

- No new delivery systems: `showRadio`, world-data props/landmarks, and
  the existing scan/interact surface are enough.
- Assumption: the reveal map's channel assignments fit the section 38
  budget; if a private answer overflows a channel, trim privately first -
  the budget is the hard gate (section 38), not the channel's wish list.
- This item reads the beat/puzzle completion flags for radio gating but
  does not set them (WI-04a / WI-04d own their flags).
- No ending content, no MacGuffin truth (ST-05): the final-zone approach
  content slots are authored here, the MacGuffin mechanics are not.

## Fresh-session handoff

Read ST-04/plan.md, request sections 22, 37, 38, 51, 68, 70, WI-01c's
reveal map (placements by id only) and WI-04a (which completion flags
exist for radio gating). Every fragment is checked against the section 38
keep-or-delete test at review time; the private files under
`design_private/` are the source of truth and are never quoted in plan
artifacts.
