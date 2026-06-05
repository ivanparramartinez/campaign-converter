<template>
  <Chip :color="color">
    {{ label }}&nbsp;<b style="font-weight:600">{{ count }}</b>
    <XBtn @click="$emit('clear')" />
  </Chip>
</template>

<script setup>
import Chip from './Chip.vue'
import XBtn from './XBtn.vue'
defineProps({ label: String, count: Number, color: String })
defineEmits(['clear'])
</script>
