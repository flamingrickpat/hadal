# PROJECT HANDOFF — HADAL / working title

> **This document is intentionally spoiler-safe for the human player.**
> The coding agent is responsible for inventing and implementing the hidden lore, deep-zone identities, creature roster, major set pieces, final reveal, and ending details privately inside the repository. Do not reveal those details in chat, commit summaries, screenshots, or progress reports unless explicitly asked after the user has finished playing.

---

# 0. Executive directive

Build a complete, browser-playable, widescreen-optimized 2D side-scrolling underwater exploration game in HTML + TypeScript + Three.js. Target a first blind playthrough of roughly **90–120 minutes**, with a fast critical path and optional discoveries that can stretch it somewhat beyond that.

The intended feeling is:

- the compulsive “one more dive, one more upgrade, a little deeper” loop of a compact ocean exploration game;
- the escalating scale awe of Subnautica, but compressed into two hours;
- the dark, minimalist, uncanny quality of old browser diving games;
- a strongly authored sequence of ecological surprises rather than an infinite procedural sandbox;
- stylized graphics that are cheap to build procedurally but can still make enormous creatures look spectacular;
- a world that begins almost mundane and becomes increasingly alien, industrial, ancient, and difficult to classify;
- creatures that feel like actual organisms with niches and behaviors, not a list of enemy sprites.

The human player explicitly wants to be surprised. **Do not solve the creative problem by writing all the monsters and lore into this handoff or exposing them during development.** Solve it inside the codebase in a hidden content pass.

The finished game should be playable from start to finish with no developer intervention.

---

# 1. Non-negotiable design pillars

## 1.1 Deeper must always mean more interesting, not merely more dangerous

Depth is the primary progression axis. Every meaningful descent should change at least two of these:

- visual language;
- soundscape;
- movement constraints;
- available resources;
- ecology;
- creature scale;
- creature behavior;
- architecture / geology;
- interpretation of the world;
- what the player thinks the next layer contains.

Do not make the lower zones just “the same fish but stronger.”

## 1.2 The ocean is the main character

The player should routinely see things they do not fully understand. Not everything should be collectible, scannable, killable, or explained.

At least some events should exist solely to make the player think:

> What the hell was that?

The game should be comfortable leaving that question partially unanswered.

## 1.3 Creature spectacle through behavior and staging, not asset complexity

We are deliberately constrained to a vibecoded 2D game with procedural / generated visuals. Therefore creature impact must come from:

- silhouette;
- scale;
- timing;
- partial visibility;
- animation;
- sound;
- interaction with the environment;
- unconventional locomotion;
- ecological context;
- surprising changes of state.

A 300-line procedural creature with a brilliant entrance is preferable to a detailed static sprite.

## 1.4 Crafting is progression, not housekeeping

No survival chore simulator.

Do not add hunger, thirst, sleep, temperature meters, durability spam, or five tiers of identical inventory bags.

Crafting should answer questions like:

- Can I stay down longer?
- Can I survive this pressure?
- Can I cross that current?
- Can I see what is making that noise?
- Can I get away from that predator?
- Can I enter that structure?
- Can I carry this weird specimen back?

Every major upgrade should unlock new behaviors or routes.

## 1.5 The player should feel vulnerable without feeling helpless

Early creatures can be fought or scared away. Mid-game creatures should increasingly require avoidance, deception, environmental use, or specific tools. The largest creatures should generally not be “bosses with HP bars.”

The deepest fauna should make the player feel that their equipment is impressive by human standards and irrelevant by geological standards.

## 1.6 Surprise is a production requirement

Treat spoiler containment like a feature.

The user should not know in advance:

- the final lore explanation;
- the true nature of the MacGuffin;
- the final zone’s core reveal;
- the identity or complete behavior of the largest organisms;
- the ending choice or consequence;
- the most memorable creature gimmicks.

---

# 2. Player-visible premise

Keep the initial setup simple enough to explain in about 20 seconds.

The player is a contract salvage diver operating from a small, battered coastal platform on an ocean-dominated colony / world. A deep-water industrial or research installation stopped transmitting. The job is to descend through abandoned infrastructure and retrieve a compact high-value object from the lost site.

The employer frames it as salvage.

The sea increasingly suggests that the official explanation is incomplete.

Do not front-load terminology. The player should understand:

1. **I have a boat/platform.**
2. **I can dive.**
3. **I need resources to improve my gear.**
4. **Better gear lets me go deeper.**
5. **There is something valuable at the bottom.**

Everything else can arrive later.

Working project title can be `HADAL`, `BENTHIC`, `LOW WATER`, or another short title generated during implementation. Do not spend substantial time on naming.

---

# 3. Target playtime and pacing

Target blind first playthrough:

- **0–10 min:** learn swimming, harvesting, returning to base, first craft;
- **10–25 min:** first proper exploration zone, first predator behavior, first strange discovery;
- **25–45 min:** acquire equipment that materially increases range; encounter first thing too large / strange to treat as ordinary fauna;
- **45–70 min:** world starts to feel wrong; player reaches transition into deep water and must actively prepare for it;
- **70–95 min:** abyssal exploration, high-value discoveries, major set piece, meaningful route decisions;
- **95–110 min:** final descent / approach;
- **110–120 min:** MacGuffin, revelation, escape / return / ending beat.

A skilled player who knows the route should be able to finish in perhaps 55–75 minutes. Do not artificially slow experts.

### Pacing rule

Something notable should happen approximately every **3–6 minutes**:

- new creature;
- new environmental behavior;
- new sound;
- new resource;
- new ruin;
- new route;
- new tool;
- unexpected ecology interaction;
- unusual visual;
- story fragment;
- massive silhouette;
- change in water behavior.

Not every beat needs to be dramatic. The point is to prevent empty traversal.

---

# 4. World structure

## 4.1 Use a finite authored world, not an infinite procedural ocean

The world should be one connected side-view map split into approximately **five depth bands / macro-zones**.

Only the coastal starting zone needs to be conceptually fixed in this document. Generate the exact themes of later zones privately.

Suggested physical scale in gameplay coordinates:

- horizontal extent: roughly 18,000–28,000 world units;
- vertical extent: surface at `y = 0`, deepest point around `y = -9,000` to `-12,000`;
- orthographic camera showing around 1,800–2,300 horizontal world units at 16:9;
- player width ~45–60 units.

Numbers are tuning defaults, not sacred.

## 4.2 Macro topology

Prefer a **wide descending network** instead of a straight vertical shaft.

Each zone should contain:

- a main safe-ish traversal route;
- at least one shortcut unlocked from the far side;
- at least one optional pocket with upgrade material or lore;
- at least one memorable landmark;
- at least one creature encounter designed around that landmark;
- at least one return route that becomes faster after an upgrade or shortcut.

The player should sometimes descend, sometimes move laterally, sometimes enter caves / wrecks / tunnels, and occasionally ascend inside a deeper region.

## 4.3 Gates

Use **soft equipment gates** instead of colored-key doors whenever possible.

Good gates:

- pressure damage below a depth threshold;
- darkness that becomes practically impossible without a lamp;
- current too strong without propulsion upgrade;
- toxic / electrically active water requiring insulation;
- narrow wreck passage requiring cutter;
- vertical chasm requiring better oxygen and speed;
- creature territory that can be crossed safely only after learning its behavior or building a decoy.

