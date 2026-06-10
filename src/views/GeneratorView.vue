<template>
  <div class="page">
    <AppHeader />

    <div class="tool-header">
      <div class="logo">JSON <span>Generator</span></div>
      <div class="record-count"><b>{{ generatedCount }}</b> {{ generatedCount === 1 ? 'record' : 'records' }} generated</div>
    </div>

    <div class="layout">
      <!-- LEFT: CONFIG -->
      <div class="sidebar">

        <div class="section">
          <div class="section-title">Campaign Fields</div>
          <div class="field-grid">
            <div><label>Model Year</label><input v-model="fields.modelYear" placeholder="2025" /></div>
            <div><label>Brand</label>
              <select v-model="fields.marketingMake">
                <option value="">—</option>
                <option v-for="b in brands" :key="b">{{ b }}</option>
              </select>
            </div>
            <div><label>Marketing Model</label><input v-model="fields.marketingModel" placeholder="Canyon" /></div>
            <div><label>Campaign Prefix</label><input v-model="fields.campaignPrefix" placeholder="CANS" /></div>
            <div><label>Email</label><input v-model="fields.email" placeholder="test@example.com" /></div>
            <div><label>Touch</label><input v-model="fields.touch" placeholder="1" /></div>
            <div><label>Loyalty Flag</label>
              <select v-model="fields.loyaltyFlag">
                <option value="N">N</option><option value="Y">Y</option>
              </select>
            </div>
            <div><label>Start Message ID</label><input v-model.number="fields.messageIdStart" type="number" min="1" /></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Event Codes <span class="cnt">{{ eventCodes.length }}</span></div>
          <div class="input-row">
            <input v-model="ecInput" placeholder="00 30 34..." @keydown.enter="addEventCodes" />
            <button class="btn btn-sm" @click="addEventCodes">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag accent" v-for="(c,i) in eventCodes" :key="c">
              {{ c }}<span class="del" @click="eventCodes.splice(i,1)">×</span>
            </span>
            <button v-if="eventCodes.length" class="tag-clear" @click="eventCodes=[]">Clear</button>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Interior Colors <span class="cnt">{{ interiorColors.length }}</span></div>
          <div class="input-row">
            <input v-model="intInput" placeholder="H2G H1T..." @keydown.enter="addInteriors" />
            <button class="btn btn-sm" @click="addInteriors">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="(c,i) in interiorColors" :key="c">
              {{ c }}<span class="del" @click="interiorColors.splice(i,1)">×</span>
            </span>
            <button v-if="interiorColors.length" class="tag-clear" @click="interiorColors=[]">Clear</button>
          </div>
          <button v-if="g.interiorPairs.length && !interiorColors.length" class="btn btn-sm" style="margin-top:4px" @click="interiorColors=g.interiorPairs.map(p=>p.code)">Load from globals ({{ g.interiorPairs.length }})</button>
        </div>

        <div class="section">
          <div class="section-title">MMC → Model Name <span class="cnt">{{ Object.keys(mmcModelMap).length }}</span></div>
          <div class="input-row">
            <input v-model="mmcCode" placeholder="TC10543" style="width:90px;flex:none" @keydown.enter="focusModelName" />
            <input v-model="mmcName" ref="mmcNameRef" placeholder="Canyon" @keydown.enter="addMmcMap" />
            <button class="btn btn-sm" @click="addMmcMap">+</button>
          </div>
          <div class="hint">Or bulk paste (MMC + space + name):</div>
          <div class="input-row">
            <textarea v-model="mmcBulk" rows="3" placeholder="TC10543 Canyon&#10;TK10906 Sierra 1500" style="font-size:11px" />
            <button class="btn btn-sm" style="align-self:flex-start" @click="bulkMmcMap">Add</button>
          </div>
          <div class="tag-list">
            <span class="tag" v-for="[mmc,name] in Object.entries(mmcModelMap)" :key="mmc">
              <span style="color:var(--accent2)">{{ mmc }}</span>&nbsp;→&nbsp;{{ name }}
              <span class="del" @click="removeMmc(mmc)">×</span>
            </span>
            <button v-if="Object.keys(mmcModelMap).length" class="tag-clear" @click="mmcModelMap={}">Clear</button>
          </div>
          <button v-if="Object.keys(g.mmcModelMap).length && !Object.keys(mmcModelMap).length" class="btn btn-sm" style="margin-top:4px" @click="mmcModelMap={...g.mmcModelMap}">Load from globals ({{ Object.keys(g.mmcModelMap).length }})</button>
        </div>

        <div class="section">
          <div class="section-title">Combinations <span class="cnt">{{ combosCount }}</span></div>
          <div class="hint">One per line: <code>MODEL TRIM EXTCOLOR</code></div>
          <textarea v-model="combosRaw" rows="6" placeholder="TC10543 3SA GAZ&#10;TC10543 3SA GBA&#10;TK10906 3SB G7C" style="font-size:11px" @input="updateCombosCount" />
          <div class="pairs-hint" v-if="hasSavedPairs">
            <button class="btn btn-sm" @click="loadSavedPairs">Load pairs from Checker</button>
          </div>
        </div>

        <div class="run-row">
          <button class="btn btn-accent" @click="generate">⚡ Generate JSON</button>
          <button class="btn btn-sm" @click="resetOutput">↺ Clear output</button>
        </div>

      </div>

      <!-- RIGHT: OUTPUT -->
      <div class="main">
        <div class="output-actions" v-if="generatedJSON">
          <button class="btn btn-sm" @click="copyOutput">⎘ Copy</button>
          <button class="btn btn-sm" @click="copyFlat">⎘ No brackets</button>
          <button class="btn btn-sm" @click="downloadJSON">↓ Download</button>
          <button v-if="!g.dealer" class="btn btn-sm btn-cyan" @click="refreshDealer">↻ Randomize dealer</button>
          <span v-else class="dealer-fixed">📍 {{ g.dealer.name }}</span>
        </div>

        <pre class="output-box"><code v-html="outputHtml || '// Configure fields and press Generate'" /></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { useGlobalsStore } from '../stores/globals.js'

