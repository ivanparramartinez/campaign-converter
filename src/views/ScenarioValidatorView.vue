<template>
  <div class="page">
    <AppHeader />

    <div class="tool-header">
      <div class="logo">Scenario <span>Validator</span></div>
      <div class="header-stats" v-if="validated.length">
        <span>{{ validated.length }} records</span>
        <span class="s-ok">✓ {{ statOk }}</span>
        <span v-if="statIssues" class="s-warn">⚠ {{ statIssues }} issues</span>
      </div>
    </div>

    <div class="layout">

      <!-- ── SIDEBAR: EJS reference ── -->
      <div class="sidebar">
        <div class="sidebar-label">EJS reference data</div>
        <div class="hint">Pega el contenido del archivo EJS con los arrays var MODELS = [...], var INTERIOR = [...], etc.</div>

        <textarea
          v-model="ejsSource"
          rows="14"
          placeholder="var MODELS = [&#10;  { MMC: 'TC10543', ... },&#10;  ...&#10;];&#10;var INTERIOR = [...];&#10;var EXTERIOR = [...];&#10;var TRIM = [...];"
          style="font-size:10px; font-family: var(--mono)"
        />

        <div class="parse-actions">
          <button class="btn btn-accent btn-sm" @click="parseEJS" :disabled="!ejsSource.trim()">⚙ Parse EJS</button>
          <button class="btn btn-sm" @click="ejsSource=''; parsedVars={}; validated=[]">↺</button>
        </div>

        <!-- Parse log -->
        <div v-if="parseLog.length" class="parse-log">
          <div v-for="(line, i) in parseLog" :key="i" class="log-line" :class="line.includes('✗') ? 'log-err' : line.includes('No var') ? 'log-warn' : 'log-ok'">{{ line }}</div>
        </div>

        <!-- Detected variables -->
        <div v-if="Object.keys(parsedVars).length" class="vars-section">
          <div class="vars-title">Variables detectadas</div>
          <div v-for="(v, name) in parsedVars" :key="name" class="var-row">
            <span class="var-dot" :class="v.type !== 'unknown' && v.type !== 'error' ? 'mapped' : 'unmap'"></span>
            <span class="var-name">{{ name }}</span>
            <span class="var-type" v-if="v.type !== 'unknown' && v.type !== 'error'" :class="'t-'+v.type">{{ v.type }}</span>
            <span class="var-type t-err" v-else-if="v.type === 'error'">parse error</span>
            <span class="var-type t-unk" v-else>—</span>
            <span class="var-count">{{ Array.isArray(v.data) ? v.data.length : '' }}</span>
          </div>
        </div>

        <!-- Mapping summary -->
        <div v-if="dataReady" class="mapping-summary">
          <div class="ms-row" v-if="refData.models.length">
            <span class="ms-dot ok"></span>Models: <b>{{ refData.models.length }}</b> ({{ refData.mmcs.size }} MMC)
          </div>
          <div class="ms-row" v-if="refData.trim.length">
            <span class="ms-dot ok"></span>Trims: <b>{{ refData.trim.length }}</b> records
          </div>
          <div class="ms-row" v-if="refData.exterior.length">
            <span class="ms-dot ok"></span>Exterior: <b>{{ refData.exterior.length }}</b> records
          </div>
          <div class="ms-row" v-if="refData.interior.length">
            <span class="ms-dot ok"></span>Interior: <b>{{ refData.interior.length }}</b> records
          </div>
          <div class="ms-row warn" v-if="!refData.models.length">
            <span class="ms-dot warn"></span>No models data detected
          </div>
          <div class="ms-row warn" v-if="!refData.trim.length">
            <span class="ms-dot warn"></span>No trim data detected
          </div>
        </div>
      </div>

      <!-- ── MAIN: Scenarios + Results ── -->
      <div class="main">

        <!-- JSON input -->
        <div class="input-section">
          <div class="section-title">
            Test scenarios JSON
            <span class="row-count" v-if="inputRecords.length">{{ inputRecords.length }} records</span>
            <span class="row-count error" v-if="parseError">{{ parseError }}</span>
          </div>
          <textarea v-model="rawJson" rows="8" placeholder="Pega el JSON generado aquí…" style="font-size:11px" />
          <div class="input-actions">
            <button class="btn btn-accent" @click="runValidate" :disabled="!inputRecords.length || !dataReady">
              ⚡ Validate
            </button>
            <button class="btn btn-sm" @click="rawJson=''; validated=[]">↺ Clear</button>
            <span v-if="!dataReady && inputRecords.length" class="hint warn">Parse the EJS first</span>
          </div>
        </div>

        <!-- Results -->
        <div v-if="validated.length" class="results-section">

          <div class="results-header">
            <div class="filter-tabs">
              <button class="tab" :class="{active: filter==='all'}"    @click="filter='all'">All ({{ validated.length }})</button>
              <button class="tab warn-tab" :class="{active: filter==='issues'}" @click="filter='issues'">⚠ Issues ({{ statIssues }})</button>
              <button class="tab ok-tab"   :class="{active: filter==='ok'}"     @click="filter='ok'">✓ OK ({{ statOk }})</button>
            </div>
            <!-- Field issue counts -->
            <div class="field-counts">
              <span v-for="f in fieldSummary" :key="f.label" v-show="f.count" class="fcnt">
                {{ f.label }}: <b class="red">{{ f.count }}</b>
              </span>
            </div>
          </div>

          <div class="table-wrap">
            <table class="vtable">
              <thead>
                <tr>
                  <th class="col-id">ID</th>
                  <th class="col-vehicle">Brand · Year · Model</th>
                  <th class="col-field">MMC</th>
                  <th class="col-field">Trim</th>
                  <th class="col-field">Exterior</th>
                  <th class="col-field">Interior</th>
                  <th class="col-status">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, i) in displayedRows" :key="i" :class="r.hasIssue ? 'row-issue' : 'row-ok'">
                  <td class="col-id mono">{{ r.versionId }}</td>
                  <td class="col-vehicle">
                    <span class="brand-tag" :style="{color: brandColor(r.brand)}">{{ r.brand }}</span>
                    <span class="sub">{{ r.year }} · {{ r.model }}</span>
                  </td>
                  <td class="col-field"><FieldCell :value="r.mmc"  :valid="r.mmcValid" /></td>
                  <td class="col-field"><FieldCell :value="r.trim" :valid="r.trimValid" /></td>
                  <td class="col-field"><FieldCell :value="r.ext"  :valid="r.extValid" /></td>
                  <td class="col-field"><FieldCell :value="r.int"  :valid="r.intValid" /></td>
                  <td class="col-status">
                    <span v-if="r.hasIssue" class="badge badge-issue">⚠ Issue</span>
                    <span v-else            class="badge badge-ok">✓ OK</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineComponent, h } from 'vue'
