<template>
  <div class="page">
    <AppHeader />

    <div class="tool-header">
      <div class="logo">Trim <span>Matrix</span></div>
      <div class="row-count">{{ generated.length }} rows</div>
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
          <div class="section-title">
            Model Years
            <span class="cnt">{{ years.length }} year{{ years.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="input-row">
            <input type="text" v-model="yearInput" placeholder="2025 2026" @keydown.enter="addYears" />
            <button class="btn btn-sm" @click="addYears">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(y, i) in years" :key="y">
              {{ y }}<span class="del" @click="removeYear(i)">×</span>
            </span>
            <button v-if="years.length" class="tag-clear" @click="years = []">Clear</button>
          </div>
        </div>

        <div class="section">
          <div class="section-title">
            MMC Codes
            <span class="cnt">{{ mmcs.length }} code{{ mmcs.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="input-row">
            <input type="text" v-model="mmcInput" placeholder="TC10543 TK10906" @keydown.enter="addMMCs" />
            <button class="btn btn-sm" @click="addMMCs">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(m, i) in mmcs" :key="m">
              {{ m }}<span class="del" @click="removeMMC(i)">×</span>
            </span>
            <button v-if="mmcs.length" class="tag-clear" @click="mmcs = []">Clear</button>
          </div>
          <button v-if="g.mmcs.length && !mmcs.length" class="btn btn-sm" @click="mmcs = [...g.mmcs]" style="margin-top:4px">
            Load from globals ({{ g.mmcs.length }})
          </button>
        </div>

        <div class="section">
          <div class="section-title">Trim Source</div>
          <div class="trim-source" v-if="g.trimPairs.length" style="color:var(--success)">
            ✓ {{ g.trimPairs.length }} pair{{ g.trimPairs.length !== 1 ? 's' : '' }} loaded from globals
          </div>
          <div class="trim-source" v-else>
            — load via <router-link to="/setup" style="color:var(--accent2)">Campaign Setup</router-link>
          </div>
        </div>

        <div class="run-row">
          <button class="btn btn-accent" @click="generate">⚡ Generate</button>
          <button class="btn btn-sm" @click="resetAll">↺ Reset</button>
        </div>

        <div class="stat-chips" v-if="generated.length">
          <span class="stat-pill" v-for="s in stats" :key="s">{{ s }}</span>
        </div>
      </div>

      <!-- MAIN -->
      <div class="main">
        <div class="results-header" v-if="generated.length">
          <div />
          <div class="export-row">
            <button id="copyBtn" class="btn btn-sm" @click="copyTSV">⎘ Copy for Excel</button>
            <button class="btn btn-sm" @click="downloadCSV">↓ CSV</button>
          </div>
        </div>

        <div class="empty-state" v-if="!generated.length">
          Select brand, year and MMC codes,<br>then press Generate
        </div>

        <div class="table-wrap" v-else>
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Brand</th><th>Model Yr</th><th>MMC</th><th>Trim</th><th>Trim Text</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in generated" :key="i" :class="{ 'mmc-first': i === 0 || generated[i-1].mmc !== r.mmc }">
                <td class="cell-meta">{{ r.brand }}</td>
                <td class="cell-meta">{{ r.model_yr }}</td>
                <td class="cell-mmc">{{ r.mmc }}</td>
                <td class="cell-trim">{{ r.trim }}</td>
                <td class="cell-text">{{ r.trim_text }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useGlobalsStore } from '../stores/globals.js'

const g = useGlobalsStore()

const brand     = ref(g.brand || '')
const years     = ref(g.years.length ? [...g.years] : [])
const mmcs      = ref(g.mmcs.length  ? [...g.mmcs]  : [])
const yearInput = ref('')
const mmcInput  = ref('')
const generated = ref([])

const stats = computed(() => {
  if (!generated.value.length) return []
  const mmcSet  = new Set(generated.value.map(r => r.mmc))
  const trimSet = new Set(generated.value.map(r => r.trim))
  return [
    `${generated.value.length} rows`,
    `${mmcSet.size} MMC${mmcSet.size !== 1 ? 's' : ''}`,
    `${trimSet.size} unique trim${trimSet.size !== 1 ? 's' : ''}`,
    brand.value,
  ]
})

function parseTokens(str) {
  return str.split(/[,\s\n]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
}

function addYears() {
  parseTokens(yearInput.value).forEach(v => { if (!years.value.includes(v)) years.value.push(v) })
  yearInput.value = ''
}
function removeYear(i) { years.value.splice(i, 1) }

function addMMCs() {
  parseTokens(mmcInput.value).forEach(v => { if (!mmcs.value.includes(v)) mmcs.value.push(v) })
  mmcInput.value = ''
}
function removeMMC(i) { mmcs.value.splice(i, 1) }

function trimAppliesTo(pair, mmc) {
  if (pair.filterMode === 'all')     return true
  if (pair.filterMode === 'only')    return (pair.filterMMCs || []).includes(mmc.toUpperCase())
  if (pair.filterMode === 'exclude') return !(pair.filterMMCs || []).includes(mmc.toUpperCase())
  return true
}

function generate() {
  if (!brand.value)    return alert('Select a brand.')
  if (!years.value.length) return alert('Add at least one model year.')
  if (!mmcs.value.length)  return alert('Add at least one MMC code.')
  if (!g.trimPairs.length) return alert('No trim pairs found. Load via Campaign Setup.')

  const rows = []
  for (const yr of years.value) {
    for (const mmc of mmcs.value) {
      for (const p of g.trimPairs) {
        if (trimAppliesTo(p, mmc))
          rows.push({ brand: brand.value, model_yr: yr, mmc, trim: p.trim, trim_text: p.text })
      }
    }
  }
  generated.value = rows
}

function resetAll() {
  brand.value = ''; years.value = []; mmcs.value = []; generated.value = []
}

async function copyTSV() {
  if (!generated.value.length) return
  const tsv = generated.value.map(r => [r.brand, r.model_yr, r.mmc, r.trim, r.trim_text].join('\t')).join('\n')
  await navigator.clipboard.writeText(tsv)
  const btn = document.getElementById('copyBtn')
  btn.textContent = '✓ Copied'
  setTimeout(() => btn.textContent = '⎘ Copy for Excel', 2000)
}

function downloadCSV() {
  if (!generated.value.length) return
  const header = 'BRAND,MODEL_YR,MMC,TRIM,TRIM_TEXT'
  const rows = generated.value.map(r => [r.brand, r.model_yr, r.mmc, r.trim, `"${r.trim_text}"`].join(','))
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'trim-matrix.csv'
  a.click()
}
</script>

<style scoped>
.page { min-height: 100vh; }
.tool-header { border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: #f87171; }
.row-count { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.layout { display: grid; grid-template-columns: 320px 1fr; min-height: calc(100vh - 109px); }
.sidebar { border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
.main { padding: 20px 24px; overflow-y: auto; }
.section { display: flex; flex-direction: column; gap: 7px; }
.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
.cnt { margin-left: auto; font-weight: 400; }
.input-row { display: flex; gap: 7px; }
.input-row input { flex: 1; }
.trim-source { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.run-row { display: flex; gap: 8px; }
.stat-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.stat-pill { font-family: var(--mono); font-size: 11px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 2px 9px; color: var(--muted2); }
.results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.export-row { display: flex; gap: 7px; }
.empty-state { text-align: center; padding: 60px 20px; font-family: var(--mono); font-size: 13px; color: var(--muted); line-height: 2; }
.table-wrap { overflow-x: auto; }
.matrix-table { width: 100%; border-collapse: collapse; }
.matrix-table th { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted2); text-align: left; padding: 7px 12px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); }
.matrix-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 13px; }
.matrix-table tr:hover td { background: var(--surface); }
.mmc-first td { border-top: 1px solid var(--border2); }
.cell-meta { color: var(--muted2); font-family: var(--mono); font-size: 12px; }
.cell-mmc  { color: var(--accent); font-family: var(--mono); font-weight: 600; }
.cell-trim { color: #f87171; font-family: var(--mono); }
.cell-text { color: var(--text); }
.tag-clear { font-family: var(--mono); font-size: 10px; color: var(--muted); cursor: pointer; padding: 2px 7px; border: 1px solid var(--border); border-radius: 3px; background: transparent; }
.tag-clear:hover { color: var(--danger); border-color: var(--danger); }
</style>
