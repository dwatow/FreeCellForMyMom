<script setup>
import { reactive } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import BaseDialog from './BaseDialog.vue'

const emit = defineEmits(['close'])
const store = useSettingsStore()
const draft = reactive({ sound: store.settings.sound, animation: store.settings.animation })

function save() {
  Object.assign(store.settings, draft)
  emit('close', true)
}
</script>

<template>
  <BaseDialog title="選項" @close="emit('close', $event)">
    <label class="row"><input v-model="draft.sound" type="checkbox" /> 播放音效</label>
    <label class="row"><input v-model="draft.animation" type="checkbox" /> 顯示動畫</label>
    <p class="note">進行中的遊戲會在每次移動後自動儲存，下次開啟時可以繼續。</p>
    <template #footer>
      <button class="btn primary" @click="save">確定</button>
      <button class="btn" @click="emit('close', null)">取消</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}
.note {
  color: #555;
  margin: 12px 0 0;
}
</style>
