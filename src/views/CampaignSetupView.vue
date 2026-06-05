<template>
  <div class="page">
    <AppHeader />

    <div class="tool-header">
      <div class="logo">Campaign <span>//</span> Data Setup</div>
      <div class="header-chips">
        <HeaderChip v-if="g.mmcs.length"         label="MMC"  :count="g.mmcs.length"         color="#34d399" />
        <HeaderChip v-if="g.trimPairs.length"     label="TRIM" :count="g.trimPairs.length"     color="#f87171" />
        <HeaderChip v-if="g.exteriorPairs.length" label="EXT"  :count="g.exteriorPairs.length" color="#ff9f43" />
        <HeaderChip v-if="g.interiorPairs.length" label="INT"  :count="g.interiorPairs.length" color="#c084fc" />
      </div>
    </div>

    <div class="layout">
      <!-- LEFT: INPUT -->
      <div class="left-col">

        <!-- MMC -->
        <div class="section">
          <div class="section-title" style="--dot:var(--c-mmc)">
            <span class="dot" style="background:var(--c-mmc)"></span>
            MMC / Model Names
            <span class="cnt" v-if="mmcPairs.length"><b>{{ mmcPairs.length }}</b> pairs</span>
            <span class="cnt" v-else>—</span>
          </div>
          <div class="hint">One per line: <code>TC10543 Canyon</code> | <code>TK10906 Sierra 1500</code></div>
          <textarea v-model="rawMmc" rows="5" placeholder="TC10543 Canyon&#10;TK10906 Sierra 1500" @input="updatePreview('mmc')" />
        </div>

        <!-- TRIM -->
        <div class="section">
          <div class="section-title">
            <span class="dot" style="background:var(--c-trim)"></span>
            Trims
            <span class="cnt" v-if="trimPairsLocal.length"><b>{{ trimPairsLocal.length }}</b> pairs</span>
            <span class="cnt" v-else>—</span>
          </div>
          <div class="hint">
            <code>3SA SLE</code> (all MMCs) &nbsp;·&nbsp;
            <code>3SA SLE only:TC10543</code> &nbsp;·&nbsp;
            <code>3SA SLE excl:TK10906</code>
          </div>
          <textarea v-model="rawTrim" rows="6" placeholder="3SA SLE&#10;3SB SLT only:TC10543&#10;4SB Denali excl:TK10906" />
        </div>

        <!-- EXTERIOR -->
        <div class="section">
          <div class="section-title">
            <span class="dot" style="background:var(--c-ext)"></span>
            Exterior Colors
            <span class="cnt" v-if="extPairs.length"><b>{{ extPairs.length }}</b> pairs</span>
            <span class="cnt" v-else>—</span>
          </div>
          <div class="hint">One per line: <code>GAZ Summit White</code> | <code>GBA Onyx Black</code></div>
          <textarea v-model="rawExt" rows="5" placeholder="GAZ Summit White&#10;GBA Onyx Black" />
        </div>

        <!-- INTERIOR -->
        <div class="section">
          <div class="section-title">
            <span class="dot" style="background:var(--c-int)"></span>
            Interior Colors
            <span class="cnt" v-if="intPairs.length"><b>{{ intPairs.length }}</b> pairs</span>
            <span class="cnt" v-else>—</span>
          </div>
          <div class="hint">Tab or space separated: <code>H2G&nbsp;&nbsp;Jet Black Vinyl</code></div>
          <textarea v-model="rawInt" rows="5" placeholder="H2G	Jet Black Vinyl&#10;H1T	Jet Black Cloth" />
        </div>

        <!-- ACTIONS -->
        <div class="actions">
          <button class="btn btn-accent" @click="loadAll">⚡ Load into all tools</button>
          <button class="btn btn-danger btn-sm" @click="clearAll">↺ Clear all</button>
          <span class="status-msg" :class="statusClass" v-if="statusMsg">{{ statusMsg }}</span>
          <button class="btn btn-cyan btn-sm" style="margin-left:auto" @click="showMerge = !showMerge">
            {{ showMerge ? '⊗ Close merge' : '⊕ Merge with existing data' }}
          </button>
        </div>
      </div>

      <!-- RIGHT: PREVIEW -->
      <div class="right-col">
        <PreviewBox label="MMC codes & model names" color="#34d399" :items="mmcPairs.map(p => `${p.mmc} → ${p.name}`)" />
        <PreviewBox label="Trim pairs" color="#f87171" :items="trimPairsLocal.map(p => `${p.trim} → ${p.text}${p.filterMode !== 'all' ? ` [${p.filterMode}: ${p.filterMMCs.join(',')}]` : ''}`)" />
        <PreviewBox label="Exterior color pairs" color="#ff9f43" :items="extPairs.map(p => `${p.code} → ${p.name}`)" />
        <PreviewBox label="Interior color pairs" color="#c084fc" :items="intPairs.map(p => `${p.code} → ${p.text}`)" />

        <div class="tool-links-section">
          <div class="tl-label">Go to tool →</div>
          <div class="tool-links">
            <router-link to="/checker"         class="tool-link"><div class="tl-num">Tool 01</div><div class="tl-name">Image Checker</div></router-link>
            <router-link to="/generator"       class="tool-link"><div class="tl-num">Tool 02</div><div class="tl-name">JSON Generator</div></router-link>
            <router-link to="/trim-collection" class="tool-link"><div class="tl-num">Tool 03</div><div class="tl-name">Trim Collection</div></router-link>
            <router-link to="/interior"        class="tool-link"><div class="tl-num">Tool 04</div><div class="tl-name">Interior Builder</div></router-link>
            <router-link to="/exteriors"       class="tool-link"><div class="tl-num">Tool 05</div><div class="tl-name">Exteriors</div></router-link>
            <router-link to="/models"          class="tool-link"><div class="tl-num">Tool 06</div><div class="tl-name">Model Collection</div></router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- MERGE SECTION -->
    <div class="merge-section" v-if="showMerge">
      <div class="merge-header">
        <div class="merge-title">⊕ Merge new data with existing DB records</div>
        <span class="merge-note">Exterior & Interior applied to <b>all model names</b> from MMC/Models</span>
        <button class="btn btn-accent btn-sm" @click="runMerge">⚡ Generate merge</button>
      </div>

      <div class="merge-hint">Paste directly from Excel — columns in this exact order:</div>

      <div class="merge-grid">
        <div class="merge-col" v-for="col in mergeCols" :key="col.type">
          <div class="merge-col-title">
            <span class="dot" :style="{ background: col.color }"></span>
            {{ col.label }}
          </div>
          <div class="merge-col-fields">{{ col.fields.join(' · ') }}</div>
          <textarea v-model="col.raw" rows="6" :placeholder="col.placeholder" style="font-size:11px" />
          <div class="merge-col-cnt">{{ col.rawCount ? `${col.rawCount} rows detected` : '—' }}</div>
        </div>
      </div>

      <div class="merge-results" v-if="mergeResults.length">
        <div class="merge-result-col" v-for="res in mergeResults" :key="res.label">
          <div class="merge-result-title">
            <span style="display:flex;align-items:center;gap:6px">
              <span class="dot" :style="{ background: res.color }"></span>
              <span>{{ res.label }}</span>
            </span>
            <div style="display:flex;gap:5px">
              <button class="merge-copy-btn" @click="copyMergeNew(res.type)">⎘ New only</button>
              <button class="merge-copy-btn" @click="copyMergeFull(res.type)">⎘ Full merge</button>
            </div>
          </div>
          <div class="merge-stat new">✓ <b>{{ res.newRecs.length }}</b> new records</div>
          <div class="merge-stat dup">= <b>{{ res.dups }}</b> already existed</div>
          <div class="merge-preview">
            <div v-for="(row, i) in res.newRecs.slice(0, 8)" :key="i" class="merge-row-new">
              {{ res.fields.map(f => row[f] ?? '').join(' · ') }}
            </div>
            <div v-if="res.newRecs.length > 8" style="color:var(--muted)">… and {{ res.newRecs.length - 8 }} more</div>
            <div v-if="!res.newRecs.length" style="color:var(--muted)">— no new records —</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useGlobalsStore } from '../stores/globals.js'

