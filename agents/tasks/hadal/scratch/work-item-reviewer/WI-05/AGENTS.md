# Reviewer Scratch — WI-05 Audio System

Independent reviewer probes for the WI-05 procedural WebAudio review.

- `probe.mjs` — reviewer adversarial probe. Boots the real `npm run dev` page in
  headless Chromium, hooks `AudioContext` / `createBufferSource` /
  `createOscillator`, and checks the **live WebAudio node values** (not just the
  `snapshot()` field) to distinguish the literal request from the
  implementation's interpretation:
  - the `AudioContext` is constructed *only* after the first user gesture
    (request §27/§70) — construction-count is 0 before, exactly 1 after.
  - the ambient graph is actually built (all layer gains non-null) after input.
  - there is **no** long looping music track (request §58): every looping
    `BufferSourceNode` is a short (≤30 s) noise bed, and the drone bed is
    oscillator-based.
  - descending changes the *node* parameters: `worldLowpass.frequency` drops,
    `reverbSend` / `convWet` gain rise, `hullGain` falls (request §27).
  - the volume slider changes the actual `masterGain` node value (request §43).
- `output/result.json` — the probe's structured pass/fail evidence.

Run: `node agents/tasks/hadal/scratch/work-item-reviewer/WI-05/probe.mjs`
`playwright-core` resolves from the repository root `node_modules`.
