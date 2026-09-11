/**
 * problem — developers need to break the normal loop (noclip, teleport,
 *   give resources, reset save) without touching product code (request §33);
 *   solution — a hidden panel toggled by backtick/F2 or `?debug=1` that
 *   drives those actions through a small host interface and shows a 4 Hz
 *   state readout.
 *
 * archetype: controller
 * trigger: backtick, `F2`, or `?debug=1` in the query string.
 * owns: the panel DOM and the 4 Hz state readout; the readout shows only
 *   internal state (position, O2, health, depth) and internal IDs.
 * coordinates: the `DebugPanelHost` (the game) for player state and the
 *   developer actions (noclip, teleport, give resources, reset save).
 * invariant: the panel is built only once and never shown until toggled.
 * fails when: none — it reads live host state and never throws on a
 *   missing chunk (the teleport is a no-op for an unknown ID).
 */
import type { Vec2 } from './math';
import type { TelemetrySnapshot } from '../sim/telemetry';

export interface DebugPanelHost {
  player: { position: Vec2; o2: number; o2Max: number; health: number; depth: number };
  chunks: readonly { id: string }[];
  setNoclip(noclip: boolean): void;
  teleportTo(x: number, depth: number): void;
  teleportToChunk(id: string): void;
  giveResources(): void;
  resetSave(): void;
  /** WI-07a: section 71 balance telemetry snapshot. */
  telemetry(): TelemetrySnapshot;
}

export class DebugPanel {
  private readonly host: DebugPanelHost;
  private readonly panel: HTMLElement;
  private readonly readout: HTMLElement;
  private readonly panelOpen = new URLSearchParams(window.location.search).has('debug');
  private readonly panelToggle = (e: KeyboardEvent): void => {
    // Toggled by backtick, F2, or the ?debug=1 query param (request §33).
    const isDebugUrl = this.panelOpen;
    if (isDebugUrl || e.key === '`' || e.code === 'F2') {
      e.preventDefault();
      this.toggle();
    }
  };
  private lastReadout = 0;

  constructor(host: DebugPanelHost) {
    this.host = host;
    this.panel = document.createElement('div');
    this.panel.className = 'debug-panel';
    this.panel.style.display = 'none';
    document.body.appendChild(this.panel);
    this.readout = document.createElement('div');
    this.readout.className = 'debug-readout';
    this.readout.style.display = 'none';
    document.body.appendChild(this.readout);
    this.build();
    window.addEventListener('keydown', this.panelToggle);
    if (this.panelOpen) this.toggle();
  }

  private build(): void {
    const x = this.numberInput('Teleport X');
    const y = this.numberInput('Teleport depth');
    const go = this.button('Teleport', () => {
      this.host.teleportTo(Number(x.value), Number(y.value));
    });
    const chunkSelect = document.createElement('select');
    chunkSelect.className = 'debug-chunk-select';
    for (const chunk of this.host.chunks) {
      const option = document.createElement('option');
      option.value = chunk.id;
      option.textContent = chunk.id;
      chunkSelect.appendChild(option);
    }
    const teleportChunk = this.button('Teleport to chunk', () => {
      this.host.teleportToChunk(chunkSelect.value);
    });
    const noclip = document.createElement('input');
    noclip.type = 'checkbox';
    noclip.className = 'debug-noclip';
    noclip.addEventListener('change', () => this.host.setNoclip(noclip.checked));
    const giveResources = this.button('Give resources', () => this.host.giveResources());
    const resetSave = this.button('Reset save', () => this.host.resetSave());

    this.panel.replaceChildren(x, y, go, chunkSelect, teleportChunk, noclip, giveResources, resetSave);
  }

  private numberInput(label: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = `debug-${label.replace(/\s+/g, '-').toLowerCase()}`;
    input.placeholder = label;
    return input;
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `debug-${label.replace(/\s+/g, '-').toLowerCase()}`;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  private toggle(): void {
    this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none';
  }

  /** Show the 4 Hz state readout (always on); toggle the panel otherwise. */
  tick(now: number): void {
    const p = this.host.player.position;
    const m = this.host.player;
    if (now - this.lastReadout >= 250) {
      this.lastReadout = now;
      this.readout.style.display = 'block';
      // WI-07a: extended section 71 balance telemetry readout.
      const t = this.host.telemetry();
      // WI-07d: use real browser render FPS (not simulation step rate).
      // The telemetry collector's FPS field measures sim step rate (always 60);
      // this counter measures actual requestAnimationFrame frame rate.
      const renderFps = (window as unknown as Record<string, unknown>).__HADAL_RENDER_FPS__ as () => number;
      const fps = typeof renderFps === 'function' ? renderFps() : t.fps;
      const line1 = `x ${p.x.toFixed(1)}  depth ${m.depth.toFixed(1)}  o2 ${m.o2.toFixed(0)}/${m.o2Max.toFixed(0)}  hp ${m.health.toFixed(0)}`;
      const line2 = `time ${t.playTimeSec.toFixed(0)}s  zone ${t.zone}  maxd ${t.maxDepth.toFixed(0)}  deaths ${t.deaths}`;
      const line3 = `upgrades ${t.upgradesCrafted.length}  fps ${fps.toFixed(0)}`;
      this.readout.textContent = `${line1}\n${line2}\n${line3}`;
    }
  }
}
