<script setup>
import { computed } from 'vue'
import { useStatsStore } from '../stores/stats.js'
import { formatTime } from '../composables/format.js'
import BaseDialog from './BaseDialog.vue'

const props = defineProps({
  gameNumber: { type: Number, required: true },
  elapsed: { type: Number, required: true },
  moves: { type: Number, required: true },
})
const emit = defineEmits(['close'])
const stats = useStatsStore()
const s = computed(() => stats.stats)
</script>

<template>
  <BaseDialog title="遊戲獲勝" @close="emit('close', $event)">
    <p class="congrats">恭喜，您贏了！</p>
    <table class="info">
      <tbody>
        <tr><th>局號：</th><td>{{ props.gameNumber }}</td></tr>
        <tr><th>時間：</th><td>{{ formatTime(elapsed) }}</td></tr>
        <tr><th>移動次數：</th><td>{{ moves }}</td></tr>
        <tr><th>已玩遊戲：</th><td>{{ s.played }}</td></tr>
        <tr><th>勝場：</th><td>{{ s.won }}</td></tr>
        <tr><th>勝率：</th><td>{{ stats.winRate }}%</td></tr>
      </tbody>
    </table>
    <template #footer>
      <button class="btn primary" @click="emit('close', 'new')">新局</button>
      <button class="btn" @click="emit('close', 'replay')">重玩此局</button>
    </template>
  </BaseDialog>
</template>

<style scoped>
.congrats {
  font-size: 16px;
  color: #1e3287;
  margin: 0 0 12px;
}
.info {
  width: 100%;
}
th {
  text-align: left;
  font-weight: normal;
  padding: 2px 0;
}
td {
  text-align: right;
}
</style>