Bad gates:

- “You need Blue Keycard Tier 3.”
- arbitrary invisible walls;
- level numbers.

## 4.4 Critical-path reliability

Critical resources must be deterministic. Random generation may scatter extra resources, but the player must never be softlocked because RNG failed to place a required material.

Implement a world validation function that checks the critical upgrade chain and confirms that required resource nodes exist in reachable regions before each gate.

---

# 5. Starting base / surface loop

The base is intentionally tiny. Think “functional dive platform,” not base-building game.

Required stations:

- **Workbench** — crafts permanent equipment and consumables;
- **Storage** — optional convenience, not inventory micromanagement;
- **Dive terminal** — displays current objective, depth record, maybe rough bathymetry;
- **Radio / contract terminal** — delivers sparse story messages;
- **Launch edge** — jump directly into water.

Returning to base should:

- refill oxygen / power;
- restore health;
- save automatically;
- bank resources;
- allow crafting;
- update one or two concise world/story lines when appropriate.

The turnaround from surfacing to diving again should be under 30 seconds if the player knows what they want.

No walking around a large hub.

---

# 6. Core player controls

Desktop first.

## Keyboard + mouse

- `WASD` — swim / thrust;
- mouse — aim light / tool;
- left mouse — use equipped tool;
- right mouse — alternate tool function or focus light;
- `E` — interact / collect / open;
- `Q` — sonar / active scan pulse;
- `1–4` — quick-select tools;
- `Tab` — inventory / crafting / map overlay;
- `Shift` — short boost once unlocked;
- `Esc` — pause.

Gamepad support is optional. Do not delay the project for it.

## Movement feel

Underwater movement should be responsive but clearly inertial.

Recommended model:

```text
input -> desired acceleration -> velocity
velocity *= drag
position += velocity * dt
```

Use separate horizontal and vertical acceleration if useful.

Starting movement:

- deliberate;
- slightly heavy;
- easy to aim precisely.

Later propulsion upgrades:

- improve max speed;
- improve acceleration;
- optionally add a limited dash / boost;
- do not turn movement into frictionless spaceship controls.

Add slight body rotation toward velocity / aim for visual life.

---

# 7. Player resources / meters

Keep HUD pressure low.

Required:

## Oxygen

Primary dive timer.

Do not make baseline oxygen brutally short. First dive should comfortably allow learning and returning.

Oxygen drains faster when:

- boosting;
- badly injured;
- under certain hidden environmental conditions if narratively justified.

Avoid attacks consuming oxygen directly unless the mechanic is obvious and fair.

## Health

Simple 0–100.

Damage sources:

- creature attacks;
- pressure when exceeding suit rating;
- environmental hazards;
- crush / collision only if telegraphed.

No limb damage system.

## Suit power

Optional but useful as a **shared tactical resource** for active electronics:

- sonar;
- high-beam light;
- pulse deterrent;
- boost;
- decoy launcher.

Power regenerates slowly or is refilled by passive kinetic / thermal system. Do not require collecting batteries constantly.

If power feels like pointless meter proliferation during playtesting, remove it and use cooldowns instead.

## Inventory mass / cargo

Keep it simple.

Use a single capacity number rather than slot Tetris. Permanent key objects do not consume cargo.

---

# 8. Resource economy

Use **4–6 core material families**, not 25 crafting items.

The precise in-world names can be generated to fit the hidden world, but mechanically they should map roughly to:

1. structural salvage / metal;
2. biological fiber / polymer;
3. conductive material;
4. dense pressure-resistant mineral;
5. rare bioluminescent / anomalous chemistry;
6. optional endgame catalyst.

Resources should be visually recognizable at a glance.

### Harvesting

Early resource pickup: swim near + `E`.

Later materials may require:

- cutter;
- harpoon pull;
- interacting with a living organism without killing it;
- entering dangerous territory;
- scavenging wreck internals.

### Economy rule

The player should rarely need more than **2–4 minutes of deliberate gathering** for a required upgrade if they have already reached the appropriate zone.

A player who explores naturally should usually have 60–80% of required materials by the time they discover the recipe.

No money currency unless it has a strong narrative purpose. Resources alone are enough.

---

# 9. Crafting / progression tree

Keep permanent upgrade count around **10–14**.

Possible mechanical roles:

### Tier 0 — starter

- basic tank;
- work light;
- salvage tool / knife / cutter;
- simple harpoon or impulse tool.

### Tier 1 — early range

- oxygen tank I;
- fins / propulsion I;
- cargo harness;
- simple sonar.

### Tier 2 — twilight access

- pressure shell I;
- stronger light or spectral lamp;
- cutter / arc tool;
- defensive pulse / decoy.

### Tier 3 — abyss access

- pressure shell II;
- propulsion II / boost;
- advanced sonar behavior;
- insulation / environmental protection.

### Tier 4 — final descent

- one special adaptation assembled from discoveries in prior zones;
- potentially a tool that interacts with the hidden MacGuffin / ecosystem in an unexpected way.

Do not include boring `Damage +10%` upgrades unless coupled to a new affordance.

### Consumables

Maximum 3–4 types:

- emergency oxygen shot;
- med patch;
- flare / lure;
- decoy / noise maker.

Consumables should be cheap enough that the player uses them.

---

# 10. Combat philosophy

This is not primarily a shooter.

The player may have a harpoon / lance / pulse tool, but it should serve several functions:

- collect certain prey / resources;
- break weak salvage;
- deter small predators;
- trigger environmental objects;
- pin or pull small objects;
- create noise deliberately.

### Damage model

Small fauna: killable quickly.

Medium predators: killable but costly / risky; avoidance is often better.

Large predators: potentially injurable or deterrable but generally not worth killing.

Colossal organisms: not conventional combat targets.

Never put an HP bar over a leviathan.

### Predator fairness

Every predator needs at least one readable rule.

Examples of rule categories, **not exact secret species designs**:

- reacts to motion;
- reacts to light;
- reacts to sonar;
- attacks from cover;
- defends a territory but does not chase far;
- follows blood / damaged prey;
- attacks noise sources;
- mistakes a tool for mating / feeding signal;
- is dangerous only when accompanied by another organism.

The player should be able to learn through observation, not wiki lookup.

---

# 11. Creature production system

This is the most important creative system in the project.

## 11.1 Hidden roster requirements

Privately create a roster of roughly **18–24 distinct organisms / organism groups**.

Suggested distribution:

- 5–7 tiny ambient / schooling organisms;
- 4–6 small or medium useful / neutral fauna;
- 4–6 predators or territorial fauna;
- 2–4 huge organisms used as ecological set pieces;
- 2–3 truly colossal presences, at least one of which is not simply hostile.

These numbers can overlap because an organism can change apparent role.

The roster should contain at minimum:

- two genuinely helpful or mutually beneficial species;
- one organism that looks dangerous but is safe;
- one organism that initially appears harmless but has a surprising second behavior;
- one predator with a non-chase hunting strategy;
- one creature whose body incorporates / repurposes a piece of industrial material or wreckage in a biologically plausible way;
- one “landmark” that is later revealed to be alive or partly alive;
- one large encounter where the player never receives a clean full-body view;
- one colossal organism whose presence is communicated first through changes to other fauna;
- one ecosystem relationship the player can exploit;
- one creature whose scale is initially misread because there is no good visual reference;
- one strange organism that is beautiful rather than threatening;
- one creature that uses architecture / geology as part of its life cycle;
- at least one organism that cannot be cleanly mapped to Earth categories like shark / squid / crab / eel.

