/* ============================================
   MOODLY — Main Application JS
   ============================================ */

// ── State ──
let allPins = [];
let currentCategory = 'all';
let currentSearch = '';
let currentPin = null;
let searchTimer = null;
let visibleCount = 20;

// ── Canvas State ──
let currentTool = 'select';
let selectedEl = null;
let isDragging = false;
let isResizing = false;
let dragStart = { x: 0, y: 0, elX: 0, elY: 0 };
let resizeStart = { x: 0, y: 0, w: 0, h: 0 };
let canvasBg = '#0d0d0d';
let fillColor = '#6c63ff';
let strokeColor = '#000000';
let strokeWidth = 0;
let drawPath = null;
let drawPoints = [];
let isDrawing = false;
let textProps = { font: 'Syne', size: 32, bold: true, italic: false, underline: false, color: '#ffffff' };

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  loadPins();
  setupNavScroll();
  setupKeyboard();
  setupCanvasEvents();
});

// ============================================
// NAVIGATION
// ============================================
function setupNavScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 60);
  });
}

function setView(view) {
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
}

function scrollToFeed() {
  document.getElementById('filterBar').scrollIntoView({ behavior: 'smooth' });
}

function showFeed() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleProfile() {
  const dropdown = document.getElementById('profileDropdown');
  dropdown.classList.toggle('open');
  document.addEventListener('click', closeProfileOnOutside, true);
}

function closeProfileOnOutside(e) {
  const dropdown = document.getElementById('profileDropdown');
  if (!dropdown.contains(e.target) && !e.target.closest('.avatar')) {
    dropdown.classList.remove('open');
    document.removeEventListener('click', closeProfileOnOutside, true);
  }
}

// ============================================
// FEED / PINS
// ============================================
async function loadPins() {
  showSkeletons();
  try {
    const params = new URLSearchParams();
    if (currentCategory !== 'all') params.append('category', currentCategory);
    if (currentSearch) params.append('search', currentSearch);
    const res = await fetch('/api/pins?' + params.toString());
    allPins = await res.json();
    renderPins();
  } catch (e) {
    showToast('Failed to load pins', 'error');
  }
}

function showSkeletons() {
  const grid = document.getElementById('masonryGrid');
  grid.innerHTML = Array(12).fill('').map((_, i) => `
    <div class="pin-card loading" style="animation-delay:${i * 0.05}s">
      <div class="pin-visual skeleton" style="height:${[160,220,180,260,150,200][i%6]}px"></div>
      <div class="pin-info">
        <div class="skeleton" style="height:10px;width:60%;margin-bottom:8px;border-radius:4px"></div>
        <div class="skeleton" style="height:14px;width:85%;margin-bottom:6px;border-radius:4px"></div>
        <div class="skeleton" style="height:11px;width:70%;border-radius:4px"></div>
      </div>
    </div>
  `).join('');
}

function renderPins() {
  const grid = document.getElementById('masonryGrid');
  const empty = document.getElementById('emptyState');
  const toShow = allPins.slice(0, visibleCount);

  if (allPins.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = toShow.map((pin, i) => createPinHTML(pin, i)).join('');
  document.getElementById('loadMoreBtn').style.display = allPins.length > visibleCount ? 'inline-flex' : 'none';
}

function createPinHTML(pin, index) {
  const heights = [180, 240, 200, 280, 160, 220, 260, 190];
  const h = heights[index % heights.length];
  const delay = (index % 10) * 0.06;

  let visual = '';
  if (pin.type === 'design' && pin.canvas_data) {
    visual = `<div class="pin-visual color-type" style="height:${h}px;background:${pin.gradient || pin.color}">
      <img src="${pin.canvas_data}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">
    </div>`;
  } else if (pin.type === 'image' && pin.image_data) {
    visual = `<img class="pin-visual" src="${pin.image_data}" style="height:${h}px;object-fit:cover;display:block">`;
  } else {
    visual = `<div class="pin-visual color-type" style="height:${h}px;background:${pin.gradient || pin.color || '#1a1a1a'}"></div>`;
  }

  return `
  <div class="pin-card" style="animation-delay:${delay}s" onclick="openPinModal('${pin.id}')">
    ${visual}
    <div class="pin-overlay">
      <div class="pin-actions" onclick="event.stopPropagation()">
        <button class="pin-action-btn save" onclick="quickSave('${pin.id}', event)" title="Save">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button class="pin-action-btn" onclick="quickLike('${pin.id}', event)" title="Like">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>
    <div class="pin-info">
      <div class="pin-cat">${pin.category || 'Design'}</div>
      <div class="pin-title">${pin.title}</div>
      ${pin.description ? `<div class="pin-desc">${pin.description}</div>` : ''}
      <div class="pin-stats">
        <span class="pin-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${formatNum(pin.likes || 0)}
        </span>
        <span class="pin-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          ${formatNum(pin.saves || 0)}
        </span>
      </div>
    </div>
  </div>`;
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}

function loadMore() {
  visibleCount += 12;
  renderPins();
}

function filterCategory(btn, cat) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentCategory = cat;
  visibleCount = 20;
  loadPins();
}

