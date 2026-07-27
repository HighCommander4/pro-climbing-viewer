window.rects = [];
window.activeRectIndex = 0;
window.isZoomed = false;
window._uiEnabled = false;
window.settings = {
  animations: true
  };

function addButton() {
  const rightControls = document.querySelector('.ytp-right-controls');
  if (!rightControls) return;

  if (document.getElementById('zoom-button')) return;

  const btn = document.createElement('button');
  btn.id = 'zoom-button';
  btn.innerText = 'Zoom Swap';
  btn.className = 'ytp-button';

  btn.onclick = () => {
    swapZoom();
  };
  rightControls.appendChild(btn);
}

function addSettingsButton() {
  const rightControls = document.querySelector('.ytp-right-controls');
  if (!rightControls) return;

  if (document.getElementById('settings-button')) return;

  const btn = document.createElement('button');
  btn.id = 'settings-button';
  btn.innerText = 'Help';
  btn.className = 'ytp-button';
  btn.title = "Zoom Tools Settings";

  btn.onclick = () => toggleSettingsPanel();

  rightControls.appendChild(btn);
}


function addResetButton() {
  const rightControls = document.querySelector('.ytp-right-controls');
  if (!rightControls) return;

  if (document.getElementById('reset-button')) return;

  const btn = document.createElement('button');
  btn.id = 'reset-button';
  btn.innerText = 'Reset';
  btn.className = 'ytp-button';

  btn.onclick = () => {
    resetZoom();
  };

  rightControls.appendChild(btn);
}

function toggleSettingsPanel() {
  let panel = document.getElementById("zoom-settings-panel");

  if (panel) {
    panel.remove();
    return;
  }

  panel = document.createElement("div");
  panel.id = "zoom-settings-panel";

  panel.style.position = "absolute";
  panel.style.right = "20px";
  panel.style.bottom = "80px";
  panel.style.width = "240px";
  panel.style.background = "rgba(40,40,40,0.98)";
  panel.style.border = "1px solid rgba(255,255,255,0.08)";
  panel.style.borderRadius = "8px";
  panel.style.color = "#fff";
  panel.style.fontFamily = "Roboto, Arial, sans-serif";
  panel.style.fontSize = "13px";
  panel.style.zIndex = "10000";
  panel.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
  panel.style.padding = "6px 0";

  panel.innerHTML = `
    <div style="
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 500;
    ">
      Pro Climbing Viewer
    </div>

    <div style="height:1px;background:rgba(255,255,255,0.08);"></div>

    <div style="padding: 10px 14px; font-size: 12px; color: rgba(255,255,255,0.75); line-height:1.6;">
      <div style="font-weight:500; margin-bottom:6px;">Keyboard shortcuts</div>

      <div>1 – 4 <span style="float:right; opacity:0.7;">Zoom regions</span></div>
      <div>5 / 0 <span style="float:right; opacity:0.7;">Reset zoom</span></div>
    </div>

    <div style="height:1px;background:rgba(255,255,255,0.08);"></div>

    <div style="
      padding: 10px 14px;
      font-size: 12px;
      color: rgba(255,255,255,0.6);
    ">
      Click Help again to close menu
    </div>
  `;

  document.querySelector('.ytp-right-controls')?.appendChild(panel);
}

function resetZoom() {
  const video = document.querySelector('video');
  const overlay = window.overlay;

  if (!video) return;

  video.style.transform = 'none';

  window.isZoomed = false;

  if (overlay) {
    overlay.style.display = "block";
  }

  console.log("Zoom reset");
}

document.addEventListener('keydown', handleKeys, true);

function handleKeys(e) {
  const tag = document.activeElement?.tagName;
  if (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    document.activeElement?.isContentEditable
  ) return;

  const keyMap = {
    'Digit1': 0,
    'Digit2': 1,
    'Digit3': 2,
    'Digit4': 3,
    'Digit5': 4,
    'Digit0': 4,
  };

  if (e.code in keyMap) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  const index = keyMap[e.code];

  if (index === 4) {
    resetZoom();
    return;
  }

  if (index !== undefined && window.rects[index]) {
    window.activeRectIndex = index;
    applyZoom();
  }
}

function init() {
  if (window._initDone) return;
  window._initDone = true;

  const video = document.querySelector('video');
  if (!video) return;

  video.style.transformOrigin = "top left";
  video.style.transition = window.settings.animations
  ? "transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)"
  : "none";

  const container = video.parentElement;
  container.style.position = "relative";


  const overlay = document.createElement('div');
  overlay.id = "zoom-overlay";

  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.display = "block";
  overlay.style.zIndex = "9999";

  container.appendChild(overlay);

  window.overlay = overlay;
  window.rects.push({
    x: 0,
    y: 0.07,
    w: 0.18802083333333333,
    h: 0.18518518518518517
  });
  window.rects.push({
    x: 0.18802083333333334,
    y: 0.07,
    w: 0.18802083333333333,
    h: 0.18518518518518517
  });
  window.rects.push({
    x: 0.3760416667,
    y: 0.07,
    w: 0.18802083333333333,
    h: 0.18518518518518517
  });
  window.rects.push({
    x: 0.5640625,
    y: 0.07,
    w: 0.18802083333333333,
    h: 0.18518518518518517
  });
}



function applyZoom() {
  const video = document.querySelector('video');
  if (!video || window.rects.length === 0) return;

  const active = window.rects[window.activeRectIndex];
  if (!active) return;

  window.isZoomed = true;

  const overlay = window.overlay;
  if (overlay) overlay.style.display = "none";

  const vw = video.clientWidth;
  const vh = video.clientHeight;

  const zoom = Math.min(
    vw / (active.w * vw),
    vh / (active.h * vh)
  );

  const tx = active.x * vw;
  const ty = active.y * vh;

  video.style.transformOrigin = "top left";

  video.style.transform = `
    scale(${zoom})
    translate(${-tx}px, ${-ty}px)
  `;

  console.log("Zooming to:", window.activeRectIndex, active);
}


function swapZoom() {
  if (window.rects.length === 0) return;

  window.activeRectIndex =
    (window.activeRectIndex + 1) % window.rects.length;

  applyZoom();
}


const observer = new MutationObserver(() => {
  if (window._uiEnabled) return;
  window._uiEnabled = true;

  addButton();
  addResetButton();
  addSettingsButton();
  init();
});


observer.observe(document.body, {
  childList: true,
  subtree: true
});