# Scratch — implementer

- `ecology-browser/school-visibility-check.mjs` — boots the real `npm run dev`
  page in headless chromium, injects the `fixture-schooler` school and a
  stalking `fixture-predator` through the real sim, and asserts the school is
  visible and parts around the predator (request §20/§48). Run:
  `node scratch/implementer/ecology-browser/school-visibility-check.mjs`.
  Question answered: are the schools visible in the real running game, and
  does a predator signal make them part?
