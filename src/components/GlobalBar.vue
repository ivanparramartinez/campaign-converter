<template>
  <div class="global-bar" v-if="g.hasAny">
    <span class="label">GLOBALS</span>

    <!-- Brand -->
    <Chip v-if="g.brand" color="#c8ff00">
      {{ g.brand }}<XBtn @click="g.setBrand('')" />
    </Chip>

    <!-- Years -->
    <template v-if="g.years.length">
      <span class="sep">YR</span>
      <Chip v-for="y in g.years" :key="y" color="#e8e8e0">
        {{ y }}<XBtn @click="g.removeYear(y)" />
      </Chip>
    </template>

    <!-- Nameplates -->
    <template v-if="g.nameplates.length">
      <span class="sep">NP</span>
      <Chip v-for="np in g.nameplates" :key="np" color="#00c8ff">
        {{ np }}<XBtn @click="g.removeNameplate(np)" />
      </Chip>
    </template>

    <!-- Count chips -->
    <CountChip v-if="g.mmcs.length"          label="MMC"  :count="g.mmcs.length"          color="#34d399" @clear="g.clearMMCs()" />
    <CountChip v-if="g.trimPairs.length"      label="TRIM" :count="g.trimPairs.length"      color="#f87171" @clear="g.clearTrimPairs()" />
    <CountChip v-if="g.exteriorPairs.length"  label="EXT"  :count="g.exteriorPairs.length"  color="#ff9f43" @clear="g.clearExteriorPairs()" />
    <CountChip v-if="g.interiorPairs.length"  label="INT"  :count="g.interiorPairs.length"  color="#c084fc" @clear="g.clearInteriorPairs()" />
    <CountChip v-if="Object.keys(g.mmcModelMap).length" label="MDL" :count="Object.keys(g.mmcModelMap).length" color="#00c8ff" @clear="g.clearMMCs()" />

    <button class="clear-all" @click="g.clearAll()">× Clear all</button>
  </div>
  <div class="global-bar empty" v-else>
    <span class="label-muted">GLOBALS — none set</span>
  </div>
</template>

<script setup>
import { useGlobalsStore } from '../stores/globals.js'
import Chip from './Chip.vue'
import CountChip from './CountChip.vue'
import XBtn from './XBtn.vue'

const g = useGlobalsStore()
</script>

<style scoped>
.global-bar {
  border-bottom: 1px solid var(--border);
  padding: 6px 20px;
  display: flex; align-items: center; gap: 8px;
  background: #0d0d0d;
  font-family: var(--mono); font-size: 11px;
  flex-wrap: wrap; min-height: 32px;
}
.label { color: var(--muted); letter-spacing: 0.08em; white-space: nowrap; }
.label-muted { color: #444; letter-spacing: 0.08em; }
.sep { color: var(--muted); padding: 0 2px; }
.clear-all {
  margin-left: auto; background: transparent; border: 1px solid #333;
  color: #666; font-family: inherit; font-size: 10px; padding: 2px 9px;
  border-radius: 3px; cursor: pointer; letter-spacing: 0.06em;
  transition: color 0.1s, border-color 0.1s;
}
.clear-all:hover { color: var(--danger); border-color: var(--danger); }
</style>
