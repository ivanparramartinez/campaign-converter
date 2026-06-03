/**
 * Campaign Converter — Shared Globals
 * Persists brand, years, nameplates, MMCs, trim pairs, interior pairs,
 * exterior pairs, and MMC→model map across all tool pages via localStorage.
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

// ── Individual removal — basic fields ─────────────────────────────────────────

function removeGlobalBrand() {
  const g = getGlobals();
  delete g.brand;
  localStorage.setItem(CC_KEY, JSON.stringify(g));
  const sel = document.getElementById('inBrand');
  if (sel) sel.value = '';
  renderGlobalBar();
}

function removeGlobalYear(year) {
  const g = getGlobals();
  g.years = (g.years || []).filter(y => y !== year);
  localStorage.setItem(CC_KEY, JSON.stringify(g));
  if (_callbacks.onYears) _callbacks.onYears(g.years);
  renderGlobalBar();
}

function removeGlobalNameplate(np) {
  const g = getGlobals();
  g.nameplates = (g.nameplates || []).filter(n => n !== np);
  localStorage.setItem(CC_KEY, JSON.stringify(g));
  if (_callbacks.onNameplates) _callbacks.onNameplates(g.nameplates);
  renderGlobalBar();
}

// ── Clear by category — new data types ────────────────────────────────────────

function clearGlobalMMCs() {
  const g = getGlobals();
  delete g.mmcs;
  localStorage.setItem(CC_KEY, JSON.stringify(g));
  if (_callbacks.onMMCs) _callbacks.onMMCs([]);
  renderGlobalBar();
}

function clearGlobalTrimPairs() {
  const g = getGlobals();
  delete g.trimPairs;
  localStorage.setItem(CC_KEY, JSON.stringify(g));
  if (_callbacks.onTrimPairs) _callbacks.onTrimPairs([]);
  renderGlobalBar();
}

function clearGlobalInteriorPairs() {
  const g = getGlobals();
  delete g.interiorPairs;
  localStorage.setItem(CC_KEY, JSON.stringify(g));
  if (_callbacks.onInteriorPairs) _callbacks.onInteriorPairs([]);
  renderGlobalBar();
}

function clearGlobalExteriorPairs() {
  const g = getGlobals();
  delete g.exteriorPairs;
  localStorage.setItem(CC_KEY, JSON.stringify(g));
  if (_callbacks.onExteriorPairs) _callbacks.onExteriorPairs([]);
  renderGlobalBar();
}

function clearGlobalMMCModelMap() {
  const g = getGlobals();
  delete g.mmcModelMap;
  localStorage.setItem(CC_KEY, JSON.stringify(g));
  if (_callbacks.onMMCModelMap) _callbacks.onMMCModelMap({});
  renderGlobalBar();
}

// ── Global bar ─────────────────────────────────────────────────────────────────

let _callbacks = {};

/**
 * @param {Object} opts
 * @param {Function} [opts.onBrand]
 * @param {Function} [opts.onYears]
 * @param {Function} [opts.onNameplates]
 * @param {Function} [opts.onMMCs]          — receives string[]
 * @param {Function} [opts.onTrimPairs]     — receives {trim,text,filterMode,filterMMCs}[]
 * @param {Function} [opts.onInteriorPairs] — receives {code,text}[]
 * @param {Function} [opts.onExteriorPairs] — receives {code,name}[]
 * @param {Function} [opts.onMMCModelMap]   — receives {[mmc]:modelName}
 */
function initGlobals(opts = {}) {
  _callbacks = opts;

  const bar = document.createElement('div');
  bar.id = 'cc-global-bar';
  bar.style.cssText = [
    'border-bottom:1px solid #262626',
    'padding:6px 20px',
    'display:flex',
    'align-items:center',
    'gap:8px',
    'background:#0d0d0d',
    'font-family:"IBM Plex Mono",monospace',
    'font-size:11px',
    'flex-wrap:wrap',
    'min-height:32px',
  ].join(';');

  const nav = document.body.querySelector('div');
  nav.insertAdjacentElement('afterend', bar);

  renderGlobalBar();
  applyGlobals();
}

// Shared chip × button
function _xBtn(onclick) {
  return `<span onclick="${onclick}" style="margin-left:5px;cursor:pointer;color:#555;line-height:1;transition:color 0.1s" onmouseover="this.style.color='#ff4455'" onmouseout="this.style.color='#555'">×</span>`;
}

// Count chip for data-type categories
function _countChip(label, count, clearFn, color) {
  const rgb = _hexToRgbStr(color);
  return `<span style="display:inline-flex;align-items:center;background:rgba(${rgb},0.08);border:1px solid rgba(${rgb},0.25);color:${color};border-radius:3px;padding:2px 9px;letter-spacing:0.06em;font-size:11px">
    ${label}&nbsp;<b style="font-weight:600">${count}</b>${_xBtn(`${clearFn}()`)}
  </span>`;
}

function _hexToRgbStr(hex) {
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `${r},${g},${b}`;
}