let searchDebounce;
function handleSearch(val) {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    currentSearch = val.trim();
    visibleCount = 20;
    loadPins();
  }, 350);
}

function toggleSort() {
  allPins = [...allPins].reverse();
  renderPins();
  showToast('Sort order reversed');
}

// ── Quick actions ──
async function quickLike(id, e) {
  e.stopPropagation();
  try {
    await fetch(`/api/pins/${id}/like`, { method: 'POST' });
    const pin = allPins.find(p => p.id === id);
    if (pin) pin.likes = (pin.likes || 0) + 1;
    showToast('❤️ Liked!', 'success');
  } catch {}
}

async function quickSave(id, e) {
  e.stopPropagation();
  try {
    await fetch(`/api/pins/${id}/save`, { method: 'POST' });
    const pin = allPins.find(p => p.id === id);
    if (pin) pin.saves = (pin.saves || 0) + 1;
    showToast('🔖 Saved to board!', 'success');
  } catch {}
}

// ============================================
// PIN MODAL
// ============================================
function openPinModal(id) {
  const pin = allPins.find(p => p.id === id);
  if (!pin) return;
  currentPin = pin;

  const imgEl = document.getElementById('pinModalImage');
  if (pin.canvas_data) {
    imgEl.style.cssText = `background:${pin.gradient || pin.color};`;
    imgEl.innerHTML = `<img src="${pin.canvas_data}" style="width:100%;height:100%;object-fit:cover">`;
  } else {
    imgEl.style.cssText = `background:${pin.gradient || pin.color || '#1a1a2e'};min-height:400px;`;
    imgEl.innerHTML = '';
  }

  document.getElementById('pinModalCat').textContent = pin.category || 'Design';
  document.getElementById('pinModalTitle').textContent = pin.title;
  document.getElementById('pinModalDesc').textContent = pin.description || '';
  document.getElementById('pinModalLikes').textContent = `${formatNum(pin.likes || 0)} likes`;
  document.getElementById('pinModalSaves').textContent = `${formatNum(pin.saves || 0)} saves`;

  // Color swatches
  const swatches = document.getElementById('colorSwatches');
  if (pin.gradient || pin.color) {
    const colors = extractColors(pin.gradient || pin.color);
    swatches.innerHTML = colors.map(c =>
      `<div class="color-swatch" style="background:${c}" title="${c}" onclick="copyColor('${c}')"></div>`
    ).join('');
    document.getElementById('pinColorInfo').style.display = 'block';
  } else {
    document.getElementById('pinColorInfo').style.display = 'none';
  }

  document.getElementById('pinModal').classList.add('open');
}

function closePinModal(e) {
  if (!e || e.target === document.getElementById('pinModal') || e.currentTarget === document.getElementById('pinModal') && !e.target.closest('.pin-modal')) {
    document.getElementById('pinModal').classList.remove('open');
  }
  if (!e) document.getElementById('pinModal').classList.remove('open');
}

async function saveCurrentPin() {
  if (!currentPin) return;
  const res = await fetch(`/api/pins/${currentPin.id}/save`, { method: 'POST' });
  const data = await res.json();
  document.getElementById('pinModalSaves').textContent = `${formatNum(data.saves)} saves`;
  document.getElementById('pinModalSave').style.background = '#3ecfcf';
  showToast('🔖 Saved to your board!', 'success');
}

