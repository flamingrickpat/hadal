/**
 * enables — the hidden debug panel: teleport to an arbitrary position/depth (request §33).
 *
 * archetype: service-provider
 * owns: the `?debug=1` / backtick+F2 gating and the small panel DOM
 *   (x and depth inputs, apply button, live readout line). The rest
 *   of the request §33 feature set (noclip, tiers, resources,
 *   creature state) grows in this same file in WI-03+.
 * not own: game state — the teleport and readout callbacks are
 *   provided by the caller (Game).
 * invariant: the panel is hidden until enabled by the URL flag or the
 *   key combo (an F2 within 2 s of a Backquote press); the readout
 *   refreshes at 4 Hz while visible.
 * fails when: the inputs parse to NaN — apply is ignored.
 */
export interface DebugHost {
  teleport(x: number, depth: number): void;
  readout(): string;
}

export function enableDebugPanel(root: HTMLElement, host: DebugHost): void {
  const panel = document.createElement('div');
  panel.id = 'debug-panel';

  const xInput = document.createElement('input');
  xInput.id = 'debug-x';
  xInput.type = 'number';
  xInput.step = '10';
  const depthInput = document.createElement('input');
  depthInput.id = 'debug-depth';
  depthInput.type = 'number';
  depthInput.step = '10';
  const applyButton = document.createElement('button');
  applyButton.id = 'debug-apply';
  applyButton.textContent = 'Apply';
  const readout = document.createElement('div');
  readout.id = 'debug-readout';

  const apply = (): void => {
    const x = Number(xInput.value);
    const depth = Number(depthInput.value);
    if (!Number.isNaN(x) && !Number.isNaN(depth)) {
      host.teleport(x, depth);
      refreshReadout();
    }
  };
  applyButton.addEventListener('click', apply);
  panel.append(
    'DEBUG',
    ' x ',
    xInput,
    ' depth ',
    depthInput,
    applyButton,
    readout,
  );

  const style = document.createElement('style');
  style.textContent = `
    #debug-panel {
      position: fixed;
      right: 18px;
      bottom: 18px;
      font: 12px/1.6 ui-monospace, Consolas, monospace;
      color: #9fc3dd;
      background: rgba(8, 16, 24, 0.85);
      border: 1px solid #2f4a66;
      padding: 8px 10px;
      display: none;
    }
    #debug-panel input {
      width: 90px;
      font: inherit;
      color: #d7e8f5;
      background: #0c141d;
      border: 1px solid #2f4a66;
    }
  `;
  document.head.append(style);

  let visible = new URLSearchParams(window.location.search).has('debug');
  let lastBackquote = -Infinity;
  const refreshReadout = (): void => {
    readout.textContent = host.readout();
  };
  const refresh = (): void => {
    panel.style.display = visible ? 'block' : 'none';
    if (visible) refreshReadout();
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote') {
      lastBackquote = performance.now();
    } else if (e.code === 'F2' && performance.now() - lastBackquote < 2000) {
      visible = !visible;
      refresh();
    }
  });
  window.setInterval(() => {
    if (visible) refreshReadout();
  }, 250);
  root.append(panel);
  refresh();
}
