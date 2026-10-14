import { isRed, rankOf, suitOf } from './cards.js'
import { dealGame } from './deal.js'

export const CELL_COUNT = 4
export const FOUNDATION_COUNT = 4

/**
 * @typedef {{ tableau: number[][], cells: (number|null)[], foundations: number[][] }} Board
 * @typedef {'tableau'|'cell'|'foundation'} PileType
 * @typedef {{ type: PileType, index: number }} Loc
 * @typedef {{ from: Loc, to: Loc, count: number }} Move
 */

/** @param {number} gameNumber @returns {Board} */
export function createBoard(gameNumber) {
  return {
    tableau: dealGame(gameNumber),
    cells: Array(CELL_COUNT).fill(null),
    foundations: Array.from({ length: FOUNDATION_COUNT }, () => []),
  }
}

/** @param {Board} board @returns {Board} */
export function cloneBoard(board) {
  return {
    tableau: board.tableau.map((c) => [...c]),
    cells: [...board.cells],
    foundations: board.foundations.map((f) => [...f]),
  }
}

/** @param {Loc} a @param {Loc} b */
export const sameLoc = (a, b) => a.type === b.type && a.index === b.index

/** b 可以疊在 a 下面（a 在上、b 點數小一且異色） */
export const canStack = (a, b) => rankOf(a) === rankOf(b) + 1 && isRed(a) !== isRed(b)

/**
 * 欄底部連續可整疊移動的張數。
 * @param {number[]} column
 */
export function runLength(column) {
  if (column.length === 0) return 0
  let n = 1
  while (n < column.length && canStack(column[column.length - n - 1], column[column.length - n])) n++
  return n
}

/** 從 index 起到欄底是否為合法的整疊 */
export function isRunFrom(column, index) {
  return index >= 0 && index < column.length && column.length - index <= runLength(column)
}

export const freeCellCount = (board) => board.cells.filter((c) => c === null).length
export const emptyColumnCount = (board) => board.tableau.filter((c) => c.length === 0).length

/**
 * 一次可移動的張數上限：(空暫存格 + 1) × 2^(空欄數)。
 * @param {Board} board
 * @param {boolean} toEmptyColumn 目的地本身是空欄時不計入
 */
export function maxMovable(board, toEmptyColumn) {
  const empty = emptyColumnCount(board) - (toEmptyColumn ? 1 : 0)
  return (freeCellCount(board) + 1) * 2 ** empty
}

/** @param {number} card @param {number[]} pile */
export function canPlaceOnFoundation(card, pile) {
  if (pile.length === 0) return rankOf(card) === 1
  const top = pile[pile.length - 1]
  return suitOf(top) === suitOf(card) && rankOf(card) === rankOf(top) + 1
}

/** 該張牌可放的回收區 index；Win7 把 A 放到最左邊的空回收區 */
export function foundationFor(board, card) {
  return board.foundations.findIndex((pile) => canPlaceOnFoundation(card, pile))
}

/** @param {Board} board @param {Loc} loc @returns {number[]} 該位置由底到頂的牌 */
export function cardsAt(board, loc) {
  if (loc.type === 'tableau') return board.tableau[loc.index]
  if (loc.type === 'foundation') return board.foundations[loc.index]
  const card = board.cells[loc.index]
  return card === null ? [] : [card]
}

/**
 * @param {Board} board
 * @param {Move} move
 * @returns {boolean}
 */
export function isLegalMove(board, { from, to, count }) {
  if (sameLoc(from, to) || count < 1) return false
  if (from.type === 'foundation') return false
  const source = cardsAt(board, from)
  if (count > source.length) return false
  const moving = source.slice(source.length - count)
  const first = moving[0]

  if (to.type === 'cell') return count === 1 && board.cells[to.index] === null
  if (to.type === 'foundation') return count === 1 && canPlaceOnFoundation(first, board.foundations[to.index])

  if (count > 1 && (from.type !== 'tableau' || !isRunFrom(source, source.length - count))) return false
  const target = board.tableau[to.index]
  if (target.length === 0) return count <= maxMovable(board, true)
  return canStack(target[target.length - 1], first) && count <= maxMovable(board, false)
}

