<script setup>
import { onMounted, ref } from 'vue'

defineProps({ title: { type: String, required: true }, width: { type: String, default: '380px' } })
const emit = defineEmits(['close'])
const panel = ref(null)

onMounted(() => {
  const focusable = panel.value?.querySelector('[autofocus], input, button.primary, button')
  focusable?.focus()
})

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    emit('close', null)
  }
}
</script>

<template>
  <div class="overlay" @keydown="onKeydown">
    <div ref="panel" class="window" role="dialog" aria-modal="true" :aria-label="title" :style="{ width }">
      <header class="titlebar">
        <span class="title">{{ title }}</span>
        <button class="close" aria-label="關閉" @click="emit('close', null)">✕</button>
      </header>
      <div class="body"><slot /></div>
      <footer v-if="$slots.footer" class="footer"><slot name="footer" /></footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.18);
  padding: 16px;
}
.window {
  max-width: 100%;
  border-radius: 7px;
  padding: 0 7px 7px;
  background: linear-gradient(to bottom, rgba(180, 206, 236, 0.97), rgba(208, 226, 246, 0.97) 34px, rgba(196, 217, 241, 0.97));
  border: 1px solid #4c6f97;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6) inset, 0 10px 30px rgba(0, 0, 0, 0.45);
}
.titlebar {
  display: flex;
  align-items: center;
  height: 30px;
}
.title {
  flex: 1;
  font-size: 13px;
  color: #1e1e1e;
  text-shadow: 0 0 8px #fff, 0 0 8px #fff;
  padding-left: 2px;
}
.close {
  width: 43px;
  height: 19px;
  margin-top: -9px;
  border: 1px solid #6d2f2f;
  border-top: none;
  border-radius: 0 0 4px 4px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(to bottom, #e8a493, #d1452f 50%, #c32b13 51%, #d7735b);
  cursor: pointer;
}
.close:hover {
  background: linear-gradient(to bottom, #f5b7a6, #e85a40 50%, #d93c20 51%, #ee8f75);
}
.body {
  background: #fff;
  border: 1px solid #839fbf;
  padding: 16px 18px;
  font-size: 13px;
  color: #1e1e1e;
}
.footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  background: #f0f0f0;
  border: 1px solid #839fbf;
  border-top: 1px solid #dfdfdf;
  padding: 10px 12px;
}
</style>
