---
id: WI-03d3
role: work-item-reviewer
date: 2026-09-08
status: pass
---

# Review: WI-03d3 — Tier 4: production placement + roster-wide final proofs

Status: pass

## What was reviewed

Work item `WI-03d3` (parent WI-03d, ST-03): place the five tier-4 organisms
into the production world data on the private roster's bands, and run the two
roster-wide FINAL PROOFS — AC-roster-count (whole-roster world-data check)
and AC-roster-tests (roster-wide test-existence check + spoiler audit of
every ST-03 commit and artifact). Implementer commit: `ed96cbf`.

Codegraph was the first structural lookup (session gate): `codegraph_explore`
with `worldData creatureSpawns HIDDEN_CREATURES TIER4_BANDS CREATURE_BY_ID
rosterFinalProof` located the chunk data model (`src/world/chunks.ts`), the
`Simulation` spawn-resolution seam (`src/sim/Simulation.ts:298-313`), and
`makeSimWorld`/`MACRO_WORLD` consumers. The secret roster file
(`src/content/secret/hiddenCreatures.ts`) is not in the codegraph index; it
was read directly afterwards.

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| Placement: every tier-4 id WI-03d1 lands is in `src/world/worldData.ts`, in the bands the private roster assigns, ids debug-only | passed | 5 spawns present (`t19-abyss`, `t22-abyss` in the band-4 abyss chunk; `t20-hadal`, `t23-hadal`, `t25-hadal` in the band-5 hadal chunk) — exactly the WI-03d1 tier-4 id set {T-19, T-20, T-22, T-23, T-25}. Independent raw-source geometry probe (below) confirms each sits in its roster band chunk, inside chunk bounds, and in open water. No `T-\d\d` reference in any `src/ui/*.ts` file — ids are debug-only. |
| AC-roster-count: 15+ distinct creature types active with their spawns | passed | Re-ran `npx vitest run src/sim/rosterFinalProof.test.ts` → 6/6 pass. My independent probe over the raw source: 37 spawns, 22 distinct creature types active (≥ 15), and all 22 roster ids present in the production world data. |
| AC-roster-count: tier distribution matches the private roster's 18-24 selection per §11.1 bands | passed | Roster = 22 (in [18,24]); `design_private/creature_candidates.md` "Selected roster (22)" distribution table matches the four tiers (6+6+5+3+2) and the 22-entry `HIDDEN_CREATURES`. The shipped test asserts per-spawn band membership and per-species coverage of every designed band; my probe independently confirmed the five tier-4 placements against `TIER4_BANDS` (T-19→4, T-20→5, T-22→4, T-23→5, T-25→5). |
| AC-roster-count: every creature id resolves to a def | passed | Test 1 constructs the production `Simulation` (which throws on any unknown spawn id) and per-spawn checks `CREATURE_BY_ID`. Full suite green (below). |
| AC-roster-count: every spawn sits in the band it was designed for | passed | Shipped distribution test + my independent geometry probe (all 37 spawns in-band; the only slab-interior hit is the documented pre-existing `t03-twilight` exception, pinned as the single known exception by the test). |
| AC-roster-tests: every implemented major species has a headless signature-rule test | passed | Shipped test asserts a per-species `describe` block per id. My independent probe additionally verified every block is non-empty: all 22 ids have per-species `describe` blocks containing 1-3 real `it()` cases in the headless `tier1-4Scenario` files. |
| AC-roster-tests: no creature name or secret description appears outside debug internals and the private content files | passed | Shipped audit (hard scope: all `src/**`, every ST-03 commit, all `implementation/` deliverables — must be empty; meta hits restricted to documented homes). I re-derived the token list from `design_private/_spoiler_tokens.txt` (30 name/desc tokens, T-IDs excluded — matches the implementer's count) and ran two independent superset probes: the full git history (384 commits, case-insensitive ST-03 filter, 95 related, 0 offenders) and every git-tracked product file (102 files, all extensions, 0 offenders). |
| No regressions / type-safety | passed | `npx vitest run` → 33 files, 273 passed (273) — exactly the implementer's claimed count. `npx tsc --noEmit` → exit 0. |
| Commit hygiene | passed | `ed96cbf` stages exactly 7 files (5 tier-4 spawn lines + comment in `worldData.ts`, the new test file, the implementer artifact + index, the scratch probe + index, the project note). No `state.md`, no product code outside the two declared files, working tree clean. |

## Findings

None. No defects, no missing required evidence, no scope drift: the commit
touches only the declared files, makes no creature-behavior or renderer
change (constraint honored), and the one surfaced defect (the pre-existing
trapped `t03-twilight` spawn) is correctly pinned, documented, and routed to
fix-planning rather than fixed here, per the work item's own constraint.

## Impact Check

Changed data: five `CreatureSpawnDef` entries appended to the `abyss` and
`hadal` chunk `creatureSpawns` arrays in `src/world/worldData.ts`; new file
`src/sim/rosterFinalProof.test.ts`. Codegraph blast radius + grep of readers:
the only runtime consumer of `MACRO_WORLD`/`creatureSpawns` is
`Simulation` (via `makeSimWorld`), which resolves each spawn against
`CREATURE_BY_ID` and throws on unknown ids (`Simulation.ts:298-313`);
browser `Game`, `scenario.ts`, and `menu.ts` reach it through the same
seam. Every other reader is a test file. A data-only append cannot alter any
call signature or invariant; the 273-test full suite passing covers the
consumers (`chunks.test.ts`, all tier scenario suites, `tier4Render.test.ts`,
`sonar`/`ambient`/`currents` system tests). No silent-breakage surface found.

## Independent Adversarial Probes

Scratch: `scratch/work-item-reviewer/final-proofs/` (committed, indexed).

1. `probe-geometry.mjs` — parses `worldData.ts` raw text (independent of the
   test's `makeSimWorld` path): extracts 4 chunks, 42 closed slabs, 37
   spawns. Could falsify the placement claim if a tier-4 spawn sat in the
   wrong band chunk, outside chunk bounds, or inside any closed slab
   (including cross-chunk slabs). Observed: all five tier-4 spawns in the
   correct roster band chunk, all in bounds, zero slab intersections for the
   new spawns; the only world-wide slab-interior hit is the documented
   pre-existing `t03-twilight`/`shelf-floor-east` exception. PASS.
2. `probe-commits.mjs` — full git history token scan, deliberately a
   superset of the test's filter (case-insensitive `st-03|wi-03[a-d]`, full
   subject+body). Could falsify the audit if a lowercase-identifier commit
   carried a token the test's case-sensitive filter skips. Observed: 384
   commits, 95 ST-03-related, 0 offenders; the 4 lowercase review commits
   the test's filter misses were each scanned and are clean. PASS.
3. `probe-repo.mjs` — every git-tracked product file (all extensions, not
   just `.ts`: includes `index.html`, `*.mjs`, `*.json`, configs), excluding
   only `design_private/` and `agents/`. Could falsify the audit if a
   non-`.ts` product file carried a token. Observed: 102 files, 0
   offenders. PASS.
4. `probe-tests.mjs` — per-species scenario content check: for each of the
   22 roster ids (parsed from `hiddenCreatures.ts`), finds the per-species
   `describe` block and counts its `it()` cases (indent-scoped). Could
   falsify "test exists" if a block were an empty shell. Observed: all 22
   ids have non-empty blocks (1-3 cases each) in the four headless tier
   scenario files. PASS.
5. Re-runs (not new probes): `npx vitest run src/sim/rosterFinalProof.test.ts`
   → 6/6; `npx vitest run` → 33 files / 273 passed; `npx tsc --noEmit` →
   exit 0.

## What I Could Not Verify

- The implementer's red-first claim (the two count/distribution tests failed
  before the tier-4 placement, 17 active types). This is process evidence
  only and cannot be re-run retroactively without reverting the placement; it
  is not required evidence for either AC.