## 11.2 Anti-cliché constraints

Lovecraftian does **not** mean “put tentacles and eyes on everything.”

Actively reject:

- generic giant shark;
- generic anglerfish boss;
- giant squid with more eyes;
- black blob with teeth;
- humanoid fish cultists;
- random floating eyeballs;
- “the ancient god was asleep all along” with no ecological logic;
- every organism bioluminescing neon blue;
- simple size-scaled versions of normal fish.

A creature may use a familiar body plan only if one key biological assumption is radically different.

## 11.3 Creature concept rubric

Before implementing each major organism, privately answer:

1. What does it eat / obtain energy from?
2. Why does it exist at this depth?
3. What does it do when the player is absent?
4. What visual feature makes its silhouette recognizable in two seconds?
5. What behavior makes encountering it mechanically distinct?
6. What incorrect assumption is the player likely to make at first?
7. How can sound announce it before sight?
8. What environmental evidence can appear before the creature itself?
9. Is it actually hostile, or merely incompatible with the player?
10. Can it interact with another species?

If these answers are weak, redesign the creature before coding it.

## 11.4 “Holy shit” encounter quota

Design at least **five** deliberate spectacle moments distributed across the run.

Not five cutscenes. They should occur inside gameplay.

Examples of staging techniques:

- foreground occlusion passes and reveals only a fraction of a body;
- an object thought to be terrain moves;
- a harmless swarm abruptly changes formation because something enormous is approaching;
- distant lights turn out not to be lights;
- wreckage begins moving against the current;
- sonar returns an impossibly large arc;
- the camera subtly zooms out because the normal framing cannot contain what entered the scene;
- something crosses the background layer while the player remains free to move;
- a creature interacts with an industrial ruin at a scale that recontextualizes both.

Do not copy these literally as a checklist. Use them as staging grammar.

---

# 12. Private creative generation protocol — DO THIS WITHOUT SHOWING THE USER

Before implementing the deep content, run a private design pass inside the repository.

Create something like:

```text
/design_private/
  world_candidates.md
  creature_candidates.md
  final_selected_world.md
  encounter_beats.md
  lore_truth.md
  spoiler_map.md
```

Add `/design_private/` to `.gitignore` if the environment will expose commits or diffs to the player. If the coding environment makes ignored files inconvenient, store equivalent data in normal project files but do not quote them in chat.

### Step A — generate competing worlds

Generate **three substantially different hidden interpretations** of the premise.

They should differ in:

- what the deep ocean actually is / contains;
- why the industrial installation failed;
- what the MacGuffin really is;
- what connects the ecology to the old infrastructure;
- what emotional tone the ending has.

### Step B — critique them

For each candidate, identify:

- obvious genre clichés;
- exposition burden;
- whether the explanation makes the ocean less mysterious;
- whether it supports visually weird creatures;
- whether it can be delivered in two hours;
- whether the final reveal changes how earlier things are interpreted.

Reject the weakest.

### Step C — hybridize, do not average

Take the strongest candidate and steal one excellent mechanism / idea from another. Do not blend all three into lore soup.

### Step D — generate creature roster

Generate at least 30 rough concepts, then score each 1–5 for:

- silhouette novelty;
- ecological plausibility within the hidden world;
- gameplay distinction;
- ease of procedural animation;
- surprise potential;
- cliché penalty.

Select the best 18–24.

### Step E — enforce diversity

If more than 25% of selected creatures can be summarized as “swimming mouth attacks player,” redo the roster.

### Step F — map reveals

Assign creature reveals and lore clues to the 90–120 minute pacing timeline. Do not dump the best ideas in the first half.

### Step G — never reveal the private files in normal progress reporting

Progress reports should say things like:

- “implemented two mid-depth predator archetypes”;
- “added the first large-scale ecological set piece”;
- “final zone content is implemented.”

Do not say what they are.

---

# 13. Creature rendering: procedural 2.5D on a 2D gameplay plane

Gameplay is strictly on the `x/y` plane. Use `z` only for visual layering.

The goal is to make creatures look much richer than ordinary sprites without requiring hand-drawn assets.

## 13.1 Small creatures

Use combinations of:

- `THREE.ShapeGeometry`;
- simple polygon meshes;
- translucent fins;
- outline lines;
- procedural CanvasTexture masks;
- simple vertex deformation;
- 3–8 articulated body segments.

## 13.2 Large flexible creatures

Implement a reusable spline / spine creature renderer.

Conceptually:

```ts
interface SpineNode {
  pos: Vec2;
  prev: Vec2;
  radius: number;
}
```

Update head from AI steering, then constrain each node to follow the previous node at a fixed segment distance.

Generate body geometry from left/right normals along the spine.

Attach:

- fins;
- plates;
- tendrils;
- lights;
- carried debris;
- secondary appendages;

at normalized positions along the spine.

This one system can produce eels, ribbon animals, segmented colonial life, long filter feeders, and things that do not resemble conventional fish.

## 13.3 Massive rigid / semi-rigid organisms

Use a hierarchy of simple meshes around a root transform. Allow parts to move on different time scales.

Massive organisms should often extend beyond screen bounds.

## 13.4 Found-object / wreck symbiosis

Create a generic attachment system where a creature can carry pieces generated from the same geometry library as world wreckage.

Do not simply recreate the known “giant crab using warship as a shell” idea. Preserve the **design principle**: huge biological life can appropriate human-scale industrial objects so completely that the object becomes anatomy, camouflage, shelter, courtship structure, feeding apparatus, or nursery.

Invent a different realization privately.

## 13.5 Animation principles

Avoid perfectly periodic sine-wave animation everywhere.

Add:

- noise modulation;
- occasional pauses;
- breathing / pumping cycles;
- asymmetric appendage movement;
- reactions to nearby objects;
- acceleration-dependent deformation;
- sudden changes in posture when alert.

---

# 14. Art direction

## 14.1 High-level visual concept

Use a **dark graphic-novel / scientific-sonar / cut-paper** hybrid.

The world should be mostly composed of:

- deep desaturated water gradients;
- black / near-black silhouettes;
- restrained luminous accents;
- grain;
- drifting particulate matter;
- strong cones of player light;
- sparse line detail;
- parallax layers;
- occasional extremely bright biological or industrial events.

The visual style must still read clearly in motion at 1920×1080.

## 14.2 Why this style

It allows:

- enormous creatures with cheap geometry;
- hidden anatomy in darkness;
- partial reveals;
- atmospheric depth;
- easy procedural generation;
- coherent visuals even when different assets are produced by code rather than an artist.

## 14.3 Do not make the entire game visually uniform

Each depth band needs a distinct palette family and particle profile.

Change some combination of:

- water color;
- opacity / visibility;
- particle size;
- light attenuation;
- background geological silhouette;
- industrial debris density;
- organic texture;
- chromatic aberration amount;
- current direction;
- ambient motion.

Use restraint with post-processing. Heavy bloom on everything will make the art muddy.

---

# 15. Lighting and darkness

The player’s light is one of the main drama tools.

