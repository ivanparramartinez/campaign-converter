<template>
  <div class="page">
    <AppHeader />

    <div class="tool-header">
      <div class="logo">Dealer <span>Replace</span></div>
      <div class="header-right" v-if="result.length">
        <span class="stat">{{ result.length }} records updated</span>
      </div>
    </div>

    <div class="layout">
      <!-- LEFT: DEALER POOLS PER BRAND -->
      <div class="sidebar">
        <div class="sidebar-label">Dealer pools per brand</div>
        <div class="hint" style="margin-bottom:10px">5 lines: Name · Address · City, State Zip · Phone · URL · BAC (optional)</div>

        <div v-for="brand in brands" :key="brand.key" class="brand-section">
          <div class="brand-header">
            <span class="dot" :style="{background: brand.color}"></span>
            {{ brand.label }}
            <span class="pool-count" v-if="validPools[brand.key].length">
              {{ validPools[brand.key].length }} dealer{{ validPools[brand.key].length > 1 ? 's' : '' }}
            </span>
            <button class="add-btn" @click="addSlot(brand.key)">+ Add</button>
          </div>

          <div v-for="(slot, idx) in pools[brand.key]" :key="slot.id" class="dealer-slot">
            <div class="slot-header">
              <span class="slot-num">#{{ idx + 1 }}</span>
              <span v-if="parseDealer(slot.raw)" class="slot-name">{{ parseDealer(slot.raw).name }}</span>
              <span v-else class="slot-empty">— empty —</span>
              <button class="remove-btn" @click="removeSlot(brand.key, idx)" v-if="pools[brand.key].length > 1">✕</button>
            </div>
            <textarea
              v-model="slot.raw"
              rows="6"
              :placeholder="brand.placeholder"
              style="font-size:11px"
            />
            <div v-if="parseDealer(slot.raw)" class="dealer-preview">
              <div class="dp-row"><span class="dp-l">Address</span>{{ parseDealer(slot.raw).address }}, {{ parseDealer(slot.raw).city }}, {{ parseDealer(slot.raw).state }} {{ parseDealer(slot.raw).zip }}</div>
              <div class="dp-row"><span class="dp-l">Phone</span>{{ parseDealer(slot.raw).phone }}</div>
              <div class="dp-row" v-if="parseDealer(slot.raw).bac"><span class="dp-l">BAC</span>{{ parseDealer(slot.raw).bac }}</div>
              <div class="dp-row" style="color:var(--accent2)"><span class="dp-l">URL</span>{{ parseDealer(slot.raw).url }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN: JSON INPUT + OUTPUT -->
      <div class="main">
        <div class="input-section">
          <div class="section-title">
            JSON to process
            <span class="row-count" v-if="inputRecords.length">{{ inputRecords.length }} records detected</span>
            <span class="row-count error" v-if="parseError">{{ parseError }}</span>
          </div>
          <textarea v-model="rawJson" rows="10" placeholder="Paste the full JSON array here..." style="font-size:11px" />
          <div class="input-actions">
            <button class="btn btn-accent" @click="runReplace" :disabled="!inputRecords.length || !anyDealer">
              ⚡ Replace dealers
            </button>
            <button class="btn btn-sm" @click="rawJson=''; result=[]">↺ Clear</button>
            <span v-if="!anyDealer" class="hint" style="color:var(--warning)">Add at least one dealer on the left</span>
          </div>
        </div>

        <div v-if="result.length" class="output-section">
          <div class="section-title">
            Result
            <div style="margin-left:auto;display:flex;gap:8px">
              <button class="btn btn-sm" @click="copyResult">⎘ Copy</button>
              <button class="btn btn-sm" @click="copyFlat">⎘ No brackets</button>
            </div>
          </div>
          <div class="summary-chips">
            <span v-for="b in replaceSummary" :key="b.brand" class="summary-chip" :style="{color: getBrandColor(b.brand)}">
              <b>{{ b.count }}</b> {{ b.brand }}
            </span>
            <span v-if="skipped" class="summary-chip muted">{{ skipped }} no match</span>
          </div>
          <pre class="output-box"><code v-html="outputHtml" /></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useGlobalsStore } from '../stores/globals.js'

