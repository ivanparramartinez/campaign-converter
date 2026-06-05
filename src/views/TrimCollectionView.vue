<template>
  <div class="page">
    <AppHeader />
    <div class="tool-header">
      <div class="logo">Trim <span>Collection</span></div>
      <div class="total-count">{{ generated ? generated.length : 0 }} combinations</div>
    </div>

    <div class="layout">
      <!-- SIDEBAR -->
      <div class="sidebar">

        <div class="section">
          <div class="section-title">Brand</div>
          <select v-model="brand">
            <option value="">— select —</option>
            <option>GMC</option><option>Chevrolet</option><option>Buick</option><option>Cadillac</option>
          </select>
        </div>

        <div class="section">
          <div class="section-title">Model Years <span class="cnt">{{ years.length }}</span></div>
          <div class="input-row">
            <input v-model="yearInput" placeholder="2025" @keydown.enter="addYears" />
            <button class="btn btn-sm" @click="addYears">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(y,i) in years" :key="y">{{ y }}<span class="del" @click="removeYear(i)">×</span></span>
            <button v-if="years.length" class="tag-clear" @click="years=[]">Clear</button>
          </div>
        </div>

        <div class="section">
          <div class="section-title">MMC Codes <span class="cnt">{{ mmcs.length }}</span></div>
          <div class="input-row">
            <input v-model="mmcInput" placeholder="TC10543" @keydown.enter="addMMCs" />
            <button class="btn btn-sm" @click="addMMCs">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(m,i) in mmcs" :key="m">{{ m }}<span class="del" @click="removeMMC(i)">×</span></span>
            <button v-if="mmcs.length" class="tag-clear" @click="mmcs=[]">Clear</button>
          </div>
          <button v-if="g.mmcs.length && !mmcs.length" class="btn btn-sm" style="margin-top:4px" @click="mmcs=[...g.mmcs]">Load from globals ({{ g.mmcs.length }})</button>
        </div>

        <div class="section">
          <div class="section-title">Trim Pairs <span class="cnt">{{ pairs.length }}</span></div>
          <div class="pair-inputs">
            <div class="input-row">
              <input v-model="trimCode" placeholder="3SA" @keydown.enter="focusTrimText" style="width:80px;flex:none" />
              <input v-model="trimText" ref="trimTextRef" placeholder="SLE" @keydown.enter="addPair" />
            </div>
            <div class="filter-row">
              <select v-model="filterMode" @change="onFilterModeChange" style="font-size:11px">
                <option value="all">All MMCs</option>
                <option value="only">Only</option>
                <option value="exclude">Exclude</option>
              </select>
              <div v-if="filterMode !== 'all'" class="filter-chips">
                <span v-for="m in mmcs" :key="m" class="filter-chip" :class="{ selected: selectedMMCs.has(m) }" @click="toggleMMC(m)">{{ m }}</span>
              </div>
            </div>
            <button class="btn btn-sm" @click="addPair">+ Add pair</button>
          </div>
          <div class="hint" style="margin-top:4px">Or bulk paste:</div>
          <div class="bulk-row">
            <textarea v-model="bulkTrim" rows="3" placeholder="3SA SLE&#10;3SB SLT only:TC10543&#10;4SB Denali excl:TK10906" style="font-size:11px" />
            <button class="btn btn-sm" @click="bulkAddPairs">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag pair" v-for="(p,i) in pairs" :key="i">
              {{ p.trim }} → {{ p.text }}
              <span v-if="p.filterMode !== 'all'" style="font-size:10px;color:var(--muted2);margin-left:3px">[{{ p.filterMode }}: {{ p.filterMMCs.join(',') }}]</span>
              <span class="del" @click="pairs.splice(i,1)">×</span>
            </span>
            <button v-if="pairs.length" class="tag-clear" @click="pairs=[]">Clear</button>
          </div>
          <button v-if="g.trimPairs.length && !pairs.length" class="btn btn-sm" style="margin-top:4px" @click="pairs=[...g.trimPairs]">Load from globals ({{ g.trimPairs.length }})</button>
        </div>

        <div class="section">
          <div class="section-title">Diff Check (optional)</div>
          <textarea v-model="existingJson" rows="4" placeholder="Paste existing JSON array..." style="font-size:11px" />
          <div class="existing-row">
            <button class="btn btn-sm" @click="loadExistingData">Load</button>
            <button class="btn btn-sm" @click="clearExisting">Clear</button>
            <span class="exist-status" :class="existingStatusClass">{{ existingStatus }}</span>
          </div>
        </div>

        <div class="run-row">
          <button class="btn btn-accent" @click="generate">⚡ Generate</button>
          <button class="btn btn-sm" @click="resetAll">↺ Reset</button>
        </div>

        <div class="stats-chips" v-if="generated">
          <span class="chip accent"><b>{{ generated.length }}</b> combos</span>
          <span class="chip" v-if="brand"><b>{{ brand }}</b></span>
          <span class="chip"><b>{{ years.length }}</b> yr</span>
          <span class="chip"><b>{{ mmcs.length }}</b> MMC</span>
          <template v-if="hasDiff">
            <span class="chip success"><b>{{ newCount }}</b> new</span>
            <span class="chip warning"><b>{{ dupCount }}</b> dup</span>
          </template>
        </div>
      </div>

      <!-- MAIN -->
      <div class="main">
        <div class="output-header" v-if="generated">
          <div class="diff-toggles" v-if="hasDiff">
            <button class="diff-toggle" :class="{ active: currentView==='all' }" @click="currentView='all'">All</button>
            <button class="diff-toggle new-active" :class="{ active: currentView==='new' }" @click="currentView='new'">New ({{ newCount }})</button>
            <button class="diff-toggle dup-active" :class="{ active: currentView==='dup' }" @click="currentView='dup'">Dups ({{ dupCount }})</button>
          </div>
          <div class="copy-row">
            <button class="btn btn-sm" @click="doCopy">⎘ Copy</button>
            <button class="btn btn-sm" @click="downloadOutput">↓ JSON</button>
          </div>
        </div>

        <pre class="output-box"><code v-html="outputHtml || '// Configure and press Generate'" /></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useCollector } from '../composables/useCollector.js'