Implement a cone / radial light mask using shader materials or composited transparent meshes.

Desired effects:

- particles become visible inside the beam;
- silhouettes can cross at the edge of illumination;
- deeper zones have shorter effective visibility;
- some biological light sources can reveal geometry from behind;
- huge creatures should sometimes be readable only as multiple separately illuminated pieces.

### Flashlight behavior

The starter light should be adequate in shallow water.

Upgrades can alter:

- range;
- beam width;
- spectral mode;
- power drain;
- interaction with certain organisms.

Do not make darkness a pure black screen. The player needs enough ambient structure to navigate.

---

# 16. Camera

Use an orthographic camera.

Baseline:

- smooth follow with 0.12–0.2 sec lag;
- lead slightly toward aim direction and velocity;
- zoom based on speed and encounter state;
- clamp to world bounds where appropriate.

### Scale reveals

For select colossal encounters, very gradually widen the camera framing by 10–30% without announcing it. The player should feel the scene becoming too large for normal framing.

Do not abuse camera shake. Use low-frequency displacement for distant impacts / calls and short impulses for nearby collisions.

### Widescreen

Design around 16:9 but tolerate 21:9.

On ultrawide, expand horizontal visibility rather than stretching UI. Keep gameplay fair by limiting offscreen AI aggro to world distance, not screen edge.

---

# 17. World rendering and terrain

Avoid tile-map visual monotony.

Use procedural polygons / curves for cave walls and seabed.

Represent terrain as:

- collision polyline / polygon data in 2D;
- rendered silhouette meshes;
- separate decorative geometry along the edge;
- background parallax versions with no collision.

## Chunk model

Split world into authored chunks / rooms around 1–2 screens wide.

Example data shape:

```ts
interface WorldChunkDef {
  id: string;
  bounds: Rect;
  terrain: TerrainShapeDef[];
  exits: ExitDef[];
  resourceNodes: ResourceSpawnDef[];
  creatureSpawns: CreatureSpawnDef[];
  props: PropDef[];
  triggers: TriggerDef[];
  ambient: AmbientDef;
}
```

Only keep nearby chunks fully active.

But do not over-engineer streaming. For this world size, all coarse chunk definitions can remain in memory; just disable expensive AI / particles far away.

---

# 18. Sonar system

Sonar should be both utility and horror mechanism.

On `Q`:

- emit expanding ring;
- briefly outline nearby terrain and major objects;
- mark resource signatures if upgrade allows;
- return larger / slower pulses from massive objects;
- create sound that certain fauna may detect.

The sonar should sometimes reveal something the flashlight cannot meaningfully show.

Do not make sonar a permanent minimap cheat.

Possible visual implementation:

- expanding circle mesh in world space;
- each tagged entity records `lastSonarHitTime`;
- shader / material briefly draws outline or emissive rim;
- terrain points spawn short-lived echo particles.

---

# 19. Creature AI architecture

Keep it data-driven but not ECS-heavy.

A simple class + state machine is enough.

```ts
interface CreatureDef {
  id: string;
  body: CreatureBodyDef;
  movement: MovementDef;
  senses: SenseDef;
  behavior: BehaviorDef;
  combat?: CombatDef;
  ecology?: EcologyDef;
  audio: CreatureAudioDef;
}
```

Runtime states might include:

- `idle`;
- `forage`;
- `wander`;
- `investigate`;
- `alert`;
- `stalk`;
- `attack`;
- `flee`;
- `return`;
- `interact`;
- custom species state.

Major organisms can have bespoke controllers. Do not force every interesting behavior through a generic state machine if a 120-line custom controller is clearer.

### Sensory model

Provide primitives:

- distance vision;
- light sensitivity;
- motion sensitivity;
- noise events;
- sonar events;
- line of sight;
- chemical / blood event if needed.

Creatures subscribe to the sensory channels relevant to them.

This makes behavior surprising without magic omniscience.

---

# 20. Ecology simulation — fake it intelligently

Do not build a full ecosystem simulator.

Create the **illusion** of one.

Useful tricks:

- small fish flee when predators are near;
- scavengers approach recent kills;
- filter feeders orient to currents;
- harmless animals hide when a colossal creature event is approaching;
- predators occasionally attack ambient prey instead of the player;
- friendly species investigate certain resource nodes;
- carcass particles attract species;
- some zones become temporarily quiet before large events.

A few cross-species reactions create far more believability than hundreds of independent wandering agents.

---

# 21. Friendly creatures

The user explicitly wants some creatures to be nice.

Do not make them Disney sidekicks with dialogue bubbles.

Possible categories:

- curious;
- symbiotic;
- cleaning / repair behavior;
- guide behavior;
- warning behavior;
- trades one resource for another via feeding;
- temporarily follows light;
- protects territory that the player can shelter inside;
- responds to repeated nonviolent interactions.

At least one friendly interaction should provide a practical advantage that the player discovers organically.

Avoid explicit “Press E to befriend creature” questification.

---

# 22. Story delivery

Keep the story simple at the surface and layered underneath.

Use four channels:

1. **contract/radio messages** — terse, practical, sometimes evasive;
2. **environmental evidence** — strongest channel;
3. **short logs / labels / research fragments** — max ~40–100 words each;
4. **ecology itself** — behavior should imply history.

### Lore rule

No final exposition dump explaining every anomaly.

The player should finish with:

- a clear understanding of what they physically did;
- a plausible understanding of the central event;
- unanswered questions about the largest-scale implications.

### Contradictions

Allow official records, older logs, and observed reality to disagree.

Do not overuse unreliable narrator tricks. Contradictions should feel like institutions misunderstanding or hiding things, not the writer refusing to commit.

---

# 23. MacGuffin design

The MacGuffin must do more than trigger a victory screen.

Privately decide its true nature during the hidden world-generation pass.

Requirements:

- visually memorable despite simple rendering;
- clearly important before the player fully understands why;
- tied to at least two earlier pieces of environmental foreshadowing;
- retrieval should change the environment, creature behavior, player perception, or return journey;
- it should force one final decision, interpretation, or escape sequence;
- the final 5–10 minutes should feel mechanically different from the approach.

Avoid “pick up glowing orb, fade to credits.”

---

# 24. Endgame

Do not make the final encounter a conventional arena boss.

Good endgame structures:

- extraction under altered ecological conditions;
- stealth passage through something awakened;
- navigation while instruments become unreliable;
- choosing whether to obey the contract;
- carrying an object that changes what can perceive the player;
- escaping a structural collapse caused by something much larger than the player;
- being helped by a species the player treated well earlier.

The exact final mechanism is secret.

Allow at least **two ending variants** if they can be implemented with modest scope. They do not need radically different levels; a decision plus different final state / text / shot is enough.

---

# 25. Death / failure

This is a short atmospheric game, not a punishment simulator.

On death:

- fade / sonar collapse effect;
- respawn at surface base;
- keep permanent upgrades and key discoveries;
- lose at most a modest fraction of unbanked generic resources;
- optionally leave a recoverable salvage beacon at death location.

Do not make the player replay 20 minutes because a new creature had an unknown mechanic.

Autosave:

- every return to base;
- after major unlocks;
- before final descent;
- after key story triggers.

Use `localStorage` with a versioned save object.

---

# 26. UI / UX

Keep the main HUD minimal.

