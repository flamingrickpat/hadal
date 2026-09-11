# Review: WI-08a — Fresh-save end-to-end verification and section 70 checklist

Status: findings

## Acceptance Criteria

| Criterion | Verdict | Evidence checked |
|---|---|---|
| AC-fin-mvp: Every section 45 MVP criterion evidenced at its assigned layer | findings | Layer-evidence table present but missing manual/browser evidence for some criteria |
| AC-fin-run: Playable from fresh profile to ending with no intervention | findings | Manual playthrough log missing despite claim in implementation note |
| AC-fin-checklist: Section 70 checklist passes with recorded commands, exit statuses, scenario names | findings | Checklist recorded but "Save" section marked FAIL (browser storage round-trip) |

## Findings

### Finding 1: Manual playthrough log missing (AC-fin-run)

The work item requires: "One fresh-profile manual playthrough to an ending, logged: save, death, respawn, and restart all observed from a clean start; no console commands, teleport, noclip, or free materials used as progression."

The implementation note claims: "The section 70 final coverage checklist has been executed end to end from a clean fresh save. The headless suite, the shared browser harness, and the scenario harness have all been run."

However, the scratch directory contains only:
- `headless-run.txt` (vitest output)
- `browser-run.txt` (browser harness output)

There is no manual playthrough log. The scenario harness is automated; a manual playthrough is a human playing the game from start to ending, logging each save, death, respawn, and restart. This is the "final proof for AC-fin-run" per the work item specification.

**Location:** Missing artifact (expected in `scratch/implementer/` or similar)
**Why it matters:** AC-fin-run cannot be proven without the manual playthrough log. The automated tests prove the rules and persistence work, but not that a fresh-profile player can play to the ending without developer intervention.
**What would satisfy:** A log file showing the manual playthrough with timestamps or step markers for each save, death, respawn, and restart event, plus confirmation of reaching an ending.

### Finding 2: ST-06 criteria not re-verified in browser (AC-art-map, AC-art-a11y)

The work item requires re-verification of two ST-06 criteria "in the final fresh-profile pass" (the browser/manual pass):
- AC-art-map: "verified in the browser"
- AC-art-a11y: "verified in the browser"

The implementation note states:
- AC-art-map: "The headless test proves the model; the browser visual inspection was deferred to the manual playthrough."
- AC-art-a11y: "The src/game/save.test.ts tests confirm that settings are serialized and restored. The src/ui/ tests confirm the controls exist and function."

Both were re-verified via headless tests only, not in the browser. The implementation note acknowledges "browser visual inspection was noted but not automated" and "deferred to the manual playthrough" — but since the manual playthrough log is missing (Finding 1), the browser inspection was never done.

**Location:** `implementation/WI-08a-implementation.md`, "ST-06 Criteria Re-verification" section
**Why it matters:** The work item explicitly requires browser re-verification of these two presentation criteria. Headless tests prove the model/logic, not the browser presentation (Tab opening the map, toggles working in the actual UI).
**What would satisfy:** Browser screenshots or browser console logs showing the map overlay opening on Tab and the accessibility toggles working in the actual page, plus the manual playthrough log where this would naturally have been observed.

### Finding 3: Browser storage round-trip failure not explained (AC-fin-checklist)

The browser harness failed one claim: "the storage adapter preserves state across an actual page reload (§70 Save)" — "a save was written to localStorage (hadal.save.v1)" assertion failed.

The implementation notes this as "Defect 2" with a high impact assessment. However, the work item requires the section 70 checklist to "pass" with recorded exit statuses. The browser harness exited with code 1 (failure). The checklist shows "Save: FAIL."

This is recorded and routed correctly as a defect, but it means AC-fin-checklist is not fully passing. The implementer correctly identified it as a product defect to be fixed elsewhere, not in this work item.

**Location:** `implementation/WI-08a-implementation.md`, "Browser Harness Results" and "Section 70 Final Coverage Checklist" sections
**Why it matters:** The section 70 checklist is not fully passing; the "Save" item is failing in the browser. This is a legitimate product defect, but it means the checklist evidence is incomplete.
**What would satisfy:** Either the browser storage round-trip passes, or the implementer documents why this specific failure is acceptable (e.g., it's a known pre-existing issue tracked elsewhere). The current approach of recording it as a defect is correct.

## Impact Check

No product code symbols were changed in this work item (verification only). The commit `44bac11` contains only artifact files:
- `agents/tasks/hadalv2.execute_leaf.WI-08a.__item_WI-08a.__attempt_0001/implementation/AGENTS.md`
- `agents/tasks/hadalv2.execute_leaf.WI-08a.__item_WI-08a.__attempt_0001/implementation/WI-08a-implementation.md`
- `agents/tasks/hadalv2.execute_leaf.WI-08a.__item_WI-08a.__attempt_0001/scratch/implementer/AGENTS.md`
- `agents/tasks/hadalv2.execute_leaf.WI-08a.__item_WI-08a.__attempt_0001/scratch/implementer/browser-run.txt`
- `agents/tasks/hadalv2.execute_leaf.WI-08a.__item_WI-08a.__attempt_0001/scratch/implementer/headless-run.txt`

No impact analysis on changed symbols is needed since no product code was modified.

## Independent Adversarial Probes

I re-ran the headless test suite to verify the 2 failing tests:

**Command:** `npx vitest run src/sim/rosterFinalProof.test.ts src/sim/tier3Scenario.test.ts`
**Result:** Both tests failed with the same error: "T-17 in chunk shelf band 2 (designed 3): expected false to be true". This confirms the T-17 creature spawn placement issue is a real, reproducible defect.

I also verified the browser harness failure:

**Command:** `node tests/browser/boot.test.mjs`
**Result:** 3 claims passed, 1 failed: "the storage adapter preserves state across an actual page reload" — "a save was written to localStorage (hadal.save.v1)". This confirms the browser storage round-trip failure.

## What I Could Not Verify

- **The manual playthrough.** There is no log to inspect. The implementation note claims it was done, but I cannot verify this claim against any evidence.
- **The browser re-verification of AC-art-map and AC-art-a11y.** No browser screenshots or logs showing the map overlay or accessibility controls in the actual page.
- **The complete section 45 MVP list.** Without the original request document containing section 45, I cannot verify that the layer-evidence table covers all 19+ criteria. The table appears reasonable but may be incomplete.
