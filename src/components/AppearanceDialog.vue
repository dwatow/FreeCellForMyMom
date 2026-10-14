<script setup>
import { reactive } from 'vue'
import { BACKGROUNDS, CARD_BACKS, useSettingsStore } from '../stores/settings.js'
import BaseDialog from './BaseDialog.vue'
import PlayingCard from './PlayingCard.vue'

const emit = defineEmits(['close'])
const store = useSettingsStore()
const draft = reactive({ background: store.settings.background, cardBack: store.settings.cardBack })

function save() {
  Object.assign(store.settings, draft)
  emit('close', true)
}
</script>

<template>
  <BaseDialog title="變更外觀" width="560px" @close="emit('close', $event)">
    <h3 class="heading">選擇牌背</h3>
    <div class="choices">
      <button
        v-for="b in CARD_BACKS"
        :key="b.id"
        class="choice"
        :class="{ active: draft.cardBack === b.id }"
        :title="b.name"
        @click="draft.cardBack = b.id"
      >
        <PlayingCard :id="0" face-down :back="b.id" class="preview-card" />
        <span>{{ b.name }}</span>
      </button>
    </div>
    <h3 class="heading">選擇背景</h3>
    <div class="choices">
      <button
        v-for="bg in BACKGROUNDS"
        :key="bg.id"
        class="choice"
        :class="{ active: draft.background === bg.id }"
        @click="draft.background = bg.id"
      >
        <span class="swatch" :class="`bg-${bg.id}`" />
        <span>{{ bg.name }}</span>
      </button>
    </div>
    <template #footer>
      <button class="btn primary" @click="save">確定</button>
      <button class="btn" @click="emit('close', null)">取消</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.heading {
  font-size: 14px;
  font-weight: normal;
  color: #1e3287;
  margin: 0 0 8px;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: none;
  font: inherit;
  cursor: pointer;
}
.choice:hover {
  background: #e5f3fb;
  border-color: #b8d6fb;
}
.choice.active {
  background: #cce8ff;
  border-color: #7da2ce;
}
.preview-card {
  position: relative;
  width: 60px;
  height: 84px;
}
.swatch {
  width: 84px;
  height: 56px;
  border-radius: 3px;
  border: 1px solid #888;
}
</style>