const g = useGlobalsStore()
const brands = ['GMC','Chevrolet','Buick','Cadillac']

// Fields
const fields = ref({
  modelYear: g.years[0] || '2025',
  marketingMake: g.brand || '',
  marketingModel: '',
  campaignPrefix: 'CANS',
  email: '',
  touch: '1',
  loyaltyFlag: 'N',
  messageIdStart: 1,
})

const eventCodes    = ref(['00','30','34','38','40','42A','42B','42C','43','48','50','TB1','TB2','TB3','TB4','TB5','TB6','TB7'])
const interiorColors = ref([])
const mmcModelMap   = ref({})
const combosRaw     = ref('')
const combosCount   = ref(0)
const ecInput       = ref('')
const intInput      = ref('')
const mmcCode       = ref('')
const mmcName       = ref('')
const mmcBulk       = ref('')
const mmcNameRef    = ref(null)
const generatedJSON = ref(null)
const outputHtml    = ref('')
const generatedCount = ref(0)
const hasSavedPairs = ref(!!localStorage.getItem('cc_pairs'))

function addEventCodes() {
  ecInput.value.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
    .forEach(v => { if (v && !eventCodes.value.includes(v)) eventCodes.value.push(v) })
  ecInput.value = ''
}
function addInteriors() {
  intInput.value.split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
    .forEach(v => { if (v && !interiorColors.value.includes(v)) interiorColors.value.push(v) })
  intInput.value = ''
}
function focusModelName() { mmcNameRef.value?.focus() }
function addMmcMap() {
  const mmc  = mmcCode.value.trim().toUpperCase()
  const name = mmcName.value.trim()
  if (!mmc || !name) return
  mmcModelMap.value[mmc] = name
  mmcCode.value = ''; mmcName.value = ''
}
function bulkMmcMap() {
  mmcBulk.value.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    const idx = line.search(/\s/)
    if (idx === -1) return
    const mmc  = line.slice(0, idx).toUpperCase()
    const name = line.slice(idx).trim()
    if (mmc && name) mmcModelMap.value[mmc] = name
  })
  mmcBulk.value = ''
}
function removeMmc(mmc) {
  const m = { ...mmcModelMap.value }
  delete m[mmc]
  mmcModelMap.value = m
}
function updateCombosCount() {
  combosCount.value = parseCombos().length
}
function parseCombos() {
  return combosRaw.value.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const parts = line.split(/\s+/)
    if (parts.length >= 3) return { model: parts[0].toUpperCase(), trim: parts[1].toUpperCase(), ext: parts[2].toUpperCase() }
    return null
  }).filter(Boolean)
}
function loadSavedPairs() {
  const saved = localStorage.getItem('cc_pairs')
  if (saved) combosRaw.value = saved
  updateCombosCount()
}

