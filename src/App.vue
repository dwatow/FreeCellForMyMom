<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isValidGameNumber } from './core/deal.js'
import { openDialog, currentDialog } from './composables/dialogs.js'
import { sound } from './composables/sound.js'
import { useGameStore } from './stores/game.js'
import { useSettingsStore } from './stores/settings.js'
import AboutDialog from './components/AboutDialog.vue'
import AppearanceDialog from './components/AppearanceDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import DialogHost from './components/DialogHost.vue'
import GameBoard from './components/GameBoard.vue'
import MenuBar from './components/MenuBar.vue'
import OptionsDialog from './components/OptionsDialog.vue'
import SelectGameDialog from './components/SelectGameDialog.vue'
import StatsDialog from './components/StatsDialog.vue'
import StatusBar from './components/StatusBar.vue'
import SvgSprite from './components/SvgSprite.vue'
import WinDialog from './components/WinDialog.vue'

const game = useGameStore()
const settingsStore = useSettingsStore()
const background = computed(() => settingsStore.settings.background)
const ready = ref(false)
const board = ref(null)

watch(() => settingsStore.settings.sound, (on) => sound.setEnabled(on), { immediate: true })

function syncUrl() {
  const url = new URL(location.href)
  url.searchParams.set('game', String(game.gameNumber))
  history.replaceState(null, '', url)
  document.title = `新接龍 #${game.gameNumber}`
}

/** 進行中的局放棄會算輸，先跟使用者確認 */
async function confirmForfeit() {
  if (!game.inProgress) return true
  const answer = await openDialog(ConfirmDialog, {
    title: '新接龍',
    message: '這一局還沒有完成。\n現在放棄的話，這一局會計為輸。要放棄嗎？',
    buttons: [
      { id: 'yes', label: '放棄這一局', primary: true },
      { id: 'no', label: '繼續玩' },
    ],
  })
  return answer === 'yes'
}

async function newGame(n) {
  if (!(await confirmForfeit())) return
  game.startGame(n)
  syncUrl()
}

async function restartGame() {
  if (!(await confirmForfeit())) return
  game.restart()
}

async function selectGame() {
  const n = await openDialog(SelectGameDialog, { current: game.gameNumber })
  if (n) await newGame(n)
}

function undo() {
  if (game.undo()) board.value?.clearSelection()
}

function hint() {
  if (game.status === 'won') return
  if (!game.showHint()) openDialog(ConfirmDialog, { message: '目前沒有可以建議的移動。' })
}

const actions = {
  new: () => newGame(),
  restart: restartGame,
  select: selectGame,
  undo,
  hint,
  stats: () => openDialog(StatsDialog),
  options: () => openDialog(OptionsDialog),
  appearance: () => openDialog(AppearanceDialog),
  about: () => openDialog(AboutDialog),
}

const KEYS = { F2: 'new', F3: 'select', F4: 'stats', F5: 'options', F7: 'appearance' }

function onKeydown(e) {
  if (currentDialog.value) return
  const action = KEYS[e.key] ?? ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' ? 'undo' : null)
    ?? (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'h' ? 'hint' : null)
  if (!action) {
    if (e.key === 'Escape') board.value?.clearSelection()
    return
  }
  e.preventDefault()
  actions[action]()
}

async function onCelebrated() {
  sound.win()
  const result = await openDialog(WinDialog, { gameNumber: game.gameNumber, elapsed: game.elapsed, moves: game.moveCount })
  if (result === 'new') newGame()
  else if (result === 'replay') restartGame()
}

// 沒有合法移動時，等動畫結束再提示
let noMovesTimer = null
watch(
  () => game.board,
  () => {
    clearTimeout(noMovesTimer)
    if (game.status !== 'playing' || game.hasMoves) return
    noMovesTimer = setTimeout(async () => {
      if (game.status !== 'playing' || game.hasMoves || currentDialog.value) return
      const answer = await openDialog(ConfirmDialog, {
        title: '沒有可以走的步',
        message: '已經沒有任何合法的移動了。',
        buttons: [
          { id: 'undo', label: '復原', primary: true },
          { id: 'restart', label: '重新開始' },
          { id: 'new', label: '新局' },
        ],
      })
      if (answer === 'undo') undo()
      else if (answer === 'restart') restartGame()
      else if (answer === 'new') newGame()
    }, 900)
  },
)

let timer = null
onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('pagehide', game.persist)
  timer = setInterval(() => document.visibilityState === 'visible' && game.tick(), 1000)

  const urlGame = Number(new URLSearchParams(location.search).get('game'))
  const save = game.loadSave()
  if (save) {
    const answer = await openDialog(ConfirmDialog, {
      title: '繼續遊戲',
      message: `您有一局尚未完成的第 ${save.gameNumber} 局。\n要繼續玩嗎？不繼續的話，這一局會計為輸。`,
      buttons: [
        { id: 'yes', label: '繼續', primary: true },
        { id: 'no', label: '不要' },
      ],
    })
    if (answer === 'yes' && game.resume(save)) {
      syncUrl()
      ready.value = true
      return
    }
    game.abandonSave()
  }
  game.startGame(isValidGameNumber(urlGame) ? urlGame : undefined)
  syncUrl()
  ready.value = true
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('pagehide', game.persist)
  clearInterval(timer)
  clearTimeout(noMovesTimer)
})
</script>

<template>
  <SvgSprite />
  <div class="app">
    <MenuBar :can-undo="game.canUndo" @action="actions[$event]()" />
    <main class="table" :class="`bg-${background}`">
      <GameBoard v-if="ready" ref="board" @celebrated="onCelebrated" />
      <div v-else class="board-placeholder" />
      <StatusBar :game-number="game.gameNumber" :elapsed="game.elapsed" :moves="game.moveCount" />
    </main>
  </div>
  <DialogHost />
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}
.table {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.board-placeholder {
  flex: 1;
}
</style>
