# Ecology browser check

- `school-visibility-check.mjs` — headless-chromium check on the real dev
  server (vite on port 54431, `HADAL_BROWSER_PORT` to override): boots
  `?debug=1`, injects 5 `fixture-schooler` members + 1 stalking
  `fixture-predator` through `window.__HADAL_GAME__.sim`, asserts every school
  member has a renderer visual tracking the sim position, and asserts the
  school parts when the predator is injected (mean member-to-predator
  distance grows several-fold). Prints PASS/FAIL with a JSON summary.
