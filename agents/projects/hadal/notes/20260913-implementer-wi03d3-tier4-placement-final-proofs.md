---
title: WI-03d3 tier-4 production placement + roster-wide final proofs
role: item-implementer
created: 2026-09-08
tags: [world-data, spawns, final-proofs, spoiler-audit, roster]
symbols: [MACRO_WORLD, TIER4_BANDS, HIDDEN_CREATURES, ROSTER_IDS, BANDS, rosterFinalProof]
files: [src/world/worldData.ts, src/sim/rosterFinalProof.test.ts, src/content/secret/hiddenCreatures.ts]
---

# WI-03d3 tier-4 placement + roster-wide final proofs

## Summary

The final ST-03 item. The tier-4 organisms (the last roster tier) land in the
production world data on the private roster's bands, and two roster-wide
FINAL PROOFS close the story: the whole-roster world-data count check
(AC-roster-count) and the roster-wide test-existence + spoiler audit
(AC-roster-tests). This is the whole-roster pass over the production world
data (no fixtures); each tier already ran its own per-tier portion.

## Key facts

- **Tier-4 placement (request §33, internal ids only).** Five spawns, in
  open water (clear of every closed slab in the world), inside their chunk
  bounds, in the band `TIER4_BANDS` assigns:
  - abyss (band 4): `t19-abyss` (T-19) at (15200, -8700); `t22-abyss`
    (T-22) at (22900, -9300).
  - hadal (band 5): `t20-hadal` (T-20) at (19100, -9650); `t23-hadal`
    (T-23) at (21400, -9650); `t25-hadal` (T-25) at (22900, -9650).
  - T-20's band is {5} (hadal) per `TIER4_BANDS`, even though the design
    prose ties its pulse to the band-4 current — the roster constant is the
    authority for the band check.

- **The whole-roster proofs live in `src/sim/rosterFinalProof.test.ts`
  (6 tests).** AC-roster-count (4): the production world constructs and every
  id resolves; 22 distinct types active (≥ 15) and the roster selection ∈
  [18,24]; every spawn in its designed band and each species covers every
  designed band (distribution, §11.1); no spawn inside a closed slab except
  the one documented pre-existing exception. AC-roster-tests (2): every
  species has a per-species signature-rule `describe` block (matched as a
  whole word — labels read `'T-20: …'` or `'… (T-19)'`); and the spoiler
  audit.

- **The spoiler audit's hard vs meta scope (§0/§12/§68).** Token list from
  `design_private/_spoiler_tokens.txt` (T-IDs excluded, "The X" stripped,
  per-tier case-insensitive whole-word rule). Scans (1) every ST-03 commit
  message, (2) the whole product source `src/**`, (3) every ST-03 task
  artifact. **Hard scope** (must be empty): product source, commit history,
  and implementer deliverables (`implementation/`). **Meta scope** (may name
  tokens): review reports (name tokens to assert absence), scanner probes
  (carry the token list by construction), and controller/planner spec + state
  files (quote the request). Every meta hit is asserted to sit in one of
  those homes (path-based, no token literals in the test). This matches the
  per-tier checks (tiers 1-3) that passed review.

- **Pre-existing trapped spawn (routed, not fixed here).** The whole-roster
  clearance test surfaces exactly one trapped spawn: `t03-twilight` (T-03)
  at (11000, -5000) is strictly inside the shelf band's `shelf-floor-east`
  slab (cross-chunk overlap; see the WI-03b2 clearance note). It is a tier-1
  defect out of this item's scope; the test pins it as the single known
  exception and fails on any other trapped spawn. It does not affect the
  count/distribution assertions (T-03 still spawns in the shelf + abyss).

## Gotchas

- A whole-roster clearance check must test against **all** closed slabs in
  the world, not just the spawn's own chunk (chunks spatially overlap across
  band boundaries — the shelf floor reaches into the top of the twilight
  band).
- The per-species `describe` label does not always start with the id (e.g.
  `'… (T-19)'`), so the test-existence check must match the id as a whole
  word anywhere in the label, not just after the opening quote.
- The audit test must not carry any name-token literal (it is in `src/`, the
  hard scope, so it would flag itself). Classify meta hits by path, not by
  naming the tokens.

## Commands

- `npx vitest run src/sim/rosterFinalProof.test.ts` — the 6 roster-wide
  FINAL PROOF tests.
- `npx vitest run` — the full headless suite (33 files, 273 tests).
- `npx tsc --noEmit` — type check.
