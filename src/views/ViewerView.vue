<template>
  <div class="page">
    <AppHeader />
    <div class="tool-header">
      <div class="logo">Data <span>Viewer</span></div>
      <div class="header-stats">
        <span v-for="s in headerStats" :key="s.label" class="hstat" :style="{color:s.color}" v-if="s.count">
          <b>{{ s.count }}</b> {{ s.label }}
        </span>
      </div>
    </div>

    <div class="layout">
      <!-- INPUT PANEL -->
      <div class="sidebar">
        <div class="section" v-for="t in types" :key="t.key">
          <div class="section-title">
            <span class="dot" :style="{background:t.color}"></span>
            {{ t.label }}
            <span class="cnt" v-if="store[t.key].length"><b>{{ store[t.key].length }}</b> records</span>
          </div>
          <textarea :value="rawInputs[t.key]" @input="rawInputs[t.key]=$event.target.value" rows="4" :placeholder="t.placeholder" style="font-size:11px" />
          <div class="btn-row">
            <button class="btn btn-sm" @click="loadData(t.key)">Load</button>
            <button class="btn btn-sm" @click="clearData(t.key)">Clear</button>
          </div>
        </div>
      </div>

      <!-- BROWSER PANEL -->
      <div class="main">
        <div class="browser-controls">
          <div class="filter-tabs">
            <button class="tab" v-for="t in ['all',...types.map(t=>t.key)]" :key="t"
              :class="{ active: activeType===t }" @click="activeType=t">
              {{ t === 'all' ? 'All' : types.find(x=>x.key===t)?.label }}
              <span class="tab-count" v-if="t==='all'">{{ totalCount }}</span>
              <span class="tab-count" v-else>{{ store[t]?.length || 0 }}</span>
            </button>
          </div>
          <input class="search-input" v-model="searchQuery" placeholder="Search…" />
        </div>

        <div class="empty-state" v-if="!totalCount">
          Load data from the left panel to browse it here
        </div>

        <div v-else>
          <div v-for="t in visibleTypes" :key="t.key" class="data-section">
            <div class="data-section-title" :style="{color:t.color}">
              <span class="dot" :style="{background:t.color}"></span>
              {{ t.label }} ({{ filteredData(t.key).length }})
            </div>
            <div class="table-scroll">
              <table class="data-table">
                <thead>
                  <tr>
                    <th v-for="col in schemas[t.key]" :key="col">{{ col }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row,i) in filteredData(t.key).slice(0, 200)" :key="i">
                    <td v-for="col in schemas[t.key]" :key="col">{{ row[col] ?? '' }}</td>
                  </tr>
                  <tr v-if="filteredData(t.key).length > 200">
                    <td :colspan="schemas[t.key].length" class="more-row">… {{ filteredData(t.key).length - 200 }} more rows</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'

const types = [
  { key: 'interior', label: 'Interior', color: '#c084fc', placeholder: 'Paste interior JSON array...' },
  { key: 'exterior', label: 'Exterior', color: '#ff9f43', placeholder: 'Paste exterior JSON array...' },
  { key: 'trim',     label: 'Trim',     color: '#f87171', placeholder: 'Paste trim JSON array...' },
  { key: 'models',   label: 'Models',   color: '#34d399', placeholder: 'Paste models JSON array...' },
]

const schemas = {
  interior: ['BRAND','MODEL_YR','VEH_NAME_PLATE','INTERIOR_CODE','INTERIOR_TEXT'],
  exterior: ['BRAND','MODEL_YR','VEH_NAME_PLATE','DERIVED_FIELDS1','EXTERIOR_TEXT'],
  trim:     ['BRAND','MODEL_YR','MMC','TRIM','TRIM_TEXT'],
  models:   ['MMC','BRAND','MODEL_YR','MODEL_NAME'],
}

const store = reactive({ interior:[], exterior:[], trim:[], models:[] })
const rawInputs = reactive({ interior:'', exterior:'', trim:'', models:'' })
const activeType  = ref('all')
const searchQuery = ref('')

const totalCount = computed(() => Object.values(store).reduce((s,a) => s + a.length, 0))

const headerStats = computed(() => types.map(t => ({
  label: t.label, count: store[t.key].length, color: t.color
})))

const visibleTypes = computed(() => {
  if (activeType.value === 'all') return types.filter(t => store[t.key].length)
  return types.filter(t => t.key === activeType.value && store[t.key].length)
})

function parseInput(raw) {
  raw = raw.trim().replace(/^(var|const|let)\s+\w+\s*=\s*/, '').replace(/;?\s*$/, '')
  return JSON.parse(raw)
}

function loadData(key) {
  try {
    const arr = parseInput(rawInputs[key])
    if (!Array.isArray(arr)) throw new Error('Not an array')
    store[key] = arr
  } catch (e) {
    alert(`Parse error in ${key}: ${e.message}`)
  }
}

function clearData(key) {
  store[key] = []
  rawInputs[key] = ''
}

function filteredData(key) {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return store[key]
  return store[key].filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(q))
  )
}
</script>

<style scoped>
.page { min-height: 100vh; }
.tool-header { border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: var(--accent2); }
.header-stats { display: flex; gap: 16px; font-family: var(--mono); font-size: 11px; }
.hstat { color: var(--muted2); }
.layout { display: grid; grid-template-columns: 320px 1fr; min-height: calc(100vh - 109px); }
.sidebar { border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.main { padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }
.section { display: flex; flex-direction: column; gap: 7px; }
.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
.dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.cnt { margin-left: auto; font-weight: 400; }
.btn-row { display: flex; gap: 7px; }
.browser-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.tab { font-family: var(--mono); font-size: 11px; padding: 4px 10px; border-radius: 3px; border: 1px solid var(--border2); cursor: pointer; background: transparent; color: var(--muted2); display: flex; align-items: center; gap: 5px; }
.tab.active { border-color: var(--accent); color: var(--accent); background: rgba(200,255,0,0.06); }
.tab-count { font-size: 10px; color: var(--muted); }
.search-input { font-family: var(--mono); font-size: 12px; background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 5px 10px; border-radius: 4px; outline: none; width: 200px; }
.search-input:focus { border-color: var(--accent); }
.empty-state { text-align: center; padding: 60px 20px; font-family: var(--mono); font-size: 13px; color: var(--muted); line-height: 2; }
.data-section { display: flex; flex-direction: column; gap: 8px; }
.data-section-title { font-family: var(--mono); font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; display: flex; align-items: center; gap: 7px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
.table-scroll { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted2); text-align: left; padding: 6px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
.data-table td { padding: 6px 12px; border-bottom: 1px solid var(--border); font-family: var(--mono); font-size: 12px; white-space: nowrap; }
.data-table tr:hover td { background: var(--surface); }
.more-row { text-align: center; color: var(--muted); font-size: 11px; padding: 12px; }
</style>