const g = useGlobalsStore()

// Raw textarea state
const rawMmc  = ref('')
const rawTrim = ref('')
const rawExt  = ref('')
const rawInt  = ref('')

const statusMsg   = ref('')
const statusClass = ref('')
const showMerge   = ref(false)

let statusTimer = null

// ── Parsers ──────────────────────────────────────────────────────────────────

const mmcPairs = computed(() => {
  const pairs = []
  rawMmc.value.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    const idx = line.search(/\s/)
    if (idx === -1) return
    const mmc  = line.slice(0, idx).toUpperCase()
    const name = line.slice(idx).trim()
    if (mmc && name && !pairs.find(p => p.mmc === mmc)) pairs.push({ mmc, name })
  })
  return pairs
})

const trimPairsLocal = computed(() => {
  const pairs = []
  rawTrim.value.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    let filterMode = 'all', filterMMCs = []
    const fm = line.match(/\s+(only|excl):([^\s]+)$/i)
    if (fm) {
      filterMode = fm[1].toLowerCase() === 'only' ? 'only' : 'exclude'
      filterMMCs = fm[2].toUpperCase().split(',').filter(Boolean)
      line = line.slice(0, fm.index).trim()
    }
    const idx = line.search(/\s/)
    if (idx === -1) return
    const trim = line.slice(0, idx).toUpperCase()
    const text = line.slice(idx).trim()
    if (trim && text && !pairs.find(p => p.trim === trim && p.text === text))
      pairs.push({ trim, text, filterMode, filterMMCs })
  })
  return pairs
})

