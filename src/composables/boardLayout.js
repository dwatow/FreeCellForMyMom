import { CELL_COUNT, FOUNDATION_COUNT } from '../core/rules.js'

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * @typedef {import('../core/rules.js').Loc} Loc
 * @typedef {{ x: number, y: number, z: number, loc: Loc, index: number }} CardPos
 */

/**
 * 依容器大小算出牌的尺寸與每張牌的位置。上排左 4 格是暫存格、右 4 格是回收區，下方 8 欄。
 * @param {number} width
 * @param {number} height
 * @param {import('../core/rules.js').Board} board
 */
export function computeLayout(width, height, board) {
  const narrow = width < 600
  const cardW = clamp(Math.min(width / (narrow ? 8.7 : 9.4), height / 5), 28, 132)
  const cardH = cardW * 1.4
  const step = cardW * (narrow ? 1.08 : 1.13)
  const left = (width - (step * 7 + cardW)) / 2
  const top = Math.max(8, cardW * 0.22)
  const tableauTop = top + cardH + cardW * 0.4
  const bottom = height - Math.max(6, cardW * 0.12)
  const colX = (i) => left + i * step

  // 直式螢幕高度有餘裕時把間距拉開，讓小牌的角落點數看得清楚
  const base = clamp((bottom - tableauTop - cardH) / 11, cardH * 0.25, cardH * 0.4)
  const fanFor = (len) => {
    if (len < 2) return base
    return Math.max(cardH * 0.07, Math.min(base, (bottom - tableauTop - cardH) / (len - 1)))
  }

  const slots = [
    ...Array.from({ length: CELL_COUNT }, (_, i) => ({ loc: { type: 'cell', index: i }, x: colX(i), y: top })),
    ...Array.from({ length: FOUNDATION_COUNT }, (_, i) => ({ loc: { type: 'foundation', index: i }, x: colX(CELL_COUNT + i), y: top })),
    ...board.tableau.map((_, i) => ({ loc: { type: 'tableau', index: i }, x: colX(i), y: tableauTop })),
  ]

  /** @type {Map<number, CardPos>} */
  const positions = new Map()
  board.cells.forEach((card, i) => {
    if (card !== null) positions.set(card, { x: colX(i), y: top, z: 10, loc: { type: 'cell', index: i }, index: 0 })
  })
  board.foundations.forEach((pile, i) => {
    pile.forEach((card, j) => positions.set(card, { x: colX(CELL_COUNT + i), y: top, z: 10 + j, loc: { type: 'foundation', index: i }, index: j }))
  })
  const fans = board.tableau.map((col) => fanFor(col.length))
  board.tableau.forEach((col, i) => {
    col.forEach((card, j) => positions.set(card, { x: colX(i), y: tableauTop + j * fans[i], z: 30 + j, loc: { type: 'tableau', index: i }, index: j }))
  })

  /** 每個位置可放牌的感應範圍（拖放用） */
  const dropRect = (loc) => {
    if (loc.type !== 'tableau') {
      const x = colX(loc.type === 'cell' ? loc.index : CELL_COUNT + loc.index)
      return { x, y: top, w: cardW, h: cardH }
    }
    const len = board.tableau[loc.index].length
    return { x: colX(loc.index), y: tableauTop, w: cardW, h: cardH + Math.max(0, len - 1) * fans[loc.index] }
  }

  return { cardW, cardH, compact: cardW < 64, top, tableauTop, slots, positions, fans, dropRect, width, height }
}

/** 兩矩形重疊面積 */
export function overlapArea(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}
