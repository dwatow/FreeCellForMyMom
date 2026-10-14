import { describe, expect, it } from 'vitest'
import { cardId } from '../src/core/cards.js'
import { findHint } from '../src/core/hint.js'
import { createBoard, isLegalMove } from '../src/core/rules.js'

const card = (rank, suit) => cardId(rank, suit)
function board({ tableau = [], cells = [], foundations = [] } = {}) {
  return {
    tableau: Array.from({ length: 8 }, (_, i) => tableau[i] ?? []),
    cells: Array.from({ length: 4 }, (_, i) => cells[i] ?? null),
    foundations: Array.from({ length: 4 }, (_, i) => foundations[i] ?? []),
  }
}

describe('findHint', () => {
  it('優先建議收到回收區', () => {
    const b = board({ tableau: [[card(9, 0), card(1, 2)], [card(10, 1)]] })
    expect(findHint(b)).toEqual({ from: { type: 'tableau', index: 0 }, to: { type: 'foundation', index: 0 }, count: 1 })
  })

  it('不建議剛好抵銷上一步的移動', () => {
    // 上一步把紅心 8 從黑桃 9 移到梅花 9；移回去合法但沒有意義
    const b = board({ tableau: [[card(9, 3)], [card(9, 0), card(8, 2)]] })
    const last = { from: { type: 'tableau', index: 0 }, to: { type: 'tableau', index: 1 }, count: 1 }
    const back = { from: { type: 'tableau', index: 1 }, to: { type: 'tableau', index: 0 }, count: 1 }
    expect(findHint(b)).toEqual(back)
    expect(findHint(b, last)).not.toEqual(back)
  })

  it('開局時一定給出合法的建議', () => {
    for (const n of [1, 617, 11982, 999999]) {
      const b = createBoard(n)
      expect(isLegalMove(b, findHint(b))).toBe(true)
    }
  })

  it('沒有可走的牌時回傳 null', () => {
    const b = board({
      tableau: [[card(5, 0)], [card(5, 3)], [card(9, 0)], [card(9, 3)], [card(4, 0)], [card(4, 3)], [card(7, 0)], [card(7, 3)]],
      cells: [card(13, 0), card(13, 1), card(13, 2), card(13, 3)],
    })
    expect(findHint(b)).toBeNull()
  })
})
