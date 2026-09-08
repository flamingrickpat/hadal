# scratch/implementer/wi-02b-browser

Bounded probe for WI-02b's focused browser check (request §13, §30, §34).

- `creature-render-check.mjs` — boots the real `npm run dev` page in
  headless Chromium, injects the two WI-02a fixture organisms into the
  running `Simulation`, and asserts the `CreatureRenderer` visuals track
  the simulated position, the body geometry animates over sim time, and
  there are no page/console errors. Run with
  `node agents/tasks/hadalv2.execute_leaf.__attempt_0006/scratch/implementer/wi-02b-browser/creature-render-check.mjs`.
