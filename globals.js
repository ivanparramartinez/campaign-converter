/**
 * Campaign Converter — Shared Globals
 * Persists brand + years across collection pages via localStorage.
 */

const CC_KEY = 'cc_globals';

function getGlobals() {
  try { return JSON.parse(localStorage.getItem(CC_KEY)) || {}; }
  catch { return {}; }
}

function saveGlobals(patch) {
  localStorage.setItem(CC_KEY, JSON.stringify({ ...getGlobals(), ...patch }));
  renderGlobalBar();
}

function clearGlobals() {
  localStorage.removeItem(CC_KEY);
  renderGlobalBar();
}

// ── Global bar ─────────────────────────────────────────────────────────────
// Injected between the top-nav and the tool header.
// Each page calls initGlobals({ onBrand, onYears }) to wire up callbacks.

let _callbacks = {};

function initGlobals({ onBrand, onYears } = {}) {
  _callbacks = { onBrand, onYears };

  // Inject bar container right after the top-nav div
  const bar = document.createElement('div');
  bar.id = 'cc-global-bar';
  bar.style.cssText = [
    'border-bottom:1px solid #262626',
    'padding:6px 20px',
    'display:flex',
    'align-items:center',
    'gap:10px',
    'background:#0d0d0d',
    'font-family:"IBM Plex Mono",monospace',
    'font-size:11px',
    'flex-wrap:wrap',
    'min-height:32px',
  ].join(';');

  // Insert after the sticky nav (first div child of body)
  const nav = document.body.querySelector('div');
  nav.insertAdjacentElement('afterend', bar);

  renderGlobalBar();
  applyGlobals();
}

function renderGlobalBar() {
  const bar = document.getElementById('cc-global-bar');
  if (!bar) return;
  const g = getGlobals();
  const hasAny = g.brand || (g.years && g.years.length);

  if (!hasAny) {
    bar.innerHTML = '<span style="color:#444;letter-spacing:0.08em">GLOBALS — none set</span>';
    return;
  }

  const chips = [];
  if (g.brand) {
    chips.push(`<span style="background:rgba(200,255,0,0.08);border:1px solid rgba(200,255,0,0.25);color:#c8ff00;border-radius:3px;padding:2px 9px;letter-spacing:0.06em">${g.brand}</span>`);
  }
  (g.years || []).forEach(y => {
    chips.push(`<span style="background:#1c1c1c;border:1px solid #333;color:#e8e8e0;border-radius:3px;padding:2px 9px">${y}</span>`);
  });

  bar.innerHTML = `
    <span style="color:#555;letter-spacing:0.08em;white-space:nowrap">GLOBALS</span>
    ${chips.join('')}
    <button onclick="clearGlobalsAndPage()" style="margin-left:auto;background:transparent;border:1px solid #333;color:#666;font-family:inherit;font-size:10px;padding:2px 9px;border-radius:3px;cursor:pointer;letter-spacing:0.06em;transition:color 0.1s" onmouseover="this.style.color='#ff4455';this.style.borderColor='#ff4455'" onmouseout="this.style.color='#666';this.style.borderColor='#333'">× Clear globals</button>
  `;
}

function applyGlobals() {
  const g = getGlobals();

  // Apply brand
  if (g.brand) {
    const sel = document.getElementById('inBrand');
    if (sel) {
      sel.value = g.brand;
      if (_callbacks.onBrand) _callbacks.onBrand(g.brand);
    }
  }

  // Apply years
  if (g.years && g.years.length && _callbacks.onYears) {
    _callbacks.onYears(g.years);
  }
}

function clearGlobalsAndPage() {
  clearGlobals();
  // Reset brand select
  const sel = document.getElementById('inBrand');
  if (sel) sel.value = '';
  // Reset years via callback
  if (_callbacks.onYears) _callbacks.onYears([]);
}
