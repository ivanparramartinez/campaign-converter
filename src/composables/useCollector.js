import { ref, computed, watch } from 'vue'
import { useGlobalsStore } from '../stores/globals.js'

export function useCollector() {
  const g = useGlobalsStore()

  const brand     = ref(g.brand || '')
  const years     = ref(g.years.length ? [...g.years] : [])
  const yearInput = ref('')

  // Sync from globals when store changes (e.g. user loaded setup after opening this view)
  watch(() => g.brand,  v => { if (!brand.value && v) brand.value = v }, { immediate: false })
  watch(() => g.years,  v => { if (!years.value.length && v.length) years.value = [...v] }, { immediate: false })

  const existingJson        = ref('')
  const existingStatus      = ref('— no data loaded —')
  const existingStatusClass = ref('muted')
  const existingKeys        = ref(new Set())

  const generated   = ref(null)
  const currentView = ref('all')

  function parseTokens(str) {
    return str.split(/[,\s\n]+/).map(s => s.trim()).filter(Boolean)
  }
  function addYears() {
    parseTokens(yearInput.value).forEach(v => { if (!years.value.includes(v)) years.value.push(v) })
    yearInput.value = ''
  }
  function removeYear(i) { years.value.splice(i, 1) }

  function loadExisting(comboKeyFn) {
    let raw = existingJson.value.trim()
    if (!raw) return
    try {
      raw = raw.replace(/^(var|const|let)\s+\w+\s*=\s*/, '').replace(/;?\s*$/, '')
      const arr = JSON.parse(raw)
      if (!Array.isArray(arr)) throw new Error()
      existingKeys.value = new Set(arr.map(comboKeyFn))
      existingStatus.value = `✓ ${existingKeys.value.size} existing entries loaded`
      existingStatusClass.value = 'ok'
    } catch {
      existingStatus.value = '✗ Invalid JSON — check format'
      existingStatusClass.value = 'error'
    }
  }

  function clearExisting() {
    existingKeys.value = new Set()
    existingJson.value = ''
    existingStatus.value = '— no data loaded —'
    existingStatusClass.value = 'muted'
  }

  const visibleItems = computed(() => {
    if (!generated.value) return []
    if (currentView.value === 'new') return generated.value.filter(c => !c._isDup)
    if (currentView.value === 'dup') return generated.value.filter(c =>  c._isDup)
    return generated.value
  })

  const newCount = computed(() => generated.value ? generated.value.filter(c => !c._isDup).length : 0)
  const dupCount = computed(() => generated.value ? generated.value.filter(c =>  c._isDup).length : 0)
  const hasDiff  = computed(() => existingKeys.value.size > 0)

  async function copyOutput(items) {
    const out = items.map(({ _isDup, ...rest }) => rest)
    await navigator.clipboard.writeText(JSON.stringify(out, null, 2))
  }

  async function copyFlat(items) {
    const out = items.map(({ _isDup, ...rest }) => rest)
    await navigator.clipboard.writeText(out.map(o => JSON.stringify(o, null, 2)).join(',\n'))
  }

  return {
    g, brand, years, yearInput,
    existingJson, existingStatus, existingStatusClass, existingKeys,
    generated, currentView, visibleItems,
    newCount, dupCount, hasDiff,
    parseTokens, addYears, removeYear,
    loadExisting, clearExisting, copyOutput, copyFlat,
  }
}