async function likeCurrentPin() {
  if (!currentPin) return;
  const res = await fetch(`/api/pins/${currentPin.id}/like`, { method: 'POST' });
  const data = await res.json();
  document.getElementById('pinModalLikes').textContent = `${formatNum(data.likes)} likes`;
  showToast('❤️ Liked!', 'success');
}

function sharePin() {
  navigator.clipboard?.writeText(window.location.href + '?pin=' + currentPin?.id).catch(() => {});
  showToast('🔗 Link copied!', 'success');
}

function copyColor(c) {
  navigator.clipboard?.writeText(c).catch(() => {});
  showToast(`Copied ${c}`, 'success');
}

function extractColors(bg) {
  const hex = bg.match(/#[0-9a-fA-F]{3,8}/g) || [];
  return [...new Set(hex)].slice(0, 5);
}

// ============================================
// CANVAS EDITOR
// ============================================
function openCanvasModal() {
  document.getElementById('canvasModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCanvasModal(e) {
  if (e && e.target !== document.getElementById('canvasModal')) return;
  _closeCanvas();
}

function _closeCanvas() {
  document.getElementById('canvasModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Tool Selection ──
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tool-' + tool);
  if (btn) btn.classList.add('active');

  document.getElementById('colorSection').style.display = ['rect', 'circle', 'draw'].includes(tool) ? 'block' : 'block';
  document.getElementById('textSection').style.display = tool === 'text' ? 'block' : 'none';

  const board = document.getElementById('canvasBoard');
  board.style.cursor = tool === 'draw' ? 'crosshair' : tool === 'text' ? 'text' : 'default';

  if (selectedEl && tool !== 'select') deselectAll();
}

// ── Canvas BG ──
function setCanvasBg(bg) {
  canvasBg = bg;
  document.getElementById('canvasBoard').style.background = bg;
  if (bg.startsWith('#')) document.getElementById('bgColor').value = bg;
}

// ── Color Updates ──
function updateFill(v) { fillColor = v; document.getElementById('fillHex').value = v; if (selectedEl && selectedEl.dataset.type !== 'text') selectedEl.style.background = v; }
function updateFillHex(v) { if (/^#[0-9a-f]{6}$/i.test(v)) { document.getElementById('fillColor').value = v; updateFill(v); } }
function updateStroke(v) { strokeColor = v; if (selectedEl) { selectedEl.style.borderColor = v; selectedEl.style.borderStyle = 'solid'; } }
function updateStrokeWidth(v) { strokeWidth = parseInt(v); if (selectedEl) { selectedEl.style.borderWidth = v + 'px'; selectedEl.style.borderStyle = v > 0 ? 'solid' : 'none'; } }
function updateFont(v) { textProps.font = v; if (selectedEl?.dataset.type === 'text') selectedEl.style.fontFamily = v; }
function updateFontSize(v) { textProps.size = parseInt(v); document.getElementById('fontSizeVal').textContent = v; if (selectedEl?.dataset.type === 'text') selectedEl.style.fontSize = v + 'px'; }
function updateTextColor(v) { textProps.color = v; if (selectedEl?.dataset.type === 'text') selectedEl.style.color = v; }
function toggleBold() { textProps.bold = !textProps.bold; if (selectedEl?.dataset.type === 'text') selectedEl.style.fontWeight = textProps.bold ? '700' : '400'; document.querySelector('.style-btn:nth-child(1)').classList.toggle('active', textProps.bold); }
function toggleItalic() { textProps.italic = !textProps.italic; if (selectedEl?.dataset.type === 'text') selectedEl.style.fontStyle = textProps.italic ? 'italic' : 'normal'; document.querySelector('.style-btn:nth-child(2)').classList.toggle('active', textProps.italic); }
function toggleUnderline() { textProps.underline = !textProps.underline; if (selectedEl?.dataset.type === 'text') selectedEl.style.textDecoration = textProps.underline ? 'underline' : 'none'; document.querySelector('.style-btn:nth-child(3)').classList.toggle('active', textProps.underline); }

// ── Layer Actions ──
function bringForward() {
  if (!selectedEl) return;
  const z = parseInt(selectedEl.style.zIndex || 0);
  selectedEl.style.zIndex = z + 1;
}
function sendBackward() {
  if (!selectedEl) return;
  const z = parseInt(selectedEl.style.zIndex || 0);
  selectedEl.style.zIndex = Math.max(0, z - 1);
}
function deleteSelected() {
  if (selectedEl) { selectedEl.remove(); selectedEl = null; }
}
function clearCanvas() {
  if (confirm('Clear all elements?')) {
    document.getElementById('canvasBoard').querySelectorAll('.canvas-el').forEach(e => e.remove());
    selectedEl = null;
  }
}

// ── Element Creation ──
function addElement(type, x, y, w, h) {
  const board = document.getElementById('canvasBoard');
  const el = document.createElement('div');
  el.className = 'canvas-el';
  el.dataset.type = type;
  el.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;position:absolute;`;

  if (type === 'rect') {
    el.style.background = fillColor;
    el.style.borderRadius = '4px';
    if (strokeWidth > 0) { el.style.border = `${strokeWidth}px solid ${strokeColor}`; }
  } else if (type === 'circle') {
    el.style.background = fillColor;
    el.style.borderRadius = '50%';
    if (strokeWidth > 0) { el.style.border = `${strokeWidth}px solid ${strokeColor}`; }
  } else if (type === 'text') {
    el.className += ' canvas-text-el';
    el.contentEditable = 'true';
    el.style.fontFamily = textProps.font;
    el.style.fontSize = textProps.size + 'px';
    el.style.fontWeight = textProps.bold ? '700' : '400';
    el.style.fontStyle = textProps.italic ? 'italic' : 'normal';
    el.style.textDecoration = textProps.underline ? 'underline' : 'none';
    el.style.color = textProps.color;
    el.style.width = 'auto';
    el.style.height = 'auto';
    el.style.minWidth = '80px';
    el.style.background = 'transparent';
    el.textContent = 'Double-click to edit';
    el.addEventListener('dblclick', () => { el.focus(); selectAll(el); });
    el.addEventListener('click', e => e.stopPropagation());
    el.addEventListener('keydown', e => e.stopPropagation());
  }

  // Resize handle for non-text
  if (type !== 'text') {
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.addEventListener('mousedown', startResize);
    el.appendChild(handle);
  }

  board.appendChild(el);
  makeDraggable(el);
  selectElement(el);
  return el;
}

function selectAll(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// ── Image Upload ──
function triggerImageUpload() { document.getElementById('imageFileInput').click(); }

function handleImageFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const board = document.getElementById('canvasBoard');
    const img = document.createElement('img');
    img.src = ev.target.result;
    img.style.cssText = 'width:200px;height:auto;position:absolute;left:50px;top:50px;display:block;';
    img.className = 'canvas-el';
    img.dataset.type = 'image';

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.addEventListener('mousedown', startResize);
    img.appendChild(handle);

    board.appendChild(img);
    makeDraggable(img);
    selectElement(img);
    showToast('Image added to canvas', 'success');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

// ── Drag ──
function makeDraggable(el) {
  el.addEventListener('mousedown', startDrag);
}

function startDrag(e) {
  if (e.target.classList.contains('resize-handle')) return;
  if (e.target.isContentEditable && e.target.classList.contains('canvas-text-el')) {
    if (document.activeElement === e.target) return;
  }
  const el = e.currentTarget;
  if (currentTool === 'select' || el.dataset.type === 'text') {
    selectElement(el);
    isDragging = true;
    dragStart = {
      x: e.clientX, y: e.clientY,
      elX: parseInt(el.style.left) || 0,
      elY: parseInt(el.style.top) || 0
    };
    e.preventDefault();
  }
}

function selectElement(el) {
  deselectAll();
  selectedEl = el;
  el.classList.add('selected');
}

function deselectAll() {
  document.querySelectorAll('.canvas-el.selected').forEach(e => e.classList.remove('selected'));
  selectedEl = null;
}

// ── Canvas Board Click (create elements) ──
function setupCanvasEvents() {
  const board = document.getElementById('canvasBoard');

  board.addEventListener('click', (e) => {
    if (e.target === board || e.target === board) {
      if (currentTool === 'select') { deselectAll(); return; }
      if (currentTool === 'rect') {
        const rect = board.getBoundingClientRect();
        addElement('rect', e.clientX - rect.left - 60, e.clientY - rect.top - 40, 120, 80);
      } else if (currentTool === 'circle') {
        const rect = board.getBoundingClientRect();
        addElement('circle', e.clientX - rect.left - 50, e.clientY - rect.top - 50, 100, 100);
      } else if (currentTool === 'text') {
        const rect = board.getBoundingClientRect();
        const el = addElement('text', e.clientX - rect.left - 80, e.clientY - rect.top - 20, 200, 50);
        setTimeout(() => { el.focus(); selectAll(el); }, 50);
      }
    }
  });

  // Draw tool
  board.addEventListener('mousedown', (e) => {
    if (currentTool === 'draw' && e.target === board) {
      isDrawing = true;
      const rect = board.getBoundingClientRect();
      drawPoints = [{ x: e.clientX - rect.left, y: e.clientY - rect.top }];
      drawPath = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      drawPath.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
      drawPath.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      board.appendChild(drawPath);
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging && selectedEl) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const board = document.getElementById('canvasBoard');
      const bRect = board.getBoundingClientRect();
      const newX = Math.max(0, Math.min(bRect.width - 40, dragStart.elX + dx));
      const newY = Math.max(0, Math.min(bRect.height - 20, dragStart.elY + dy));
      selectedEl.style.left = newX + 'px';
      selectedEl.style.top = newY + 'px';
    }
    if (isResizing && selectedEl) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      selectedEl.style.width = Math.max(20, resizeStart.w + dx) + 'px';
      selectedEl.style.height = Math.max(20, resizeStart.h + dy) + 'px';
    }
    if (isDrawing && drawPath) {
      const board = document.getElementById('canvasBoard');
      const rect = board.getBoundingClientRect();
      drawPoints.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      updateDrawPath();
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    if (isDrawing) {
      isDrawing = false;
      finalizePath();
    }
  });

  board.addEventListener('click', (e) => {
    if (e.target === board && currentTool === 'select') deselectAll();
  });
}

function startResize(e) {
  e.stopPropagation();
  isResizing = true;
  const el = e.currentTarget.parentElement;
  selectElement(el);
  resizeStart = {
    x: e.clientX, y: e.clientY,
    w: parseInt(el.style.width) || el.offsetWidth,
    h: parseInt(el.style.height) || el.offsetHeight
  };
  e.preventDefault();
}

function updateDrawPath() {
  if (!drawPath || drawPoints.length < 2) return;
  drawPath.innerHTML = '';
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const d = drawPoints.reduce((acc, p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  path.setAttribute('d', d);
  path.setAttribute('stroke', fillColor);
  path.setAttribute('stroke-width', Math.max(2, strokeWidth || 3));
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  drawPath.appendChild(path);
}

function finalizePath() {
  if (drawPath && drawPoints.length > 1) {
    drawPath.style.pointerEvents = 'auto';
    drawPath.className = 'canvas-el';
    drawPath.dataset.type = 'draw';
    // Convert to absolute position for dragging
    makeDraggable(drawPath);
  }
  drawPath = null;
  drawPoints = [];
}

// ============================================
// PUBLISH DESIGN
// ============================================
function publishDesign() {
  // Show publish form modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '3000';
  overlay.innerHTML = `
    <div class="publish-modal">
      <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <h2>Publish Design</h2>
      <p>Share your creation with the Moodly community</p>
      <div class="form-group">
        <label class="form-label">Title</label>
        <input type="text" id="publishTitle" class="form-input" placeholder="Give your design a name" value="${document.getElementById('canvasTitle').value}">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea id="publishDesc" class="form-textarea" placeholder="What's the mood? Describe your design…"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select id="publishCat" class="tool-select" style="width:100%;padding:12px 16px">
          <option>Design</option><option>Architecture</option><option>Nature</option>
          <option>Fashion</option><option>Urban</option><option>Interior</option><option>Photography</option>
        </select>
      </div>
      <div class="publish-actions">
        <button class="btn-publish-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-publish-confirm" onclick="confirmPublish(this)">
          ✦ Publish to Feed
        </button>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
}

async function confirmPublish(btn) {
  const title = document.getElementById('publishTitle').value.trim() || 'Untitled';
  const desc = document.getElementById('publishDesc').value.trim();
  const category = document.getElementById('publishCat').value;

  btn.textContent = 'Publishing…';
  btn.disabled = true;

  // Capture canvas as image
  let canvasDataUrl = '';
  try {
    const board = document.getElementById('canvasBoard');
    // Simple CSS snapshot approach
    canvasDataUrl = await captureCanvas(board);
  } catch (e) {}

  const pinData = {
    title,
    description: desc,
    category,
    color: fillColor,
    gradient: canvasBg.startsWith('linear') ? canvasBg : '',
    canvas_data: canvasDataUrl,
    type: 'design'
  };

  try {
    const res = await fetch('/api/pins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pinData)
    });
    const newPin = await res.json();
    allPins.unshift(newPin);
    renderPins();

    document.querySelector('.modal-overlay[style*="3000"]')?.remove();
    _closeCanvas();
    showToast('✦ Design published to feed!', 'success');
    setTimeout(() => scrollToFeed(), 500);
  } catch (e) {
    showToast('Failed to publish', 'error');
    btn.textContent = 'Publish to Feed';
    btn.disabled = false;
  }
}

async function captureCanvas(board) {
  // Create a canvas element for export
  return new Promise(resolve => {
    try {
      const canvas = document.createElement('canvas');
      const rect = board.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');

      // Draw background
      if (canvasBg.startsWith('linear-gradient')) {
        // Parse gradient
        const colors = canvasBg.match(/#[0-9a-fA-F]{3,8}/g) || ['#0d0d0d', '#1a1a1a'];
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[colors.length - 1] || colors[0]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = canvasBg || '#0d0d0d';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw shapes
      board.querySelectorAll('.canvas-el').forEach(el => {
        const eRect = el.getBoundingClientRect();
        const x = eRect.left - rect.left;
        const y = eRect.top - rect.top;
        const w = eRect.width;
        const h = eRect.height;
        const type = el.dataset.type;

        if (type === 'rect') {
          ctx.fillStyle = el.style.background || fillColor;
          ctx.fillRect(x, y, w, h);
        } else if (type === 'circle') {
          ctx.fillStyle = el.style.background || fillColor;
          ctx.beginPath();
          ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI*2);
          ctx.fill();
        } else if (type === 'text') {
          ctx.fillStyle = el.style.color || '#fff';
          ctx.font = `${el.style.fontWeight || 700} ${el.style.fontSize || '32px'} ${el.style.fontFamily || 'Syne'}`;
          ctx.fillText(el.textContent || '', x, y + parseInt(el.style.fontSize || 32));
        } else if (type === 'image') {
          const img = new Image();
          img.src = el.src;
          ctx.drawImage(img, x, y, w, h);
        }
      });

      resolve(canvas.toDataURL('image/png', 0.85));
    } catch {
      resolve('');
    }
  });
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function setupKeyboard() {
  document.addEventListener('keydown', e => {
    // Open search on Cmd+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
    // Close modals on Escape
    if (e.key === 'Escape') {
      document.getElementById('pinModal').classList.remove('open');
      document.getElementById('profileDropdown').classList.remove('open');
    }
    // Canvas shortcuts
    if (document.getElementById('canvasModal').classList.contains('open')) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.isContentEditable) return;
        deleteSelected();
      }
      if (e.key === 'v') setTool('select');
      if (e.key === 't') setTool('text');
      if (e.key === 'r') setTool('rect');
      if (e.key === 'c') setTool('circle');
      if (e.key === 'd') setTool('draw');
    }
  });
}

// ============================================
// TOAST
// ============================================
let toastTimer;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  clearTimeout(toastTimer);
  requestAnimationFrame(() => {
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  });
}
