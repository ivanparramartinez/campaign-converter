<template>
  <div class="page">
    <AppHeader :show-global-bar="false" />

    <!-- Sticky header with stats -->
    <div class="checker-header">
      <div class="logo">Image <span>Checker</span></div>
      <div class="header-stats">
        <span>Total <b>{{ results.length }}</b></span>
        <span class="stat-ok">✓ <b>{{ statOk }}</b></span>
        <span class="stat-bad">✗ <b>{{ statBad }}</b></span>
        <span class="stat-pending">⏳ <b>{{ statPending }}</b></span>
      </div>
    </div>

    <div class="layout">
      <!-- SIDEBAR -->
      <div class="sidebar">

        <div class="section">
          <div class="section-title">URL Config</div>
          <label>Base URL</label>
          <input v-model="baseUrl" placeholder="https://cdn.example.com" @input="updatePreview" />
          <div class="base-grid">
            <div>
              <label>Body Type</label>
              <input v-model="bodyType" placeholder="SUV" @input="updatePreview" />
            </div>
            <div>
              <label>Brand</label>
              <select v-model="brand" @change="updatePreview">
                <option value="">—</option>
                <option v-for="b in brands" :key="b">{{ b }}</option>
              </select>
            </div>
          </div>
          <div class="base-grid">
            <div>
              <label>Year</label>
              <input v-model="year" placeholder="2025" @input="updatePreview" />
            </div>
            <div>
              <label>Angle</label>
              <input v-model="angle" placeholder="side" @input="updatePreview" />
            </div>
          </div>
          <label>Filename</label>
          <input v-model="filename" placeholder="image.jpg" @input="updatePreview" />
          <div class="url-preview" v-html="urlPreviewHtml" />
        </div>

        <div class="section">
          <div class="section-title">Model Codes <span class="cnt">{{ modelCodes.length }}</span></div>
          <div class="bulk-row">
            <textarea v-model="mcInput" rows="2" placeholder="TC10543 TK10906..." @keydown.enter.prevent="addMC" />
            <button class="btn btn-sm" @click="addMC">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(v,i) in modelCodes" :key="v">{{ v }}<span class="del" @click="modelCodes.splice(i,1)">×</span></span>
            <button v-if="modelCodes.length" class="tag-clear" @click="modelCodes=[]">Clear</button>
          </div>
          <button v-if="g.mmcs.length && !modelCodes.length" class="btn btn-sm" style="margin-top:4px" @click="modelCodes=[...g.mmcs]">Load from globals ({{ g.mmcs.length }})</button>
        </div>

        <div class="section">
          <div class="section-title">Trims <span class="cnt">{{ trims.length }}</span></div>
          <div class="bulk-row">
            <textarea v-model="trimInput" rows="2" placeholder="3SA 3SB 4SB..." @keydown.enter.prevent="addTrim" />
            <button class="btn btn-sm" @click="addTrim">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(v,i) in trims" :key="v">{{ v }}<span class="del" @click="trims.splice(i,1)">×</span></span>
            <button v-if="trims.length" class="tag-clear" @click="trims=[]">Clear</button>
          </div>
          <button v-if="g.trimPairs.length && !trims.length" class="btn btn-sm" style="margin-top:4px" @click="trims=g.trimPairs.map(p=>p.trim)">Load from globals ({{ g.trimPairs.length }})</button>
        </div>

        <div class="section">
          <div class="section-title">Ext. Colors <span class="cnt">{{ extColors.length }}</span></div>
          <div class="bulk-row">
            <textarea v-model="ecInput" rows="2" placeholder="GAZ GBA G7C..." @keydown.enter.prevent="addEC" />
            <button class="btn btn-sm" @click="addEC">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(v,i) in extColors" :key="v">{{ v }}<span class="del" @click="extColors.splice(i,1)">×</span></span>
            <button v-if="extColors.length" class="tag-clear" @click="extColors=[]">Clear</button>
          </div>
          <button v-if="g.exteriorPairs.length && !extColors.length" class="btn btn-sm" style="margin-top:4px" @click="extColors=g.exteriorPairs.map(p=>p.code)">Load from globals ({{ g.exteriorPairs.length }})</button>
        </div>

        <div class="section">
          <label>Concurrency</label>
          <input type="number" v-model.number="concurrency" min="1" max="20" style="width:80px" />
          <label style="margin-top:6px">Timeout (s)</label>
          <input type="number" v-model.number="timeoutSec" min="3" max="60" style="width:80px" />
        </div>

        <div class="run-row">
          <button v-if="!running" class="btn btn-accent" @click="startCheck">▶ Verify</button>
          <button v-else class="btn btn-stop" @click="stopCheck">◼ Stop</button>
          <button class="btn btn-sm" @click="clearResults">Clear</button>
        </div>

        <!-- Progress -->
        <div v-if="running || (results.length && done > 0)" class="progress-wrap">
          <div class="progress-bar-bg"><div class="progress-bar" :style="{ width: progress + '%' }" /></div>
          <div class="progress-label">{{ done }} / {{ results.length }} — {{ progress }}%</div>
        </div>
      </div>

      <!-- MAIN -->
      <div class="main">
        <!-- Banner to send to generator -->
        <div class="generator-banner" v-if="showBanner">
          <span>{{ bannerMsg }}</span>
          <button class="btn btn-sm btn-accent" @click="sendToGenerator">Open Generator →</button>
          <span class="banner-close" @click="showBanner=false">×</span>
        </div>

        <div class="results-header" v-if="results.length">
          <div class="filter-tabs">
            <button class="tab" :class="{ active: activeFilter==='all' }" @click="activeFilter='all'">All ({{ results.length }})</button>
            <button class="tab" :class="{ active: activeFilter==='ok' }" @click="activeFilter='ok'">✓ OK ({{ statOk }})</button>
            <button class="tab" :class="{ active: activeFilter==='bad' }" @click="activeFilter='bad'">✗ Pixel ({{ statBad }})</button>
            <button class="tab" :class="{ active: activeFilter==='error' }" @click="activeFilter='error'">— Error ({{ statError }})</button>
          </div>
          <div class="export-row">
            <button v-if="statOk" class="btn btn-sm" @click="copyOkPairs">⎘ Copy valid pairs</button>
            <button class="btn btn-sm" @click="exportCSV">↓ CSV</button>
          </div>
        </div>

        <div class="empty-state" v-if="!results.length">
          Configure the parameters<br>and press Verify
        </div>

        <div class="table-scroll" v-else>
          <table class="results-table">
            <thead>
              <tr>
                <th style="width:54px"></th>
                <th>Model Code</th><th>Trim</th><th>Ext. Color</th>
                <th>Status</th><th>URL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in visibleResults" :key="r.mc+r.tr+r.ec">
                <td>
                  <img v-if="r.status==='ok'" class="thumb" :src="r.url" @click="openLightbox(r)" />
                  <img v-else-if="r.status==='bad'" class="thumb pixel" :src="r.url" />
                  <span v-else style="color:var(--muted);font-family:var(--mono);font-size:11px">—</span>
                </td>
                <td><span class="mono">{{ r.mc }}</span></td>
                <td><span class="mono">{{ r.tr }}</span></td>
                <td><span class="mono">{{ r.ec }}</span></td>
                <td>
                  <span v-if="r.status==='loading'" class="badge badge-loading">⏳ Loading</span>
                  <span v-else-if="r.status==='ok'"  class="badge badge-ok">✓ {{ r.w }}×{{ r.h }}px</span>
                  <span v-else-if="r.status==='bad'" class="badge badge-bad">✗ Pixel {{ r.w }}×{{ r.h }}px</span>
                  <span v-else class="badge badge-error">— Error</span>
                </td>
                <td class="url-cell"><a :href="r.url" target="_blank">{{ r.url.replace(/^https?:\/\/[^/]+/,'') }}</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <div class="lightbox" :class="{ open: lightbox.open }" @click.self="lightbox.open=false">
      <div class="lightbox-inner">
        <div class="lightbox-label">{{ lightbox.label }}</div>
        <img :src="lightbox.url" class="lightbox-img" />
        <button class="btn btn-sm" @click="lightbox.open=false" style="margin-top:12px">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useGlobalsStore } from '../stores/globals.js'