Visible by default:

- oxygen;
- health;
- current depth;
- selected tool;
- maybe compact power meter.

Hide or fade HUD elements when full.

Inventory / map overlay should pause the game unless doing so breaks a deliberate encounter.

### Map

The map should be a rough explored-space bathymetry, not a fully detailed GPS chart.

Show:

- player position;
- explored chunk silhouettes;
- base;
- manually or automatically discovered major landmarks;
- optional death beacon.

Do not show creature locations.

### Context prompts

Use short prompts only when necessary:

- `E Salvage`;
- `E Enter`;
- `Hold E Cut`.

No tutorial modal every 30 seconds.

---

# 27. Audio

Audio is crucial because graphics are stylized.

Prefer generated / procedural WebAudio so the project remains asset-light.

## Layers

- deep filtered noise / ocean bed;
- current rumble;
- subtle hull / equipment sounds;
- sonar ping;
- breathing;
- creature calls;
- distant impacts;
- sparse music / drones during transitions.

### Depth audio

As depth increases:

- reduce high frequencies;
- increase low-frequency pressure rumble;
- alter reverb / delay character;
- make distant creature calls more important than music.

### Creature sound design

Avoid making everything roar.

Use:

- clicks;
- sub-bass pulses;
- scraping;
- resonant metallic harmonics;
- water displacement;
- rapid ticking;
- chorus-like calls;
- low filtered noise bands.

Large creatures should often be heard well before they are visible.

### Implementation

Use native `AudioContext` unless a library becomes clearly useful.

Build helper functions for:

- noise buffer;
- filtered noise bursts;
- oscillator sweeps;
- low-frequency pulses;
- stereo pan based on world x;
- gain based on distance;
- reusable ambient loops.

Respect browser autoplay restrictions: initialize audio after first input.

---

# 28. Technology stack

Use:

- HTML5;
- TypeScript;
- Vite;
- Three.js;
- CSS for UI;
- native WebAudio;
- Vitest for small deterministic logic tests if useful.

Prefer `WebGLRenderer` for project stability.

Do **not** add React unless the UI becomes complex enough to justify it. It probably will not.

Do **not** add a general-purpose ECS framework.

Do **not** add a heavy physics engine unless custom collision demonstrably becomes worse.

The core game should remain easy for an AI coding agent to inspect and hack.

---

# 29. Suggested repository layout

Keep it boring and obvious.

```text
/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  README.md
  src/
    main.ts
    game/
      Game.ts
      GameState.ts
      constants.ts
      save.ts
    render/
      Renderer.ts
      CameraRig.ts
      materials.ts
      lighting.ts
      particles.ts
      postfx.ts
    world/
      World.ts
      chunks.ts
      terrain.ts
      worldData.ts
      gates.ts
      triggers.ts
    player/
      Player.ts
      PlayerController.ts
      equipment.ts
      inventory.ts
    creatures/
      Creature.ts
      CreatureDef.ts
      creatureFactory.ts
      steering.ts
      senses.ts
      spineRenderer.ts
      behaviors/
    systems/
      CollisionSystem.ts
      ResourceSystem.ts
      CraftingSystem.ts
      SonarSystem.ts
      AudioSystem.ts
      TriggerSystem.ts
    content/
      recipes.ts
      items.ts
      resources.ts
      dialogue.ts
      landmarks.ts
      secret/
        hiddenWorld.ts
        hiddenCreatures.ts
        hiddenEncounters.ts
        hiddenLore.ts
    ui/
      hud.ts
      menu.ts
      map.ts
      styles.css
    util/
      math.ts
      rng.ts
      spatialHash.ts
      debug.ts
  design_private/
```

If fewer files are clearer, combine them. Avoid creating empty architectural layers just to match this tree.

---

# 30. Main loop

Use a fixed or semi-fixed simulation timestep for reliable creature behavior.

Pseudo-code:

```ts
const FIXED_DT = 1 / 60;
let accumulator = 0;

function frame(now: number) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  accumulator += dt;

  while (accumulator >= FIXED_DT) {
    game.update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  game.render(accumulator / FIXED_DT);
  requestAnimationFrame(frame);
}
```

Or use `renderer.setAnimationLoop` if preferred.

Avoid tying movement to frame rate.

---

# 31. Collision

Use simple 2D primitives:

- circles for most creatures;
- capsules / chain circles for long creatures;
- AABBs or convex-ish polygons for props;
- terrain represented by segments / polygons.

Implement broad phase with a spatial hash only if needed.

Player-vs-terrain collision can use circle-vs-segment resolution.

For huge creatures, use multiple broad hit circles rather than perfect mesh collision.

Visual geometry and collision do not need to match exactly. Readability matters more.

---

# 32. Resource / progression validation

Add debug utilities that make the game less likely to become impossible during rapid iteration.

At minimum:

## `validateWorld()`

Checks:

- every chunk has valid exits;
- critical chunks are connected;
- required resource nodes exist;
- story triggers reference valid IDs;
- no recipe references missing item IDs;
- all creature IDs resolve.

## `simulateCriticalPath()`

A simplified state-space progression check:

```text
start capabilities
-> collect guaranteed materials in reachable zones
-> craft available upgrades
-> recompute reachable gates
-> repeat
```

Assert that the final objective becomes reachable.

This does not need to simulate player movement. It exists to catch recipe / gate deadlocks.

---

# 33. Debug mode

Create a hidden developer panel toggled by something like backtick + `F2` or query parameter `?debug=1`.

Features:

- noclip;
- teleport to chunk;
- set depth equipment tier;
- give resources;
- invulnerability;
- show collision shapes;
- show creature state / senses;
- trigger encounter by internal ID;
- reload current chunk;
- reset save;
- accelerated movement;
- display FPS / active entities.

**Do not include creature names or secret descriptions in the normal UI.** Internal IDs are okay in debug mode.

---

# 34. Performance targets

Target smooth 60 FPS on an ordinary recent desktop browser at 1080p.

Avoid premature optimization, but follow these rules:

- pool high-volume particles;
- deactivate AI far from player;
- cap ambient creature counts;
- reuse geometries and materials;
- use instancing for repeated tiny particles / schools where useful;
- avoid allocating vectors every frame in hot loops;
- avoid hundreds of DOM nodes;
- keep UI in a small number of DOM elements;
- large procedural creatures should use moderate segment counts, not thousands of vertices.

Performance is less important than finishing the game, but stutter will destroy large-creature reveals.

---

# 35. Visual effects toolbox

Build a small reusable effects library early.

Useful effects:

- bubble emitter;
- drifting marine snow;
- silt cloud;
- blood / organic particulate cloud if used;
- sonar ring;
- sonar outline flash;
- electrical arc;
- flashlight cone;
- bioluminescent motes;
- pressure vignette;
- damage vignette;
- chromatic split used sparingly;
- screen-space grain;
- low-frequency camera shake;
- distant silhouette layer;
- foreground occluder pass.

These effects let simple geometry feel expensive.

---

# 36. Encounter scripting

Create a lightweight trigger system.

```ts
interface EncounterTrigger {
  id: string;
  once: boolean;
  condition: TriggerCondition;
  actions: TriggerAction[];
}
```

Conditions:

- enter region;
- reach depth;
- possess upgrade;
- scan object;
- collect key item;
- creature state;
- elapsed time in region;
- return through region later.

