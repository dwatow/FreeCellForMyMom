import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const EMPTY = { played: 0, won: 0, streak: 0, longestWin: 0, longestLoss: 0 }

/** streak 為正數代表目前連勝場數，負數代表目前連敗場數 */
export const useStatsStore = defineStore('stats', () => {
  const stats = useLocalStorage('freecell.stats', { ...EMPTY }, { mergeDefaults: true })

  const winRate = computed(() => (stats.value.played ? Math.round((stats.value.won / stats.value.played) * 100) : 0))

  function recordWin() {
    const s = stats.value
    s.played++
    s.won++
    s.streak = s.streak > 0 ? s.streak + 1 : 1
    s.longestWin = Math.max(s.longestWin, s.streak)
  }

  function recordLoss() {
    const s = stats.value
    s.played++
    s.streak = s.streak < 0 ? s.streak - 1 : -1
    s.longestLoss = Math.max(s.longestLoss, -s.streak)
  }

  function reset() {
    stats.value = { ...EMPTY }
  }

  return { stats, winRate, recordWin, recordLoss, reset }
})