// Dealer pools
const DEALER_POOLS = {
  GMC: [
    { name:'Burien GMC', BAC:'231056', address:'14900 1st Ave S', city:'Burien', state:'WA', zip:'98168', phone:'2065249000', url:'https://www.buriengmc.com' },
    { name:'Hendrick GMC', BAC:'344812', address:'7800 E Independence Blvd', city:'Charlotte', state:'NC', zip:'28227', phone:'7044783700', url:'https://www.hendrickgmc.com' },
    { name:'Serra GMC', BAC:'567293', address:'1600 Montgomery Hwy', city:'Hoover', state:'AL', zip:'35216', phone:'2058237000', url:'https://www.serragmc.com' },
  ],
  Chevrolet: [
    { name:'Chevrolet Of Bellevue', BAC:'225875', address:'13400 NE 20th St', city:'Bellevue', state:'WA', zip:'98005', phone:'4254548931', url:'https://www.chevroletofbellevue.com' },
    { name:'Hendrick Chevrolet', BAC:'114823', address:'6230 E Independence Blvd', city:'Charlotte', state:'NC', zip:'28212', phone:'7043716000', url:'https://www.hendrickchevy.com' },
    { name:'Serra Chevrolet', BAC:'320451', address:'2505 Acton Rd', city:'Birmingham', state:'AL', zip:'35243', phone:'2059674800', url:'https://www.serrachevrolet.com' },
  ],
  Buick: [
    { name:'Hendrick Buick', BAC:'358120', address:'6230 E Independence Blvd', city:'Charlotte', state:'NC', zip:'28212', phone:'7043711500', url:'https://www.hendrickbuick.com' },
    { name:'Serra Buick', BAC:'469035', address:'2405 Acton Rd', city:'Birmingham', state:'AL', zip:'35243', phone:'2059674900', url:'https://www.serrabuick.com' },
  ],
  Cadillac: [
    { name:'Cadillac Of Bellevue', BAC:'461278', address:'13427 NE 20th St', city:'Bellevue', state:'WA', zip:'98005', phone:'4252223000', url:'https://www.cadillacofbellevue.com' },
    { name:'Sewell Cadillac', BAC:'572389', address:'7111 Lemmon Ave', city:'Dallas', state:'TX', zip:'75209', phone:'2146916800', url:'https://www.sewellcadillac.com' },
  ],
}
const FIRST_NAMES = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Barbara','David','Susan']
const VIN_YEAR = {'2024':'R','2025':'S','2026':'T','2027':'V','2028':'W','2029':'X','2030':'Y'}

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randDealer(brand) { return rand(DEALER_POOLS[brand] || DEALER_POOLS.GMC) }
function randFirstName() { return rand(FIRST_NAMES) }
function randOrderNbr() {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', D = '0123456789'
  return Array.from({length:5},()=>L[~~(Math.random()*L.length)]).join('') + D[~~(Math.random()*10)]
}
function randLabel() {
  const L = 'abcdefghijklmnopqrstuvwxyz'
  return Array.from({length:8},()=>L[~~(Math.random()*L.length)]).join('')
}
function randVIN(yr) {
  const A='ABCDEFGHJKLMNPRSTUVWXYZ', AN='ABCDEFGHJKLMNPRSTUVWXYZ0123456789', D='0123456789'
  const r=(s)=>s[~~(Math.random()*s.length)]
  return '1G'+r(A)+Array.from({length:5},()=>r(AN)).join('')+r(D)+(VIN_YEAR[String(yr)]||'S')+r(A)+Array.from({length:6},()=>r(D)).join('')
}

function generate() {
  if (!eventCodes.value.length) return alert('Add at least one event code.')
  if (!interiorColors.value.length) return alert('Add at least one interior color.')
  const combos = parseCombos()
  if (!combos.length) return alert('Add at least one combination.')

  const f = fields.value
  const modelGroups = new Map()
  for (const c of combos) {
    const name = mmcModelMap.value[c.model] || f.marketingModel
    if (!modelGroups.has(name)) modelGroups.set(name, [])
    modelGroups.get(name).push(c)
  }

  const records = []
  let msgIdx = 0
  for (const [modelName, gCombos] of modelGroups) {
    for (const ec of eventCodes.value) {
      const variants = ec === '38' ? ['N','Y'] : [f.loyaltyFlag]
      for (const loyalty of variants) {
        const combo     = rand(gCombos)
        const intColor  = rand(interiorColors.value)
        const dealer    = g.dealer || randDealer(f.marketingMake)
        const firstName = randFirstName()
        const msgId = String(f.messageIdStart + msgIdx)
        const vName = `${f.campaignPrefix} | ${f.marketingMake} | ${ec} | ${f.modelYear} | ${modelName}`
        records.push({
          subjectLine: `${msgId}_${vName}_${combo.trim}_${combo.ext}_${intColor}`,
          message: { id: msgId, delivery: { mapping: { name:'targetData' }, label: randLabel() } },
          targetData: {
            VersionId: msgId, VERSION_NAME: vName, Touch: f.touch,
            orderNbr: randOrderNbr(),
            merchandisingModelCode: combo.model,
            dealerAddress: dealer.address, dealerBAC: dealer.BAC, dealerCity: dealer.city,
            dealerName: dealer.name, dealerPhone: dealer.phone, dealerState: dealer.state,
            dealerURL: dealer.url, dealerZip: dealer.zip,
            exteriorColor: combo.ext, firstName, interior: intColor,
            modelYear: f.modelYear, trim: combo.trim,
            marketingMake: f.marketingMake, marketingModel: modelName,
            VIN: randVIN(f.modelYear), eventCode: ec, Email: f.email,
            loyaltyMemberFlag: loyalty,
          }
        })
        msgIdx++
      }
    }
  }

  generatedJSON.value = records
  generatedCount.value = records.length
  renderOutput(records)
}

