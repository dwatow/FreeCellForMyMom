<script setup>
import { formatTime } from '../composables/format.js'

defineProps({
  gameNumber: { type: Number, required: true },
  elapsed: { type: Number, required: true },
  moves: { type: Number, required: true },
})
</script>

<template>
  <footer class="status" aria-live="off">
    <span>第 {{ gameNumber }} 局</span>
    <span>時間：{{ formatTime(elapsed) }}</span>
    <span>移動：{{ moves }}</span>
  </footer>
</template>

<style scoped>
.status {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 4px 12px;
  font-size: 13px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.35));
}
</style>