const extPairs = computed(() => {
  const pairs = []
  rawExt.value.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    const idx = line.search(/\s/)
    if (idx === -1) return
    const code = line.slice(0, idx).toUpperCase()
    const name = line.slice(idx).trim()
    if (code && name && !pairs.find(p => p.code === code)) pairs.push({ code, name })
  })
  return pairs
})

const intPairs = computed(() => {
  const pairs = []
  rawInt.value.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    const idx = line.search(/\s/)
    if (idx === -1) return
    const code = line.slice(0, idx).toUpperCase()
    const text = line.slice(idx).trim()
    if (code && text && !pairs.find(p => p.code === code)) pairs.push({ code, text })
  })
  return pairs
})

// ── Actions ───────────────────────────────────────────────────────────────────

function loadAll() {
  const mmcMap = {}
  mmcPairs.value.forEach(p => { mmcMap[p.mmc] = p.name })
  g.setMMCs(mmcPairs.value.map(p => p.mmc), mmcMap)
  g.setTrimPairs(trimPairsLocal.value)
  g.setExteriorPairs(extPairs.value)
  g.setInteriorPairs(intPairs.value)

  const parts = []
  if (mmcPairs.value.length)     parts.push(`${mmcPairs.value.length} MMCs`)
  if (trimPairsLocal.value.length) parts.push(`${trimPairsLocal.value.length} trims`)
  if (extPairs.value.length)     parts.push(`${extPairs.value.length} ext colors`)
  if (intPairs.value.length)     parts.push(`${intPairs.value.length} int colors`)

  if (!parts.length) { showStatus('Paste at least one section of data first.', 'warn'); return }
  showStatus(`✓ ${parts.join(' · ')} loaded into all tools`, 'ok')
}

function clearAll() {
  rawMmc.value = rawTrim.value = rawExt.value = rawInt.value = ''
  g.clearAll()
  showStatus('All data cleared.', 'warn')
}

function showStatus(msg, type) {
  statusMsg.value = msg
  statusClass.value = type
  clearTimeout(statusTimer)
  if (type === 'ok') statusTimer = setTimeout(() => { statusMsg.value = '' }, 5000)
}

// ── Restore textareas from store on mount ─────────────────────────────────────

onMounted(() => {
  if (Object.keys(g.mmcModelMap).length)
    rawMmc.value = Object.entries(g.mmcModelMap).map(([mmc, name]) => `${mmc} ${name}`).join('\n')
  if (g.trimPairs.length)
    rawTrim.value = g.trimPairs.map(p => {
      let l = `${p.trim} ${p.text}`
      if (p.filterMode === 'only'    && p.filterMMCs.length) l += ` only:${p.filterMMCs.join(',')}`
      if (p.filterMode === 'exclude' && p.filterMMCs.length) l += ` excl:${p.filterMMCs.join(',')}`
      return l
    }).join('\n')
  if (g.exteriorPairs.length)
    rawExt.value = g.exteriorPairs.map(p => `${p.code} ${p.name}`).join('\n')
  if (g.interiorPairs.length)
    rawInt.value = g.interiorPairs.map(p => `${p.code}\t${p.text}`).join('\n')
})

