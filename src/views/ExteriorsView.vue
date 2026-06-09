<template>
  <div class="page">
    <AppHeader />
    <div class="tool-header">
      <div class="logo">Exterior <span>Collection</span></div>
      <div class="total-count">{{ generated ? generated.length : 0 }} combinations</div>
    </div>

    <div class="layout">
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
          <div class="section-title">Nameplates <span class="cnt">{{ nameplates.length }}</span></div>
          <div class="input-row">
            <input v-model="plateInput" placeholder="Sierra 1500, Canyon" @keydown.enter="addPlates" />
            <button class="btn btn-sm" @click="addPlates">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(np,i) in nameplates" :key="np">{{ np }}<span class="del" @click="nameplates.splice(i,1)">×</span></span>
            <button v-if="nameplates.length" class="tag-clear" @click="nameplates=[]">Clear</button>
          </div>
          <button v-if="g.nameplates.length && !nameplates.length" class="btn btn-sm" style="margin-top:4px" @click="nameplates=[...g.nameplates]">Load from globals ({{ g.nameplates.length }})</button>
        </div>

        <div class="section">
          <div class="section-title">Color Pairs <span class="cnt">{{ pairs.length }}</span></div>
          <div class="input-row">
            <input v-model="colorCode" placeholder="GAZ" style="width:65px;flex:none" @keydown.enter="focusName" />
            <input v-model="colorName" ref="nameRef" placeholder="Summit White" @keydown.enter="addPair" />
            <button class="btn btn-sm" @click="addPair">+</button>
          </div>
          <div class="hint">Or bulk paste (code + space + name):</div>
          <div class="input-row">
            <textarea v-model="bulkInput" rows="4" placeholder="GAZ Summit White&#10;GBA Onyx Black&#10;G7C Satin Steel Metallic" style="font-size:11px" />
            <button class="btn btn-sm" style="align-self:flex-start" @click="bulkAdd">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag pair" v-for="(p,i) in pairs" :key="i">{{ p.code }} → {{ p.name }}<span class="del" @click="pairs.splice(i,1)">×</span></span>
            <button v-if="pairs.length" class="tag-clear" @click="pairs=[]">Clear</button>
          </div>
          <button v-if="g.exteriorPairs.length && !pairs.length" class="btn btn-sm" style="margin-top:4px" @click="pairs=g.exteriorPairs.map(p=>({code:p.code,name:p.name}))">Load from globals ({{ g.exteriorPairs.length }})</button>
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
          <template v-if="hasDiff">
            <span class="chip success"><b>{{ newCount }}</b> new</span>
            <span class="chip warning"><b>{{ dupCount }}</b> dup</span>
          </template>
        </div>
      </div>

      <div class="main">
        <div class="output-header" v-if="generated">
          <div class="diff-toggles" v-if="hasDiff">
            <button class="diff-toggle" :class="{ active: currentView==='all' }" @click="currentView='all'">All</button>
            <button class="diff-toggle new-active" :class="{ active: currentView==='new' }" @click="currentView='new'">New ({{ newCount }})</button>
            <button class="diff-toggle dup-active" :class="{ active: currentView==='dup' }" @click="currentView='dup'">Dups ({{ dupCount }})</button>
          </div>
          <div class="copy-row">
            <button class="btn btn-sm" @click="doCopy">⎘ Copy</button>
            <button class="btn btn-sm" @click="doCopyFlat">⎘ No brackets</button>
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
  loadExisting, clearExisting, copyOutput, copyFlat,
} = useCollector()

const nameplates = ref(g.nameplates.length ? [...g.nameplates] : [])
const plateInput = ref('')
const pairs      = ref([])
const colorCode  = ref('')
const colorName  = ref('')
const bulkInput  = ref('')
const nameRef    = ref(null)