import AppHeader from '../components/AppHeader.vue'

// ─── Inline FieldCell ─────────────────────────────────────────────────────────
const FieldCell = defineComponent({
  props: { value: String, valid: { default: null } },
  setup(props) {
    return () => {
      const v = props.valid
      if (v === null) return h('span', { class: 'fc-null' }, props.value || '—')
      if (v === true) return h('span', { class: 'fc-ok' }, [h('span', { class: 'fc-icon' }, '✓'), ' ', props.value])
      return h('span', { class: 'fc-bad' }, [h('span', { class: 'fc-icon' }, '✗'), ' ', props.value || '—'])
    }
  }
})

// ─── EJS PARSING ─────────────────────────────────────────────────────────────
const ejsSource  = ref('')
const parsedVars = ref({})
const parseLog   = ref([])

function detectType(arr) {
  if (!Array.isArray(arr) || !arr.length) return 'unknown'
  // Check a few items (not just first) in case first is odd
  const samples = arr.slice(0, 5)
  for (const first of samples) {
    if (!first || typeof first !== 'object') continue
    if ('INTERIOR_CODE' in first) return 'interior'
    if ('DERIVED_FIELDS1' in first) return 'exterior'
    if ('TRIM' in first && 'MMC' in first) return 'trim'
    if ('MMC' in first) return 'models'
  }
  return 'unknown'
}

// String-aware bracket finder — skips [ ] inside strings
function findClosingBracket(str, start) {
  let depth = 0
  let i = start
  let inStr = false
  let strChar = ''
  while (i < str.length) {
    const c = str[i]
    if (inStr) {
      if (c === '\\') { i += 2; continue }   // skip escaped char
      if (c === strChar) inStr = false
    } else {
      if (c === '"' || c === "'" || c === '`') { inStr = true; strChar = c }
      else if (c === '[') depth++
      else if (c === ']') { depth--; if (depth === 0) return i }
    }
    i++
  }
  return -1
}