function renderOutput(records) {
  const raw = JSON.stringify(records, null, 2)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  outputHtml.value = raw
    .replace(/("[\w]+")\s*:/g,'<span class="jk">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g,': <span class="jv">$1</span>')
    .replace(/:\s*(\d+)/g,': <span class="jn">$1</span>')
}

function refreshDealer() {
  if (!generatedJSON.value) return
  generate()
}

async function copyOutput() {
  if (!generatedJSON.value) return
  await navigator.clipboard.writeText(JSON.stringify(generatedJSON.value, null, 2))
}

async function copyFlat() {
  if (!generatedJSON.value) return
  await navigator.clipboard.writeText(generatedJSON.value.map(o => JSON.stringify(o, null, 2)).join(',\n'))
}

function downloadJSON() {
  if (!generatedJSON.value) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(generatedJSON.value, null, 2)], { type: 'application/json' }))
  a.download = 'campaign.json'; a.click()
}

function resetOutput() {
  generatedJSON.value = null
  outputHtml.value = ''
  generatedCount.value = 0
}

onMounted(() => {
  if (g.interiorPairs.length && !interiorColors.value.length)
    interiorColors.value = g.interiorPairs.map(p => p.code)
  if (Object.keys(g.mmcModelMap).length && !Object.keys(mmcModelMap.value).length)
    mmcModelMap.value = { ...g.mmcModelMap }
  const saved = localStorage.getItem('cc_pairs')
  if (saved) { combosRaw.value = saved; updateCombosCount() }
})
</script>

<style scoped>
.page { min-height: 100vh; }
.tool-header { border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-family: var(--mono); font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; }
.logo span { color: var(--accent); }
.record-count { font-family: var(--mono); font-size: 11px; color: var(--muted2); }
.dealer-fixed { font-family: var(--mono); font-size: 11px; color: var(--warning); }
.layout { display: grid; grid-template-columns: 360px 1fr; min-height: calc(100vh - 109px); }
.sidebar { border-right: 1px solid var(--border); padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.main { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }
.section { display: flex; flex-direction: column; gap: 7px; }
.section-title { font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted2); padding-bottom: 7px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 7px; }
.cnt { margin-left: auto; color: var(--muted); font-weight: 400; }
.field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.input-row { display: flex; gap: 7px; }
.input-row input { flex: 1; }
.tag-list { display: flex; flex-wrap: wrap; gap: 5px; min-height: 20px; }
.tag { display: inline-flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 12px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 3px; padding: 3px 9px; }
.tag.accent { border-color: rgba(200,255,0,0.3); color: var(--accent); }
.del { cursor: pointer; color: var(--muted); font-size: 14px; transition: color 0.1s; }
.del:hover { color: var(--danger); }
.tag-clear { font-family: var(--mono); font-size: 10px; color: var(--muted); cursor: pointer; padding: 2px 7px; border: 1px solid var(--border); border-radius: 3px; background: transparent; }
.tag-clear:hover { color: var(--danger); border-color: var(--danger); }
.pairs-hint { margin-top: 4px; }
.run-row { display: flex; gap: 8px; }
.output-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.output-box { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 16px; font-family: var(--mono); font-size: 12px; line-height: 1.7; color: var(--text); white-space: pre-wrap; word-break: break-all; flex: 1; min-height: 400px; overflow-y: auto; }
:deep(.jk) { color: var(--accent2); }
:deep(.jv) { color: var(--accent); }
:deep(.jn) { color: #f87171; }
</style>
