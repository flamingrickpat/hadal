/**
 * problem — the game needs asset-light, procedural ambient audio that changes
 *   with depth and can place event sounds in world space (request §27, §58,
 *   §14.3); solution — a native-WebAudio service-provider that owns one
 *   `AudioContext` (created only after the first user input, so the browser
 *   autoplay rules are respected, request §27/§70) and synthesizes layered
 *   ambient loops plus event-sound helpers from the pure `AudioProfile` / pan /
 *   gain mappings in `src/util/audio.ts`.
 *
 * archetype: service-provider; also: UI adapter for the master-volume slider
 * owns: the `AudioContext` and the whole ambient graph — the layered loops
 *   (ocean bed, current rumble, low-pressure sub-rumble, hull, breathing,
 *   sparse procedural drone bed), the depth-driven global high-cut and
 *   reverb/delay bus, the event helpers (filtered noise bursts, oscillator
 *   sweeps, low pulses, reusable ambient loops, sonar ping), and the master
 *   volume slider + gain (request §43).
 * not own: the player's depth (the `Simulation` owns it; the browser `Game`
 *   feeds it each frame); the visual band stops (`band.ts`); the sonar *ring*
 *   and world-signal bus (WI-06); creature-specific sound-design content
 *   (WI-10/11 build on these helpers).
 * fails when: a public event helper is called before `unlock()` — it no-ops
 *   (there is no `AudioContext` yet); `createAmbientLoop` is called before
 *   `unlock()` — it throws; the slider container is not an `HTMLElement` — the
 *   constructor throws.
 * invariant: the `AudioContext` is created/resumed only after the first user
 *   input (request §27/§70); the ambient layers are built once and only their
 *   node *parameters* are ramped per frame (no per-frame allocation,
 *   request §34); the music bed is sparse and evolving, never an obvious
 *   looped track (request §58).
 */
import { AUDIO_STOPS, audioProfileAtDepth, distanceGain, worldPan, type AudioProfile } from '../util/audio';
import { createRng } from '../util/rng';
import { clamp } from '../util/math';
import type { Player } from '../player/Player';

// Base mix levels (tuned by ear; the *relative* depth changes are what matter).
const OCEAN_BASE = 0.5;
const CURRENT_BASE = 0.4;
const SUB_BASE = 0.6;
const HULL_BASE = 0.18;
const BREATH_BASE = 0.35;
const DRONE_BASE = 0.4;
const CALL_BASE = 0.5;
const REVERB_WET = 0.7;
const CONV_WET = 0.8;
const DELAY_WET = 0.5;
const DELAY_MIN = 0.12;
const DELAY_MAX = 0.6;
const SMOOTH_TC = 0.4;
const BREATH_PERIOD = 4.2;
const CALL_PERIOD = 8;
const HULL_TICK_PERIOD = 3.5;

/** A debug/browser snapshot of the live audio state (request §27). */
export interface AudioSnapshot {
  unlocked: boolean;
  contextState: string;
  depth: number;
  masterVolume: number;
  highCutoff: number;
  lowRumble: number;
  reverb: number;
  drone: number;
  oceanBed: number;
}

export interface NoiseBurstOptions {
  when?: number;
  duration?: number;
  filterType?: BiquadFilterType;
  frequency?: number;
  q?: number;
  gain?: number;
  pan?: number;
}

export interface OscSweepOptions {
  when?: number;
  startFreq: number;
  endFreq: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  pan?: number;
}