function renderGlobalBar() {
  const bar = document.getElementById('cc-global-bar');
  if (!bar) return;
  const g = getGlobals();

  const hasBasic = g.brand || (g.years && g.years.length) || (g.nameplates && g.nameplates.length);
  const hasMMCs  = g.mmcs && g.mmcs.length;
  const hasTrims = g.trimPairs && g.trimPairs.length;
  const hasExt   = g.exteriorPairs && g.exteriorPairs.length;
  const hasInt   = g.interiorPairs && g.interiorPairs.length;
  const hasMdl   = g.mmcModelMap && Object.keys(g.mmcModelMap).length;
  const hasAny   = hasBasic || hasMMCs || hasTrims || hasExt || hasInt || hasMdl;

  if (!hasAny) {
    bar.innerHTML = '<span style="color:#444;letter-spacing:0.08em">GLOBALS — none set</span>';
    return;
  }

  const chips = [];

  // ── Basic fields ──────────────────────────────────────────────────────────
  if (g.brand) {
    chips.push(`
      <span style="display:inline-flex;align-items:center;background:rgba(200,255,0,0.08);border:1px solid rgba(200,255,0,0.25);color:#c8ff00;border-radius:3px;padding:2px 9px;letter-spacing:0.06em">
        ${g.brand}${_xBtn('removeGlobalBrand()')}
      </span>`);
  }

  if (g.years && g.years.length) {
    chips.push(`<span style="color:#555;padding:0 2px">YR</span>`);
    g.years.forEach(y => {
      chips.push(`
        <span style="display:inline-flex;align-items:center;background:#1c1c1c;border:1px solid #333;color:#e8e8e0;border-radius:3px;padding:2px 9px">
          ${y}${_xBtn(`removeGlobalYear('${y}')`)}
        </span>`);
    });
  }

  if (g.nameplates && g.nameplates.length) {
    chips.push(`<span style="color:#555;padding:0 2px">NP</span>`);
    g.nameplates.forEach(np => {
      const safe = np.replace(/'/g, "\\'");
      chips.push(`
        <span style="display:inline-flex;align-items:center;background:#1c1c1c;border:1px solid rgba(0,200,255,0.25);color:#00c8ff;border-radius:3px;padding:2px 9px">
          ${np}${_xBtn(`removeGlobalNameplate('${safe}')`)}
        </span>`);
    });
  }

  // ── Data-type category chips ──────────────────────────────────────────────
  if (hasMMCs) {
    chips.push(_countChip('MMC', g.mmcs.length, 'clearGlobalMMCs', '#34d399'));
  }
  if (hasTrims) {
    chips.push(_countChip('TRIM', g.trimPairs.length, 'clearGlobalTrimPairs', '#f87171'));
  }
  if (hasExt) {
    chips.push(_countChip('EXT', g.exteriorPairs.length, 'clearGlobalExteriorPairs', '#ff9f43'));
  }
  if (hasInt) {
    chips.push(_countChip('INT', g.interiorPairs.length, 'clearGlobalInteriorPairs', '#c084fc'));
  }
  if (hasMdl) {
    chips.push(_countChip('MDL', Object.keys(g.mmcModelMap).length, 'clearGlobalMMCModelMap', '#00c8ff'));
  }

  bar.innerHTML = `
    <span style="color:#555;letter-spacing:0.08em;white-space:nowrap">GLOBALS</span>
    ${chips.join('')}
    <button onclick="clearGlobalsAndPage()" style="margin-left:auto;background:transparent;border:1px solid #333;color:#666;font-family:inherit;font-size:10px;padding:2px 9px;border-radius:3px;cursor:pointer;letter-spacing:0.06em;transition:color 0.1s" onmouseover="this.style.color='#ff4455';this.style.borderColor='#ff4455'" onmouseout="this.style.color='#666';this.style.borderColor='#333'">× Clear all</button>
  `;
}

function applyGlobals() {
  const g = getGlobals();

  if (g.brand) {
    const sel = document.getElementById('inBrand');
    if (sel) {
      sel.value = g.brand;
      if (_callbacks.onBrand) _callbacks.onBrand(g.brand);
    }
  }

  if (g.years && g.years.length && _callbacks.onYears) {
    _callbacks.onYears(g.years);
  }

  if (g.nameplates && g.nameplates.length && _callbacks.onNameplates) {
    _callbacks.onNameplates(g.nameplates);
  }

  if (g.mmcs && g.mmcs.length && _callbacks.onMMCs) {
    _callbacks.onMMCs(g.mmcs);
  }

  if (g.trimPairs && g.trimPairs.length && _callbacks.onTrimPairs) {
    _callbacks.onTrimPairs(g.trimPairs);
  }

  if (g.interiorPairs && g.interiorPairs.length && _callbacks.onInteriorPairs) {
    _callbacks.onInteriorPairs(g.interiorPairs);
  }

  if (g.exteriorPairs && g.exteriorPairs.length && _callbacks.onExteriorPairs) {
    _callbacks.onExteriorPairs(g.exteriorPairs);
  }

  if (g.mmcModelMap && Object.keys(g.mmcModelMap).length && _callbacks.onMMCModelMap) {
    _callbacks.onMMCModelMap(g.mmcModelMap);
  }
}

function clearGlobalsAndPage() {
  clearGlobals();
  const sel = document.getElementById('inBrand');
  if (sel) sel.value = '';
  if (_callbacks.onYears)          _callbacks.onYears([]);
  if (_callbacks.onNameplates)     _callbacks.onNameplates([]);
  if (_callbacks.onMMCs)           _callbacks.onMMCs([]);
  if (_callbacks.onTrimPairs)      _callbacks.onTrimPairs([]);
  if (_callbacks.onInteriorPairs)  _callbacks.onInteriorPairs([]);
  if (_callbacks.onExteriorPairs)  _callbacks.onExteriorPairs([]);
  if (_callbacks.onMMCModelMap)    _callbacks.onMMCModelMap({});
}
