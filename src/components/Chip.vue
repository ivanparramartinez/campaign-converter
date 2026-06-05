<template>
  <span class="chip" :style="chipStyle">
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ color: { type: String, default: '#e8e8e0' } })
const chipStyle = computed(() => {
  const hex = props.color.replace('#','')
  const r = parseInt(hex.slice(0,2),16)
  const g = parseInt(hex.slice(2,4),16)
  const b = parseInt(hex.slice(4,6),16)
  return {
    background: `rgba(${r},${g},${b},0.08)`,
    border: `1px solid rgba(${r},${g},${b},0.25)`,
    color: props.color,
  }
})
</script>

<style scoped>
.chip {
  display: inline-flex; align-items: center;
  border-radius: 3px; padding: 2px 9px;
  letter-spacing: 0.06em; font-size: 11px;
}
</style>
