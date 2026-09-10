import { describe, it, expect } from 'vitest';
import { TRIGGER_RADIO_LINES, BASE_RETURN_LINES } from '../content/dialogue';
import { MACRO_WORLD, GREYBOX_WORLD } from '../world/worldData';
import type { PropDef, TriggerDef } from '../world/chunks';
import type { EncounterTrigger } from '../world/triggers';

describe('story payload budget (request §22/§38)', () => {
  // Collect all triggers across the world.
  const allTriggers: EncounterTrigger[] = [];
  for (const chunk of MACRO_WORLD) {
    if (chunk.triggers) {
      allTriggers.push(...chunk.triggers);
    }
  }

  // Radio triggers are those with a showRadio action.
  const radioTriggers = allTriggers.filter((t) =>
    t.actions.some((a) => a.type === 'showRadio'),
  );

  // Collect all props across the world.
  const allProps: PropDef[] = [];
  for (const chunk of MACRO_WORLD) {
    if (chunk.props) {
      allProps.push(...chunk.props);
    }
  }
  const landmarks = allProps.filter((p) => p.kind === 'landmark' || p.kind === 'facility');
  // "Story props" are environmental evidence (debris, wreck) — not layout features
  // (pockets, interiors) that are gameplay elements per request §4.2.
  const storyProps = allProps.filter((p) => p.kind === 'debris' || p.kind === 'wreck');

  it('has 8-12 radio/contract messages (request §38)', () => {
    expect(radioTriggers.length).toBeGreaterThanOrEqual(8);
    expect(radioTriggers.length).toBeLessThanOrEqual(12);
  });

  it('has 6-10 no-text story props (request §38)', () => {
    expect(storyProps.length).toBeGreaterThanOrEqual(6);
    expect(storyProps.length).toBeLessThanOrEqual(10);
  });

  it('has 3-5 major landmarks with history (request §38)', () => {
    expect(landmarks.length).toBeGreaterThanOrEqual(3);
    expect(landmarks.length).toBeLessThanOrEqual(5);
  });

  it('every radio trigger textId resolves in the text table', () => {
    for (const t of radioTriggers) {
      for (const a of t.actions) {
        if (a.type === 'showRadio') {
          expect(TRIGGER_RADIO_LINES).toHaveProperty(a.textId);
        }
      }
    }
  });

  it('every radio line is short (max ~100 words, request §38)', () => {
    for (const [id, line] of Object.entries(TRIGGER_RADIO_LINES)) {
      const words = line.trim().split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(100);
    }
  });
});

describe('foreshadowing traces (request §51)', () => {
  // Each major late reveal (R1-R4) must have 2-4 earlier traces.
  // The traces are props, landmarks, and environmental elements.
  // R1 (the deep is a body): traces = the pulse sound, growth into metal,
  //   living-tissue material. These are represented by the props/landmarks.
  // R2 (station was nursery): traces = intact hull, personal items.
  // R3: traces = sonar echo, alignments,
  //   friendly organism deferring.
  // R4 (final choice is spatial): traces = contract wording, radio line,
  //   two exits.

  // Count props that serve as foreshadow traces. The reveal map (design_private)
  // assigns these: each trace is a prop/landmark with a specific id prefix.
  const allProps: PropDef[] = [];
  for (const chunk of MACRO_WORLD) {
    if (chunk.props) {
      allProps.push(...chunk.props);
    }
  }

  it('R1 has at least 2 traces (growth direction, pulse)', () => {
    // Growth direction trace: a prop showing growth into metal.
    // Pulse trace: a prop related to the fixed-point sound.
    const growthTrace = allProps.find((p) => p.id.startsWith('trace-growth-'));
    expect(growthTrace).not.toBeNull();
    expect(growthTrace!.id).toMatch(/R1/);

    const pulseTrace = allProps.find((p) => p.id.startsWith('trace-pulse-'));
    expect(pulseTrace).not.toBeNull();
    expect(pulseTrace!.id).toMatch(/R1/);
  });

  it('R2 has at least 2 traces (intact hull, personal items)', () => {
    const hullTrace = allProps.find((p) => p.id.startsWith('trace-hull-'));
    expect(hullTrace).not.toBeNull();
    expect(hullTrace!.id).toMatch(/R2/);

    const itemsTrace = allProps.find((p) => p.id.startsWith('trace-items-'));
    expect(itemsTrace).not.toBeNull();
    expect(itemsTrace!.id).toMatch(/R2/);
  });

  it('R3 has at least 2 traces (sonar echo, alignment)', () => {
    const sonarTrace = allProps.find((p) => p.id.startsWith('trace-sonar-'));
    expect(sonarTrace).not.toBeNull();
    expect(sonarTrace!.id).toMatch(/R3/);

    const alignTrace = allProps.find((p) => p.id.startsWith('trace-align-'));
    expect(alignTrace).not.toBeNull();
    expect(alignTrace!.id).toMatch(/R3/);
  });

  it('R4 has at least 2 traces (contract wording, exits)', () => {
    const contractTrace = allProps.find((p) => p.id.startsWith('trace-contract-'));
    expect(contractTrace).not.toBeNull();
    expect(contractTrace!.id).toMatch(/R4/);

    const exitTrace = allProps.find((p) => p.id.startsWith('trace-exit-'));
    expect(exitTrace).not.toBeNull();
    expect(exitTrace!.id).toMatch(/R4/);
  });
});