const {
  g, brand, years, yearInput, addYears, removeYear,
  existingJson, existingStatus, existingStatusClass, existingKeys,
  generated, currentView, visibleItems, newCount, dupCount, hasDiff,
  loadExisting, clearExisting, copyOutput,
} = useCollector()

const mmcs        = ref(g.mmcs.length ? [...g.mmcs] : [])
const mmcInput    = ref('')
const pairs       = ref([])
const trimCode    = ref('')
const trimText    = ref('')
const bulkTrim    = ref('')
const filterMode  = ref('all')
const selectedMMCs = ref(new Set())
const trimTextRef = ref(null)

function addMMCs() {
  mmcInput.value.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
    .forEach(v => { if (!mmcs.value.includes(v)) mmcs.value.push(v) })
  mmcInput.value = ''
}
function removeMMC(i) { mmcs.value.splice(i, 1) }

function focusTrimText() { trimTextRef.value?.focus() }
function onFilterModeChange() { selectedMMCs.value = new Set() }
function toggleMMC(m) {
  const s = new Set(selectedMMCs.value)
  if (s.has(m)) s.delete(m); else s.add(m)
  selectedMMCs.value = s
}

function addPair() {
  const trim = trimCode.value.trim().toUpperCase()
  const text = trimText.value.trim()
  if (!trim || !text) return
  const fm = filterMode.value
  const fmmcs = fm !== 'all' ? [...selectedMMCs.value] : []
  if (!pairs.value.find(p => p.trim === trim && p.text === text))
    pairs.value.push({ trim, text, filterMode: fm, filterMMCs: fmmcs })
  trimCode.value = ''
  trimText.value = ''
  filterMode.value = 'all'
  selectedMMCs.value = new Set()
}

function bulkAddPairs() {
  bulkTrim.value.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    let fm = 'all', fmmcs = []
    const fm_match = line.match(/\s+(only|excl):([^\s]+)$/i)
    if (fm_match) {
      fm = fm_match[1].toLowerCase() === 'only' ? 'only' : 'exclude'
      fmmcs = fm_match[2].toUpperCase().split(',').filter(Boolean)
      line = line.slice(0, fm_match.index).trim()
    }
    const idx = line.search(/\s/)
    if (idx === -1) return
    const trim = line.slice(0, idx).toUpperCase()
    const text = line.slice(idx).trim()
    if (trim && text && !pairs.value.find(p => p.trim === trim && p.text === text))
      pairs.value.push({ trim, text, filterMode: fm, filterMMCs: fmmcs })
  })
  bulkTrim.value = ''
}

function trimAppliesTo(pair, mmc) {
  if (pair.filterMode === 'all')     return true
  if (pair.filterMode === 'only')    return (pair.filterMMCs || []).includes(mmc.toUpperCase())
  if (pair.filterMode === 'exclude') return !(pair.filterMMCs || []).includes(mmc.toUpperCase())
  return true
}

function comboKey(obj) {
  return `${(obj.BRAND||'').toUpperCase()}|${obj.MODEL_YR}|${(obj.MMC||'').toUpperCase()}|${(obj.TRIM||'').toUpperCase()}`
}

function loadExistingData() { loadExisting(comboKey) }

function generate() {
  if (!brand.value || !years.value.length || !mmcs.value.length || !pairs.value.length)
    return alert('Select a brand and fill in Year, MMC and at least one Trim pair.')
  const combos = []
  for (const y of years.value) for (const m of mmcs.value) for (const p of pairs.value) {
    if (!trimAppliesTo(p, m)) continue
    const obj = { BRAND: brand.value, MODEL_YR: isNaN(parseInt(y)) ? y : parseInt(y), MMC: m, TRIM: p.trim, TRIM_TEXT: p.text }
    obj._isDup = existingKeys.value.size > 0 && existingKeys.value.has(comboKey(obj))
    combos.push(obj)
  }
  generated.value = combos
  currentView.value = 'all'
}

function resetAll() {
  years.value = []; mmcs.value = []; pairs.value = []
  brand.value = ''; generated.value = null; currentView.value = 'all'
  clearExisting()
}

