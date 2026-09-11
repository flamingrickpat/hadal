/**
 * problem — the bathymetry map overlay (request §26) must open on Tab,
 *   pause the game, and render explored space as rough silhouettes;
 *   solution — a full-screen canvas overlay that takes a read-only
 *   MapViewModel each frame and draws the explored chunks, player
 *   position, base, discovered landmarks, and an optional death beacon
 *   in the section 26 bathymetric style.
 *
 * archetype: controller
 * trigger: Tab key (handled by Game.ts); the map is redrawn each frame
 *   while open via `update(viewModel)`
 * owns: the overlay DOM element (a canvas) and its bathymetric rendering
 *   state; the open/closed toggle and the pause request to Game.ts
 * not own: the map data (built by `buildMapViewModel` from the simulation)
 *   or the game pause state (the map requests pause via a callback)
 * fails when: the container is not an HTMLElement — the constructor throws
 */
import { worldBounds } from '../world/worldData';
import type { WorldChunkDef } from '../world/chunks';
import type { MapViewModel } from './mapView';

export class MapOverlay {
  private readonly overlay: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private open = false;
  private viewBounds: { x: number; y: number; w: number; h: number } | null = null;

  constructor(container: HTMLElement, chunks: readonly WorldChunkDef[]) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('MapOverlay: container must be an HTMLElement');
    }
    this.viewBounds = worldBounds(chunks);

    this.injectStyles();

    this.overlay = document.createElement('div');
    this.overlay.id = 'map-overlay';
    this.overlay.style.display = 'none';

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'map-canvas';
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    this.ctx = this.canvas.getContext('2d')!;

    this.overlay.appendChild(this.canvas);
    container.appendChild(this.overlay);
  }

  get isOpen(): boolean {
    return this.open;
  }

  toggle(): boolean {
    this.open = !this.open;
    this.overlay.style.display = this.open ? 'flex' : 'none';
    return this.open;
  }

  update(viewModel: MapViewModel): void {
    if (!this.open) return;
    this.render(viewModel);
  }

  private render(vm: MapViewModel): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const bounds = this.viewBounds!;

    // Clear with bathymetric deep-ocean background
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, w, h);

    // Map coordinates to canvas (with 5% padding)
    const pad = 0.05;
    const mapW = w * (1 - 2 * pad);
    const mapH = h * (1 - 2 * pad);
    const scale = Math.min(mapW / bounds.w, mapH / bounds.h);
    const offsetX = pad * w + (mapW - bounds.w * scale) / 2;
    const offsetY = pad * h + (mapH - bounds.h * scale) / 2;

    const toScreen = (x: number, y: number): { sx: number; sy: number } => ({
      sx: offsetX + (x - bounds.x) * scale,
      sy: offsetY + (y - bounds.y) * scale,
    });

    // Draw explored chunk silhouettes (rough bathymetric blocks)
    for (const chunk of vm.exploredChunks) {
      const p = toScreen(chunk.bounds.x, chunk.bounds.y);
      const cw = chunk.bounds.w * scale;
      const ch = chunk.bounds.h * scale;
      // Bathymetric style: filled rectangles with depth-tinted edges
      ctx.fillStyle = 'rgba(18, 40, 65, 0.85)';
      ctx.fillRect(p.sx, p.sy, cw, ch);
      ctx.strokeStyle = 'rgba(60, 110, 140, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.sx, p.sy, cw, ch);
    }

    // Draw base marker
    {
      const p = toScreen(vm.base.position.x, vm.base.position.y);
      ctx.fillStyle = '#6db8d6';
      ctx.fillRect(p.sx - 6, p.sy - 6, 12, 12);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.sx - 6, p.sy - 6, 12, 12);
    }

    // Draw discovered landmarks
    for (const lm of vm.landmarks) {
      const p = toScreen(lm.position.x, lm.position.y);
      ctx.fillStyle = '#b8a060';
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e0d090';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw death beacon if tracked
    if (vm.beacon !== null) {
      const p = toScreen(vm.beacon.x, vm.beacon.y);
      ctx.fillStyle = '#e06060';
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff9090';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw player position
    {
      const p = toScreen(vm.playerPosition.x, vm.playerPosition.y);
      ctx.fillStyle = '#8fd3f0';
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 6, 0, Math.PI * 2);
      ctx.fill();
      // Pulsing ring
      const t = performance.now() / 1000;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2);
      ctx.strokeStyle = `rgba(143, 211, 240, ${0.3 + 0.4 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 10 + 4 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Title
    ctx.fillStyle = '#d7e8f5';
    ctx.font = '14px ui-monospace, Consolas, monospace';
    ctx.fillText('BATHYMETRY MAP', 40, 40);
    ctx.fillStyle = 'rgba(215, 232, 245, 0.5)';
    ctx.font = '12px ui-monospace, Consolas, monospace';
    ctx.fillText('Tab to close', 40, 62);
  }

  private injectStyles(): void {
    if (document.getElementById('map-overlay-style') !== null) return;
    const style = document.createElement('style');
    style.id = 'map-overlay-style';
    style.textContent = `
      #map-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(2, 6, 10, 0.7);
        z-index: 100;
      }
      #map-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }
    `;
    document.head.appendChild(style);
  }
}
