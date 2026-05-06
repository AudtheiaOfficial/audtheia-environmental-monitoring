/* ==========================================================================
   website/assets/demo.js
   Species detection demo — all interactive logic for demo.html.
   No inline JavaScript; every DOM interaction lives here.
   ========================================================================== */

'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROXY_URL       = 'https://audtheia-proxy.onrender.com/detect';
const COLD_START_MS   = 5000;   // ms before escalating to the cold-start warning
const REQUEST_TIMEOUT = 90000;  // ms total: covers proxy cold start + inference

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
]);

// Canvas drawing palette — mirrors the design-system CSS variables
const BOX_COLOR    = '#00c9a7';               // --color-teal
const CORNER_COLOR = '#38bdf8';               // --color-blue
const LABEL_BG     = 'rgba(0, 201, 167, 0.92)';
const LABEL_FG     = '#07090f';               // --color-bg

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let selectedFile    = null;
let isDetecting     = false;
let lastPredictions = null;   // retained for re-draw on window resize
let lastImageDims   = null;   // { width, height } in original image pixels

// ---------------------------------------------------------------------------
// DOM references (populated in init)
// ---------------------------------------------------------------------------

let elDropZone;
let elFileInput;
let elPreviewSection;
let elPreviewImg;
let elCanvas;
let elActions;
let elSubmitBtn;
let elResetBtn;
let elStatus;
let elResultsSection;
let elResultsList;
let ctx;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  elDropZone       = document.getElementById('demo-drop-zone');
  elFileInput      = document.getElementById('demo-file-input');
  elPreviewSection = document.getElementById('demo-preview-section');
  elPreviewImg     = document.getElementById('demo-preview-img');
  elCanvas         = document.getElementById('demo-canvas');
  elActions        = document.getElementById('demo-actions');
  elSubmitBtn      = document.getElementById('demo-submit');
  elResetBtn       = document.getElementById('demo-reset');
  elStatus         = document.getElementById('demo-status');
  elResultsSection = document.getElementById('demo-results-section');
  elResultsList    = document.getElementById('demo-results-list');

  ctx = elCanvas.getContext('2d');

  // Drop-zone interaction
  elDropZone.addEventListener('dragover',  onDragOver);
  elDropZone.addEventListener('dragleave', onDragLeave);
  elDropZone.addEventListener('drop',      onDrop);
  elDropZone.addEventListener('click',     () => elFileInput.click());
  elDropZone.addEventListener('keydown',   (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elFileInput.click(); }
  });

  elFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
    elFileInput.value = ''; // allow re-selecting the same file
  });

  elSubmitBtn.addEventListener('click', runDetection);
  elResetBtn.addEventListener('click',  resetDemo);

  window.addEventListener('resize', debounce(onResize, 150));
});

// ---------------------------------------------------------------------------
// Drag-and-drop
// ---------------------------------------------------------------------------

function onDragOver(e) {
  e.preventDefault();
  elDropZone.classList.add('drag-over');
}