function extractArrays(source) {
  const log = []

  // 1. Remove EJS delimiters but KEEP the JS content inside them
  //    <%# comment blocks %> → remove entirely
  //    <%= expr %> and <%- expr %> → remove (output expressions, not data)
  //    <% code %> → keep the code, just strip the delimiters
  let cleaned = source
    .replace(/<%#[\s\S]*?%>/g, '')          // remove EJS comments entirely
    .replace(/<%[=\-][\s\S]*?%>/g, '')      // remove output expressions
    .replace(/<%[-_]?/g, '')                // remove remaining opening tags
    .replace(/[-_]?%>/g, '')               // remove closing tags
  // 2. Strip line comments
  cleaned = cleaned.replace(/\/\/[^\n]*/g, '')
  // 3. Strip block comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '')

  const result = {}
  // Match var / const / let  NAME = [
  const re = /(?:var|const|let)\s+(\w+)\s*=\s*\[/g
  let m
  while ((m = re.exec(cleaned)) !== null) {
    const name  = m[1]
    const open  = m.index + m[0].length - 1   // position of '['
    const close = findClosingBracket(cleaned, open)

    if (close === -1) {
      result[name] = { data: null, type: 'error', error: 'Unmatched brackets' }
      log.push(`${name}: ✗ unmatched brackets`)
      continue
    }

    const arrStr = cleaned.slice(open, close + 1)
    try {
      // eslint-disable-next-line no-new-func
      const data = new Function('return ' + arrStr)()
      if (!Array.isArray(data)) {
        result[name] = { data: null, type: 'error', error: 'Not an array' }
        log.push(`${name}: ✗ not an array`)
      } else {
        const type = detectType(data)
        result[name] = { data, type }
        log.push(`${name}: ✓ ${data.length} items → ${type}`)
      }
    } catch (e) {
      result[name] = { data: null, type: 'error', error: e.message }
      log.push(`${name}: ✗ ${e.message.slice(0, 80)}`)
    }
  }

  if (!Object.keys(result).length) {
    log.push('No var/const/let declarations with array values found.')
  }

  parseLog.value = log
  return result
}

function parseEJS() {
  parsedVars.value = extractArrays(ejsSource.value)
  validated.value = []
}

// ─── Reference data built from parsed vars ────────────────────────────────────
const refData = computed(() => {
  const vars = parsedVars.value
  const models   = []
  const trim     = []
  const exterior = []
  const interior = []

  for (const v of Object.values(vars)) {
    if (!Array.isArray(v.data)) continue
    if (v.type === 'models')   models.push(...v.data)
    if (v.type === 'trim')     trim.push(...v.data)
    if (v.type === 'exterior') exterior.push(...v.data)
    if (v.type === 'interior') interior.push(...v.data)
  }

  const mmcs = new Set(models.map(r => r.MMC).filter(Boolean))

  // trimByMmc: Map<MMC, Set<TRIM>>
  const trimByMmc = new Map()
  trim.forEach(r => {
    if (!r.MMC || !r.TRIM) return
    if (!trimByMmc.has(r.MMC)) trimByMmc.set(r.MMC, new Set())
    trimByMmc.get(r.MMC).add(r.TRIM)
  })

  // Exterior: keyed by BRAND|MODEL_YR|VEH_NAME_PLATE|COLOR  (same logic as ExteriorsView comboKey)
  const extSet = new Set(
    exterior
      .filter(r => r.BRAND && r.MODEL_YR && r.VEH_NAME_PLATE && r.DERIVED_FIELDS1)
      .map(r => `${r.BRAND}|${r.MODEL_YR}|${r.VEH_NAME_PLATE}|${r.DERIVED_FIELDS1}`.toUpperCase())
  )

  // Interior: keyed by BRAND|MODEL_YR|VEH_NAME_PLATE|CODE  (same logic as InteriorView comboKey)
  const intSet = new Set(
    interior
      .filter(r => r.BRAND && r.MODEL_YR && r.VEH_NAME_PLATE && r.INTERIOR_CODE)
      .map(r => `${r.BRAND}|${r.MODEL_YR}|${r.VEH_NAME_PLATE}|${r.INTERIOR_CODE}`.toUpperCase())
  )

  return { models, trim, exterior, interior, mmcs, extSet, intSet, trimByMmc }
})

const dataReady = computed(() => {
  const d = refData.value
  return d.models.length > 0 || d.trim.length > 0 || d.exterior.length > 0 || d.interior.length > 0
})

// ─── Scenarios JSON ───────────────────────────────────────────────────────────
const rawJson    = ref('')
const parseError = ref('')
const filter     = ref('all')

const inputRecords = computed(() => {
  const raw = rawJson.value.trim()
  if (!raw) { parseError.value = ''; return [] }
  try {
    const cleaned = raw.replace(/^(var|const|let)\s+\w+\s*=\s*/, '').replace(/;?\s*$/, '')
    const arr = JSON.parse(cleaned)
    parseError.value = ''
    return Array.isArray(arr) ? arr : []
  } catch {
    parseError.value = '✗ Invalid JSON'
    return []
  }
})

// ─── Validation ───────────────────────────────────────────────────────────────
const validated = ref([])

function validate(record) {
  const td    = record.targetData || record
  const mmc   = (td.merchandisingModelCode || '').trim()
  const trim  = (td.trim                   || '').trim()
  const ext   = (td.exteriorColor          || '').trim()
  const int_  = (td.interior               || '').trim()
  const brand = (td.marketingMake          || '').trim()
  const year  = String(td.modelYear        || '').trim()
  const model = (td.marketingModel         || '').trim()
  const d     = refData.value

  const mmcValid  = d.models.length   ? (mmc  ? d.mmcs.has(mmc)                           : false) : null
  const trimValid = d.trim.length     ? (trim ? (d.trimByMmc.get(mmc)?.has(trim) ?? false) : false) : null

  // Exterior/Interior validated per BRAND|MODEL_YR|VEH_NAME_PLATE|CODE
  const extKey = `${brand}|${year}|${model}|${ext}`.toUpperCase()
  const intKey = `${brand}|${year}|${model}|${int_}`.toUpperCase()

  const extValid  = d.exterior.length ? (ext  ? d.extSet.has(extKey) : false) : null
  const intValid  = d.interior.length ? (int_ ? d.intSet.has(intKey) : false) : null

  const hasIssue = [mmcValid, trimValid, extValid, intValid].some(v => v === false)

  return {
    versionId: td.VersionId || '',
    brand, year, model,
    mmc, trim, ext, int: int_,
    mmcValid, trimValid, extValid, intValid, hasIssue,
  }
}

function runValidate() {
  validated.value = inputRecords.value.map(validate)
  filter.value = 'all'
}

// ─── Stats & display ──────────────────────────────────────────────────────────
const statOk     = computed(() => validated.value.filter(r => !r.hasIssue).length)
const statIssues = computed(() => validated.value.filter(r =>  r.hasIssue).length)

const displayedRows = computed(() => {
  if (filter.value === 'issues') return validated.value.filter(r =>  r.hasIssue)
  if (filter.value === 'ok')     return validated.value.filter(r => !r.hasIssue)
  return validated.value
})

const fieldSummary = computed(() => [
  { label: 'MMC',      count: validated.value.filter(r => r.mmcValid  === false).length },
  { label: 'Trim',     count: validated.value.filter(r => r.trimValid === false).length },
  { label: 'Exterior', count: validated.value.filter(r => r.extValid  === false).length },
  { label: 'Interior', count: validated.value.filter(r => r.intValid  === false).length },
])

const BRAND_COLORS = { GMC: '#34d399', Chevrolet: '#f87171', Buick: '#ff9f43', Cadillac: '#c084fc' }
function brandColor(b) { return BRAND_COLORS[b] || 'var(--muted2)' }
</script>

<style scoped>
.page { min-height: 100vh; }
.tool-header { border-bottom: 1px solid var(--border); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: #a78bfa; }
.header-stats { display: flex; gap: 20px; font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.s-ok   { color: #34d399; }
.s-warn { color: #f87171; }

.layout { display: grid; grid-template-columns: 280px 1fr; min-height: calc(100vh - 93px); }

/* ── SIDEBAR ── */
.sidebar { border-right: 1px solid var(--border); padding: 16px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.sidebar-label { font-family: var(--mono); font-size: 9px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 6px; border-bottom: 1px solid var(--border); }

.parse-actions { display: flex; gap: 8px; }

.parse-log { display: flex; flex-direction: column; gap: 2px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; }
.log-line  { font-family: var(--mono); font-size: 10px; line-height: 1.5; }
.log-ok    { color: #34d399; }
.log-err   { color: #f87171; }
.log-warn  { color: var(--warning); }

.vars-section { display: flex; flex-direction: column; gap: 5px; padding-top: 4px; }
.vars-title { font-family: var(--mono); font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted2); margin-bottom: 2px; }
.var-row { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 11px; }
.var-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.var-dot.mapped { background: #34d399; }
.var-dot.unmap  { background: var(--border2); }
.var-name  { flex: 1; color: var(--text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
.var-count { color: var(--muted2); font-size: 10px; min-width: 30px; text-align: right; }
.var-type  { font-size: 10px; border-radius: 3px; padding: 1px 6px; }
.t-models   { background: rgba(52,211,153,0.12);  color: #34d399; }
.t-trim     { background: rgba(96,165,250,0.12);  color: #60a5fa; }
.t-exterior { background: rgba(251,191,36,0.12);  color: #fbbf24; }
.t-interior { background: rgba(167,139,250,0.12); color: #a78bfa; }
.t-err      { background: rgba(248,113,113,0.12); color: #f87171; }
.t-unk      { color: var(--muted2); }

.mapping-summary { display: flex; flex-direction: column; gap: 5px; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; }
.ms-row { font-family: var(--mono); font-size: 11px; color: var(--text); display: flex; align-items: center; gap: 7px; }
.ms-row.warn { color: var(--warning); }
.ms-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.ms-dot.ok   { background: #34d399; }
.ms-dot.warn { background: var(--warning); }

/* ── MAIN ── */
.main { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }

.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.row-count { margin-left: auto; font-weight: 400; color: var(--muted); }
.row-count.error { color: var(--danger); }
.input-section { display: flex; flex-direction: column; gap: 8px; }
.input-actions { display: flex; gap: 8px; align-items: center; }
.hint.warn { color: var(--warning); font-family: var(--mono); font-size: 11px; }

/* Results */
.results-section { display: flex; flex-direction: column; gap: 10px; }
.results-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }

.filter-tabs { display: flex; gap: 4px; }
.tab { font-family: var(--mono); font-size: 11px; padding: 4px 12px; border-radius: 3px; border: 1px solid var(--border2); cursor: pointer; color: var(--muted2); background: transparent; transition: all 0.13s; }
.tab:hover { color: var(--text); border-color: var(--muted2); }
.tab.active { border-color: var(--accent); color: var(--accent); background: rgba(200,255,0,0.05); }
.warn-tab.active { border-color: #f87171; color: #f87171; background: rgba(248,113,113,0.05); }
.ok-tab.active   { border-color: #34d399; color: #34d399; background: rgba(52,211,153,0.05); }

.field-counts { display: flex; gap: 12px; flex-wrap: wrap; }
.fcnt { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.red  { color: #f87171; }

.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 4px; }
.vtable { width: 100%; border-collapse: collapse; }
.vtable thead tr { background: var(--surface2); }
.vtable th { font-family: var(--mono); font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted2); text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
.vtable td { padding: 7px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.vtable tr:last-child td { border-bottom: none; }
.vtable tr.row-issue:hover td { background: rgba(248,113,113,0.05); }
.vtable tr.row-ok:hover td    { background: var(--surface); }
.vtable tr.row-issue td       { background: rgba(248,113,113,0.025); }

.col-id      { width: 56px; }
.col-vehicle { min-width: 180px; }
.col-field   { width: 130px; }
.col-status  { width: 84px; }

.mono { font-family: var(--mono); font-size: 11px; }
.brand-tag { font-family: var(--mono); font-size: 11px; font-weight: 600; }
.sub { font-family: var(--mono); font-size: 10px; color: var(--muted2); display: block; margin-top: 2px; }

:deep(.fc-ok)   { font-family: var(--mono); font-size: 11px; color: #34d399; }
:deep(.fc-bad)  { font-family: var(--mono); font-size: 11px; color: #f87171; font-weight: 600; }
:deep(.fc-null) { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
:deep(.fc-icon) { margin-right: 3px; }

.badge { font-family: var(--mono); font-size: 10px; font-weight: 600; border-radius: 3px; padding: 2px 8px; }
.badge-ok    { color: #34d399; background: rgba(52,211,153,0.1); }
.badge-issue { color: #f87171; background: rgba(248,113,113,0.1); }
</style>