// ── Header chip component inline ──────────────────────────────────────────────
const HeaderChip = {
  props: ['label','count','color'],
  setup(props) {
    const style = computed(() => {
      const h = props.color.replace('#','')
      const r = parseInt(h.slice(0,2),16), gg = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
      return { background:`rgba(${r},${gg},${b},0.08)`, border:`1px solid rgba(${r},${gg},${b},0.28)`, color: props.color }
    })
    return { style }
  },
  template: `<span class="hchip" :style="style">{{ label }} <b>{{ count }}</b></span>`
}

// ── PreviewBox component inline ───────────────────────────────────────────────
const PreviewBox = {
  props: ['label','color','items'],
  setup(props) {
    const style = computed(() => {
      const h = props.color.replace('#','')
      const r = parseInt(h.slice(0,2),16), gg = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
      return { background:`rgba(${r},${gg},${b},0.07)`, border:`1px solid rgba(${r},${gg},${b},0.28)`, color: props.color }
    })
    const dotStyle = computed(() => ({ background: props.color }))
    return { style, dotStyle }
  },
  template: `
    <div class="prev-section">
      <div class="prev-title"><span class="dot" :style="dotStyle"></span>{{ label }}</div>
      <div class="prev-box">
        <div v-if="!items.length" class="prev-empty">— paste data above —</div>
        <div v-else class="tag-row">
          <span v-for="item in items" :key="item" class="ptag" :style="style">{{ item }}</span>
        </div>
      </div>
    </div>`
}

// ── MERGE ─────────────────────────────────────────────────────────────────────

const mergeCols = ref([
  {
    type: 'trim', label: 'Existing Trim data', color: 'var(--c-trim)',
    fields: ['BRAND','MODEL_YR','MMC','TRIM','TRIM_TEXT'],
    placeholder: 'BRAND\tMODEL_YR\tMMC\tTRIM\tTRIM_TEXT\nGMC\t2025\tTC10543\t3SA\tSLE',
    raw: '', rawCount: 0,
  },
  {
    type: 'ext', label: 'Existing Exterior data', color: 'var(--c-ext)',
    fields: ['BRAND','MODEL_YR','VEH_NAME_PLATE','DERIVED_FIELDS1','EXTERIOR_TEXT'],
    placeholder: 'BRAND\tMODEL_YR\tVEH_NAME_PLATE\tDERIVED_FIELDS1\tEXTERIOR_TEXT',
    raw: '', rawCount: 0,
  },
  {
    type: 'int', label: 'Existing Interior data', color: 'var(--c-int)',
    fields: ['BRAND','MODEL_YR','VEH_NAME_PLATE','INTERIOR_CODE','INTERIOR_TEXT'],
    placeholder: 'BRAND\tMODEL_YR\tVEH_NAME_PLATE\tINTERIOR_CODE\tINTERIOR_TEXT',
    raw: '', rawCount: 0,
  },
])

watch(mergeCols, (cols) => {
  cols.forEach(col => {
    col.rawCount = parseTSV(col.raw, col.fields).length
  })
}, { deep: true })

const mergeResults = ref([])
const _mergeNew  = ref({})
const _mergeFull = ref({})

function parseTSV(raw, fields) {
  const lines = raw.trim().split('\n').map(l => l.trimEnd()).filter(Boolean)
  if (!lines.length) return []
  const firstCell = lines[0].split('\t')[0].trim().toUpperCase()
  const known = fields.map(f => f.toUpperCase())
  const start = known.includes(firstCell) ? 1 : 0
  return lines.slice(start).map(line => {
    const cols = line.split('\t')
    const obj = {}
    fields.forEach((f, i) => { obj[f] = (cols[i] || '').trim() })
    return obj
  }).filter(r => fields.some(f => r[f]))
}

function trimAppliesTo(pair, mmc) {
  if (pair.filterMode === 'all')     return true
  if (pair.filterMode === 'only')    return (pair.filterMMCs || []).includes(mmc.toUpperCase())
  if (pair.filterMode === 'exclude') return !(pair.filterMMCs || []).includes(mmc.toUpperCase())
  return true
}