const g = useGlobalsStore()

const brands = [
  { key: 'GMC',       label: 'GMC',       color: '#34d399',
    placeholder: 'Serra GMC\n1600 Montgomery Hwy\nHoover, AL 35216\n2058237000\nwww.serragmc.com\n567293' },
  { key: 'Chevrolet', label: 'Chevrolet', color: '#f87171',
    placeholder: 'Serra Chevrolet\n2505 Acton Rd\nBirmingham, AL 35243\n2059674800\nwww.serrachevrolet.com\n320451' },
  { key: 'Buick',     label: 'Buick',     color: '#ff9f43',
    placeholder: 'Serra Buick\n2405 Acton Rd\nBirmingham, AL 35243\n2059674900\nwww.serrabuick.com\n469035' },
  { key: 'Cadillac',  label: 'Cadillac',  color: '#c084fc',
    placeholder: 'Sewell Cadillac\n7111 Lemmon Ave\nDallas, TX 75209\n2146916800\nwww.sewellcadillac.com\n572389' },
]

let _id = 0
function makeSlot(raw = '') { return { id: _id++, raw } }

// Initialize pools with 1 empty slot per brand
const pools = reactive({
  GMC:       [makeSlot()],
  Chevrolet: [makeSlot()],
  Buick:     [makeSlot()],
  Cadillac:  [makeSlot()],
})

// Pre-fill from globals dealer if set
if (g.dealer) {
  const d = g.dealer
  const lines = [d.name, d.address, `${d.city}, ${d.state} ${d.zip}`, d.phone, d.url, d.bac].filter(Boolean).join('\n')
  for (const b of brands) {
    if (d.name?.toLowerCase().includes(b.key.toLowerCase())) {
      pools[b.key][0].raw = lines
      break
    }
  }
}

function addSlot(brandKey) { pools[brandKey].push(makeSlot()) }
function removeSlot(brandKey, idx) { pools[brandKey].splice(idx, 1) }

function parseDealer(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 5) return null
  const [nameLine, addressLine, cityStateLine, phoneLine, urlLine] = lines
  const m = cityStateLine.match(/^(.+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/)
  if (!m) return null
  let url = urlLine.trim()
  if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url
  return {
    name:    nameLine,
    address: addressLine,
    city:    m[1].trim(),
    state:   m[2].toUpperCase(),
    zip:     m[3],
    phone:   phoneLine.replace(/\D/g, ''),
    url,
    bac:     lines[5] || '',
  }
}

// Valid parsed dealers per brand
const validPools = computed(() => {
  const out = {}
  for (const b of brands) {
    out[b.key] = pools[b.key].map(s => parseDealer(s.raw)).filter(Boolean)
  }
  return out
})

const anyDealer = computed(() => Object.values(validPools.value).some(arr => arr.length))

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const rawJson     = ref('')
const parseError  = ref('')
const result      = ref([])
const skipped     = ref(0)
const replaceSummary = ref([])
const outputHtml  = ref('')

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

function getBrandColor(brand) {
  return brands.find(b => b.key === brand)?.color || 'var(--muted2)'
}

function runReplace() {
  const pools_ = validPools.value
  let skip = 0
  const counts = {}

  const updated = inputRecords.value.map(record => {
    const td = record.targetData || record
    const brand = td.marketingMake || td.BRAND || ''
    const pool = pools_[brand]
    if (!pool?.length) { skip++; return record }

    const dealer = randFrom(pool)
    counts[brand] = (counts[brand] || 0) + 1

    const dealerFields = {
      dealerName:    dealer.name,
      dealerAddress: dealer.address,
      dealerCity:    dealer.city,
      dealerState:   dealer.state,
      dealerZip:     dealer.zip,
      dealerPhone:   dealer.phone,
      dealerURL:     dealer.url,
      ...(dealer.bac ? { dealerBAC: dealer.bac } : {}),
    }

    if (record.targetData) {
      return { ...record, targetData: { ...record.targetData, ...dealerFields } }
    }
    return { ...record, ...dealerFields }
  })

  result.value = updated
  skipped.value = skip
  replaceSummary.value = Object.entries(counts).map(([brand, count]) => ({ brand, count }))
  renderOutput(updated)
}