function addPlates() {
  plateInput.value.split(',').map(s => s.trim()).filter(Boolean)
    .forEach(v => { if (!nameplates.value.find(x => x.toLowerCase() === v.toLowerCase())) nameplates.value.push(v) })
  plateInput.value = ''
}
function focusName() { nameRef.value?.focus() }
function addPair() {
  const code = colorCode.value.trim().toUpperCase()
  const name = colorName.value.trim()
  if (!code || !name) return
  if (!pairs.value.find(p => p.code === code && p.name === name)) pairs.value.push({ code, name })
  colorCode.value = ''; colorName.value = ''
}
function bulkAdd() {
  bulkInput.value.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    const idx = line.search(/\s/)
    if (idx === -1) return
    const code = line.slice(0, idx).toUpperCase()
    const name = line.slice(idx).trim()
    if (code && name && !pairs.value.find(p => p.code === code && p.name === name)) pairs.value.push({ code, name })
  })
  bulkInput.value = ''
}

function comboKey(obj) {
  return `${(obj.BRAND||'').toUpperCase()}|${obj.MODEL_YR}|${(obj.VEH_NAME_PLATE||'').toUpperCase()}|${(obj.DERIVED_FIELDS1||'').toUpperCase()}`
}
function loadExistingData() { loadExisting(comboKey) }

function generate() {
  if (!brand.value || !years.value.length || !nameplates.value.length || !pairs.value.length)
    return alert('Fill in brand, year, nameplate and at least one color pair.')
  const combos = []
  for (const y of years.value) for (const np of nameplates.value) for (const p of pairs.value) {
    const obj = { BRAND: brand.value, MODEL_YR: y, VEH_NAME_PLATE: np, DERIVED_FIELDS1: p.code, EXTERIOR_TEXT: p.name }
    obj._isDup = existingKeys.value.size > 0 && existingKeys.value.has(comboKey(obj))
    combos.push(obj)
  }
  generated.value = combos; currentView.value = 'all'
}

function resetAll() {
  years.value = []; nameplates.value = []; pairs.value = []
  brand.value = ''; generated.value = null; clearExisting()
}

function hl(raw) {
  return raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/("[\w_]+")\s*:/g,'<span class="jk">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g,': <span class="jv">$1</span>')
    .replace(/:\s*(\d+)/g,': <span class="jn">$1</span>')
}

const outputHtml = computed(() => {
  if (!generated.value) return ''
  const items = visibleItems.value
  if (!hasDiff.value) return hl(JSON.stringify(items.map(({ _isDup, ...r }) => r), null, 2))
  const lines = ['[']
  items.forEach((combo, idx) => {
    const { _isDup, ...rest } = combo
    const cls = _isDup ? 'json-dup' : 'json-new'
    const el = JSON.stringify(rest, null, 2).split('\n')
    el.forEach((line, li) => {
      let out = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      if (li === el.length - 1 && idx < items.length - 1) out += ','
      lines.push(`<span class="${cls}">${out}</span>`)
    })
  })
  lines.push(']')
  return lines.join('\n')
})

async function doCopy() { if (generated.value) await copyOutput(visibleItems.value) }
async function doCopyFlat() { if (generated.value) await copyFlat(visibleItems.value) }
function downloadOutput() {
  if (!generated.value) return
  const items = visibleItems.value.map(({ _isDup, ...r }) => r)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' }))
  a.download = 'exterior-collection.json'; a.click()
}
</script>

<style scoped>
.page { min-height: 100vh; }
.tool-header { border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: #ff9f43; }
.total-count { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.layout { display: grid; grid-template-columns: 340px 1fr; min-height: calc(100vh - 109px); }
.sidebar { border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.main { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
.section { display: flex; flex-direction: column; gap: 7px; }
.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
.cnt { margin-left: auto; color: var(--muted); font-weight: 400; }
.input-row { display: flex; gap: 7px; }
.input-row input { flex: 1; }
.tag-list { display: flex; flex-wrap: wrap; gap: 5px; min-height: 20px; }
.tag { display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 12px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 3px 9px; }
.tag.pair { border-color: rgba(255,159,67,0.3); color: #ff9f43; }
.del { cursor: pointer; color: var(--muted); font-size: 14px; transition: color 0.1s; }
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
.diff-toggle { font-family: var(--mono); font-size: 11px; padding: 4px 10px; border-radius: 3px; border: 1px solid var(--border2); cursor: pointer; background: transparent; color: var(--muted2); }
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
