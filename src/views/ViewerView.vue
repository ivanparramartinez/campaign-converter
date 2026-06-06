<template>
  <div class="page">
    <AppHeader />

    <header class="tool-header">
      <div class="logo">GM <span class="slash">//</span> Data <span>Viewer</span></div>
      <div class="header-stats">
        <template v-if="!anyLoaded"><span class="muted">No data loaded</span></template>
        <template v-else>
          <template v-for="t in types" :key="t.key">
            <span v-if="store[t.key].length" :style="{color:t.color}">
              {{ t.label }}: <b>{{ store[t.key].length }}</b>
            </span>
          </template>
        </template>
      </div>
    </header>

    <div class="layout">
      <!-- SIDEBAR -->
      <div class="sidebar">
        <div v-for="t in types" :key="t.key" class="ds-section" :class="{open: openSections[t.key]}">
          <div class="ds-header" @click="openSections[t.key] = !openSections[t.key]">
            <div class="ds-label">
              <span class="ds-dot" :class="{loaded: store[t.key].length}"></span>
              {{ t.label }}
              <span v-if="store[t.key].length" class="ds-count">{{ store[t.key].length }} records</span>
            </div>
            <span class="ds-chevron">▼</span>
          </div>
          <div class="ds-body" v-show="openSections[t.key]">
            <textarea v-model="rawInputs[t.key]" rows="5" :placeholder="t.placeholder" style="font-size:11px" />
            <div class="ds-actions">
              <button class="btn btn-accent btn-sm" @click="loadData(t.key)">Load</button>
              <button class="btn btn-danger btn-sm" @click="clearData(t.key)">Clear data</button>
              <button class="btn btn-sm" @click="rawInputs[t.key]=''">Clear text</button>
            </div>
          </div>
        </div>
        <button class="btn btn-danger clear-all-btn" @click="clearAll">⊘ Clear all</button>
      </div>

      <!-- MAIN -->
      <div class="main">
        <div class="tabs">
          <div class="tab" :class="{active: activeTab==='browser'}" @click="activeTab='browser'">Browser</div>
          <div class="tab" :class="{active: activeTab==='compare'}" @click="activeTab='compare'">Compare</div>
        </div>

        <div class="tab-content">

          <!-- ── BROWSER TAB ── -->
          <div v-if="activeTab==='browser'" class="tab-panel">
            <div class="filter-row four">
              <div>
                <label>Brand</label>
                <select v-model="fBrand" @change="onBrandChange">
                  <option value="">— All —</option>
                  <option v-for="v in brandOptions" :key="v">{{ v }}</option>
                </select>
              </div>
              <div>
                <label>Model Year</label>
                <select v-model="fYear" @change="onYearChange">
                  <option value="">— All —</option>
                  <option v-for="v in yearOptions" :key="v">{{ v }}</option>
                </select>
              </div>
              <div>
                <label>Nameplate</label>
                <select v-model="fPlate">
                  <option value="">— All —</option>
                  <option v-for="v in plateOptions" :key="v">{{ v }}</option>
                </select>
              </div>
              <div>
                <label>MMC</label>
                <select v-model="fMmc">
                  <option value="">— All —</option>
                  <option v-for="v in mmcOptions" :key="v">{{ v }}</option>
                </select>
              </div>
            </div>

            <div v-if="!anyLoaded" class="empty-msg">Load data from the left panel to explore it here.</div>

            <template v-else>
              <!-- INTERIOR -->
              <template v-if="store.interior.length">
                <div class="section-title">
                  Interior
                  <span class="row-count">{{ filteredInterior.length }} records</span>
                </div>
                <div v-if="!filteredInterior.length" class="empty-msg">No results with this filter.</div>
                <table v-else class="data-table">
                  <thead><tr><th>INTERIOR_CODE</th><th>INTERIOR_TEXT</th><th>VEH_NAME_PLATE</th><th>BRAND</th><th>MODEL_YR</th></tr></thead>
                  <tbody>
                    <tr v-for="(r,i) in filteredInterior.slice(0,300)" :key="i">
                      <td class="code-cell">{{ r.INTERIOR_CODE }}</td><td>{{ r.INTERIOR_TEXT }}</td>
                      <td class="muted">{{ r.VEH_NAME_PLATE }}</td><td class="muted">{{ r.BRAND }}</td><td class="muted">{{ r.MODEL_YR }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <!-- EXTERIOR -->
              <template v-if="store.exterior.length">
                <div class="section-title">
                  Exterior
                  <span class="row-count">{{ filteredExterior.length }} records</span>
                </div>
                <div v-if="!filteredExterior.length" class="empty-msg">No results with this filter.</div>
                <table v-else class="data-table">
                  <thead><tr><th>COLOR CODE</th><th>EXTERIOR_TEXT</th><th>VEH_NAME_PLATE</th><th>BRAND</th><th>MODEL_YR</th></tr></thead>
                  <tbody>
                    <tr v-for="(r,i) in filteredExterior.slice(0,300)" :key="i">
                      <td class="code-cell">{{ r.DERIVED_FIELDS1 }}</td><td>{{ r.EXTERIOR_TEXT }}</td>
                      <td class="muted">{{ r.VEH_NAME_PLATE }}</td><td class="muted">{{ r.BRAND }}</td><td class="muted">{{ r.MODEL_YR }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <!-- TRIM -->
              <template v-if="store.trim.length">
                <div class="section-title">
                  Trim Collection
                  <span class="row-count">{{ filteredTrim.length }} records</span>
                </div>
                <div v-if="!filteredTrim.length" class="empty-msg">No results with this filter.</div>
                <table v-else class="data-table">
                  <thead><tr><th>TRIM</th><th>TRIM_TEXT</th><th>MMC</th><th>BRAND</th><th>MODEL_YR</th></tr></thead>
                  <tbody>
                    <tr v-for="(r,i) in filteredTrim.slice(0,300)" :key="i">
                      <td class="code-cell">{{ r.TRIM }}</td><td>{{ r.TRIM_TEXT }}</td>
                      <td class="muted">{{ r.MMC }}</td><td class="muted">{{ r.BRAND }}</td><td class="muted">{{ r.MODEL_YR }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <!-- MODELS -->
              <template v-if="store.models.length">
                <div class="section-title">
                  Models
                  <span class="row-count">{{ filteredModels.length }} records</span>
                </div>
                <div v-if="!filteredModels.length" class="empty-msg">No results with this filter.</div>
                <table v-else class="data-table">
                  <thead><tr><th>MMC</th><th>MODEL_NAME</th><th>BRAND</th><th>MODEL_YR</th></tr></thead>
                  <tbody>
                    <tr v-for="(r,i) in filteredModels.slice(0,300)" :key="i">
                      <td class="code-cell">{{ r.MMC }}</td><td>{{ r.MODEL_NAME }}</td>
                      <td class="muted">{{ r.BRAND }}</td><td class="muted">{{ r.MODEL_YR }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </template>
          </div>

          <!-- ── COMPARE TAB ── -->
          <div v-if="activeTab==='compare'" class="tab-panel">
            <div class="compare-controls">
              <div>
                <label>Data type to compare</label>
                <select v-model="compareType" @change="clearCompareResults" style="width:200px">
                  <option value="interior">Interior</option>
                  <option value="exterior">Exterior</option>
                  <option value="trim">Trim Collection</option>
                  <option value="models">Models</option>
                </select>
              </div>
              <button class="btn btn-accent" style="margin-top:18px" @click="runCompare">⚡ Compare</button>
              <button class="btn btn-sm" style="margin-top:18px" @click="clearCompareResults">↺ Clear</button>
            </div>

            <div style="margin-top:14px">
              <label>New data to verify</label>
              <textarea v-model="compareInput" rows="8" placeholder="Paste the new array to verify against loaded data&#10;&#10;var INTERIOR = [{...}]  or  [{...},{...}]" style="font-size:11px" />
            </div>

            <!-- RESULTS -->
            <div v-if="compareResults.length" style="margin-top:16px">
              <div class="results-header">
                <span class="stat-pill"><b>{{ compareResults.length }}</b> total</span>
                <span class="stat-pill new-pill"><b>{{ cntNew }}</b> new</span>
                <span class="stat-pill match-pill"><b>{{ cntMatch }}</b> exact</span>
                <span class="stat-pill conflict-pill"><b>{{ cntConflict }}</b> conflicts</span>
                <div class="filter-btns">
                  <button v-for="v in ['all','new','conflict','match']" :key="v"
                    class="filter-btn" :class="{active: compareView===v}"
                    @click="compareView=v">{{ v }}</button>
                  <button class="copy-btn" @click="copyFiltered">⎘ Copy view</button>
                </div>
              </div>

              <table class="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>{{ compareSchema.codeField }}</th>
                    <th>{{ compareSchema.textField }}</th>
                    <th v-if="compareSchema.plateField">NAMEPLATE</th>
                    <th v-if="compareSchema.mmcField && compareSchema.mmcField !== compareSchema.codeField">MMC</th>
                    <th>BRAND</th><th>MODEL_YR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r,i) in filteredCompare.slice(0,300)" :key="i">
                    <td>
                      <span class="status-badge" :class="'status-'+r.status">
                        {{ r.status === 'new' ? '🟢 NEW' : r.status === 'match' ? '✓ MATCH' : '⚠ CONFLICT' }}
                      </span>
                    </td>
                    <td class="code-cell">{{ r.record[compareSchema.codeField] }}</td>
                    <td>
                      {{ r.record[compareSchema.textField] }}
                      <template v-if="r.status==='conflict'">
                        <div v-for="f in r.diffs" :key="f" style="margin-top:4px;font-size:11px">
                          <span class="muted" style="font-family:var(--mono)">{{ f }}:</span>
                          <span class="diff-old">{{ r.existing[f] ?? '(empty)' }}</span>
                          <span class="muted"> → </span>
                          <span class="diff-new">{{ r.record[f] ?? '(empty)' }}</span>
                        </div>
                      </template>
                    </td>
                    <td v-if="compareSchema.plateField" class="muted">{{ r.record[compareSchema.plateField] }}</td>
                    <td v-if="compareSchema.mmcField && compareSchema.mmcField !== compareSchema.codeField" class="muted">{{ r.record[compareSchema.mmcField] }}</td>
                    <td class="muted">{{ r.record.BRAND }}</td>
                    <td class="muted">{{ r.record.MODEL_YR }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- MERGE -->
              <div class="merge-section">
                <div class="merge-header">
                  <div class="section-title" style="border:none;padding:0">
                    <span class="dot-accent"></span>
                    Merge — original + new + conflicts resolved
                  </div>
                  <div class="merge-modes">
                    <label class="mode-label" :class="{active: mergeMode==='update'}" @click="mergeMode='update'">
                      <input type="radio" name="merge-mode" value="update" v-model="mergeMode"> Update conflicts
                    </label>
                    <label class="mode-label" :class="{active: mergeMode==='keep'}" @click="mergeMode='keep'">
                      <input type="radio" name="merge-mode" value="keep" v-model="mergeMode"> Keep existing
                    </label>
                  </div>
                  <div style="margin-left:auto;display:flex;gap:8px">
                    <button class="btn btn-accent btn-sm" @click="runMerge">⚡ Generate merge</button>
                    <button v-if="mergedArray" class="btn btn-sm" @click="copyMerge">⎘ Copy</button>
                    <button v-if="mergedArray" class="btn btn-sm" @click="copyMergeFlat">⎘ No brackets</button>
                  </div>
                </div>
                <div v-if="mergeStats" class="merge-stats">
                  <span class="stat-pill"><b>{{ mergeStats.total }}</b> total in merge</span>
                  <span class="stat-pill muted-pill"><b>{{ mergeStats.original }}</b> original</span>
                  <span v-if="mergeStats.added" class="stat-pill new-pill"><b>+{{ mergeStats.added }}</b> added</span>
                  <span v-if="mergeStats.updated" class="stat-pill conflict-pill"><b>{{ mergeStats.updated }}</b> updated</span>
                  <span v-if="mergeStats.kept" class="stat-pill muted-pill"><b>{{ mergeStats.kept }}</b> conflicts kept as-is</span>
                </div>
                <pre v-if="mergedArray" class="merge-output">{{ JSON.stringify(mergedArray, null, 2) }}</pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import AppHeader from '../components/AppHeader.vue'

// ── TYPES & SCHEMAS ──────────────────────────────────────────────────────────
const types = [
  { key: 'interior', label: 'Interior',        color: '#c084fc',
    placeholder: 'var INTERIOR = [{"BRAND":"GMC","MODEL_YR":"2025",...}]\n\nor paste the JSON array directly:\n[{...},{...}]' },
  { key: 'exterior', label: 'Exterior',        color: '#ff9f43',
    placeholder: 'var EXTERIOR = [{"BRAND":"GMC","MODEL_YR":"2025",...}]' },
  { key: 'trim',     label: 'Trim Collection', color: '#f87171',
    placeholder: 'var TRIM = [{"BRAND":"GMC","MODEL_YR":2025,"MMC":"TC10543",...}]' },
  { key: 'models',   label: 'Models',          color: '#34d399',
    placeholder: 'var MODELS = [{"MMC":"TT35743","BRAND":"GMC",...}]' },
]

const schemas = {
  interior: { keyFields:['BRAND','MODEL_YR','VEH_NAME_PLATE','INTERIOR_CODE'], valueFields:['INTERIOR_TEXT'], codeField:'INTERIOR_CODE', textField:'INTERIOR_TEXT', plateField:'VEH_NAME_PLATE', mmcField:null },
  exterior: { keyFields:['BRAND','MODEL_YR','VEH_NAME_PLATE','DERIVED_FIELDS1'], valueFields:['EXTERIOR_TEXT'], codeField:'DERIVED_FIELDS1', textField:'EXTERIOR_TEXT', plateField:'VEH_NAME_PLATE', mmcField:null },
  trim:     { keyFields:['BRAND','MODEL_YR','MMC','TRIM'], valueFields:['TRIM_TEXT'], codeField:'TRIM', textField:'TRIM_TEXT', plateField:null, mmcField:'MMC' },
  models:   { keyFields:['MMC','BRAND','MODEL_YR'], valueFields:['MODEL_NAME'], codeField:'MMC', textField:'MODEL_NAME', plateField:null, mmcField:'MMC' },
}

// ── STATE ────────────────────────────────────────────────────────────────────
const store       = reactive({ interior:[], exterior:[], trim:[], models:[] })
const rawInputs   = reactive({ interior:'', exterior:'', trim:'', models:'' })
const openSections = reactive({ interior:true, exterior:false, trim:false, models:false })
const activeTab   = ref('browser')

// Browser filters
const fBrand = ref(''); const fYear = ref(''); const fPlate = ref(''); const fMmc = ref('')
const brandOptions = ref([]); const yearOptions = ref([]); const plateOptions = ref([]); const mmcOptions = ref([])

// Compare
const compareType    = ref('interior')
const compareInput   = ref('')
const compareResults = ref([])
const compareView    = ref('all')
const mergeMode      = ref('update')
const mergedArray    = ref(null)
const mergeStats     = ref(null)

// ── HELPERS ──────────────────────────────────────────────────────────────────
const anyLoaded = computed(() => Object.values(store).some(a => a.length))
const str = v => String(v ?? '')
const uniq = arr => [...new Set(arr)].filter(Boolean).sort()

function parseInput(raw) {
  raw = raw.trim().replace(/^(var|const|let)\s+\w+\s*=\s*/, '').replace(/;?\s*$/, '')
  return JSON.parse(raw)
}

function makeKey(obj, keyFields) {
  return keyFields.map(f => str(obj[f]).toUpperCase()).join('|')
}

// ── LOAD / CLEAR ─────────────────────────────────────────────────────────────
function loadData(key) {
  try {
    const arr = parseInput(rawInputs[key])
    if (!Array.isArray(arr)) throw new Error('Not an array')
    store[key] = arr
    updateFilterOptions()
  } catch(e) { alert(`Parse error in ${key}: ${e.message}`) }
}

function clearData(key) { store[key] = []; rawInputs[key] = ''; updateFilterOptions() }
function clearAll() { types.forEach(t => clearData(t.key)); fBrand.value=fYear.value=fPlate.value=fMmc.value='' }

// ── FILTER OPTIONS (cascading) ───────────────────────────────────────────────
function getAllRecords() { return [...store.interior, ...store.exterior, ...store.trim, ...store.models] }

function updateFilterOptions() {
  const all = getAllRecords()
  brandOptions.value = uniq(all.map(r => str(r.BRAND)))
  onBrandChange()
}

function onBrandChange() {
  const all = getAllRecords()
  const filtered = fBrand.value ? all.filter(r => str(r.BRAND) === fBrand.value) : all
  yearOptions.value = uniq(filtered.map(r => str(r.MODEL_YR)))
  if (!yearOptions.value.includes(fYear.value)) fYear.value = ''
  onYearChange()
}

function onYearChange() {
  const all = getAllRecords()
  const filtered = all.filter(r =>
    (!fBrand.value || str(r.BRAND) === fBrand.value) &&
    (!fYear.value  || str(r.MODEL_YR) === fYear.value)
  )
  plateOptions.value = uniq(filtered.map(r => str(r.VEH_NAME_PLATE)).filter(Boolean))
  mmcOptions.value   = uniq(filtered.map(r => str(r.MMC)).filter(Boolean))
  if (!plateOptions.value.includes(fPlate.value)) fPlate.value = ''
  if (!mmcOptions.value.includes(fMmc.value))     fMmc.value   = ''
}

// ── BROWSER FILTERED DATA ────────────────────────────────────────────────────
function filterRows(rows, { hasPlate = true, hasMmc = false } = {}) {
  return rows.filter(r =>
    (!fBrand.value || str(r.BRAND)       === fBrand.value) &&
    (!fYear.value  || str(r.MODEL_YR)    === fYear.value)  &&
    (!fPlate.value || !hasPlate || str(r.VEH_NAME_PLATE)  === fPlate.value) &&
    (!fMmc.value   || !hasMmc  || str(r.MMC)               === fMmc.value)
  )
}
const filteredInterior = computed(() => filterRows(store.interior, { hasPlate:true,  hasMmc:false }))
const filteredExterior = computed(() => filterRows(store.exterior, { hasPlate:true,  hasMmc:false }))
const filteredTrim     = computed(() => filterRows(store.trim,     { hasPlate:false, hasMmc:true  }))
const filteredModels   = computed(() => filterRows(store.models,   { hasPlate:false, hasMmc:true  }))

// ── COMPARE ──────────────────────────────────────────────────────────────────
const compareSchema = computed(() => schemas[compareType.value])
const cntNew      = computed(() => compareResults.value.filter(r => r.status==='new').length)
const cntMatch    = computed(() => compareResults.value.filter(r => r.status==='match').length)
const cntConflict = computed(() => compareResults.value.filter(r => r.status==='conflict').length)

const filteredCompare = computed(() => {
  if (compareView.value === 'all') return compareResults.value
  return compareResults.value.filter(r => r.status === compareView.value)
})

function clearCompareResults() { compareResults.value = []; mergedArray.value = null; mergeStats.value = null }

function runCompare() {
  const type = compareType.value
  const s = schemas[type]
  if (!store[type].length) { alert(`Load "${type}" data first from the left panel.`); return }
  let newArr
  try { newArr = parseInput(compareInput.value); if (!Array.isArray(newArr)) throw new Error('Not an array') }
  catch(e) { alert(`Parse error: ${e.message}`); return }

  // Store ALL records per key (handles duplicates)
  const existingIndex = {}
  store[type].forEach(r => {
    const key = makeKey(r, s.keyFields)
    if (!existingIndex[key]) existingIndex[key] = []
    existingIndex[key].push(r)
  })

  compareResults.value = newArr.map(r => {
    const key = makeKey(r, s.keyFields)
    if (!existingIndex[key]) return { status:'new', record:r, existing:null }
    // Check if any existing record with this key is an exact match
    const candidates = existingIndex[key]
    const exactMatch = candidates.find(ex => s.valueFields.every(f => str(r[f]).trim() === str(ex[f]).trim()))
    if (exactMatch) return { status:'match', record:r, existing:exactMatch }
    // Conflict: same key, no exact value match — show diff against first candidate
    const ex = candidates[0]
    const diffs = s.valueFields.filter(f => str(r[f]).trim() !== str(ex[f]).trim())
    return { status:'conflict', record:r, existing:ex, diffs }
  })

  mergedArray.value = null; mergeStats.value = null
}

function copyFiltered() {
  const rows = filteredCompare.value.map(r => r.record)
  navigator.clipboard.writeText(rows.map(o => JSON.stringify(o, null, 2)).join(',\n'))
}

// ── MERGE ─────────────────────────────────────────────────────────────────────
function runMerge() {
  const type = compareType.value
  const s = schemas[type]
  const results = compareResults.value
  if (!results.length) return

  const existingIndexMap = new Map()
  store[type].forEach((r, i) => { const k = makeKey(r, s.keyFields); if (!existingIndexMap.has(k)) existingIndexMap.set(k, i) })

  const merged = store[type].map(r => ({ ...r }))
  results.forEach(r => {
    const key = makeKey(r.record, s.keyFields)
    if (r.status === 'new') merged.push(r.record)
    else if (r.status === 'conflict' && mergeMode.value === 'update') {
      const idx = existingIndexMap.get(key)
      if (idx !== undefined) merged[idx] = r.record
    }
  })
  mergedArray.value = merged

  const added    = results.filter(r => r.status==='new').length
  const conflicts = results.filter(r => r.status==='conflict').length
  mergeStats.value = {
    total: merged.length, original: store[type].length, added,
    updated: mergeMode.value==='update' ? conflicts : 0,
    kept:    mergeMode.value==='keep'   ? conflicts : 0,
  }
}

function copyMerge() {
  if (!mergedArray.value) return
  navigator.clipboard.writeText(JSON.stringify(mergedArray.value, null, 2))
}
function copyMergeFlat() {
  if (!mergedArray.value) return
  navigator.clipboard.writeText(mergedArray.value.map(o => JSON.stringify(o, null, 2)).join(',\n'))
}
</script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }

.tool-header {
  border-bottom: 1px solid var(--border); padding: 16px 28px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 48px; background: var(--bg); z-index: 10;
}
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo .slash { color: var(--muted2); margin: 0 5px; }
.logo span:last-child { color: var(--accent2); }
.header-stats { display: flex; gap: 16px; font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.header-stats b { color: inherit; }

.layout { display: grid; grid-template-columns: 340px 1fr; flex: 1; min-height: 0; overflow: hidden; }

/* SIDEBAR */
.sidebar { border-right: 1px solid var(--border); padding: 16px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; height: calc(100vh - 94px); }
.ds-section { border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
.ds-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 12px; cursor: pointer; background: var(--surface);
  font-family: var(--mono); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
  user-select: none; transition: background 0.15s;
}
.ds-header:hover { background: var(--surface2); }
.ds-label { display: flex; align-items: center; gap: 8px; }
.ds-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border2); flex-shrink: 0; transition: background 0.2s; }
.ds-dot.loaded { background: var(--success); }
.ds-count { font-size: 10px; color: var(--muted2); font-weight: 400; }
.ds-chevron { color: var(--muted); font-size: 10px; transition: transform 0.2s; }
.ds-section.open .ds-chevron { transform: rotate(180deg); }
.ds-body { padding: 10px 12px; border-top: 1px solid var(--border); background: var(--bg); display: flex; flex-direction: column; gap: 8px; }
.ds-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.clear-all-btn { margin-top: 4px; }

/* MAIN */
.main { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.tabs { display: flex; border-bottom: 1px solid var(--border); padding: 0 24px; background: var(--bg); flex-shrink: 0; }
.tab { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 12px 16px; cursor: pointer; color: var(--muted2); border-bottom: 2px solid transparent; transition: all 0.15s; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-content { padding: 20px 24px; overflow-y: auto; flex: 1; min-height: 0; }
.tab-panel { display: flex; flex-direction: column; gap: 16px; }

/* BROWSER FILTERS */
.filter-row.four { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; }

/* SECTION TITLES */
.section-title {
  font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 7px;
}
.section-title::before { content: ''; display: inline-block; width: 5px; height: 5px; background: var(--accent); border-radius: 50%; }
.row-count { margin-left: auto; font-weight: 400; color: var(--muted); }

/* TABLES */
.data-table { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 12px; }
.data-table th { text-align: left; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted2); padding: 6px 10px; border-bottom: 1px solid var(--border2); font-weight: 600; white-space: nowrap; }
.data-table td { padding: 7px 10px; border-bottom: 1px solid var(--border); color: var(--text); vertical-align: top; }
.data-table tr:hover td { background: var(--surface); }
.code-cell { color: var(--accent2); }
.muted { color: var(--muted2); font-size: 11px; }
.empty-msg { font-family: var(--mono); font-size: 12px; color: var(--muted); padding: 20px 0; text-align: center; }

/* COMPARE */
.compare-controls { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
.results-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.stat-pill { font-family: var(--mono); font-size: 11px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 3px 10px; color: var(--muted2); }
.stat-pill b { color: var(--text); }
.new-pill      { border-color: rgba(0,230,118,0.3);  color: var(--success); }
.match-pill    { }
.conflict-pill { border-color: rgba(251,146,60,0.3);  color: #fb923c; }
.muted-pill    { color: var(--muted2); }
.filter-btns { display: flex; gap: 6px; margin-left: auto; }
.filter-btn { font-family: var(--mono); font-size: 10px; padding: 3px 10px; border-radius: 3px; border: 1px solid var(--border2); cursor: pointer; background: transparent; color: var(--muted2); letter-spacing: 0.06em; text-transform: uppercase; transition: all 0.13s; }
.filter-btn.active { background: var(--surface2); color: var(--text); border-color: var(--accent); }
.copy-btn { margin-left: 8px; background: rgba(200,255,0,0.08); border: 1px solid rgba(200,255,0,0.35); color: var(--accent); font-family: var(--mono); font-size: 10px; padding: 3px 10px; border-radius: 3px; cursor: pointer; letter-spacing: 0.06em; transition: all 0.15s; }
.copy-btn:hover { background: rgba(200,255,0,0.16); }

.status-badge { display: inline-flex; align-items: center; gap: 4px; font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.08em; padding: 2px 8px; border-radius: 3px; white-space: nowrap; }
.status-new      { background: rgba(0,230,118,0.1);  color: var(--success);  border: 1px solid rgba(0,230,118,0.3); }
.status-match    { background: rgba(100,100,100,0.1); color: var(--muted2);  border: 1px solid var(--border2); }
.status-conflict { background: rgba(251,146,60,0.1);  color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }
.diff-old { color: var(--danger); text-decoration: line-through; font-family: var(--mono); font-size: 11px; }
.diff-new { color: var(--success); font-family: var(--mono); font-size: 11px; }

/* MERGE */
.merge-section { border-top: 1px solid var(--border); margin-top: 20px; padding-top: 16px; }
.merge-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.merge-modes { display: flex; gap: 6px; }
.mode-label {
  display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em;
  background: transparent; border: 1px solid var(--border2); color: var(--muted2);
  border-radius: 3px; padding: 3px 10px; transition: all 0.13s;
}
.mode-label input { width: auto; margin: 0; accent-color: var(--accent); }
.mode-label.active { background: rgba(200,255,0,0.1); border-color: rgba(200,255,0,0.5); color: var(--accent); }
.dot-accent { display: inline-block; width: 5px; height: 5px; background: var(--accent); border-radius: 50%; flex-shrink: 0; }
.merge-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.merge-output { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 12px; font-family: var(--mono); font-size: 11px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; }
</style>
