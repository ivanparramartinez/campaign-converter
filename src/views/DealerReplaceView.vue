<template>
  <div class="page">
    <AppHeader />

    <div class="tool-header">
      <div class="logo">Dealer <span>Replace</span></div>
      <div class="header-right" v-if="mode === 'replace' && result.length">
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

      <!-- MAIN AREA -->
      <div class="main">

        <!-- TAB SWITCHER -->
        <div class="tab-bar">
          <button class="tab-btn" :class="{active: mode==='replace'}" @click="mode='replace'">⚡ Replace</button>
          <button class="tab-btn" :class="{active: mode==='audit'}"   @click="mode='audit'">🔍 Audit URLs</button>
        </div>

        <!-- SHARED JSON INPUT -->
        <div class="input-section">
          <div class="section-title">
            JSON input
            <span class="row-count" v-if="inputRecords.length">{{ inputRecords.length }} records</span>
            <span class="row-count error" v-if="parseError">{{ parseError }}</span>
          </div>
          <textarea v-model="rawJson" rows="9" placeholder="Paste the full JSON array here..." style="font-size:11px" />
        </div>

        <!-- ─── REPLACE MODE ─── -->
        <template v-if="mode === 'replace'">
          <div class="input-actions">
            <button class="btn btn-accent" @click="runReplace" :disabled="!inputRecords.length || !anyDealer">
              ⚡ Replace dealers
            </button>
            <button class="btn btn-sm" @click="rawJson=''; result=[]">↺ Clear</button>
            <span v-if="!anyDealer" class="hint" style="color:var(--warning)">Add at least one dealer on the left</span>
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
        </template>

        <!-- ─── AUDIT MODE ─── -->
        <template v-if="mode === 'audit'">
          <div class="input-actions">
            <button class="btn btn-accent" @click="runAudit" :disabled="!inputRecords.length">
              🔍 Extract dealers
            </button>
            <button class="btn btn-sm" @click="auditRows=[]">↺ Clear</button>
          </div>

          <div v-if="auditRows.length" class="audit-section">
            <div class="section-title">
              {{ auditRows.length }} unique dealer{{ auditRows.length > 1 ? 's' : '' }} found
              <div style="margin-left:auto;display:flex;gap:8px">
                <button class="btn btn-sm" @click="checkAllUrls" :disabled="checking">
                  <span v-if="checking">⏳ Checking…</span>
                  <span v-else>✓ Check all URLs</span>
                </button>
              </div>
            </div>

            <div class="audit-table">
              <div class="audit-row audit-head">
                <div class="ac brand-col">Brand</div>
                <div class="ac name-col">Dealer</div>
                <div class="ac url-col">URL</div>
                <div class="ac status-col">Status</div>
              </div>
              <div v-for="(row, i) in auditRows" :key="i" class="audit-row" :class="'status-' + row.status">
                <div class="ac brand-col">
                  <span class="brand-dot" :style="{background: getBrandColor(row.brand)}"></span>
                  {{ row.brand || '—' }}
                </div>
                <div class="ac name-col">
                  <div class="dealer-name">{{ row.name || '—' }}</div>
                  <div class="dealer-sub" v-if="row.city">{{ row.city }}, {{ row.state }}</div>
                </div>
                <div class="ac url-col">
                  <a v-if="row.url" :href="row.url" target="_blank" class="url-link">{{ row.url }}</a>
                  <span v-else class="muted-text">no URL</span>
                </div>
                <div class="ac status-col">
                  <span v-if="row.status === 'pending'"  class="status-badge pending">—</span>
                  <span v-if="row.status === 'checking'" class="status-badge checking">⏳</span>
                  <span v-if="row.status === 'ok'"       class="status-badge ok">✓ OK</span>
                  <span v-if="row.status === 'timeout'"  class="status-badge timeout">⏱ Timeout</span>
                  <span v-if="row.status === 'error'"    class="status-badge error">✗ Error</span>
                  <span v-if="row.status === 'no-url'"   class="status-badge no-url">no URL</span>
                </div>
              </div>
            </div>

            <!-- Summary after check -->
            <div v-if="auditDone" class="audit-summary">
              <span class="sum-chip ok">✓ {{ auditCounts.ok }} reachable</span>
              <span v-if="auditCounts.error"   class="sum-chip error">✗ {{ auditCounts.error }} failed</span>
              <span v-if="auditCounts.timeout" class="sum-chip timeout">⏱ {{ auditCounts.timeout }} timed out</span>
              <span v-if="auditCounts.noUrl"   class="sum-chip no-url">{{ auditCounts.noUrl }} no URL</span>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useGlobalsStore } from '../stores/globals.js'