import { useRouter } from 'vue-router'

const g = useGlobalsStore()
const router = useRouter()

const brands = ['GMC','Chevrolet','Buick','Cadillac']

// URL config
const baseUrl   = ref('')
const bodyType  = ref('')
const brand     = ref(g.brand?.toLowerCase() || '')
const year      = ref(g.years[0] || '')
const angle     = ref('side')
const filename  = ref('image.jpg')
const concurrency = ref(8)
const timeoutSec  = ref(12)

// Lists
const modelCodes = ref([])
const trims      = ref([])
const extColors  = ref([])
const mcInput    = ref('')
const trimInput  = ref('')
const ecInput    = ref('')

// Results
const results     = ref([])
const activeFilter = ref('all')
const running     = ref(false)
let shouldStop    = false
const done        = ref(0)
const showBanner  = ref(false)
const bannerMsg   = ref('')

const lightbox = reactive({ open: false, url: '', label: '' })

const urlPreviewHtml = ref('<span style="color:var(--muted)">— fill in the fields above —</span>')

function parseTokens(str) {
  return str.split(/[\s,\n]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
}
function addMC()   { parseTokens(mcInput.value).forEach(v => { if (!modelCodes.value.includes(v)) modelCodes.value.push(v) }); mcInput.value = '' }
function addTrim() { parseTokens(trimInput.value).forEach(v => { if (!trims.value.includes(v)) trims.value.push(v) }); trimInput.value = '' }
function addEC()   { parseTokens(ecInput.value).forEach(v => { if (!extColors.value.includes(v)) extColors.value.push(v) }); ecInput.value = '' }

function buildUrl(mc, tr, ec) {
  const b = baseUrl.value.trim().replace(/\/$/, '')
  const br = brand.value.trim().toLowerCase()
  return `${b}/images/exterior/${bodyType.value.trim()}/${br}/${year.value.trim()}/${mc}/${tr}/${ec}_${angle.value.trim()}/${filename.value.trim()}`
}

function updatePreview() {
  const mc = modelCodes.value[0] || '{modelCode}'
  const tr = trims.value[0]      || '{trim}'
  const ec = extColors.value[0]  || '{extColor}'
  const b  = baseUrl.value.trim().replace(/\/$/, '')
  const br = brand.value.toLowerCase()
  urlPreviewHtml.value =
    `<span class="seg">${b}/images/exterior/${bodyType.value}/</span>` +
    `<span class="seg-var">${br}</span><span class="seg">/</span>` +
    `<span class="seg-var">${year.value}</span><span class="seg">/</span>` +
    `<span class="seg-var">${mc}</span><span class="seg">/</span>` +
    `<span class="seg-var">${tr}</span><span class="seg">/</span>` +
    `<span class="seg-var">${ec}</span><span class="seg">_${angle.value}/${filename.value}</span>`
}

const statOk      = computed(() => results.value.filter(r => r.status === 'ok').length)
const statBad     = computed(() => results.value.filter(r => r.status === 'bad').length)
const statPending = computed(() => results.value.filter(r => r.status === 'loading').length)
const statError   = computed(() => results.value.filter(r => r.status === 'error').length)
const progress    = computed(() => results.value.length ? Math.round(done.value / results.value.length * 100) : 0)

const visibleResults = computed(() => {
  if (activeFilter.value === 'all') return results.value
  return results.value.filter(r => r.status === activeFilter.value)
})

let sessionToken = Date.now()

function checkImageUrl(url) {
  return new Promise(resolve => {
    const img = new Image()
    const ms  = timeoutSec.value * 1000
    const t   = setTimeout(() => { img.src = ''; resolve({ status: 'error', w: 0, h: 0 }) }, ms)
    img.onload = () => {
      clearTimeout(t)
      const read = () => {
        const w = img.naturalWidth, h = img.naturalHeight
        if (w === 0 && h === 0) resolve({ status: 'ok', w: 0, h: 0 })
        else resolve({ status: w <= 2 && h <= 2 ? 'bad' : 'ok', w, h })
      }
      if (typeof img.decode === 'function') img.decode().then(read).catch(read)
      else read()
    }
    img.onerror = () => { clearTimeout(t); resolve({ status: 'error', w: 0, h: 0 }) }
    img.src = url + '?_s=' + sessionToken
  })
}

async function startCheck() {
  if (running.value) return
  sessionToken = Date.now()

  const combos = []
  for (const mc of modelCodes.value)
    for (const tr of trims.value)
      for (const ec of extColors.value)
        combos.push({ mc, tr, ec, url: buildUrl(mc, tr, ec) })

  if (!combos.length) return alert('Add at least one value to each list.')

  results.value = combos.map(c => ({ ...c, status: 'loading', w: 0, h: 0 }))
  running.value = true
  shouldStop = false
  done.value = 0
  showBanner.value = false

  const conc = concurrency.value
  let idx = 0

  const worker = async () => {
    while (idx < results.value.length) {
      if (shouldStop) return
      const i = idx++
      const res = await checkImageUrl(results.value[i].url)
      results.value[i].status = res.status
      results.value[i].w = res.w
      results.value[i].h = res.h
      done.value++
    }
  }

  await Promise.all(Array.from({ length: Math.min(conc, results.value.length) }, worker))

  running.value = false
  shouldStop = false

  if (statOk.value) {
    bannerMsg.value = `✓ ${statOk.value} valid combinations found — open JSON Generator?`
    showBanner.value = true
    // Save pairs for generator
    const lines = results.value.filter(r => r.status === 'ok').map(r => `${r.mc} ${r.tr} ${r.ec}`).join('\n')
    localStorage.setItem('cc_pairs', lines)
  }
}

function stopCheck() {
  shouldStop = true
  running.value = false
}

function clearResults() {
  results.value = []
  done.value = 0
  showBanner.value = false
  activeFilter.value = 'all'
}

function openLightbox(r) {
  lightbox.url   = r.url
  lightbox.label = `${r.mc} / ${r.tr} / ${r.ec}`
  lightbox.open  = true
}

async function copyOkPairs() {
  const lines = results.value.filter(r => r.status === 'ok').map(r => `${r.mc} ${r.tr} ${r.ec}`).join('\n')
  await navigator.clipboard.writeText(lines)
}

function exportCSV() {
  const rows = results.value.map(r => `${r.mc},${r.tr},${r.ec},${r.status},${r.w},${r.h},${r.url}`)
  const blob = new Blob(['modelCode,trim,extColor,status,width,height,url\n' + rows.join('\n')], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'image-check.csv'; a.click()
}

function sendToGenerator() {
  router.push('/generator')
}
</script>

<style scoped>
.page { min-height: 100vh; }
.checker-header { border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; background: var(--bg); }
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: var(--accent); }
.header-stats { display: flex; gap: 20px; font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.stat-ok { color: var(--success); } .stat-bad { color: var(--danger); } .stat-pending { color: var(--warning); }
.layout { display: grid; grid-template-columns: 360px 1fr; min-height: calc(100vh - 109px); }
.sidebar { border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.main { padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
.section { display: flex; flex-direction: column; gap: 7px; }
.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
.cnt { margin-left: auto; color: var(--muted); font-weight: 400; }
.base-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.url-preview { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 10px 12px; font-family: var(--mono); font-size: 10px; color: var(--muted2); word-break: break-all; line-height: 1.7; }
:deep(.seg) { color: var(--accent2); } :deep(.seg-var) { color: var(--accent); }
.bulk-row { display: flex; gap: 7px; }
.bulk-row textarea { flex: 1; min-height: 38px; max-height: 80px; }
.tag-list { display: flex; flex-wrap: wrap; gap: 5px; min-height: 20px; }
.tag { display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 12px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 3px 9px; }
.del { cursor: pointer; color: var(--muted); font-size: 14px; transition: color 0.1s; }
.del:hover { color: var(--danger); }
.tag-clear { font-family: var(--mono); font-size: 10px; color: var(--muted); cursor: pointer; padding: 2px 7px; border: 1px solid var(--border); border-radius: 3px; background: transparent; }
.tag-clear:hover { color: var(--danger); border-color: var(--danger); }
.run-row { display: flex; gap: 8px; align-items: center; }
.progress-wrap { display: flex; flex-direction: column; gap: 5px; }
.progress-bar-bg { background: var(--surface2); border-radius: 2px; height: 3px; overflow: hidden; }
.progress-bar { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.2s; }
.progress-label { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.generator-banner { background: rgba(0,200,255,0.06); border: 1px solid rgba(0,200,255,0.25); border-radius: 6px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; font-family: var(--mono); font-size: 12px; color: var(--accent2); }
.banner-close { cursor: pointer; color: var(--muted); margin-left: auto; font-size: 16px; }
.banner-close:hover { color: var(--danger); }
.results-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.filter-tabs { display: flex; gap: 6px; }
.tab { font-family: var(--mono); font-size: 11px; padding: 5px 12px; border-radius: 3px; border: 1px solid var(--border2); cursor: pointer; color: var(--muted2); background: transparent; transition: all 0.15s; }
.tab.active { border-color: var(--accent); color: var(--accent); background: rgba(200,255,0,0.06); }
.export-row { display: flex; gap: 7px; }
.table-scroll { overflow-x: auto; }
.results-table { width: 100%; border-collapse: collapse; }
.results-table th { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted2); text-align: left; padding: 7px 12px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg); }
.results-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: middle; }
.results-table tr:hover td { background: var(--surface); }
.mono { font-family: var(--mono); font-size: 13px; }
.thumb { width: 48px; height: 32px; object-fit: contain; border: 1px solid var(--border); border-radius: 3px; background: var(--surface2); cursor: pointer; }
.thumb.pixel { image-rendering: pixelated; width: 32px; height: 32px; opacity: 0.4; }
.url-cell { font-family: var(--mono); font-size: 11px; color: var(--muted2); word-break: break-all; max-width: 300px; }
.url-cell a { color: var(--accent2); text-decoration: none; }
.url-cell a:hover { text-decoration: underline; }
.empty-state { text-align: center; padding: 60px 20px; font-family: var(--mono); font-size: 13px; color: var(--muted); line-height: 2; }
.lightbox { display: none; position: fixed; inset: 0; z-index: 900; background: rgba(0,0,0,0.9); align-items: center; justify-content: center; }
.lightbox.open { display: flex; }
.lightbox-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.lightbox-label { font-family: var(--mono); font-size: 12px; color: var(--accent); }
.lightbox-img { max-width: 90vw; max-height: 75vh; object-fit: contain; border: 1px solid var(--border2); border-radius: 4px; }
</style>
