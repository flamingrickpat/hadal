# Reviewer Scratch — WI-06 Sonar + World-Signal Bus

Independent reviewer probes for the WI-06 sonar / signal-bus review.

- `probe.mjs` — reviewer adversarial probe. Boots the real `npm run dev` page
  in headless Chromium (`?debug=1`) and drives the LIVE sonar through the
  production UI + input path:
  - the page boots with the sonar wired in and no console exceptions (the
    `SonarVisuals` ring/points render path runs every frame).
  - the sonar-1 upgrade is craftable at the base (recipe card flips to
    `Crafted`) and grants the `sonar` capability.
  - pressing Q (with the capability) fires the sonar with no runtime exception.
  - two screenshots capture the expanding ring + echo particles
    (`output/sonar-ring-early.png`, `output/sonar-ring-late.png`).
- `output/result.json` — the probe's structured pass/fail evidence.

The signal-bus-receives-sonar + fixture-creature-reacts claims are proven by
the headless `senses.test.ts` / `scenarios.test.ts` (per the work item's
evidence table); this probe adds the render-path + visible-ring browser
evidence.

Run: `node agents/tasks/hadal/scratch/work-item-reviewer/WI-06/probe.mjs`
`playwright-core` resolves from the repository root `node_modules`.
