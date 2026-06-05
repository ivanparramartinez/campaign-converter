<template>
  <span class="xbtn" @click.stop="$emit('click')">×</span>
</template>

<script setup>
defineEmits(['click'])
</script>

<style scoped>
.xbtn {
  margin-left: 5px; cursor: pointer;
  color: #555; line-height: 1;
  transition: color 0.1s;
}
.xbtn:hover { color: var(--danger); }
</style>