function highlightJson(raw) {
  return raw
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/("[\w_]+")\s*:/g,'<span class="jk">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g,': <span class="jv">$1</span>')
    .replace(/:\s*(\d+)/g,': <span class="jn">$1</span>')
}

const outputHtml = computed(() => {
  if (!generated.value) return ''
  const items = visibleItems.value
  const hdiff = hasDiff.value
  if (!hdiff) return highlightJson(JSON.stringify(items.map(({ _isDup, ...r }) => r), null, 2))
  const lines = ['[']
  items.forEach((combo, idx) => {
    const { _isDup, ...rest } = combo
    const cls = _isDup ? 'json-dup' : 'json-new'
    const entryLines = JSON.stringify(rest, null, 2).split('\n')
    entryLines.forEach((line, li) => {
      let out = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      if (li === entryLines.length - 1 && idx < items.length - 1) out += ','
      lines.push(`<span class="${cls}">${out}</span>`)
    })
  })
  lines.push(']')
  return lines.join('\n')
})

async function doCopy() {
  if (!generated.value) return
  await copyOutput(visibleItems.value)
  // brief feedback could be added
}

function downloadOutput() {
  if (!generated.value) return
  const items = visibleItems.value.map(({ _isDup, ...r }) => r)
  const suffix = currentView.value === 'new' ? '-new' : currentView.value === 'dup' ? '-dups' : ''
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }))
  a.download = `trim-collection${suffix}.json`
  a.click()
}
</script>

<style scoped>
.page { min-height: 100vh; }
.tool-header { border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: #f87171; }
.total-count { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.layout { display: grid; grid-template-columns: 340px 1fr; min-height: calc(100vh - 109px); }
.sidebar { border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.main { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }
.section { display: flex; flex-direction: column; gap: 7px; }
.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
.cnt { margin-left: auto; color: var(--muted); font-weight: 400; }
.input-row { display: flex; gap: 7px; }
.input-row input { flex: 1; }
.pair-inputs { display: flex; flex-direction: column; gap: 6px; }
.filter-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.filter-chips { display: flex; flex-wrap: wrap; gap: 4px; }
.filter-chip { font-family: var(--mono); font-size: 11px; padding: 2px 7px; border-radius: 3px; cursor: pointer; background: var(--surface2); border: 1px solid var(--border2); color: var(--muted2); transition: all 0.12s; }
.filter-chip.selected { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.5); color: var(--accent); }
.bulk-row { display: flex; gap: 7px; }
.bulk-row textarea { flex: 1; }
.tag-list { display: flex; flex-wrap: wrap; gap: 5px; min-height: 20px; }
.tag { display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 12px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 3px 9px; }
.tag.pair { border-color: rgba(248,113,113,0.3); color: #f87171; }
.del { cursor: pointer; color: var(--muted); font-size: 14px; line-height: 1; transition: color 0.1s; }
.del:hover { color: var(--danger); }
.tag-clear { font-family: var(--mono); font-size: 10px; color: var(--muted); cursor: pointer; padding: 2px 7px; border: 1px solid var(--border); border-radius: 3px; background: transparent; }
.tag-clear:hover { color: var(--danger); border-color: var(--danger); }
.existing-row { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
.exist-status { font-family: var(--mono); font-size: 10px; }
.exist-status.ok { color: var(--success); } .exist-status.error { color: var(--danger); } .exist-status.muted { color: var(--muted); }
.run-row { display: flex; gap: 8px; }
.stats-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.chip { font-family: var(--mono); font-size: 11px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 2px 9px; color: var(--muted2); }
.chip.accent { background: rgba(200,255,0,0.07); border-color: rgba(200,255,0,0.25); color: var(--accent); }
.chip.success { background: rgba(0,230,118,0.07); border-color: rgba(0,230,118,0.25); color: var(--success); }
.chip.warning { background: rgba(255,187,0,0.07); border-color: rgba(255,187,0,0.25); color: var(--warning); }
.output-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.diff-toggles { display: flex; gap: 6px; }
.diff-toggle { font-family: var(--mono); font-size: 11px; padding: 4px 10px; border-radius: 3px; border: 1px solid var(--border2); cursor: pointer; background: transparent; color: var(--muted2); transition: all 0.15s; }
.diff-toggle.active { border-color: var(--muted2); color: var(--text); }
.diff-toggle.new-active.active { border-color: var(--success); color: var(--success); }
.diff-toggle.dup-active.active { border-color: var(--warning); color: var(--warning); }
.copy-row { display: flex; gap: 7px; }
.output-box { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 16px; font-family: var(--mono); font-size: 12px; line-height: 1.7; color: var(--text); white-space: pre-wrap; word-break: break-all; flex: 1; min-height: 400px; overflow-y: auto; }
:deep(.jk) { color: var(--accent2); }
:deep(.jv) { color: var(--accent); }
:deep(.jn) { color: #f87171; }
:deep(.json-new) { background: rgba(0,230,118,0.06); display: block; }
:deep(.json-dup) { background: rgba(255,187,0,0.05); color: var(--muted2); display: block; }
</style>