function runMerge() {
  const brand     = g.brand || ''
  const years     = g.years || []
  const mmcMap    = g.mmcModelMap || {}
  const modelNames = [...new Set(Object.values(mmcMap))]

  const newTrim = [], newExt = [], newInt = []
  for (const yr of years) {
    for (const [mmc] of Object.entries(mmcMap)) {
      for (const p of g.trimPairs) {
        if (trimAppliesTo(p, mmc))
          newTrim.push({ BRAND: brand, MODEL_YR: yr, MMC: mmc, TRIM: p.trim, TRIM_TEXT: p.text })
      }
    }
    for (const name of modelNames) {
      for (const p of g.exteriorPairs)
        newExt.push({ BRAND: brand, MODEL_YR: String(yr), VEH_NAME_PLATE: name, DERIVED_FIELDS1: p.code, EXTERIOR_TEXT: p.name })
      for (const p of g.interiorPairs)
        newInt.push({ BRAND: brand, MODEL_YR: String(yr), VEH_NAME_PLATE: name, INTERIOR_CODE: p.code, INTERIOR_TEXT: p.text })
    }
  }

  const cols = mergeCols.value
  const existTrim = parseTSV(cols[0].raw, cols[0].fields)
  const existExt  = parseTSV(cols[1].raw, cols[1].fields)
  const existInt  = parseTSV(cols[2].raw, cols[2].fields)

  const kTrim = r => `${r.BRAND}|${r.MODEL_YR}|${r.MMC}|${r.TRIM}`.toUpperCase()
  const kExt  = r => `${r.BRAND}|${r.MODEL_YR}|${r.VEH_NAME_PLATE}|${r.DERIVED_FIELDS1}`.toUpperCase()
  const kInt  = r => `${r.BRAND}|${r.MODEL_YR}|${r.VEH_NAME_PLATE}|${r.INTERIOR_CODE}`.toUpperCase()

  const setT = new Set(existTrim.map(kTrim))
  const setE = new Set(existExt.map(kExt))
  const setI = new Set(existInt.map(kInt))

  const onlyT = newTrim.filter(r => !setT.has(kTrim(r)))
  const onlyE = newExt.filter(r  => !setE.has(kExt(r)))
  const onlyI = newInt.filter(r  => !setI.has(kInt(r)))

  _mergeNew.value  = { trim: onlyT, ext: onlyE, int: onlyI }
  _mergeFull.value = { trim: [...existTrim, ...onlyT], ext: [...existExt, ...onlyE], int: [...existInt, ...onlyI] }

  const fieldsMap = {
    trim: ['BRAND','MODEL_YR','MMC','TRIM','TRIM_TEXT'],
    ext:  ['BRAND','MODEL_YR','VEH_NAME_PLATE','DERIVED_FIELDS1','EXTERIOR_TEXT'],
    int:  ['BRAND','MODEL_YR','VEH_NAME_PLATE','INTERIOR_CODE','INTERIOR_TEXT'],
  }

  mergeResults.value = [
    { type: 'trim', label: 'Trim',     color: 'var(--c-trim)', newRecs: onlyT, dups: newTrim.length - onlyT.length, fields: fieldsMap.trim },
    { type: 'ext',  label: 'Exterior', color: 'var(--c-ext)',  newRecs: onlyE, dups: newExt.length  - onlyE.length, fields: fieldsMap.ext  },
    { type: 'int',  label: 'Interior', color: 'var(--c-int)',  newRecs: onlyI, dups: newInt.length  - onlyI.length, fields: fieldsMap.int  },
  ]
}

function recsToTSV(recs, type) {
  const fields = { trim:['BRAND','MODEL_YR','MMC','TRIM','TRIM_TEXT'], ext:['BRAND','MODEL_YR','VEH_NAME_PLATE','DERIVED_FIELDS1','EXTERIOR_TEXT'], int:['BRAND','MODEL_YR','VEH_NAME_PLATE','INTERIOR_CODE','INTERIOR_TEXT'] }[type]
  return recs.map(r => fields.map(f => r[f] ?? '').join('\t')).join('\n')
}
async function copyMergeNew(type) {
  const recs = _mergeNew.value[type]
  if (recs?.length) await navigator.clipboard.writeText(recsToTSV(recs, type))
}
async function copyMergeFull(type) {
  const recs = _mergeFull.value[type]
  if (recs?.length) await navigator.clipboard.writeText(recsToTSV(recs, type))
}
</script>