function renderOutput(records) {
  const raw = JSON.stringify(records, null, 2)
  outputHtml.value = raw
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/("(?:dealerName|dealerAddress|dealerCity|dealerState|dealerZip|dealerPhone|dealerURL|dealerBAC)":\s*"[^"]*")/g,
      '<span class="hl-dealer">$1</span>')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g,': <span class="jv">$1</span>')
    .replace(/:\s*(\d+)/g,': <span class="jn">$1</span>')
}

async function copyResult() {
  if (!result.value.length) return
  await navigator.clipboard.writeText(JSON.stringify(result.value, null, 2))
}
async function copyFlat() {
  if (!result.value.length) return
  await navigator.clipboard.writeText(result.value.map(o => JSON.stringify(o, null, 2)).join(',\n'))
}
</script>

<style scoped>
.page { min-height: 100vh; }
.tool-header { border-bottom: 1px solid var(--border); padding: 14px 24px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: var(--warning); }
.stat { font-family: var(--mono); font-size: 11px; color: var(--success); }

.layout { display: grid; grid-template-columns: 310px 1fr; min-height: calc(100vh - 93px); }

/* SIDEBAR */
.sidebar { border-right: 1px solid var(--border); padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.sidebar-label { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted2); }

.brand-section { display: flex; flex-direction: column; gap: 8px; }
.brand-header { font-family: var(--mono); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; gap: 7px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
.dot { display: inline-block; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.pool-count { font-size: 10px; color: var(--muted2); font-weight: 400; }
.add-btn { margin-left: auto; font-family: var(--mono); font-size: 10px; background: transparent; border: 1px solid var(--border2); color: var(--muted2); border-radius: 3px; padding: 2px 8px; cursor: pointer; transition: all 0.13s; letter-spacing: 0.06em; }
.add-btn:hover { border-color: var(--accent); color: var(--accent); }

.dealer-slot { display: flex; flex-direction: column; gap: 5px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; }
.slot-header { display: flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 10px; margin-bottom: 2px; }
.slot-num { color: var(--muted); }
.slot-name { color: var(--text); font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.slot-empty { color: var(--muted); flex: 1; font-style: italic; }
.remove-btn { background: transparent; border: none; color: var(--muted); cursor: pointer; font-size: 11px; padding: 0 2px; transition: color 0.1s; }
.remove-btn:hover { color: var(--danger); }

.dealer-preview { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; border-top: 1px solid var(--border); }
.dp-row { display: flex; gap: 8px; font-family: var(--mono); font-size: 10px; color: var(--text); }
.dp-l { color: var(--muted); min-width: 40px; text-transform: uppercase; font-size: 9px; letter-spacing: 0.08em; padding-top: 1px; flex-shrink: 0; }

/* MAIN */
.main { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.row-count { margin-left: auto; font-weight: 400; color: var(--muted); }
.row-count.error { color: var(--danger); }

.input-section { display: flex; flex-direction: column; gap: 8px; }
.input-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

.output-section { display: flex; flex-direction: column; gap: 8px; }
.summary-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.summary-chip { font-family: var(--mono); font-size: 11px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 2px 10px; }
.summary-chip.muted { color: var(--muted2); }

.output-box { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 14px 16px; font-family: var(--mono); font-size: 11px; max-height: 480px; overflow-y: auto; white-space: pre-wrap; line-height: 1.6; }
:deep(.jv)  { color: #98c379; }
:deep(.jn)  { color: #d19a66; }
:deep(.hl-dealer) { background: rgba(255,187,0,0.12); color: var(--warning); border-radius: 2px; }
</style>
