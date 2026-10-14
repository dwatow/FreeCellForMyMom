import { describe, expect, it } from 'vitest'
import { computeLayout, overlapArea } from '../src/composables/boardLayout.js'
import { createBoard } from '../src/core/rules.js'

describe('computeLayout', () => {
  it('52 張牌都有位置，且 8 欄都在容器寬度內', () => {
    for (const [w, h] of [[1200, 800], [390, 700], [1920, 1080]]) {
      const L = computeLayout(w, h, createBoard(1))
      expect(L.positions.size).toBe(52)
      for (const p of L.positions.values()) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x + L.cardW).toBeLessThanOrEqual(w)
      }
    }
  })

  it('長欄會壓縮間距，最底下的牌仍在畫面內', () => {
    const board = createBoard(1)
    board.tableau[0] = Array.from({ length: 19 }, (_, i) => i)
    const L = computeLayout(1200, 600, board)
    const last = L.positions.get(18)
    expect(last.y + L.cardH).toBeLessThanOrEqual(600)
  })

  it('小螢幕切換為放大角落的精簡牌面', () => {
    expect(computeLayout(390, 700, createBoard(1)).compact).toBe(true)
    expect(computeLayout(1200, 800, createBoard(1)).compact).toBe(false)
  })
})

describe('overlapArea', () => {
  it('計算重疊面積，不重疊為 0', () => {
    expect(overlapArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(25)
    expect(overlapArea({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 5, h: 5 })).toBe(0)
  })
})
