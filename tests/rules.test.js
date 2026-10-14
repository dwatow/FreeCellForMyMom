import { describe, expect, it } from 'vitest'
import { cardId } from '../src/core/cards.js'
import {
  applyMove,
  autoPlay,
  createBoard,
  isLegalMove,
  isSafeToAutoPlay,
  isWon,
  legalMoves,
  maxMovable,
  runLength,
} from '../src/core/rules.js'

const C = 0, D = 1, H = 2, S = 3
const card = (rank, suit) => cardId(rank, suit)
const t = (index) => ({ type: 'tableau', index })
const cell = (index) => ({ type: 'cell', index })
const fnd = (index) => ({ type: 'foundation', index })

/** 建立自訂盤面；未指定的欄為空 */
function board({ tableau = [], cells = [], foundations = [] } = {}) {
  return {
    tableau: Array.from({ length: 8 }, (_, i) => tableau[i] ?? []),
    cells: Array.from({ length: 4 }, (_, i) => cells[i] ?? null),
    foundations: Array.from({ length: 4 }, (_, i) => foundations[i] ?? []),
  }
}
const suitPile = (suit, upTo) => Array.from({ length: upTo }, (_, i) => card(i + 1, suit))

describe('runLength', () => {
  it('計算欄底連續異色遞減的張數', () => {
    expect(runLength([card(9, C), card(8, H), card(7, S), card(6, D)])).toBe(4)
    expect(runLength([card(9, C), card(8, S), card(7, H)])).toBe(2)
    expect(runLength([])).toBe(0)
  })
})

describe('maxMovable', () => {
  it('(空暫存格 + 1) × 2^空欄數，目的地空欄不計', () => {
    const full = Array.from({ length: 8 }, () => [card(13, S)])
    expect(maxMovable(board({ tableau: full }), false)).toBe(5)
    const twoEmpty = board({ tableau: full.slice(0, 6), cells: [card(2, C), card(3, C)] })
    expect(maxMovable(twoEmpty, false)).toBe(12)
    expect(maxMovable(twoEmpty, true)).toBe(6)
  })
})

describe('isLegalMove', () => {
  const fullCols = (extra) => [extra, ...Array.from({ length: 7 }, () => [card(13, S)])]

  it('疊到異色、點數大一的牌上', () => {
    const b = board({ tableau: [[card(8, H)], [card(9, S)], [card(9, D)]] })
    expect(isLegalMove(b, { from: t(0), to: t(1), count: 1 })).toBe(true)
    expect(isLegalMove(b, { from: t(0), to: t(2), count: 1 })).toBe(false)
  })

  it('整疊移動受張數上限限制', () => {
    const run = [card(10, C), card(9, H), card(8, S), card(7, H), card(6, S), card(5, H)]
    const cols = fullCols(run)
    cols[1] = [card(11, D)]
    const b = board({ tableau: cols, cells: [card(2, C), card(2, D), card(2, H), card(2, S)] })
    expect(maxMovable(b, false)).toBe(1)
    expect(isLegalMove(b, { from: t(0), to: t(1), count: 6 })).toBe(false)
    b.cells = [null, null, null, null]
    expect(maxMovable(b, false)).toBe(5)
    expect(isLegalMove(b, { from: t(0), to: t(1), count: 6 })).toBe(false)
    b.tableau[1] = [card(8, C)]
    expect(isLegalMove(b, { from: t(0), to: t(1), count: 3 })).toBe(true)
    expect(isLegalMove(b, { from: t(0), to: t(1), count: 2 })).toBe(false)
  })

  it('不合法的疊不能整疊移動', () => {
    const b = board({ tableau: [[card(9, C), card(8, C)], [card(10, H)]] })
    expect(isLegalMove(b, { from: t(0), to: t(1), count: 2 })).toBe(false)
  })

  it('暫存格只能放一張且必須是空的', () => {
    const b = board({ tableau: [[card(5, C)]], cells: [card(1, H)] })
    expect(isLegalMove(b, { from: t(0), to: cell(0), count: 1 })).toBe(false)
    expect(isLegalMove(b, { from: t(0), to: cell(1), count: 1 })).toBe(true)
  })

  it('回收區須從 A 開始、同花色遞增，且不能從回收區移出', () => {
    const b = board({ tableau: [[card(2, H)], [card(1, H)]], foundations: [[card(1, S)]] })
    expect(isLegalMove(b, { from: t(0), to: fnd(1), count: 1 })).toBe(false)
    expect(isLegalMove(b, { from: t(1), to: fnd(1), count: 1 })).toBe(true)
    expect(isLegalMove(b, { from: t(1), to: fnd(0), count: 1 })).toBe(false)
    expect(isLegalMove(b, { from: fnd(0), to: t(2), count: 1 })).toBe(false)
  })
})

describe('applyMove', () => {
  it('回傳新盤面且不改動原盤面', () => {
    const b = board({ tableau: [[card(8, H)], [card(9, S)]] })
    const next = applyMove(b, { from: t(0), to: t(1), count: 1 })
    expect(next.tableau[1]).toEqual([card(9, S), card(8, H)])
    expect(b.tableau[0]).toEqual([card(8, H)])
  })

  it('不合法時丟出錯誤', () => {
    const b = board({ tableau: [[card(8, H)], [card(9, H)]] })
    expect(() => applyMove(b, { from: t(0), to: t(1), count: 1 })).toThrow()
  })
})

describe('自動收牌', () => {
  it('A、2 一律收；3 以上要等異色都收到 rank - 1', () => {
    const b = board({ foundations: [suitPile(H, 2), suitPile(C, 2)] })
    expect(isSafeToAutoPlay(b, card(2, S))).toBe(true)
    expect(isSafeToAutoPlay(b, card(3, H))).toBe(false)
    b.foundations[2] = suitPile(S, 2)
    expect(isSafeToAutoPlay(b, card(3, H))).toBe(true)
  })

  it('連鎖收牌直到沒有安全的牌', () => {
    const b = board({ tableau: [[card(2, C), card(1, C)], [card(3, C)]], cells: [card(1, D)] })
    const { board: after, moves } = autoPlay(b)
    expect(moves).toHaveLength(3)
    expect(after.tableau[1]).toEqual([card(3, C)])
  })
})

describe('legalMoves 與勝利', () => {
  it('開局 #1 有合法移動且未勝利', () => {
    const b = createBoard(1)
    expect(legalMoves(b).length).toBeGreaterThan(0)
    expect(legalMoves(b).every((m) => isLegalMove(b, m))).toBe(true)
    expect(isWon(b)).toBe(false)
  })

  it('沒有空格、沒有可接的牌時沒有合法移動', () => {
    const b = board({
      tableau: [[card(5, C)], [card(5, S)], [card(9, C)], [card(9, S)], [card(4, C)], [card(4, S)], [card(7, C)], [card(7, S)]],
      cells: [card(13, C), card(13, D), card(13, H), card(13, S)],
    })
    expect(legalMoves(b)).toEqual([])
  })

  it('四個回收區都到 K 即勝利', () => {
    expect(isWon(board({ foundations: [0, 1, 2, 3].map((s) => suitPile(s, 13)) }))).toBe(true)
  })
})
