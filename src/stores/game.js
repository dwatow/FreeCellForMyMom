import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { isValidGameNumber, randomGameNumber } from '../core/deal.js'
import { findHint } from '../core/hint.js'
import { applyMove, autoPlay, createBoard, isLegalMove, isWon, legalMoves } from '../core/rules.js'
import { useStatsStore } from './stats.js'

export const SAVE_KEY = 'freecell.save'

/** @typedef {import('../core/rules.js').Move} Move */

/**
 * @typedef {{ gameNumber: number, moves: Move[], elapsed: number }} SavedGame
 * 只存使用者的移動；自動收牌是確定性的，續玩時重播即可還原。
 */

function readSave() {
  try {
    const save = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null')
    if (save && isValidGameNumber(save.gameNumber) && Array.isArray(save.moves)) return save
  } catch {
    // 存檔損毀時當作沒有存檔
  }
  return null
}

function writeSave(save) {
  try {
    if (save) localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    else localStorage.removeItem(SAVE_KEY)
  } catch {
    // 私密瀏覽等情況無法寫入，不影響遊戲
  }
}

export const useGameStore = defineStore('game', () => {
  const stats = useStatsStore()

  const gameNumber = ref(1)
  /** boards[i] 是第 i 步之後的盤面，boards[0] 為發牌結果 */
  const boards = shallowRef([createBoard(1)])
  /** 每一步 = 使用者的一次移動 + 隨之觸發的自動收牌 */
  const steps = shallowRef(/** @type {Move[][]} */ ([]))
  const elapsed = ref(0)
  /** idle：還沒走第一步；playing：進行中；won：已勝利 */
  const status = ref('idle')
  const hint = shallowRef(/** @type {Move|null} */ (null))

  const board = computed(() => boards.value[boards.value.length - 1])
  const moveCount = computed(() => steps.value.length)
  const lastStep = computed(() => steps.value[steps.value.length - 1] ?? null)
  const inProgress = computed(() => status.value === 'playing')
  const hasMoves = computed(() => legalMoves(board.value).length > 0)
  const canUndo = computed(() => steps.value.length > 0 && status.value !== 'won')

  function persist() {
    writeSave(
      status.value === 'playing'
        ? { gameNumber: gameNumber.value, moves: steps.value.map((s) => s[0]), elapsed: elapsed.value }
        : null,
    )
  }

  function reset(n) {
    gameNumber.value = n
    boards.value = [createBoard(n)]
    steps.value = []
    elapsed.value = 0
    status.value = 'idle'
    hint.value = null
  }

  /** 開始指定局號（未指定時隨機）；進行中的局算輸。 */
  function startGame(n = randomGameNumber()) {
    if (!isValidGameNumber(n)) throw new RangeError(`無效的局號：${n}`)
    if (inProgress.value) stats.recordLoss()
    reset(n)
    persist()
  }

  const restart = () => startGame(gameNumber.value)

  /**
   * 執行一次使用者移動，接著自動收牌。
   * @param {Move} move
   * @returns {Move[]|null} 實際發生的移動（含自動收牌），不合法時為 null
   */
  function move(move) {
    if (status.value === 'won' || !isLegalMove(board.value, move)) return null
    const { board: next, moves: auto } = autoPlay(applyMove(board.value, move))
    const step = [move, ...auto]
    boards.value = [...boards.value, next]
    steps.value = [...steps.value, step]
    hint.value = null
    if (isWon(next)) {
      status.value = 'won'
      stats.recordWin()
    } else {
      status.value = 'playing'
    }
    persist()
    return step
  }

  function undo() {
    if (!canUndo.value) return null
    const step = lastStep.value
    boards.value = boards.value.slice(0, -1)
    steps.value = steps.value.slice(0, -1)
    hint.value = null
    persist()
    return step
  }

  function showHint() {
    hint.value = findHint(board.value, lastStep.value?.[0])
    return hint.value
  }

  const clearHint = () => (hint.value = null)

  function tick() {
    if (status.value !== 'playing') return
    elapsed.value++
    if (elapsed.value % 5 === 0) persist()
  }

  const loadSave = readSave

  /** @param {SavedGame} save @returns {boolean} 是否成功還原 */
  function resume(save) {
    reset(save.gameNumber)
    for (const m of save.moves) {
      if (!move(m)) {
        reset(save.gameNumber)
        writeSave(null)
        return false
      }
    }
    elapsed.value = Number(save.elapsed) || 0
    persist()
    return true
  }

  /** 不續玩存檔中的局：算輸並刪除存檔 */
  function abandonSave() {
    if (readSave()) stats.recordLoss()
    writeSave(null)
  }

  return {
    gameNumber, board, boards, steps, elapsed, status, hint,
    moveCount, lastStep, inProgress, hasMoves, canUndo,
    startGame, restart, move, undo, showHint, clearHint, tick, loadSave, resume, abandonSave, persist,
  }
})
