/**
 * trigger — the player opens the settings overlay (request §43 accessibility);
 *   outcome — a compact settings panel with toggles for master volume,
 *   screen shake, reduced flashing, subtitles, and high-contrast sonar.
 *
 * archetype: controller
 * owns: the DOM settings panel and the setting values passed through callbacks
 * coordinates: the AudioSystem (volume), Renderer (shake), and the sonar
 *   visuals (contrast) via passed callback functions
 * fails when: the container is not an HTMLElement — the constructor throws
 */
import { clamp } from '../util/math';

export interface AccessibilityState {
  masterVolume: number;
  screenShake: boolean;
  reducedFlashing: boolean;
  showSubtitles: boolean;
  hiContrastSonar: boolean;
}

export interface AccessibilityCallbacks {
  onMasterVolume: (volume: number) => void;
  onScreenShake: (enabled: boolean) => void;
  onReducedFlashing: (enabled: boolean) => void;
  onShowSubtitles: (enabled: boolean) => void;
  onHiContrastSonar: (enabled: boolean) => void;
}

export class SettingsOverlay {
  private readonly overlay: HTMLElement;
  private open = false;
  private readonly callbacks: AccessibilityCallbacks;

  constructor(container: HTMLElement, callbacks: AccessibilityCallbacks) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('SettingsOverlay: container must be an HTMLElement');
    }
    this.callbacks = callbacks;
    this.overlay = document.createElement('div');
    this.overlay.id = 'settings-overlay';
    this.overlay.style.display = 'none';

    this.buildPanel();
    container.appendChild(this.overlay);
    this.injectStyles();
  }

  get isOpen(): boolean {
    return this.open;
  }

  toggle(): boolean {
    this.open = !this.open;
    this.overlay.style.display = this.open ? 'flex' : 'none';
    return this.open;
  }

  close(): void {
    if (this.open) {
      this.open = false;
      this.overlay.style.display = 'none';
    }
  }

  /** Apply current settings from the saved state. */
  applyState(state: AccessibilityState): void {
    const volumeSlider = this.overlay.querySelector('.settings-volume') as HTMLInputElement;
    if (volumeSlider !== null) volumeSlider.value = String(state.masterVolume);
    const shakeToggle = this.overlay.querySelector('#settings-shake') as HTMLInputElement;
    if (shakeToggle !== null) shakeToggle.checked = state.screenShake;
    const flashToggle = this.overlay.querySelector('#settings-flash') as HTMLInputElement;
    if (flashToggle !== null) flashToggle.checked = state.reducedFlashing;
    const subToggle = this.overlay.querySelector('#settings-subtitles') as HTMLInputElement;
    if (subToggle !== null) subToggle.checked = state.showSubtitles;
    const contrastToggle = this.overlay.querySelector('#settings-sonar') as HTMLInputElement;
    if (contrastToggle !== null) contrastToggle.checked = state.hiContrastSonar;
  }

  /** Read current settings from the UI controls. */
  readState(): AccessibilityState {
    const volumeSlider = this.overlay.querySelector('.settings-volume') as HTMLInputElement;
    const volume = volumeSlider !== null ? clamp(Number(volumeSlider.value), 0, 1) : 1;
    const shake = (this.overlay.querySelector('#settings-shake') as HTMLInputElement)?.checked ?? true;
    const flash = (this.overlay.querySelector('#settings-flash') as HTMLInputElement)?.checked ?? false;
    const subs = (this.overlay.querySelector('#settings-subtitles') as HTMLInputElement)?.checked ?? true;
    const contrast = (this.overlay.querySelector('#settings-sonar') as HTMLInputElement)?.checked ?? false;
    return { masterVolume: volume, screenShake: shake, reducedFlashing: flash, showSubtitles: subs, hiContrastSonar: contrast };
  }

  private buildPanel(): void {
    const content = document.createElement('div');
    content.className = 'settings-content';

    const title = document.createElement('h2');
    title.className = 'settings-title';
    title.textContent = 'Settings';
    content.appendChild(title);

    // Master volume
    content.appendChild(this.buildSliderRow('Volume', '.settings-volume', this.callbacks.onMasterVolume));

    // Screen shake
    content.appendChild(this.buildToggleRow('Screen shake', 'settings-shake', this.callbacks.onScreenShake));

    // Reduced flashing
    content.appendChild(this.buildToggleRow('Reduced flashing', 'settings-flash', this.callbacks.onReducedFlashing));

    // Subtitles
    content.appendChild(this.buildToggleRow('Radio subtitles', 'settings-subtitles', this.callbacks.onShowSubtitles));

    // High-contrast sonar
    content.appendChild(this.buildToggleRow('High-contrast sonar', 'settings-sonar', this.callbacks.onHiContrastSonar));

    this.overlay.appendChild(content);
  }

  private buildSliderRow(label: string, selector: string, onChange: (v: number) => void): HTMLElement {
    const row = document.createElement('div');
    row.className = 'settings-row';
    const labelEl = document.createElement('span');
    labelEl.className = 'settings-label';
    labelEl.textContent = label;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = '1';
    slider.className = 'settings-volume';
    slider.setAttribute('aria-label', label);
    slider.addEventListener('input', () => onChange(clamp(Number(slider.value), 0, 1)));
    row.appendChild(labelEl);
    row.appendChild(slider);
    return row;
  }

  private buildToggleRow(label: string, id: string, onChange: (v: boolean) => void): HTMLElement {
    const row = document.createElement('div');
    row.className = 'settings-row';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.className = 'settings-toggle';
    input.checked = true;
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.className = 'settings-label';
    labelEl.textContent = label;
    input.addEventListener('change', () => onChange(input.checked));
    row.appendChild(input);
    row.appendChild(labelEl);
    return row;
  }

  private injectStyles(): void {
    if (document.getElementById('settings-overlay-style') !== null) return;
    const style = document.createElement('style');
    style.id = 'settings-overlay-style';
    style.textContent = `
      #settings-overlay {
        position: fixed;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(2, 6, 10, 0.75);
        z-index: 100;
      }
      .settings-content {
        background: #0a1520;
        border: 1px solid #3a5570;
        padding: 32px 40px;
        min-width: 400px;
        max-width: 600px;
        font: 16px/1.6 ui-monospace, Consolas, monospace;
        color: #d7e8f5;
        user-select: none;
      }
      .settings-title {
        margin: 0 0 24px;
        font-size: 22px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: #8fd3f0;
      }
      .settings-row {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        gap: 12px;
      }
      .settings-label {
        min-width: 180px;
        cursor: pointer;
      }
      .settings-volume {
        width: 200px;
        accent-color: #8fd3f0;
      }
      .settings-toggle {
        width: 18px;
        height: 18px;
        accent-color: #8fd3f0;
      }
    `;
    document.head.appendChild(style);
  }
}