function onDragLeave(e) {
  e.preventDefault();
  elDropZone.classList.remove('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  elDropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}

// ---------------------------------------------------------------------------
// File processing
// ---------------------------------------------------------------------------

function processFile(file) {
  // Client-side validation mirrors the proxy allowlist
  if (!ALLOWED_MIME.has(file.type)) {
    showStatus('error', 'Unsupported file type. Please select a JPEG, PNG, WebP, GIF, or BMP image.');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showStatus('error', 'File exceeds the 10\u00a0MB limit. Please use a smaller image.');
    return;
  }

  selectedFile = file;
  clearResults();
  clearStatus();

  const reader = new FileReader();
  reader.onload = (e) => {
    // Use { once: true } so stale listeners don't accumulate on re-uploads
    elPreviewImg.addEventListener('load', onImageLoaded, { once: true });
    elPreviewImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function onImageLoaded() {
  elPreviewSection.hidden = false;
  elActions.hidden        = false;
  syncCanvas();
  ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
  // Scroll preview into view on small screens
  elPreviewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

async function runDetection() {
  if (!selectedFile || isDetecting) return;

  isDetecting          = true;
  elSubmitBtn.disabled = true;
  clearResults();
  showStatus('loading', 'Connecting to detection server\u2026');

  // Escalate message after COLD_START_MS with no response
  const coldTimer = setTimeout(() => {
    if (isDetecting) {
      showStatus('loading',
        'The detection server is starting \u2014 this can take up to 30\u00a0seconds on first use. Please wait.'
      );
    }
  }, COLD_START_MS);

  const controller = new AbortController();
  const hardTimer  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const body = new FormData();
  body.append('file', selectedFile);  // field name must match the proxy's UploadFile parameter

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      body,
      signal: controller.signal,
    });

    clearTimeout(coldTimer);
    clearTimeout(hardTimer);

    const data = await response.json();

    if (!response.ok) {
      handleProxyError(response.status, data);
      return;
    }

    handleDetectionSuccess(data);

  } catch (err) {
    clearTimeout(coldTimer);
    clearTimeout(hardTimer);

    if (err.name === 'AbortError') {
      showStatus('error',
        'The request timed out after 90\u00a0seconds. The server may be unavailable. Please try again in a moment.'
      );
    } else {
      showStatus('error',
        'Unable to reach the detection server. Check your connection, or visit the ' +
        '<a href="https://github.com/AudtheiaOfficial/audtheia-environmental-monitoring" ' +
        'target="_blank" rel="noopener noreferrer">GitHub repository</a> for status.'
      );
    }
  } finally {
    isDetecting          = false;
    elSubmitBtn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// Error handling — maps proxy HTTP status codes to user-facing messages
// ---------------------------------------------------------------------------

function handleProxyError(status, data) {
  // The proxy wraps detail in a nested object: data.detail.detail (FastAPI HTTPException)
  // or a flat string data.detail for rate-limit responses
  const detail = data?.detail?.detail ?? data?.detail ?? 'An unexpected error occurred.';

  switch (status) {
    case 429:
      showStatus('error',
        'Detection limit reached. The demo allows 5\u00a0detections per hour per IP\u00a0address to protect shared access. ' +
        'Please try again later, or <a href="setup.html">set up your own Roboflow workspace</a> for unlimited use.'
      );
      return;
    case 504:
      showStatus('error',
        'Roboflow inference did not respond in time. This can occur during server warm-up. ' +
        'Please wait a moment and try again.'
      );
      return;
    case 415:
      showStatus('error',
        'The server rejected this file format. Please use a JPEG, PNG, WebP, GIF, or BMP image.'
      );
      return;
    case 413:
      showStatus('error', 'Image exceeds the 10\u00a0MB size limit. Please use a smaller file.');
      return;
    default:
      showStatus('error', `Detection failed (HTTP\u00a0${status}): ${escHtml(String(detail))}`);
  }
}

// ---------------------------------------------------------------------------
// Success handling
// ---------------------------------------------------------------------------

function handleDetectionSuccess(data) {
  const predictions = data?.predictions ?? [];

  // Use image dimensions from the response; fall back to the img element's natural size
  const imageDims = (data?.image?.width && data?.image?.height)
    ? data.image
    : { width: elPreviewImg.naturalWidth, height: elPreviewImg.naturalHeight };

  if (predictions.length === 0) {
    showStatus('info',
      'No species detected in this image. Try a clear photograph of a marine sponge or other organism in good lighting.'
    );
    return;
  }

  clearStatus();

  lastPredictions = predictions;
  lastImageDims   = imageDims;

  syncCanvas();
  drawBoxes(predictions, imageDims);
  buildResultsList(predictions);
}

// ---------------------------------------------------------------------------
// Canvas — bounding boxes
// ---------------------------------------------------------------------------

function syncCanvas() {
  // Set the bitmap resolution to match the CSS-rendered image dimensions.
  // Setting style.width/height explicitly covers the image exactly without
  // depending on CSS percentage values, which could conflict with bitmap attrs.
  const w = elPreviewImg.clientWidth;
  const h = elPreviewImg.clientHeight;
  elCanvas.width        = w;
  elCanvas.height       = h;
  elCanvas.style.width  = w + 'px';
  elCanvas.style.height = h + 'px';
}

function drawBoxes(predictions, imageDims) {
  ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);

  // Scale factors: Roboflow pixel space → displayed canvas space
  const sx = elCanvas.width  / imageDims.width;
  const sy = elCanvas.height / imageDims.height;

  // Render lower-confidence detections first so higher ones appear on top
  const sorted = [...predictions].sort((a, b) => a.confidence - b.confidence);

  sorted.forEach((pred) => {
    // Roboflow returns center-origin coordinates; convert to top-left origin
    const x = (pred.x - pred.width  / 2) * sx;
    const y = (pred.y - pred.height / 2) * sy;
    const w = pred.width  * sx;
    const h = pred.height * sy;

    // ── Bounding box ──────────────────────────────────────────────────────
    ctx.strokeStyle = BOX_COLOR;
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(x, y, w, h);

    // ── Corner accents (L-shapes) — adds depth without visual noise ───────
    const cs = Math.min(10, w * 0.18, h * 0.18);
    ctx.strokeStyle = CORNER_COLOR;
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    // Top-left
    ctx.beginPath();
    ctx.moveTo(x, y + cs);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cs, y);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(x + w - cs, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cs);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(x + w, y + h - cs);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w - cs, y + h);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(x + cs, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + h - cs);
    ctx.stroke();

    // ── Label ─────────────────────────────────────────────────────────────
    ctx.font = '500 11px "IBM Plex Mono", "Courier New", monospace';

    const speciesText = pred.class;
    const confText    = `${(pred.confidence * 100).toFixed(1)}%`;
    const speciesW    = ctx.measureText(speciesText).width;
    const confW       = ctx.measureText(confText).width;
    const labelW      = speciesW + confW + 18; // 6 left + 6 gap + 6 right
    const labelH      = 20;

    // Place label above the box; if insufficient vertical space, place below
    const labelY = (y >= labelH + 4) ? y - labelH - 2 : y + h + 2;

    // Background
    ctx.fillStyle = LABEL_BG;
    ctx.fillRect(x, labelY, labelW, labelH);

    // Species name (dark on teal)
    ctx.fillStyle = LABEL_FG;
    ctx.fillText(speciesText, x + 6, labelY + 13);

    // Confidence score (right of species, slightly dimmed)
    ctx.fillStyle = 'rgba(7, 9, 15, 0.55)';
    ctx.fillText(confText, x + speciesW + 12, labelY + 13);
  });
}

// ---------------------------------------------------------------------------
// Results list
// ---------------------------------------------------------------------------

function buildResultsList(predictions) {
  elResultsList.innerHTML = '';

  // Highest confidence first
  const sorted = [...predictions].sort((a, b) => b.confidence - a.confidence);

  sorted.forEach((pred, i) => {
    const li = document.createElement('li');
    li.className = 'demo-result-item';
    li.innerHTML =
      `<span class="demo-result-index">${pad2(i + 1)}</span>` +
      `<span class="demo-result-species">${escHtml(pred.class)}</span>` +
      `<span class="demo-result-confidence">${(pred.confidence * 100).toFixed(1)}%</span>`;
    elResultsList.appendChild(li);
  });

  elResultsSection.hidden = false;
}

// ---------------------------------------------------------------------------
// Status messages
// ---------------------------------------------------------------------------

function showStatus(type, message) {
  elStatus.hidden    = false;
  elStatus.className = `demo-status demo-status--${type}`;

  elStatus.innerHTML = (type === 'loading')
    ? `<span class="demo-spinner" aria-hidden="true"></span><span class="demo-status-text">${message}</span>`
    : `<span class="demo-status-text">${message}</span>`;
}

function clearStatus() {
  elStatus.hidden    = true;
  elStatus.innerHTML = '';
  elStatus.className = 'demo-status';
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

function resetDemo() {
  selectedFile    = null;
  isDetecting     = false;

  elPreviewSection.hidden = true;
  elActions.hidden        = true;
  elPreviewImg.src        = '';
  elFileInput.value       = '';

  if (ctx) ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);

  clearResults();
  clearStatus();
}

function clearResults() {
  lastPredictions         = null;
  lastImageDims           = null;
  elResultsList.innerHTML = '';
  elResultsSection.hidden = true;

  if (ctx) ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
}

// ---------------------------------------------------------------------------
// Resize handler
// ---------------------------------------------------------------------------

function onResize() {
  if (elPreviewSection.hidden) return;
  syncCanvas();
  if (lastPredictions && lastImageDims) {
    drawBoxes(lastPredictions, lastImageDims);
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
