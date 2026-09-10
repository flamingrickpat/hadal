/**
 * holds — short text fragments (request §22 channel 3, §38): brief logs,
 *   labels, and research notes found in the world, each with a keep-or-delete
 *   classification (request §38).
 *
 * archetype: information-holder
 * owns: `TEXT_FRAGMENTS` — an array of text fragments, each with an id, text,
 *   location (world position), and a keep-or-delete reason (foreshadow gameplay,
 *   explain a human decision, recontextualize a place, hint at hidden lore, or
 *   provide emotional texture).
 * not own: the radio/contract messages (dialogue.ts) or the no-text story props
 *   (worldData.ts).
 * invariant: each fragment is 40-100 words; each has a keep-or-delete reason.
 * fails when: none — authored data.
 */
import { vec2, type Vec2 } from '../util/math';

export interface TextFragment {
  id: string;
  text: string;
  position: Vec2;
  /** The keep-or-delete reason (request §38). */
  reason:
    | 'foreshadow-gameplay'
    | 'explain-human-decision'
    | 'recontextualize-place'
    | 'hint-at-hidden-lore'
    | 'emotional-texture';
}

/**
 * The 12 text fragments of the story payload (request §38 budget: 10-16).
 * Placed across the five depth bands; each passes the keep-or-delete test.
 */
export const TEXT_FRAGMENTS: readonly TextFragment[] = [
  {
    id: 'frag-shelf-1',
    text: 'Routine survey of shelf band reveals normal marine activity. No anomalies detected. Temperature within acceptable range. Current measurements standard for this depth band. — Coastline Salvage survey team, day 3 of operations',
    position: vec2(7000, -3800),
    reason: 'emotional-texture',
  },
  {
    id: 'frag-shelf-2',
    text: 'Warning: increased current strength east of shelf boundary. Recommend powered propulsion for transit. Previous divers report difficulty maintaining heading in this sector. Standard fin propulsion may be insufficient for extended exposure.',
    position: vec2(9000, -3500),
    reason: 'foreshadow-gameplay',
  },
  {
    id: 'frag-twilight-1',
    text: 'Material analysis: synthetic alloy found at 4,800 m depth. Origin unknown. Possibly from installation. Spectral analysis shows no corrosion consistent with prolonged submersion, which is unusual. Further testing recommended before disposal.',
    position: vec2(11500, -5500),
    reason: 'hint-at-hidden-lore',
  },
  {
    id: 'frag-twilight-2',
    text: 'Audio log (station operator): "Still receiving the low pulse. It doesn\'t match any known vent pattern. Checked the archives at HQ — nothing. Might be equipment malfunction, but I\'ve been monitoring it for weeks now. Getting stronger."',
    position: vec2(13500, -6000),
    reason: 'hint-at-hidden-lore',
  },
  {
    id: 'frag-twilight-3',
    text: 'Debris field survey: metal fragments oriented northward. Cause unexplained. Magnetic survey shows no local field. Orientation is consistent across multiple fragments. Could be impact, but no blast damage observed. Odd.',
    position: vec2(15500, -5800),
    reason: 'hint-at-hidden-lore',
  },
  {
    id: 'frag-abyss-1',
    text: 'Installation exterior inspection: no visible damage. Hatches appear sealed from inside. Contradicts initial report of hull collapse. Photos attached. Recommend revising cause-of-loss assessment before salvage team deployment.',
    position: vec2(17000, -8800),
    reason: 'recontextualize-place',
  },
  {
    id: 'frag-abyss-2',
    text: 'Personal item recovered from intact quarters: ceramic mug, handwritten label "J. Kowalski — coffee." No damage. Placed deliberately on shelf, not scattered. Suggests orderly abandonment, not panic. Contradicts "hull failure" theory.',
    position: vec2(18500, -9000),
    reason: 'emotional-texture',
  },
  {
    id: 'frag-abyss-3',
    text: 'Final transmission transcript: "Requesting extraction. All systems nominal. Thank you." — No departure record found. Crew manifests show all twelve listed as "on site." Discrepancy noted and flagged for legal review at HQ.',
    position: vec2(19000, -8700),
    reason: 'recontextualize-place',
  },
  {
    id: 'frag-hadal-1',
    text: 'Contract clause 12.4: "Salvage party assumes all liability. Employer not responsible for biological encounters, natural or otherwise. Diver certifies awareness of deep-zone risk factors." Signed by diver before descent.',
    position: vec2(20500, -9600),
    reason: 'emotional-texture',
  },
  {
    id: 'frag-hadal-2',
    text: 'Growth observation: tissue has penetrated interior of hull. Not external contamination. Something inside is growing. Metal shows no corrosion, but organic matter has infiltrated structural supports. Suggests prolonged exposure, not recent.',
    position: vec2(21200, -9550),
    reason: 'hint-at-hidden-lore',
  },
  {
    id: 'frag-hadal-3',
    text: 'Core chamber note: "It\'s not a mechanism. It\'s alive. And it\'s waiting." Written in margin of technical schematic. No further context. Could be metaphor, but given what we\'ve seen at this depth — probably not.',
    position: vec2(22000, -9580),
    reason: 'recontextualize-place',
  },
  {
    id: 'frag-hadal-4',
    text: 'The lights on the ascent are fading. Whatever they are, they\'re going quiet now. I hope I made the right choice. The water is darker here, colder. My suit\'s heating element is cycling on and off, struggling.',
    position: vec2(22500, -9600),
    reason: 'emotional-texture',
  },
];