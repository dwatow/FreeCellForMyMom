<script setup>
import { computed, ref } from 'vue'
import { MAX_GAME, MIN_GAME, isValidGameNumber } from '../core/deal.js'
import BaseDialog from './BaseDialog.vue'

const props = defineProps({ current: { type: Number, default: 1 } })
const emit = defineEmits(['close'])
const text = ref(String(props.current))
const value = computed(() => Number(text.value.trim()))
const valid = computed(() => /^\d+$/.test(text.value.trim()) && isValidGameNumber(value.value))

function submit() {
  if (valid.value) emit('close', value.value)
}
</script>

<template>
  <BaseDialog title="選擇遊戲" @close="emit('close', $event)">
    <form @submit.prevent="submit">
      <label class="label" for="game-number">請選擇遊戲編號（{{ MIN_GAME }} 到 {{ MAX_GAME.toLocaleString() }}）：</label>
      <input id="game-number" v-model="text" class="input" inputmode="numeric" autocomplete="off" autofocus @focus="$event.target.select()" />
      <p v-if="!valid && text.trim()" class="error">請輸入 {{ MIN_GAME }} 到 {{ MAX_GAME.toLocaleString() }} 之間的整數。</p>
    </form>
    <template #footer>
      <button class="btn primary" :disabled="!valid" @click="submit">確定</button>
      <button class="btn" @click="emit('close', null)">取消</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.label {
  display: block;
  margin-bottom: 8px;
}
.input {
  width: 100%;
  box-sizing: border-box;
  font-size: 15px;
  padding: 4px 6px;
  border: 1px solid #abadb3;
  border-top-color: #7a7a7a;
}
.input:focus {
  outline: none;
  border-color: #3d7bad;
}
.error {
  color: #c00;
  margin: 8px 0 0;
}
</style>