Actions:

- spawn / despawn entity;
- play audio cue;
- alter ambient parameters;
- move background creature;
- lock / unlock path;
- show radio message;
- camera modifier;
- start timed event;
- set story flag.

Keep it data driven enough that set pieces are easy to tune.

---

# 37. Worldbuilding through repeated motifs

In the private lore pass, create **3–5 recurring motifs** that appear in different contexts.

Examples of motif *types*, not content to copy:

- a geometric mark found on both machinery and biological surfaces;
- a repeated acoustic rhythm;
- missing sections of wrecks with the same shape;
- a material that appears synthetic early and biological later;
- old navigation warnings that become newly interpretable at depth.

The final reveal should connect at least two motifs without explaining all of them.

This gives the world coherence cheaply.

---

# 38. Environmental storytelling budget

Do not write hundreds of logs.

Aim roughly for:

- 8–12 short contract / radio messages;
- 10–16 optional text fragments;
- 6–10 environmental “story props” that need no text;
- 3–5 major landmarks with clear history visible in their shape;
- 1–2 deep discoveries that contradict the official timeline.

Every written fragment must either:

- foreshadow gameplay;
- explain a human decision;
- recontextualize a place;
- hint at hidden lore;
- provide emotional texture.

Delete pure filler diary entries.

---

# 39. Difficulty curve

The game should be tense but completable blind.

### Early

- predators telegraph clearly;
- oxygen forgiving;
- death unlikely;
- resources abundant.

### Mid

- player must learn one creature-specific avoidance rule;
- oxygen becomes a route-planning constraint;
- environmental damage matters;
- encounters can force retreat.

### Deep

- equipment allows long dives, so tension comes from ecology and navigation rather than a tiny oxygen bar;
- giant organisms can dominate routes temporarily;
- player must combine sonar, light, decoy, and movement knowledge;
- pressure keeps the player from skipping the progression chain.

### Final

Do not simply maximize numerical damage.

Make the challenge come from altered rules / context.

---

# 40. Resource scarcity tuning

Avoid grind with explicit rules.

For each required permanent upgrade:

- guarantee at least **130–170%** of its required critical materials in the first area where the upgrade becomes relevant;
- distribute those materials across at least 2 locations;
- never require a rare random drop for the critical path;
- optional upgrades may require exploration or risk.

If playtesting shows the player repeating the same resource route more than twice, reduce cost or add a richer node.

---

# 41. Exploration rewards

Optional exploration should yield one of:

- permanent minor upgrade;
- extra resource cache;
- shortcut;
- strange organism interaction;
- environmental lore;
- cosmetic equipment glow / suit marking;
- alternate ending information;
- safer route through later area.

Avoid collectible-count chores like “0/50 pearls.”

A few individually memorable discoveries are better.

---

# 42. Save schema

Version it from the start.

Example:

```ts
interface SaveGameV1 {
  version: 1;
  playTimeSec: number;
  player: {
    health: number;
    oxygenUpgrade: number;
    equipmentIds: string[];
    inventory: Record<string, number>;
  };
  world: {
    discoveredChunks: string[];
    openedShortcuts: string[];
    collectedUniqueIds: string[];
    storyFlags: string[];
    maxDepth: number;
  };
  settings: {
    masterVolume: number;
  };
}
```

Keep save migration trivial. This is a short project.

---

# 43. Accessibility / clarity

Even atmospheric games need readable rules.

Include:

- volume sliders;
- screen shake toggle;
- reduced flashing toggle;
- subtitles / text for radio messages;
- high-contrast sonar outline option if easy;
- remappable controls optional, not required for MVP.

Do not rely on red/green alone for critical state.

---

# 44. Implementation phases

## Phase 1 — skeleton

Deliver a playable greybox with:

- Vite + Three.js project;
- orthographic camera;
- player swimming;
- collision with terrain;
- oxygen;
- depth meter;
- surface base;
- one resource;
- one craftable oxygen upgrade;
- local save;
- debug teleport.

The player should already be able to dive, gather, surface, craft, and go farther.

## Phase 2 — visual language

Add:

- water gradient;
- particles;
- flashlight;
- parallax terrain;
- simple procedural creature renderer;
- sound system;
- sonar.

Make one screen look genuinely atmospheric before producing the whole world.

## Phase 3 — progression backbone

Implement:

- all material families;
- permanent upgrades;
- pressure gates;
- current / environmental gate;
- full macro world graph in greybox;
- critical path validator.

At this point the game should be completable as boxes and circles.

## Phase 4 — hidden creative pass

Generate the private world / lore / creature design files as specified above.

Do not expose them to the user.

## Phase 5 — creature framework

Implement:

- steering;
- senses;
- generic creature states;
- spine renderer;
- schools;
- predator primitives;
- cross-species events.

Then implement the selected secret roster.

## Phase 6 — authored encounters

Add the five+ major spectacle beats and environmental story sequence.

Do not rely on random spawning for the most important moments.

## Phase 7 — full art / audio pass

Replace obvious debug geometry in all critical-path areas.

Tune depth palettes, soundscapes, particles, lighting, and landmarks.

## Phase 8 — balance pass

Run full playthroughs with debug instrumentation.

Record:

- time to first upgrade;
- time to each depth band;
- deaths;
- resource shortages;
- time spent lost;
- repeated travel;
- final completion time.

Tune toward 90–120 min blind.

## Phase 9 — spoiler-safe handoff

When finished, tell the user only:

- how to install/run;
- controls;
- whether save works;
- target playtime;
- any technical limitations.

Do **not** list creatures, zones, lore revelations, final mechanics, or ending branches.

---

# 45. MVP acceptance criteria

The game is not done because it renders an ocean.

MVP is complete only if all are true:

- new game to ending is playable without console commands;
- the world has at least four meaningful depth transitions after the starting coast;
- crafting gates access to depth / capabilities;
- at least 15 distinct creature types are implemented;
- at least 4 creature behaviors are materially different from direct pursuit;
- at least 2 creatures are beneficial / friendly;
- at least 3 large-scale creatures or creature events exist;
- at least 5 authored “surprise” beats exist;
- the MacGuffin can be reached and retrieved;
- retrieval changes the final sequence;
- death and save/load work;
- a blind-ish playthrough can finish in under 2.5 hours without grind;
- performance remains smooth in the largest encounter;
- the user has not been spoiled by development chatter.

---

# 46. Quality bar for the creatures

Before declaring the creature roster done, ask of each major species:

> If I replaced this with a shark of the same size, would the gameplay and scene be mostly unchanged?

If yes, the design is too generic.

Ask of each colossal organism:

> Is the main idea just “it is very big”?

If yes, redesign it.

Ask of each friendly species:

> Is it mechanically useful or emotionally memorable without speaking English or becoming a pet mascot?

If no, redesign it.

Ask of every major encounter:

> Does the player see evidence before explanation?

Prefer yes.

---

# 47. Secret “creature awesomeness” requirements

The user specifically wants creatures to be outrageous and memorable. Treat this as a first-class requirement rather than polish.

Privately ensure the final roster includes designs satisfying **at least eight** of these principles:

