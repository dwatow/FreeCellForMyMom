import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { SAVE_KEY, useGameStore } from '../src/stores/game.js'
import { useStatsStore } from '../src/stores/stats.js'
import { legalMoves } from '../src/core/rules.js'

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

const firstMove = (game) => legalMoves(game.board).find((m) => m.to.type === 'tableau') ?? legalMoves(game.board)[0]

describe('game store', () => {
  it('開局後狀態為 idle、第一步後為 playing 並存檔', () => {
    const game = useGameStore()
    game.startGame(617)
    expect(game.status).toBe('idle')
    expect(game.move(firstMove(game))).not.toBeNull()
    expect(game.status).toBe('playing')
    expect(JSON.parse(localStorage.getItem(SAVE_KEY))).toMatchObject({ gameNumber: 617, moves: [expect.any(Object)] })
  })

  it('不合法的移動被拒絕且不改變盤面', () => {
    const game = useGameStore()
    game.startGame(1)
    const before = game.board
    expect(game.move({ from: { type: 'tableau', index: 0 }, to: { type: 'foundation', index: 0 }, count: 1 })).toBeNull()
    expect(game.board).toBe(before)
  })

  it('undo 還原上一步', () => {
    const game = useGameStore()
    game.startGame(1)
    const initial = game.board
    game.move(firstMove(game))
    game.move(firstMove(game))
    game.undo()
    game.undo()
    expect(game.board).toEqual(initial)
    expect(game.moveCount).toBe(0)
    expect(game.undo()).toBeNull()
  })

  it('存檔重播後盤面相同', () => {
    const game = useGameStore()
    game.startGame(11982)
    for (let i = 0; i < 5; i++) game.move(firstMove(game))
    game.elapsed = 42
    game.persist()
    const expected = game.board

    setActivePinia(createPinia())
    const restored = useGameStore()
    const save = restored.loadSave()
    expect(restored.resume(save)).toBe(true)
    expect(restored.board).toEqual(expected)
    expect(restored.elapsed).toBe(42)
    expect(restored.status).toBe('playing')
  })

  it('損毀或無效的存檔不會被載入', () => {
    const game = useGameStore()
    localStorage.setItem(SAVE_KEY, '{oops')
    expect(game.loadSave()).toBeNull()
    localStorage.setItem(SAVE_KEY, JSON.stringify({ gameNumber: 0, moves: [] }))
    expect(game.loadSave()).toBeNull()
  })

  it('進行中開新局算輸；未走任何一步不算', () => {
    const game = useGameStore()
    const stats = useStatsStore()
    game.startGame(1)
    game.startGame(2)
    expect(stats.stats.played).toBe(0)
    game.move(firstMove(game))
    game.restart()
    expect(stats.stats).toMatchObject({ played: 1, won: 0, streak: -1, longestLoss: 1 })
    expect(game.gameNumber).toBe(2)
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })

  it('放棄存檔中的局算輸', () => {
    const game = useGameStore()
    game.startGame(5)
    game.move(firstMove(game))
    setActivePinia(createPinia())
    useGameStore().abandonSave()
    expect(useStatsStore().stats.played).toBe(1)
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })

  it('最後一步觸發自動收牌並記錄勝利', () => {
    const game = useGameStore()
    const stats = useStatsStore()
    game.startGame(1)
    // 只剩紅心 Q、K 與黑桃 K 未收：把 Q 移到暫存格後，其餘自動收完
    const pile = (suit, upTo) => Array.from({ length: upTo }, (_, i) => i * 4 + suit)
    game.boards = [{
      tableau: [[48 + 2, 44 + 2], [48 + 3], [], [], [], [], [], []],
      cells: [null, null, null, null],
      foundations: [pile(0, 13), pile(1, 13), pile(2, 11), pile(3, 12)],
    }]
    const step = game.move({ from: { type: 'tableau', index: 0 }, to: { type: 'cell', index: 0 }, count: 1 })
    expect(step).toHaveLength(4)
    expect(game.status).toBe('won')
    expect(stats.stats).toMatchObject({ played: 1, won: 1, streak: 1 })
    expect(game.canUndo).toBe(false)
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
  })

  it('tick 只在進行中計時', () => {
    const game = useGameStore()
    game.startGame(1)
    game.tick()
    expect(game.elapsed).toBe(0)
    game.move(firstMove(game))
    game.tick()
    expect(game.elapsed).toBe(1)
  })
})

describe('stats store', () => {
  it('計算連勝、連敗與勝率', () => {
    const stats = useStatsStore()
    stats.recordWin()
    stats.recordWin()
    stats.recordLoss()
    stats.recordWin()
    expect(stats.stats).toMatchObject({ played: 4, won: 3, streak: 1, longestWin: 2, longestLoss: 1 })
    expect(stats.winRate).toBe(75)
    stats.reset()
    expect(stats.stats.played).toBe(0)
  })
})
