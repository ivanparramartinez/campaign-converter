import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGlobalsStore = defineStore('globals', () => {
  // State
  const brand      = ref('')
  const years      = ref([])
  const nameplates = ref([])
  const mmcs       = ref([])
  const mmcModelMap    = ref({})
  const trimPairs      = ref([])
  const interiorPairs  = ref([])
  const exteriorPairs  = ref([])
  const dealer         = ref(null) // { name, address, city, state, zip, phone, url, bac }

  // Computed
  const hasAny = computed(() =>
    brand.value || years.value.length || nameplates.value.length ||
    mmcs.value.length || trimPairs.value.length ||
    exteriorPairs.value.length || interiorPairs.value.length
  )

  // Actions
  function setBrand(v) { brand.value = v }

  function addYear(y) {
    if (y && !years.value.includes(y)) years.value.push(y)
  }
  function removeYear(y) { years.value = years.value.filter(v => v !== y) }

  function addNameplate(np) {
    if (np && !nameplates.value.includes(np)) nameplates.value.push(np)
  }
  function removeNameplate(np) { nameplates.value = nameplates.value.filter(v => v !== np) }

  function setMMCs(list, map) {
    mmcs.value = list
    mmcModelMap.value = map
  }
  function clearMMCs() { mmcs.value = []; mmcModelMap.value = {} }

  function setTrimPairs(pairs) { trimPairs.value = pairs }
  function clearTrimPairs() { trimPairs.value = [] }

  function setInteriorPairs(pairs) { interiorPairs.value = pairs }
  function clearInteriorPairs() { interiorPairs.value = [] }

  function setExteriorPairs(pairs) { exteriorPairs.value = pairs }
  function clearExteriorPairs() { exteriorPairs.value = [] }

  function setDealer(d) { dealer.value = d }
  function clearDealer() { dealer.value = null }

  function clearAll() {
    brand.value = ''
    years.value = []
    nameplates.value = []
    mmcs.value = []
    mmcModelMap.value = {}
    trimPairs.value = []
    interiorPairs.value = []
    exteriorPairs.value = []
    dealer.value = null
  }

  return {
    brand, years, nameplates, mmcs, mmcModelMap,
    trimPairs, interiorPairs, exteriorPairs, dealer, hasAny,
    setBrand, addYear, removeYear,
    addNameplate, removeNameplate,
    setMMCs, clearMMCs,
    setTrimPairs, clearTrimPairs,
    setInteriorPairs, clearInteriorPairs,
    setExteriorPairs, clearExteriorPairs,
    setDealer, clearDealer,
    clearAll,
  }
}, {
  persist: {
    key: 'cc_globals',
  }
})