- biomechanical appropriation of human infrastructure;
- colonial organism that reads as one animal from a distance;
- scale ambiguity;
- impossible-seeming locomotion that becomes ecologically intelligible;
- predator strategy based on manipulating another species;
- creature that uses light in a way unrelated to luring prey;
- organism mistaken for geology;
- organism whose dangerous phase is not its visually scary phase;
- protective / nurturing behavior toward something unexpected;
- organism that builds or rearranges the environment;
- gigantic filter-feeding / grazing behavior rather than predation;
- distributed body with no obvious head;
- body plan based on pressure / buoyancy rather than skeleton-and-muscle assumptions;
- symbiotic use of industrial waste;
- migration event;
- metamorphosis linked to depth;
- acoustic territory marking;
- creature visible only through secondary effects for most of the game.

Do not mechanically tick all boxes. The point is conceptual range.

---

# 48. Moment-to-moment “juice”

Small feedback makes vibecoded games feel finished.

Add:

- subtle bubbles from acceleration;
- silt puff when near seabed;
- resource fragments pull slightly toward player at close range;
- tool recoil / tether snap;
- sonar echo particles;
- suit light sways with acceleration;
- brief UI tick when depth record increases;
- faint vibration / screen impulse for distant giant motion;
- predators visibly commit to attack before contact;
- impact particles follow local current;
- camera lean in travel direction;
- ambient schools part around the player.

Do not use excessive floating damage numbers.

---

# 49. Map size vs content density

Do not confuse a huge coordinate range with a huge game.

A two-hour game needs **dense traversal**.

Rule of thumb:

- normal travel between meaningful points: 20–60 sec;
- long dramatic transit: 1–2 min, used sparingly;
- return trips become shorter through upgrades / shortcuts;
- no three-minute empty swim corridors.

If the world feels small, create scale with background layers and off-route vistas rather than making the player cross empty space.

---

# 50. Player curiosity loop

Every zone should create three questions:

1. **What is that?** — visual / creature / structure mystery.
2. **Can I reach that?** — navigation / equipment gate.
3. **What do I need to go deeper?** — progression.

At least one answer should create a new question.

This is the fundamental loop more than combat.

---

# 51. Foreshadowing rules

For every major late-game reveal, place 2–4 earlier traces.

Good traces:

- scars on wrecks;
- unusually aligned debris;
- a sound at a different depth;
- a smaller related organism;
- warning signage that seems mundane at first;
- a repeated material;
- resource distribution anomaly;
- behavior change in local fauna.

Do not foreshadow by naming the reveal in a log.

---

# 52. How to make enormous organisms work in 2D

Use the screen as a limitation intentionally.

### Technique A — partial anatomy

Show a single limb / plate / flank spanning the viewport. Let the player infer the whole.

### Technique B — parallax crossing

Place creature behind playable layer moving slower than expected, creating apparent immense distance / size.

### Technique C — foreground pass

Have a structure cross between camera and player. Temporary occlusion makes it feel physically close and huge.

### Technique D — environment reaction

Move particles, schools, hanging cables, sediment, and loose debris before the organism enters view.

### Technique E — sonar scale

Return echoes at distances much larger than the visible screen.

### Technique F — speed mismatch

A huge organism can move slowly in body-space but cover enormous world distance.

### Technique G — no center framing

Do not obligingly center every leviathan like a boss intro. Let it cross, disappear, or only partially notice the player.

---

# 53. The first 10 minutes — concrete tutorial flow

This part can be fixed because it should not contain major spoilers.

### Minute 0–2

- title;
- short contract text;
- player on surface platform;
- movement keys shown unobtrusively;
- jump / descend into shallow water;
- immediate small ambient life.

### Minute 2–5

- find first salvage nodes;
- interact to collect;
- oxygen bar becomes relevant but forgiving;
- a harmless animal reacts to player;
- return path remains obvious through surface light / base beacon.

### Minute 5–8

- surface / bank materials;
- workbench highlights one affordable oxygen or propulsion upgrade;
- craft it with one click;
- objective updates toward a nearby submerged structure / marked signal.

### Minute 8–10

- player returns and immediately feels increased range;
- encounters first environmental clue that the deeper setting will not be mundane;
- no explanatory lore dump.

The player should understand the entire core loop by minute 10.

---

# 54. Base crafting UI

Keep it tactile and fast.

Recipe card shows:

- icon / silhouette;
- short name;
- one-sentence mechanical effect;
- ingredient counts;
- craft button.

Example effect text style:

- `Tank Mk II — +65 s oxygen capacity.`
- `Pressure Weave — safe operating depth +900 m.`
- `Impulse Fins — stronger acceleration; unlocks boost.`
- `Wideband Sonar — echoes large moving bodies through terrain gaps.`

No fake lore paragraphs inside recipe cards.

---

# 55. Loot / harvesting philosophy

Do not reward murdering every creature.

Most progression resources should come from:

- salvage;
- mineral deposits;
- shed biological material;
- environmental harvesting;
- specific small prey if appropriate;
- voluntary creature interactions.

If killing neutral fauna is profitable, create an ecological or tactical cost rather than morality popups.

One interesting possibility is that over-harvesting a local species changes predator behavior. Only implement if simple.

---

# 56. Optional scanner / codex

A full Pokémon-style codex is not required.

If implemented, scanning should provide **fragmentary observations**, not omniscient facts.

Example structure:

```ts
interface ScanEntry {
  observedName: string;
  observation: string;
  uncertainNote?: string;
}
```

Entries might say what the suit can infer from motion, temperature, material, or behavior.

Avoid definitive statements about hidden cosmology.

The scanner can assign practical hints after the player has already encountered a behavior once.

---

# 57. Narrative tone

Keep text restrained, competent, slightly bureaucratic, and increasingly uneasy.

Avoid:

- quippy Marvel dialogue;
- protagonist monologues every time something weird happens;
- “well THAT just happened” writing;
- constant swearing to signal horror;
- explicit Lovecraft pastiche;
- florid descriptions of madness.

Let the player provide the reaction.

Corporate / research language can remain dry even when describing disturbing facts. That contrast is useful.

---

# 58. Music

Music should be sparse.

Prefer:

- low drones near base;
- subtle tonal beds during normal exploration;
- silence / ambient-only periods before major encounters;
- brief harmonic motif when reaching a new depth band;
- final theme that incorporates an earlier sonar / creature interval if feasible.

Do not loop an obvious 90-second track for two hours.

Procedural oscillator / granular beds are sufficient.

---

# 59. Surface and depth contrast

The surface should feel almost cozy by comparison:

- visible sky gradient;
- wave line;
- warm small work lights;
- familiar mechanical sounds;
- relatively clear water;
- simple ambient fauna.

The player needs a baseline so the abyss feels alien.

Returning to the surface after a deep dive should create relief.

---

# 60. World-state reactions

After major milestones, subtly alter earlier areas so return trips are not identical.

Examples of categories:

- new migration;
- fewer small animals;
- changed industrial lights;
- debris shifted;
- friendly organism appears near base;
- radio receives odd interference;
- deep sound audible in shallows.

Keep these cheap: a few flags and spawn-table changes.

---

# 61. Use of randomness

Use deterministic seeded randomness for:

- school formation;
- particle placement;
- ambient resource scatter;
- minor wreck decoration;
- creature idle variation.

Do not randomize:

- critical gates;
- critical resources;
- major creature reveals;
- lore sequence;
- final path viability.