const g = useGlobalsStore()

// ─── BRANDS ─────────────────────────────────────────────────────────────────
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

// ─── POOLS ──────────────────────────────────────────────────────────────────
let _id = 0
function makeSlot(raw = '') { return { id: _id++, raw } }

const pools = reactive({
  GMC:       [makeSlot()],
  Chevrolet: [makeSlot()],
  Buick:     [makeSlot()],
  Cadillac:  [makeSlot()],
})

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

const validPools = computed(() => {
  const out = {}
  for (const b of brands) {
    out[b.key] = pools[b.key].map(s => parseDealer(s.raw)).filter(Boolean)
  }
  return out
})

const anyDealer = computed(() => Object.values(validPools.value).some(arr => arr.length))
function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// ─── SHARED JSON ─────────────────────────────────────────────────────────────
const mode       = ref('replace')
const rawJson    = ref('')
const parseError = ref('')

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

// ─── REPLACE ─────────────────────────────────────────────────────────────────
const result         = ref([])
const skipped        = ref(0)
const replaceSummary = ref([])
const outputHtml     = ref('')

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

// ─── AUDIT ───────────────────────────────────────────────────────────────────
const auditRows = ref([])
const checking  = ref(false)
const auditDone = ref(false)

const auditCounts = computed(() => {
  const rows = auditRows.value
  return {
    ok:      rows.filter(r => r.status === 'ok').length,
    error:   rows.filter(r => r.status === 'error').length,
    timeout: rows.filter(r => r.status === 'timeout').length,
    noUrl:   rows.filter(r => r.status === 'no-url').length,
  }
})

function runAudit() {
  auditDone.value = false
  const seen = new Set()
  const rows = []

  for (const record of inputRecords.value) {
    const td = record.targetData || record
    const name  = td.dealerName  || td.DEALER_NAME  || ''
    const url   = td.dealerURL   || td.DEALER_URL   || ''
    const brand = td.marketingMake || td.BRAND || ''
    const city  = td.dealerCity  || ''
    const state = td.dealerState || ''
    const phone = td.dealerPhone || ''

    const key = `${name}|${url}`
    if (seen.has(key)) continue
    seen.add(key)

    rows.push({
      name, url, brand, city, state, phone,
      status: url ? 'pending' : 'no-url',
    })
  }

  // Sort: by brand then name
  rows.sort((a, b) => (a.brand + a.name).localeCompare(b.brand + b.name))
  auditRows.value = rows
}

async function checkUrl(url) {
  if (!url) return 'no-url'
  return new Promise(resolve => {
    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort(); resolve('timeout') }, 9000)
    fetch(url, { mode: 'no-cors', signal: controller.signal })
      .then(() => { clearTimeout(timer); resolve('ok') })
      .catch(e => { clearTimeout(timer); resolve(e.name === 'AbortError' ? 'timeout' : 'error') })
  })
}

async function checkAllUrls() {
  checking.value = true
  auditDone.value = false

  const checkable = auditRows.value.filter(r => r.url)
  // Mark all as checking
  checkable.forEach(r => { r.status = 'checking' })

  // Check concurrently (5 at a time)
  const CONCURRENCY = 5
  for (let i = 0; i < checkable.length; i += CONCURRENCY) {
    const batch = checkable.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async row => {
      row.status = await checkUrl(row.url)
    }))
  }

  checking.value = false
  auditDone.value = true
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
.main { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }

.tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border); padding-bottom: 0; margin-bottom: 4px; }
.tab-btn { font-family: var(--mono); font-size: 11px; background: transparent; border: none; color: var(--muted); padding: 6px 14px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.13s; }
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.row-count { margin-left: auto; font-weight: 400; color: var(--muted); }
.row-count.error { color: var(--danger); }

.input-section { display: flex; flex-direction: column; gap: 8px; }
.input-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* REPLACE OUTPUT */
.output-section { display: flex; flex-direction: column; gap: 8px; }
.summary-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.summary-chip { font-family: var(--mono); font-size: 11px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 2px 10px; }
.summary-chip.muted { color: var(--muted2); }

.output-box { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 14px 16px; font-family: var(--mono); font-size: 11px; max-height: 420px; overflow-y: auto; white-space: pre-wrap; line-height: 1.6; }
:deep(.jv)  { color: #98c379; }
:deep(.jn)  { color: #d19a66; }
:deep(.hl-dealer) { background: rgba(255,187,0,0.12); color: var(--warning); border-radius: 2px; }

/* AUDIT TABLE */
.audit-section { display: flex; flex-direction: column; gap: 8px; }

.audit-table { border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
.audit-row { display: grid; grid-template-columns: 110px 1fr 220px 90px; border-bottom: 1px solid var(--border); }
.audit-row:last-child { border-bottom: none; }
.audit-head { background: var(--surface2); }
.audit-head .ac { font-family: var(--mono); font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted2); padding: 6px 10px; }

.ac { padding: 8px 10px; font-family: var(--mono); font-size: 11px; display: flex; flex-direction: column; justify-content: center; }
.brand-col { display: flex; flex-direction: row; align-items: center; gap: 6px; }
.brand-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

.dealer-name { font-weight: 600; color: var(--text); }
.dealer-sub  { font-size: 10px; color: var(--muted); margin-top: 2px; }

.url-col { overflow: hidden; }
.url-link { color: var(--accent); text-decoration: none; font-size: 10px; word-break: break-all; }
.url-link:hover { text-decoration: underline; }
.muted-text { color: var(--muted); font-style: italic; }

.status-col { align-items: flex-start; justify-content: center; }
.status-badge { font-family: var(--mono); font-size: 10px; font-weight: 600; border-radius: 3px; padding: 2px 8px; }
.status-badge.pending  { color: var(--muted); }
.status-badge.checking { color: var(--muted2); }
.status-badge.ok       { color: #34d399; background: rgba(52,211,153,0.1); }
.status-badge.error    { color: #f87171; background: rgba(248,113,113,0.1); }
.status-badge.timeout  { color: var(--warning); background: rgba(255,187,0,0.1); }
.status-badge.no-url   { color: var(--muted2); }

/* Row highlight by status */
.audit-row.status-ok      { background: rgba(52,211,153,0.03); }
.audit-row.status-error   { background: rgba(248,113,113,0.05); }
.audit-row.status-timeout { background: rgba(255,187,0,0.04); }

.audit-summary { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 4px; }
.sum-chip { font-family: var(--mono); font-size: 11px; font-weight: 600; border-radius: 3px; padding: 3px 12px; }
.sum-chip.ok      { color: #34d399; background: rgba(52,211,153,0.1);  border: 1px solid rgba(52,211,153,0.25); }
.sum-chip.error   { color: #f87171; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); }
.sum-chip.timeout { color: var(--warning); background: rgba(255,187,0,0.1); border: 1px solid rgba(255,187,0,0.25); }
.sum-chip.no-url  { color: var(--muted2); background: var(--surface2); border: 1px solid var(--border2); }
</style>
