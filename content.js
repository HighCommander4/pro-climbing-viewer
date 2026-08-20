window.rects = [];
window.activeRectIndex = 0;
window.isZoomed = false;
window._uiEnabled = false;
window.settings = {
  animations: true
  };

// Regions A–D: the strip of per-boulder thumbnail feeds across the top of the
// broadcast; pressing key 1–4 zooms into one of them. Coordinates are
// normalized (0..1) fractions of the video element's box. Values taken from the
// original Pro Climbing Viewer layout.
window.regionA = { x: 0,                   y: 0.07, w: 0.18802083333333333, h: 0.18518518518518517 };
window.regionB = { x: 0.18802083333333334, y: 0.07, w: 0.18802083333333333, h: 0.18518518518518517 };
window.regionC = { x: 0.3760416667,         y: 0.07, w: 0.18802083333333333, h: 0.18518518518518517 };
window.regionD = { x: 0.5640625,            y: 0.07, w: 0.18802083333333333, h: 0.18518518518518517 };

// Region E: the large main-feed area, below the strip. When zoomed, the
// selected thumbnail is composited into this region via a <canvas> overlay,
// while the real video — including the thumbnail strip above E — keeps playing
// underneath. Coordinates are normalized (0..1) fractions of the video
// element's box; calibrate to the actual broadcast layout if needed.
window.regionE = { x: 0, y: 0.31, w: 0.745, h: 0.69 };

// Region F: a small picture-in-picture inset, shown while zoomed, that keeps
// displaying the content normally occupying region E (hidden behind the zoom).
// Coordinates are in the SAME whole-video normalized units as the others (not
// relative to E). F is drawn onto the region-E canvas, so any part of F that
// extends beyond region E falls outside the canvas and is simply not rendered.
// The default sits in the bottom-right corner of E; calibrate as needed.
window.regionF = { x: 0.5, y: 0.773, w: 0.245, h: 0.227 };

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
  window.isZoomed = false;
  stopZoomLoop();

  if (window.zoomCanvas) {
    window.zoomCanvas.style.display = "none";
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

  const container = video.parentElement;
  container.style.position = "relative";

  // Canvas overlay used to composite the zoomed region into area E. It lives in
  // the same container as the video (so it stacks below the player chrome), is
  // hidden until zoomed, and never intercepts pointer events.
  const canvas = document.createElement('canvas');
  canvas.id = "zoom-canvas";
  canvas.style.position = "absolute";
  canvas.style.pointerEvents = "none";
  canvas.style.display = "none";
  container.appendChild(canvas);

  window.zoomCanvas = canvas;
  window.zoomCtx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  window.rects = [window.regionA, window.regionB, window.regionC, window.regionD];
}



function applyZoom() {
  const video = document.querySelector('video');
  if (!video || window.rects.length === 0) return;
  if (!window.rects[window.activeRectIndex]) return;

  window.isZoomed = true;

  if (window.zoomCanvas) window.zoomCanvas.style.display = "block";

  startZoomLoop();

  console.log("Zooming to:", window.activeRectIndex, window.rects[window.activeRectIndex]);
}


// Position/size the canvas over region E, in the video element's coordinate
// space, and keep its backing store sized to the displayed pixels.
function positionCanvasOverE(video, canvas) {
  const vw = video.clientWidth;
  const vh = video.clientHeight;

  canvas.style.left = (video.offsetLeft + window.regionE.x * vw) + "px";
  canvas.style.top = (video.offsetTop + window.regionE.y * vh) + "px";
  canvas.style.width = (window.regionE.w * vw) + "px";
  canvas.style.height = (window.regionE.h * vh) + "px";

  const dpr = window.devicePixelRatio || 1;
  const bw = Math.max(1, Math.round(window.regionE.w * vw * dpr));
  const bh = Math.max(1, Math.round(window.regionE.h * vh * dpr));
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
}


// Draw one composited frame: the active thumbnail region of the source video,
// scaled to fit (aspect-preserving, centered) into the canvas over region E.
function drawZoomFrame() {
  if (!window.isZoomed) return;

  const video = document.querySelector('video');
  const canvas = window.zoomCanvas;
  const ctx = window.zoomCtx;
  const active = window.rects[window.activeRectIndex];

  if (!video || !canvas || !ctx || !active || !video.videoWidth) {
    scheduleZoomFrame(video);
    return;
  }

  positionCanvasOverE(video, canvas);

  // Source rects are in the video's intrinsic pixels; the canvas maps region E
  // to its full extent (0,0)..(cw,ch).
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cw = canvas.width;
  const ch = canvas.height;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, cw, ch);
  try {
    // Main view: the active thumbnail (A–D), scaled to fill region E's canvas.
    drawContainFit(ctx, video,
      active.x * vw, active.y * vh, active.w * vw, active.h * vh,
      0, 0, cw, ch);

    // Picture-in-picture: the content normally occupying region E, drawn as a
    // small inset over region F (on top of the zoomed view). regionF is in
    // whole-video coordinates, so map it into the E-canvas's pixel space.
    // Anything outside region E lands off-canvas and is clipped automatically.
    const e = window.regionE;
    const f = window.regionF;
    const fx = (f.x - e.x) / e.w * cw;
    const fy = (f.y - e.y) / e.h * ch;
    const fw = f.w / e.w * cw;
    const fh = f.h / e.h * ch;

    ctx.fillStyle = "black";
    ctx.fillRect(fx, fy, fw, fh);
    drawContainFit(ctx, video,
      e.x * vw, e.y * vh, e.w * vw, e.h * vh,
      fx, fy, fw, fh);
  } catch (err) {
    // A SecurityError here means the video frame is protected (EME/DRM) and
    // can't be read into a canvas. Bail out cleanly rather than looping on it.
    console.warn("Pro Climbing Viewer: unable to draw video frame:", err);
    resetZoom();
    return;
  }

  scheduleZoomFrame(video);
}


// Draw a source rect of the video (intrinsic px) into a destination box (canvas
// px), scaled to fit (contain): aspect-preserving and centered within the box.
function drawContainFit(ctx, video, sx, sy, sw, sh, boxX, boxY, boxW, boxH) {
  const scale = Math.min(boxW / sw, boxH / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = boxX + (boxW - dw) / 2;
  const dy = boxY + (boxH - dh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, dx, dy, dw, dh);
}


// Schedule the next frame with requestVideoFrameCallback when available (fires
// once per new video frame; Firefox 132+/Chrome), else requestAnimationFrame.
function scheduleZoomFrame(video) {
  if (!window.isZoomed) return;
  if (video && typeof video.requestVideoFrameCallback === "function") {
    window._zoomFrameKind = "rvfc";
    window._zoomFrameHandle = video.requestVideoFrameCallback(() => drawZoomFrame());
  } else {
    window._zoomFrameKind = "raf";
    window._zoomFrameHandle = requestAnimationFrame(() => drawZoomFrame());
  }
}


function startZoomLoop() {
  if (window._zoomLoopRunning) return;
  window._zoomLoopRunning = true;
  drawZoomFrame();
}


function stopZoomLoop() {
  window._zoomLoopRunning = false;
  const handle = window._zoomFrameHandle;
  if (handle == null) return;

  const video = document.querySelector('video');
  if (window._zoomFrameKind === "rvfc" && video && video.cancelVideoFrameCallback) {
    video.cancelVideoFrameCallback(handle);
  } else if (window._zoomFrameKind === "raf") {
    cancelAnimationFrame(handle);
  }
  window._zoomFrameHandle = null;
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