- Browser-visible behavior of the tier-4 organisms: out of scope by design
  (placement-only item; the definitive 60 FPS check is ST-07's). No creature
  behavior or renderer code changed, so no browser probe was warranted.
- `design_private/` files were read as the source of truth per the work item
  (roster, bands, tokens); they are gitignored, so they cannot be audited in
  the commit history — that is by design.

## Assumptions

- **T-20's band is 5 (hadal).** The design prose (B13 "set into the abyss
  wall", band-4 pulsing current) is loose narrative; the authoritative band
  map for this item is `TIER4_BANDS`, established by the passed WI-03d1
  review, which places T-20 in band 5. The implementer recorded this
  assumption; I concur — the roster's band assignment is what the AC's
  "bands the private roster assigns" points at, and the check asserts
  against it consistently on both sides.
- **Meta-audit classification is a correct reading of the AC.** The AC says
  "no creature name … outside debug internals and the private content
  files." A literal whole-repo reading would flag prior reviewers' own
  append-only review notes and scanner probes that must name the tokens to
  assert their absence (and the token manifest itself). The implementer kept
  the hard scope at the shippable surface (product source, commit history,
  implementer deliverables — all verified independently empty by my probes 2
  and 3) and classified the rest as meta-audit documents with a fail-loud
  home check. This matches the scope the four passed per-tier reviews
  established. For this reading to be wrong, the AC would have to be read as
  covering every byte under `agents/`, which the per-tier precedent and the
  append-only artifact rule make untenable.
