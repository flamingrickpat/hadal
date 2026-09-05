/**
 * renders — the minimal oxygen/health/depth/tool readouts (request §26).
 *
 * archetype: controller
 * trigger: `Game.update` calls `update(player)` once per simulation
 *   step; `setPaused` is called on Esc (request §6).
 * owns: a few fixed DOM nodes in a corner (one row per readout —
 *   request §34 keeps the UI in a small number of DOM elements,
 *   updated in place, no per-frame node creation), plus the pause
 *   overlay. Oxygen and health rows fade to low opacity while their
 *   meter is full (request §26).
 * not own: the meter math (`Player`), the input (`PlayerController`),
 *   the map or menus (WI-15).
 * fails when: the container is not an HTMLElement — the constructor
 *   throws.
 */
import { HP_MAX } from '../game/constants';
import { clamp } from '../util/math';
import type { Player } from '../player/Player';

export class Hud {
  private readonly o2Row: HTMLElement;
  private readonly o2Fill: HTMLElement;
  private readonly o2Text: HTMLElement;
  private readonly hpRow: HTMLElement;
  private readonly hpFill: HTMLElement;
  private readonly hpText: HTMLElement;
  private readonly depthText: HTMLElement;
  private readonly toolText: HTMLElement;
  private readonly pauseOverlay: HTMLElement;

  constructor(container: HTMLElement) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('Hud: container must be an HTMLElement');
    }
    this.injectStyles();
    const root = document.createElement('div');
    root.id = 'hud-root';
    const o2 = this.buildRow('O2', '180s');
    this.o2Row = o2.row;
    this.o2Fill = o2.fill;
    this.o2Text = o2.text;
    const hp = this.buildRow('HP', '100');
    this.hpRow = hp.row;
    this.hpFill = hp.fill;
    this.hpText = hp.text;
    root.append(o2.row, hp.row);
    const depthRow = document.createElement('div');
    depthRow.className = 'hud-row';
    depthRow.append('DEPTH ');
    this.depthText = document.createElement('span');
    this.depthText.id = 'hud-depth-text';
    this.depthText.textContent = '0m';
    depthRow.append(this.depthText);
    root.append(depthRow);
    const toolRow = document.createElement('div');
    toolRow.className = 'hud-row';
    toolRow.append('TOOL ');
    this.toolText = document.createElement('span');
    this.toolText.id = 'hud-tool-text';
    this.toolText.textContent = '—';
    toolRow.append(this.toolText);
    root.append(toolRow);
    container.append(root);

    this.pauseOverlay = document.createElement('div');
    this.pauseOverlay.id = 'pause-overlay';
    this.pauseOverlay.textContent = 'PAUSED — Esc to resume';
    this.pauseOverlay.style.display = 'none';
    container.append(this.pauseOverlay);
  }

  update(player: Player): void {
    const o2Frac = clamp(player.o2 / Math.max(1, player.o2Max), 0, 1);
    this.o2Fill.style.width = `${(o2Frac * 100).toFixed(1)}%`;
    this.o2Text.textContent = `${Math.ceil(player.o2)}s`;
    this.o2Row.style.opacity = o2Frac >= 1 ? '0.25' : '1';
    const hpFrac = clamp(player.health / HP_MAX, 0, 1);
    this.hpFill.style.width = `${(hpFrac * 100).toFixed(1)}%`;
    this.hpText.textContent = `${Math.ceil(player.health)}`;
    this.hpRow.style.opacity = hpFrac >= 1 ? '0.25' : '1';
    this.depthText.textContent = `${Math.round(player.depth)}m`;
    this.toolText.textContent = player.selectedTool ?? '—';
  }

  setPaused(paused: boolean): void {
    this.pauseOverlay.style.display = paused ? 'block' : 'none';
  }

  private buildRow(label: string, initialText: string): {
    row: HTMLElement;
    fill: HTMLElement;
    text: HTMLElement;
  } {
    const row = document.createElement('div');
    row.className = 'hud-row';
    row.id = label === 'O2' ? 'hud-o2' : 'hud-hp';
    row.append(label + ' ');
    const bar = document.createElement('span');
    bar.className = 'hud-bar';
    const fill = document.createElement('span');
    fill.className = 'hud-bar-fill';
    bar.append(fill);
    row.append(bar);
    const text = document.createElement('span');
    text.className = 'hud-value';
    text.textContent = initialText;
    row.append(' ', text);
    return { row, fill, text };
  }

  private injectStyles(): void {
    if (document.getElementById('hud-style') !== null) return;
    const style = document.createElement('style');
    style.id = 'hud-style';
    style.textContent = `
      #hud-root {
        position: fixed;
        top: 18px;
        left: 18px;
        font: 14px/1.7 ui-monospace, Consolas, monospace;
        color: #d7e8f5;
        user-select: none;
        pointer-events: none;
      }
      .hud-bar {
        display: inline-block;
        width: 150px;
        height: 9px;
        border: 1px solid #4a6a8a;
        vertical-align: middle;
      }
      .hud-bar-fill {
        display: block;
        height: 100%;
        background: #8fd3f0;
        width: 100%;
      }
      #hud-hp .hud-bar-fill { background: #e0908a; }
      .hud-value { margin-left: 8px; }
      #pause-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        font: 28px ui-monospace, Consolas, monospace;
        letter-spacing: 0.3em;
        color: #d7e8f5;
        background: rgba(2, 6, 10, 0.55);
      }
    `;
    document.head.append(style);
  }
}