/**
 * 套用移動並回傳新的盤面；不合法時丟出錯誤。
 * @param {Board} board
 * @param {Move} move
 * @returns {Board}
 */
export function applyMove(board, move) {
  if (!isLegalMove(board, move)) throw new Error(`不合法的移動：${JSON.stringify(move)}`)
  const next = cloneBoard(board)
  const { from, to, count } = move
  let moving
  if (from.type === 'cell') {
    moving = [next.cells[from.index]]
    next.cells[from.index] = null
  } else {
    const column = next.tableau[from.index]
    moving = column.splice(column.length - count, count)
  }
  if (to.type === 'cell') next.cells[to.index] = moving[0]
  else if (to.type === 'foundation') next.foundations[to.index].push(moving[0])
  else next.tableau[to.index].push(...moving)
  return next
}

/** 回收區中某花色已收到的點數 */
function foundationRank(board, suit) {
  const pile = board.foundations.find((p) => p.length > 0 && suitOf(p[0]) === suit)
  return pile ? pile.length : 0
}

/**
 * 「安全」的自動收牌：A、2 一律收；其他牌要等兩個異色花色都收到 rank - 1，
 * 確保不會有還需要它來接的牌。
 */
export function isSafeToAutoPlay(board, card) {
  const rank = rankOf(card)
  if (rank <= 2) return true
  const opposite = isRed(card) ? [0, 3] : [1, 2]
  return opposite.every((s) => foundationRank(board, s) >= rank - 1)
}

/** @param {Board} board @returns {Move|null} 下一個安全的自動收牌 */
export function nextAutoMove(board) {
  const sources = [
    ...board.cells.map((card, index) => ({ card, from: { type: 'cell', index } })),
    ...board.tableau.map((col, index) => ({ card: col.at(-1) ?? null, from: { type: 'tableau', index } })),
  ]
  for (const { card, from } of sources) {
    if (card === null || !isSafeToAutoPlay(board, card)) continue
    const f = foundationFor(board, card)
    if (f >= 0) return { from, to: { type: 'foundation', index: f }, count: 1 }
  }
  return null
}

/**
 * 反覆自動收牌直到沒有安全的牌可收。
 * @param {Board} board
 * @returns {{ board: Board, moves: Move[] }}
 */
export function autoPlay(board) {
  const moves = []
  let move
  while ((move = nextAutoMove(board))) {
    board = applyMove(board, move)
    moves.push(move)
  }
  return { board, moves }
}

/**
 * 列出所有合法移動。同一張牌到不同空暫存格／空欄視為同一種移動，只列第一個。
 * @param {Board} board
 * @returns {Move[]}
 */
export function legalMoves(board) {
  const moves = []
  const firstEmptyCell = board.cells.indexOf(null)
  const firstEmptyColumn = board.tableau.findIndex((c) => c.length === 0)
  const sources = [
    ...board.cells.map((_, index) => ({ type: 'cell', index })),
    ...board.tableau.map((_, index) => ({ type: 'tableau', index })),
  ]
  for (const from of sources) {
    const source = cardsAt(board, from)
    if (source.length === 0) continue
    const top = source[source.length - 1]
    const f = foundationFor(board, top)
    if (f >= 0) moves.push({ from, to: { type: 'foundation', index: f }, count: 1 })
    if (from.type === 'tableau' && firstEmptyCell >= 0) {
      moves.push({ from, to: { type: 'cell', index: firstEmptyCell }, count: 1 })
    }
    const maxRun = from.type === 'tableau' ? runLength(source) : 1
    board.tableau.forEach((target, index) => {
      if (from.type === 'tableau' && from.index === index) return
      if (target.length === 0 && index !== firstEmptyColumn) return
      for (let count = 1; count <= maxRun; count++) {
        const move = { from, to: { type: 'tableau', index }, count }
        if (isLegalMove(board, move)) moves.push(move)
      }
    })
  }
  return moves
}

/** @param {Board} board */
export const isWon = (board) => board.foundations.every((pile) => pile.length === 13)
