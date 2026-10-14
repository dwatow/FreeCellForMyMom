<script setup>
import { computed } from 'vue'
import { useStatsStore } from '../stores/stats.js'
import BaseDialog from './BaseDialog.vue'

const emit = defineEmits(['close'])
const store = useStatsStore()
const s = computed(() => store.stats)
const current = computed(() => {
  const n = s.value.streak
  if (n > 0) return `${n} 勝`
  if (n < 0) return `${-n} 敗`
  return '0'
})

function reset() {
  if (confirm('確定要重設所有統計資料嗎？')) store.reset()
}
</script>

<template>
  <BaseDialog title="新接龍統計資料" @close="emit('close', $event)">
    <table class="stats">
      <tbody>
        <tr><th>已玩遊戲：</th><td>{{ s.played }}</td></tr>
        <tr><th>勝場：</th><td>{{ s.won }}</td></tr>
        <tr><th>勝率：</th><td>{{ store.winRate }}%</td></tr>
        <tr class="gap"><th>最長連勝：</th><td>{{ s.longestWin }}</td></tr>
        <tr><th>最長連敗：</th><td>{{ s.longestLoss }}</td></tr>
        <tr><th>目前連續：</th><td>{{ current }}</td></tr>
      </tbody>
    </table>
    <template #footer>
      <button class="btn" @click="reset">重設</button>
      <button class="btn primary" @click="emit('close', null)">關閉</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.stats {
  width: 100%;
  border-collapse: collapse;
}
th {
  text-align: left;
  font-weight: normal;
  padding: 3px 0;
}
td {
  text-align: right;
}
.gap th,
.gap td {
  padding-top: 12px;
}
</style>