A blind first playthrough matters more than replayability.

---

# 62. Recommended internal data model for upgrades

```ts
type Capability =
  | 'sonar'
  | 'cutter'
  | 'boost'
  | 'decoy'
  | 'insulated'
  | 'spectralLight'
  | 'deepPressure';

interface EquipmentDef {
  id: string;
  name: string;
  description: string;
  cost: Record<string, number>;
  oxygenBonus?: number;
  maxDepthBonus?: number;
  cargoBonus?: number;
  speedBonus?: number;
  capabilities?: Capability[];
}
```

Gates should query capabilities / depth rating rather than hardcoded recipe IDs when possible.

---

# 63. Creature sensory event bus

Implement a small event bus for environmental perception.

```ts
type WorldSignal =
  | { type: 'noise'; pos: Vec2; strength: number; tag: string }
  | { type: 'light'; pos: Vec2; strength: number; tag: string }
  | { type: 'sonar'; pos: Vec2; strength: number }
  | { type: 'injury'; pos: Vec2; strength: number };
```

Creatures can evaluate only nearby recent signals.

This supports surprising behavior without bespoke references to the player everywhere.

---

# 64. Current system

Currents add movement variety cheaply.

Represent them as fields attached to regions:

```ts
interface CurrentField {
  bounds: Rect;
  velocityAt(pos: Vec2, time: number): Vec2;
}
```

Use for:

- horizontal drift;
- vertical vents;
- pulsing currents;
- slow circular eddies.

Particles should follow the same field, visually teaching the player.

One mid-game mobility upgrade should noticeably change how the player handles current.

---

# 65. Interior spaces

Include a few wreck / facility interiors but do not turn the game into a tile-based platformer.

Interior benefits:

- constrained flashlight scenes;
- strong silhouette framing through windows;
- machinery puzzles;
- contrast with open water;
- environmental storytelling.

Keep controls identical. The player is still swimming.

Use foreground hull shapes and cutaway rooms.

Avoid doors everywhere. Use damaged gaps, hatches, flooded shafts.

---

# 66. Simple puzzle design

Maximum 3–5 environmental puzzle moments.

Good underwater puzzles:

- reroute power by connecting two nodes;
- cut a restraint to move a buoyant object;
- use current to carry an object;
- use sonar to reveal a path / mechanism;
- lure a creature to interact with the environment;
- change light / noise state to pass an organism.

No abstract colored-symbol Sudoku panels.

---

# 67. Set-piece implementation philosophy

It is acceptable for major encounters to be partially scripted.

The player will notice bad fake spontaneity less than they will notice a dull procedural encounter.

Use scripts to guarantee:

- timing;
- entrance angle;
- camera behavior;
- environmental reactions;
- escape path availability.

But preserve player control unless a sub-3-second cinematic framing beat is absolutely necessary.

No long cutscenes.

---

# 68. Progress reporting to the human user

The coding agent must preserve surprise.

When updating progress, report:

- systems completed;
- performance;
- bugs fixed;
- approximate content completeness;
- whether full playthrough works.

Do not report:

- names / descriptions of deep creatures;
- specific late-zone visuals;
- lore truth;
- MacGuffin truth;
- final encounter mechanics;
- ending variants.

If a screenshot is needed, use early-game coast or generic debug areas unless the user explicitly requests spoilers.

---

# 69. README for the finished project

The public README should be spoiler-safe.

Include:

- install:

```bash
npm install
npm run dev
```

- production build:

```bash
npm run build
npm run preview
```

- controls;
- browser requirements;
- expected playtime;
- save location (`localStorage`);
- debug mode in a clearly separated developer section.

Do not include a creature list or story synopsis beyond the starting premise.

---

# 70. Testing checklist

Before handing the game to the user, verify manually:

## Boot

- fresh browser profile starts game;
- audio starts after input;
- resize works;
- no console exceptions.

## Core loop

- can collect first resource;
- can surface;
- can craft first upgrade;
- upgrade visibly changes capability;
- oxygen refills;
- death respawns properly.

## Progression

- each depth gate is understandable;
- all required materials exist;
- final zone reachable from fresh save;
- no sequence break creates softlock;
- shortcut flags persist after reload.

## Creatures

- predators do not aggro through impossible terrain unless intended;
- large creatures do not teleport visibly;
- friendly creatures do not become permanently stuck;
- offscreen AI is throttled;
- colossal encounter remains above performance target.

## Save

- reload after each major tier;
- reload at base;
- reload after death;
- old / malformed save fails gracefully by resetting or backing up.

## Ending

- MacGuffin trigger cannot fire twice;
- final sequence works after save reload;
- credits / restart works.

---

# 71. Balance telemetry for development only

Display in debug mode or log locally:

- play time;
- current zone;
- max depth;
- deaths;
- crafted upgrades;
- resources collected/spent;
- time since last progression unlock;
- oxygen remaining on surfacing;
- encounter trigger timestamps.

This makes a 2-hour target tunable without a backend analytics system.

---

# 72. Scope cuts if development balloons

Cut in this order:

1. gamepad support;
2. advanced settings UI;
3. optional codex;
4. minor cosmetic upgrades;
5. one optional side cave per zone;
6. complex creature-vs-creature combat;
7. second ending variant;
8. advanced post-processing.

Do **not** cut first:

- major creature roster quality;
- depth progression;
- sonar;
- atmosphere;
- five spectacle moments;
- final reveal / end sequence;
- friendly fauna;
- save system.

Those are the identity of the game.

---

# 73. Things explicitly NOT to build

Do not add any of the following unless the user later asks:

- base construction;
- farming;
- hunger / thirst;
- multiplayer;
- procedural infinite world;
- randomized roguelike runs;
- dialogue trees with dozens of NPCs;
- quest board;
- skill tree;
- level / XP system;
- dozens of weapons;
- armor loot rarity;
- crafting stations beyond the tiny surface hub;
- monetization;
- achievements as a development priority;
- mobile controls;
- live service anything.

---

# 74. Creative north star

The game should create a progression of reactions roughly like:

1. “This is a neat little diving game.”
2. “I wonder what is down there.”
3. “Oh, that creature actually has a behavior I can learn.”
4. “That is much bigger than I expected.”
5. “Why is that structure here?”
6. “I do not think I understand what counts as an animal anymore.”
7. “I probably should not be here.”
8. “I absolutely need to see what is at the bottom.”
9. “What the fuck.”
10. quiet return / aftermath.

Do not chase constant horror. Contrast makes the extreme moments stronger.

---

# 75. Final instruction to the coding agent

Treat this as a game to **finish**, not an engine to perfect.

Make strong creative decisions independently. Do not repeatedly ask the human user to choose among monster concepts, lore options, color palettes, or endings because that would destroy the surprise they explicitly requested.

When uncertain:

- choose the option that produces a more memorable player experience;
- prefer a bespoke 100-line solution to a framework dependency;
- prefer authored staging over generic procedural spawning;
- prefer ecological weirdness over generic horror imagery;
- prefer readable mechanics over realism;
- prefer one excellent creature over five filler creatures;
- prefer hidden foreshadowing over exposition;
- prefer finishing the 2-hour arc over adding systems.

The player wants to enter the game without knowing what is waiting below.

**Protect that. Then make the ocean progressively more impossible.**

