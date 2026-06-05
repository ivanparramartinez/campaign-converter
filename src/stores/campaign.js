import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCampaignStore = defineStore('campaign', () => {
  const models   = ref([])
  const trim     = ref([])
  const exterior = ref([])
  const interior = ref([])

  const hasData = computed(() =>
    models.value.length || trim.value.length ||
    exterior.value.length || interior.value.length
  )

  function setType(type, arr) {
    if (type === 'models')   models.value   = arr
    if (type === 'trim')     trim.value     = arr
    if (type === 'exterior') exterior.value = arr
    if (type === 'interior') interior.value = arr
  }

  function clearType(type) { setType(type, []) }

  function clearAll() {
    models.value = []; trim.value = []
    exterior.value = []; interior.value = []
  }

  // Extractors (mirror campaign.js logic)
  const mmcCodes = computed(() =>
    [...new Set(models.value.map(r => r.MMC).filter(Boolean))]
  )
  const trimCodes = computed(() =>
    [...new Set(trim.value.map(r => r.TRIM).filter(Boolean))]
  )
  const extColorCodes = computed(() =>
    [...new Set(exterior.value.map(r => r.DERIVED_FIELDS1).filter(Boolean))]
  )
  const interiorCodes = computed(() =>
    [...new Set(interior.value.map(r => r.INTERIOR_CODE).filter(Boolean))]
  )

  const trimPairs = computed(() => {
    if (!trim.value.length) return []
    const allMMCs = mmcCodes.value
    const trimMap = new Map()
    trim.value.forEach(r => {
      if (!r.TRIM || !r.TRIM_TEXT) return
      const key = `${r.TRIM}|${r.TRIM_TEXT}`
      if (!trimMap.has(key)) trimMap.set(key, new Set())
      if (r.MMC) trimMap.get(key).add(r.MMC)
    })
    const pairs = []
    for (const [key, mmcSet] of trimMap) {
      const idx  = key.indexOf('|')
      const t    = key.slice(0, idx)
      const text = key.slice(idx + 1)
      const filterMMCs = [...mmcSet]
      const filterMode = filterMMCs.length === allMMCs.length ? 'all' : 'only'
      pairs.push({ trim: t, text, filterMode, filterMMCs })
    }
    return pairs
  })

  function parseCampaignInput(raw) {
    raw = raw.trim().replace(/^(var|const|let)\s+\w+\s*=\s*/, '').replace(/;?\s*$/, '')
    return JSON.parse(raw)
  }

  return {
    models, trim, exterior, interior, hasData,
    mmcCodes, trimCodes, extColorCodes, interiorCodes, trimPairs,
    setType, clearType, clearAll, parseCampaignInput,
  }
}, {
  persist: { key: 'cc_campaign' }
})
