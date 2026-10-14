import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'

export const BACKGROUNDS = [
  { id: 'green', name: '經典綠' },
  { id: 'blue', name: '深海藍' },
  { id: 'red', name: '酒紅' },
  { id: 'wood', name: '木紋' },
  { id: 'night', name: '夜色' },
]

export const CARD_BACKS = [
  { id: 'blue', name: '藍色格紋' },
  { id: 'red', name: '紅色格紋' },
  { id: 'green', name: '綠色菱紋' },
  { id: 'gold', name: '金色花紋' },
]

const DEFAULTS = { sound: true, animation: true, background: 'green', cardBack: 'blue' }

export const useSettingsStore = defineStore('settings', () => {
  const settings = useLocalStorage('freecell.settings', { ...DEFAULTS }, { mergeDefaults: true })
  return { settings }
})
