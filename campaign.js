/**
 * Campaign Converter — Campaign Data
 * Load your campaign arrays once; all tools share them via localStorage.
 */

const CC_CAMP_KEY = 'cc_campaign';

// ── Storage ────────────────────────────────────────────────────────────────

function getCampaign() {
  try { return JSON.parse(localStorage.getItem(CC_CAMP_KEY)) || {}; }
  catch { return {}; }
}

function saveCampaignType(type, arr) {
  const c = getCampaign();
  c[type] = arr;
  localStorage.setItem(CC_CAMP_KEY, JSON.stringify(c));
}

function clearCampaignType(type) {
  const c = getCampaign();
  delete c[type];
  localStorage.setItem(CC_CAMP_KEY, JSON.stringify(c));
}

function clearAllCampaign() {
  localStorage.removeItem(CC_CAMP_KEY);
}

function parseCampaignInput(raw) {
  raw = raw.trim().replace(/^(var|const|let)\s+\w+\s*=\s*/, '').replace(/;?\s*$/, '');
  return JSON.parse(raw);
}

// ── Extractors ─────────────────────────────────────────────────────────────

function campaignGetMMCCodes() {
  const c = getCampaign();
  return [...new Set((c.models || []).map(r => r.MMC).filter(Boolean))];
}

function campaignGetTrimCodes() {
  const c = getCampaign();
  return [...new Set((c.trim || []).map(r => r.TRIM).filter(Boolean))];
}

function campaignGetExtColorCodes() {
  const c = getCampaign();
  return [...new Set((c.exterior || []).map(r => r.DERIVED_FIELDS1).filter(Boolean))];
}

function campaignGetInteriorCodes() {
  const c = getCampaign();
  return [...new Set((c.interior || []).map(r => r.INTERIOR_CODE).filter(Boolean))];
}

// Trim pairs with smart MMC filter:
// If a trim pair appears with all known MMCs → filterMode: 'all'
// If only with some → filterMode: 'only', filterMMCs: [those MMCs]
function campaignGetTrimPairs() {
  const c = getCampaign();
  if (!c.trim || !c.trim.length) return [];

  const allMMCs = campaignGetMMCCodes();
  const trimMap = new Map(); // "TRIM|TEXT" -> Set of MMCs

  c.trim.forEach(r => {
    if (!r.TRIM || !r.TRIM_TEXT) return;
    const key = `${r.TRIM}|${r.TRIM_TEXT}`;
    if (!trimMap.has(key)) trimMap.set(key, new Set());
    if (r.MMC) trimMap.get(key).add(r.MMC);
  });

  const pairs = [];
  for (const [key, mmcSet] of trimMap) {
    const pipeIdx = key.indexOf('|');
    const trim = key.slice(0, pipeIdx);
    const text = key.slice(pipeIdx + 1);
    const filterMMCs = [...mmcSet];
    const coversAll = allMMCs.length > 0 && allMMCs.every(m => mmcSet.has(m));
    pairs.push({
      trim,
      text,
      filterMode: coversAll || filterMMCs.length === 0 ? 'all' : 'only',
      filterMMCs: coversAll ? [] : filterMMCs,
    });
  }
  return pairs;
}

function campaignGetExteriorPairs() {
  const c = getCampaign();
  const seen = new Set();
  const pairs = [];
  (c.exterior || []).forEach(r => {
    if (!r.DERIVED_FIELDS1 || !r.EXTERIOR_TEXT) return;
    const key = `${r.DERIVED_FIELDS1}|${r.EXTERIOR_TEXT}`;
    if (!seen.has(key)) { seen.add(key); pairs.push({ code: r.DERIVED_FIELDS1, name: r.EXTERIOR_TEXT }); }
  });
  return pairs;
}

function campaignGetInteriorPairs() {
  const c = getCampaign();
  const seen = new Set();
  const pairs = [];
  (c.interior || []).forEach(r => {
    if (!r.INTERIOR_CODE || !r.INTERIOR_TEXT) return;
    const key = `${r.INTERIOR_CODE}|${r.INTERIOR_TEXT}`;
    if (!seen.has(key)) { seen.add(key); pairs.push({ code: r.INTERIOR_CODE, text: r.INTERIOR_TEXT }); }
  });
  return pairs;
}

function campaignGetModelPairs() {
  const c = getCampaign();
  const seen = new Set();
  const pairs = [];
  (c.models || []).forEach(r => {
    if (!r.MMC || !r.MODEL_NAME) return;
    const key = `${r.MMC}|${r.MODEL_NAME}`;
    if (!seen.has(key)) { seen.add(key); pairs.push({ mmc: r.MMC, name: r.MODEL_NAME }); }
  });
  return pairs;
}

function campaignGetMMCModelMap() {
  const c = getCampaign();
  const map = {};
  (c.models || []).forEach(r => { if (r.MMC && r.MODEL_NAME) map[r.MMC] = r.MODEL_NAME; });
  return map;
}

// ── Campaign banner ────────────────────────────────────────────────────────
// Each tool calls initCampaignBanner() to inject a load prompt at the top of its sidebar.

const CAMP_COLOR = '#818cf8';

function _campCount(type) {
  const arr = getCampaign()[type];
  return arr && arr.length ? arr.length : 0;
}

function _campChips() {
  const types = [
    { key: 'trim',     label: 'Trim' },
    { key: 'exterior', label: 'Ext'  },
    { key: 'interior', label: 'Int'  },
    { key: 'models',   label: 'Models' },
  ];
  return types.map(({ key, label }) => {
    const n = _campCount(key);
    return n > 0
      ? `<span style="font-family:var(--mono);font-size:10px;padding:1px 8px;border-radius:3px;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.3);color:${CAMP_COLOR}">${label} <b>${n}</b></span>`
      : `<span style="font-family:var(--mono);font-size:10px;padding:1px 8px;border-radius:3px;background:transparent;border:1px solid #262626;color:#444">${label}</span>`;
  }).join('');
}

function initCampaignBanner(containerId, onLoadFnName) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const c = getCampaign();
  const hasAny = ['trim','exterior','interior','models'].some(k => c[k] && c[k].length);

  if (!hasAny) {
    container.innerHTML = `
      <div style="border:1px dashed #262626;border-radius:4px;padding:9px 12px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
        <span style="font-family:var(--mono);font-size:10px;color:#444;letter-spacing:0.08em">NO CAMPAIGN LOADED</span>
        <a href="campaign.html" style="font-family:var(--mono);font-size:10px;color:${CAMP_COLOR};text-decoration:none;padding:2px 8px;border:1px solid rgba(129,140,248,0.35);border-radius:3px">Set up →</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="background:rgba(129,140,248,0.06);border:1px solid rgba(129,140,248,0.2);border-radius:4px;padding:10px 12px;margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <span style="font-family:var(--mono);font-size:10px;font-weight:600;letter-spacing:0.12em;color:${CAMP_COLOR}">CAMPAIGN DATA</span>
        <a href="campaign.html" style="font-family:var(--mono);font-size:10px;color:#555;text-decoration:none;letter-spacing:0.06em">Edit →</a>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:9px">${_campChips()}</div>
      <button onclick="${onLoadFnName}" style="width:100%;background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.35);color:${CAMP_COLOR};font-family:var(--mono);font-size:11px;font-weight:600;padding:5px 12px;border-radius:3px;cursor:pointer;letter-spacing:0.06em;transition:background 0.13s" onmouseover="this.style.background='rgba(129,140,248,0.2)'" onmouseout="this.style.background='rgba(129,140,248,0.1)'">↓ Load into tool</button>
    </div>`;
}