export interface LowPulseOptions {
  when?: number;
  frequency: number;
  duration?: number;
  gain?: number;
  pan?: number;
}

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private unlocked = false;
  /** The user-facing master volume (request §43); the slider and save read it. */
  masterVolume = 1;

  private worldBus: GainNode | null = null;
  private worldLowpass: BiquadFilterNode | null = null;
  private reverbSend: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayWet: GainNode | null = null;
  private convWet: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private oceanBedGain: GainNode | null = null;
  private currentGain: GainNode | null = null;
  private subRumbleGain: GainNode | null = null;
  private hullGain: GainNode | null = null;
  private breathGain: GainNode | null = null;
  private droneGain: GainNode | null = null;

  private noiseCache: AudioBuffer | null = null;
  private readonly rng = createRng(0xa0d10);
  private nextBreath = 0;
  private nextCall = 0;
  private nextHullTick = 0;
  private lastBand = -1;
  private lastProfile: AudioProfile | null = null;
  private readonly slider: HTMLInputElement;

  constructor(container: HTMLElement = document.body) {
    this.slider = this.buildVolumeSlider(container);
  }

  /** Create/resume the `AudioContext` and start the ambient layers. Idempotent. */
  unlock(): void {
    if (this.unlocked) return;
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (Ctor === undefined) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.buildGraph(ctx);
    this.buildAmbientLayers(ctx);
    this.unlocked = true;
    this.lastProfile = audioProfileAtDepth(0);
    this.nextBreath = ctx.currentTime + 0.6;
    this.nextCall = ctx.currentTime + 3;
    this.nextHullTick = ctx.currentTime + 1;
    void ctx.resume();
  }

  /** Ramp the ambient graph to the player's depth band and schedule events. */
  update(player: Player): void {
    const ctx = this.ctx;
    if (!this.unlocked || ctx === null) return;
    const profile = audioProfileAtDepth(player.depth);
    this.lastProfile = profile;
    const now = ctx.currentTime;
    this.applyProfile(profile, now);
    this.scheduleEvents(profile, player, now);
  }

  /** Set the master volume (the slider calls this; request §43). */
  setMasterVolume(v: number): void {
    this.masterVolume = clamp(v, 0, 1);
    this.slider.value = String(this.masterVolume);
    if (this.unlocked && this.masterGain !== null && this.ctx !== null) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  /** A browser/debug snapshot of the current profile and context state. */
  snapshot(): AudioSnapshot {
    const ctx = this.ctx;
    const profile = this.lastProfile;
    if (ctx === null || profile === null) {
      return {
        unlocked: this.unlocked,
        contextState: ctx === null ? 'not-created' : ctx.state,
        depth: 0,
        masterVolume: this.masterVolume,
        highCutoff: 0,
        lowRumble: 0,
        reverb: 0,
        drone: 0,
        oceanBed: 0,
      };
    }
    return {
      unlocked: this.unlocked,
      contextState: ctx.state,
      depth: profile.depth,
      masterVolume: this.masterVolume,
      highCutoff: profile.highCutoff,
      lowRumble: profile.lowRumble,
      reverb: profile.reverb,
      drone: profile.drone,
      oceanBed: profile.oceanBed,
    };
  }

  // ---- request §27 helper functions ---------------------------------------

  /** The cached white-noise buffer used by the loops and bursts (request §27). */
  noiseBuffer(seconds = 2): AudioBuffer | null {
    const ctx = this.ctx;
    if (ctx === null) return null;
    if (this.noiseCache === null || this.noiseCache.duration < seconds) {
      const len = Math.floor(ctx.sampleRate * seconds);
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      const rng = createRng(0x5eaf0);
      for (let i = 0; i < len; i += 1) data[i] = rng() * 2 - 1;
      this.noiseCache = buffer;
    }
    return this.noiseCache;
  }

  /**
   * A reusable ambient loop (request §27): a looping source through a
   * band/low/high filter into a per-layer gain on the world bus. Must be
   * called after `unlock()`.
   */
  createAmbientLoop(source: AudioNode, filterType: BiquadFilterType, filterFreq: number, q: number): GainNode {
    const ctx = this.ctx;
    const bus = this.worldBus;
    if (ctx === null || bus === null) throw new Error('AudioSystem: call unlock() before createAmbientLoop()');
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    return gain;
  }

  /** A one-shot filtered noise burst (request §27). */
  playNoiseBurst(opts: NoiseBurstOptions): void {
    const ctx = this.ctx;
    if (ctx === null) return;
    const when = opts.when ?? ctx.currentTime;
    const duration = opts.duration ?? 0.4;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer()!;
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType ?? 'lowpass';
    filter.frequency.value = opts.frequency ?? 800;
    filter.Q.value = opts.q ?? 0.8;
    const env = this.routedEnv(ctx, opts.pan ?? 0);
    source.connect(filter);
    filter.connect(env);
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(opts.gain ?? 0.3, when + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.start(when);
    source.stop(when + duration + 0.05);
  }

  /** A one-shot oscillator sweep (request §27). */
  playOscSweep(opts: OscSweepOptions): void {
    const ctx = this.ctx;
    if (ctx === null) return;
    const when = opts.when ?? ctx.currentTime;
    const duration = opts.duration ?? 0.5;
    const osc = ctx.createOscillator();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.startFreq, when);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.endFreq), when + duration);
    const env = this.routedEnv(ctx, opts.pan ?? 0);
    osc.connect(env);
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(opts.gain ?? 0.3, when + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }

  /** A one-shot low-frequency pulse (request §27). */
  playLowPulse(opts: LowPulseOptions): void {
    const ctx = this.ctx;
    if (ctx === null) return;
    const when = opts.when ?? ctx.currentTime;
    const duration = opts.duration ?? 0.6;
    const osc = this.sineSource(ctx, opts.frequency);
    const env = this.routedEnv(ctx, opts.pan ?? 0);
    osc.connect(env);
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(opts.gain ?? 0.4, when + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.stop(when + duration + 0.05);
  }

  /**
   * A sonar ping (request §27): a high->low sweep plus a short noise splash,
   * at the player and through the reverb bus. Fires on the Q edge (request §6).
   */
  playSonarPing(): void {
    const ctx = this.ctx;
    if (ctx === null) return;
    const now = ctx.currentTime;
    const env = this.routedEnv(ctx, 0);
    const sweep = ctx.createOscillator();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(1400, now);
    sweep.frequency.exponentialRampToValueAtTime(320, now + 0.35);
    const sweepGain = ctx.createGain();
    sweepGain.gain.value = 0.2;
    sweep.connect(sweepGain);
    sweepGain.connect(env);
    const splash = ctx.createBufferSource();
    splash.buffer = this.noiseBuffer()!;
    const splashFilter = ctx.createBiquadFilter();
    splashFilter.type = 'bandpass';
    splashFilter.frequency.value = 1200;
    splashFilter.Q.value = 1.2;
    splash.connect(splashFilter);
    const splashGain = ctx.createGain();
    splashGain.gain.value = 0.15;
    splashFilter.connect(splashGain);
    splashGain.connect(env);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(1, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    sweep.start(now);
    sweep.stop(now + 0.5);
    splash.start(now);
    splash.stop(now + 0.3);
  }

  // ---- graph construction --------------------------------------------------

  private buildGraph(ctx: AudioContext): void {
    this.worldBus = ctx.createGain();
    this.worldBus.gain.value = 1;

    // Global high-cut: the whole ambience is muffled as depth increases.
    this.worldLowpass = ctx.createBiquadFilter();
    this.worldLowpass.type = 'lowpass';
    this.worldLowpass.frequency.value = audioProfileAtDepth(0).highCutoff;
    this.worldLowpass.Q.value = 0.7;
    this.worldBus.connect(this.worldLowpass);

    // Master gain (user volume) through a safety limiter to prevent clipping.
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.worldLowpass.connect(this.masterGain);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 24;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.005;
    limiter.release.value = 0.2;
    this.masterGain.connect(limiter);
    limiter.connect(ctx.destination);

    // Reverb/delay bus: a short echo + a large-space convolver, both fed by a
    // depth-scaled send; the mix/length/character shifts with depth.
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = audioProfileAtDepth(0).reverb * REVERB_WET;
    this.worldLowpass.connect(this.reverbSend);

    this.delayNode = ctx.createDelay(1.0);
    this.delayNode.delayTime.value = DELAY_MIN;
    this.delayWet = ctx.createGain();
    this.delayWet.gain.value = (1 - audioProfileAtDepth(0).reverb) * DELAY_WET;
    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.35;
    this.reverbSend.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    this.delayNode.connect(delayFeedback);
    delayFeedback.connect(this.delayNode);

    const convolver = ctx.createConvolver();
    convolver.buffer = this.makeImpulseResponse(ctx);
    this.convWet = ctx.createGain();
    this.convWet.gain.value = audioProfileAtDepth(0).reverb * CONV_WET;
    this.reverbSend.connect(convolver);
    convolver.connect(this.convWet);
    this.delayWet.connect(this.masterGain);
    this.convWet.connect(this.masterGain);
  }

  private buildAmbientLayers(ctx: AudioContext): void {
    // Ocean bed: looping lowpassed white noise (request §27).
    this.oceanBedGain = this.createAmbientLoop(this.loopingNoise(ctx), 'lowpass', 400, 0.8);

    // Current rumble: looping bandpassed noise with a slow swell.
    this.currentGain = this.createAmbientLoop(this.loopingNoise(ctx), 'bandpass', 180, 1.4);
    this.attachSwell(ctx, this.currentGain, 0.09, 0.28);

    // Low-pressure sub-rumble: a sub sine plus very-low noise, with a slow swell.
    this.subRumbleGain = this.createAmbientLoop(this.sineSource(ctx, 38), 'lowpass', 90, 0.7);
    const subNoise = this.loopingNoise(ctx);
    const subNoiseFilter = ctx.createBiquadFilter();
    subNoiseFilter.type = 'lowpass';
    subNoiseFilter.frequency.value = 60;
    subNoiseFilter.Q.value = 0.9;
    subNoise.connect(subNoiseFilter);
    subNoiseFilter.connect(this.subRumbleGain);
    this.attachSwell(ctx, this.subRumbleGain, 0.05, 0.35);

    // Subtle hull/equipment: a faint bandpassed noise; metallic ticks are scheduled.
    this.hullGain = this.createAmbientLoop(this.loopingNoise(ctx), 'bandpass', 2400, 1.6);

    // Breathing: a persistent gain the scheduled puffs route through.
    this.breathGain = ctx.createGain();
    this.breathGain.gain.value = 0;
    this.breathGain.connect(this.worldBus!);

    // Sparse procedural drone bed: three detuned low oscillators through a lowpass.
    this.droneGain = this.createAmbientLoop(this.droneBed(ctx), 'lowpass', 260, 0.9);
    this.attachSwell(ctx, this.droneGain, 0.03, 0.5);
  }

  private makeImpulseResponse(ctx: AudioContext, seconds = 2.6, decay = 2.8): AudioBuffer {
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buffer = ctx.createBuffer(2, len, rate);
    const rng = createRng(0x11ce);
    for (let ch = 0; ch < 2; ch += 1) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i += 1) {
        const envelope = Math.pow(1 - i / len, decay);
        data[i] = (rng() * 2 - 1) * envelope;
      }
    }
    return buffer;
  }

  private loopingNoise(ctx: AudioContext): AudioBufferSourceNode {
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer()!;
    source.loop = true;
    source.start();
    return source;
  }

  private sineSource(ctx: AudioContext, freq: number): OscillatorNode {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.start();
    return osc;
  }

  private droneBed(ctx: AudioContext): GainNode {
    const sum = ctx.createGain();
    sum.gain.value = 0.6;
    // A low, sparse triad (A-minor-ish); a few cents of detune keeps it from
    // reading as a clean chord or a fixed loop.
    for (const f of [55, 82.41, 110]) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (this.rng() - 0.5) * 10;
      const g = ctx.createGain();
      g.gain.value = 0.3;
      osc.connect(g);
      g.connect(sum);
      osc.start();
    }
    return sum;
  }

  private attachSwell(ctx: AudioContext, gain: GainNode, rate: number, depth: number): void {
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    const scale = ctx.createGain();
    scale.gain.value = depth;
    lfo.connect(scale);
    // Modulates the layer's gain param around the base value set by applyProfile.
    scale.connect(gain.gain);
    lfo.start();
  }

  // ---- per-frame profile + scheduled events --------------------------------

  private applyProfile(p: AudioProfile, t: number): void {
    const tc = SMOOTH_TC;
    this.oceanBedGain?.gain.setTargetAtTime(p.oceanBed * OCEAN_BASE, t, tc);
    this.currentGain?.gain.setTargetAtTime(p.currentRumble * CURRENT_BASE, t, tc);
    this.subRumbleGain?.gain.setTargetAtTime(p.lowRumble * SUB_BASE, t, tc);
    this.hullGain?.gain.setTargetAtTime(p.hull * HULL_BASE, t, tc);
    this.breathGain?.gain.setTargetAtTime(p.breathing * BREATH_BASE, t, tc);
    this.droneGain?.gain.setTargetAtTime(p.drone * DRONE_BASE, t, tc);
    this.worldLowpass?.frequency.setTargetAtTime(p.highCutoff, t, tc);
    // Reverb/delay character: more wet, longer, and more large-space with depth.
    this.reverbSend?.gain.setTargetAtTime(p.reverb * REVERB_WET, t, tc);
    this.delayNode?.delayTime.setTargetAtTime(DELAY_MIN + p.reverb * (DELAY_MAX - DELAY_MIN), t, tc);
    this.convWet?.gain.setTargetAtTime(p.reverb * CONV_WET, t, tc);
    this.delayWet?.gain.setTargetAtTime((1 - p.reverb) * DELAY_WET, t, tc);
  }

  private scheduleEvents(p: AudioProfile, player: Player, now: number): void {
    if (now >= this.nextBreath) {
      this.playBreathPuff(now);
      this.nextBreath = now + BREATH_PERIOD;
    }
    if (now >= this.nextHullTick) {
      this.playHullTick(now);
      this.nextHullTick = now + HULL_TICK_PERIOD * (0.7 + this.rng() * 0.6);
    }
    if (now >= this.nextCall) {
      this.playDistantCall(now, p, player);
      this.nextCall = now + CALL_PERIOD * (0.75 + this.rng() * 0.6);
    }
    // A brief harmonic motif when crossing into a new depth band (request §58).
    const band = this.bandIndex(player.depth);
    if (this.lastBand === -1) {
      this.lastBand = band;
    } else if (band !== this.lastBand) {
      this.playDepthMotif(now, band);
      this.lastBand = band;
    }
  }

  private bandIndex(depth: number): number {
    let idx = 0;
    for (let i = 0; i < AUDIO_STOPS.length; i += 1) {
      if (depth >= AUDIO_STOPS[i]!.depth) idx = i;
    }
    return idx;
  }

  private playBreathPuff(now: number): void {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer()!;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.8;
    const env = ctx.createGain();
    env.gain.value = 0;
    source.connect(filter);
    filter.connect(env);
    env.connect(this.breathGain!);
    const inhale = 1.3;
    const exhale = 1.6;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.9, now + inhale);
    env.gain.linearRampToValueAtTime(0, now + inhale + exhale);
    source.start(now);
    source.stop(now + inhale + exhale + 0.1);
  }

  private playHullTick(now: number): void {
    const ctx = this.ctx!;
    const base = 900 + this.rng() * 900;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = base;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = base;
    filter.Q.value = 6;
    const env = ctx.createGain();
    env.gain.value = 0;
    osc.connect(filter);
    filter.connect(env);
    env.connect(this.worldBus!);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  private playDistantCall(now: number, p: AudioProfile, player: Player): void {
    const ctx = this.ctx!;
    // A low groan (filtered noise) plus a sub-bass pulse, at a pseudo world-x so
    // it is panned and distance-attenuated by the pure helpers (request §27).
    const callX = player.position.x + (this.rng() * 2 - 1) * 2600;
    const pan = worldPan(callX, player.position.x);
    const level = distanceGain(Math.abs(callX - player.position.x)) * CALL_BASE * (0.3 + 0.7 * p.lowRumble);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    const env = ctx.createGain();
    env.gain.value = 0;
    panner.connect(env);
    env.connect(this.worldBus!);

    const groan = ctx.createBufferSource();
    groan.buffer = this.noiseBuffer()!;
    const groanFilter = ctx.createBiquadFilter();
    groanFilter.type = 'lowpass';
    groanFilter.frequency.value = 300 + this.rng() * 250;
    groanFilter.Q.value = 2;
    groan.connect(groanFilter);
    groanFilter.connect(panner);
    groan.start(now);

    const thump = this.sineSource(ctx, 32 + this.rng() * 10);
    thump.connect(panner);

    const duration = 2.2 + this.rng() * 1.6;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), now + 0.5);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    groan.stop(now + duration + 0.1);
    thump.stop(now + duration + 0.1);
  }

  private playDepthMotif(now: number, band: number): void {
    const ctx = this.ctx!;
    const root = 110 * Math.pow(2, band / 7);
    for (const f of [root, root * 1.5, root * 2]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const env = this.routedEnv(ctx, 0);
      osc.connect(env);
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.12, now + 0.3);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
      osc.start(now);
      osc.stop(now + 2.1);
    }
  }

  // ---- slider + node plumbing ---------------------------------------------

  private routedEnv(ctx: AudioContext, pan: number): GainNode {
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    const env = ctx.createGain();
    env.gain.value = 0;
    panner.connect(env);
    env.connect(this.worldBus!);
    return env;
  }

  private buildVolumeSlider(container: HTMLElement): HTMLInputElement {
    if (!(container instanceof HTMLElement)) {
      throw new Error('AudioSystem: slider container must be an HTMLElement');
    }
    const wrap = document.createElement('div');
    wrap.id = 'audio-volume';
    const label = document.createElement('span');
    label.textContent = 'VOL ';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = String(this.masterVolume);
    slider.className = 'audio-volume-slider';
    slider.setAttribute('aria-label', 'master volume');
    slider.addEventListener('input', () => this.setMasterVolume(Number(slider.value)));
    const style = document.createElement('style');
    style.textContent =
      '#audio-volume { position: fixed; bottom: 18px; left: 18px; font: 12px/1 ui-monospace, Consolas, monospace; color: #9fb8cc; user-select: none; }' +
      '.audio-volume-slider { width: 120px; vertical-align: middle; accent-color: #8fd3f0; }';
    container.append(style, wrap);
    wrap.append(label, slider);
    return slider;
  }
}