<style scoped>
.page { min-height: 100vh; }

.tool-header {
  border-bottom: 1px solid var(--border); padding: 16px 28px;
  display: flex; align-items: center; justify-content: space-between;
}
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: #818cf8; }
.header-chips { display: flex; gap: 8px; flex-wrap: wrap; }
:deep(.hchip) {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: var(--mono); font-size: 10px; border-radius: 3px; padding: 2px 8px;
}

.layout { display: grid; grid-template-columns: 1fr 1fr; min-height: calc(100vh - 109px); }
.left-col { border-right: 1px solid var(--border); padding: 24px 28px; overflow-y: auto; display: flex; flex-direction: column; gap: 22px; }
.right-col { padding: 24px 28px; overflow-y: auto; display: flex; flex-direction: column; gap: 18px; }

.section { display: flex; flex-direction: column; gap: 7px; }
.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
.dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.cnt { margin-left: auto; font-weight: 400; color: var(--muted); }
.cnt b { font-weight: 600; }

.actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding-top: 6px; border-top: 1px solid var(--border); }
.status-msg { font-family: var(--mono); font-size: 11px; }
.status-msg.ok   { color: var(--success); }
.status-msg.warn { color: var(--warning); }

/* Preview */
:deep(.prev-section) { display: flex; flex-direction: column; gap: 6px; }
:deep(.prev-title) { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted2); padding-bottom: 6px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
:deep(.prev-box) { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 10px 12px; font-family: var(--mono); font-size: 11px; line-height: 1.9; color: var(--muted2); max-height: 150px; overflow-y: auto; }
:deep(.prev-empty) { color: #333; }
:deep(.tag-row) { display: flex; flex-wrap: wrap; gap: 5px; }
:deep(.ptag) { font-family: var(--mono); font-size: 11px; border-radius: 3px; padding: 2px 8px; }

/* Tool links */
.tool-links-section { border-top: 1px solid var(--border); padding-top: 14px; }
.tl-label { font-family: var(--mono); font-size: 10px; color: var(--muted2); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
.tool-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
.tool-link { display: flex; flex-direction: column; gap: 3px; font-family: var(--mono); font-size: 11px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 9px 11px; color: var(--muted2); transition: all 0.15s; }
.tool-link:hover { border-color: var(--accent); color: var(--text); }
.tl-num  { font-size: 10px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }
.tl-name { font-size: 12px; color: var(--text); }

/* Merge */
.merge-section { border-top: 2px solid var(--border2); padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }
.merge-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.merge-title { font-family: var(--mono); font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted2); flex: 1; }
.merge-note { font-family: var(--mono); font-size: 10px; color: var(--muted); }
.merge-hint { font-family: var(--mono); font-size: 10px; color: var(--muted); line-height: 1.7; }
.merge-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.merge-col { display: flex; flex-direction: column; gap: 8px; }
.merge-col-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; display: flex; align-items: center; gap: 7px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
.merge-col-fields { font-family: var(--mono); font-size: 10px; color: var(--muted); }
.merge-col-cnt { font-family: var(--mono); font-size: 10px; color: var(--muted); }
.merge-results { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.merge-result-col { display: flex; flex-direction: column; gap: 6px; }
.merge-result-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between; padding-bottom: 5px; border-bottom: 1px solid var(--border); }
.merge-stat { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.merge-stat b { color: var(--text); }
.merge-stat.new { color: var(--success); }
.merge-stat.dup { color: var(--muted); }
.merge-preview { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; font-family: var(--mono); font-size: 10px; color: var(--muted2); max-height: 140px; overflow-y: auto; line-height: 1.8; }
.merge-row-new { color: var(--success); }
.merge-copy-btn { font-family: var(--mono); font-size: 10px; background: transparent; border: 1px solid var(--border2); color: var(--muted); border-radius: 3px; padding: 2px 8px; cursor: pointer; transition: all 0.1s; }
.merge-copy-btn:hover { color: var(--text); border-color: var(--muted2); }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .left-col { border-right: none; border-bottom: 1px solid var(--border); }
  .tool-links { grid-template-columns: repeat(2,1fr); }
  .merge-grid, .merge-results { grid-template-columns: 1fr; }
}
</style>
