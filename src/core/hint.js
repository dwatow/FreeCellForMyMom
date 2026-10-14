import { rankOf } from './cards.js'
import { cardsAt, foundationFor, legalMoves, sameLoc } from './rules.js'

/** @typedef {import('./rules.js').Board} Board @typedef {import('./rules.js').Move} Move */

const isUndoOf = (move, last) =>
  last && sameLoc(move.from, last.to) && sameLoc(move.to, last.from) && move.count === last.count

/**
 * 給移動打分數：越能推進牌局分數越高；無意義的移動回傳 -Infinity。
 * @param {Board} board @param {Move} move @param {Move|undefined} last
 */
function score(board, move, last) {
  if (isUndoOf(move, last)) return -Infinity
  const source = cardsAt(board, move.from)
  const moving = source[source.length - move.count]
  const remaining = source.length - move.count
  const exposed = remaining > 0 ? source[remaining - 1] : null

  if (move.to.type === 'foundation') return 1000 - rankOf(moving)

  let s = 0
  // 整欄搬到空欄、或從暫存格搬來搬去不會推進牌局
  if (move.to.type === 'tableau' && cardsAt(board, move.to).length === 0) {
    if (remaining === 0) return -Infinity
    s += 100
  } else if (move.to.type === 'tableau') {
    s += 300 + move.count * 10
  } else {
    s += 50
  }
  if (move.from.type === 'cell') s += 200
  if (move.from.type === 'tableau' && remaining === 0) s += 150
  if (exposed !== null && foundationFor(board, exposed) >= 0) s += 400
  if (exposed !== null) s += Math.max(0, 14 - rankOf(exposed))
  return s
}

/**
 * 挑一個建議的移動；沒有值得建議的移動時回傳 null。
 * @param {Board} board
 * @param {Move} [lastMove] 上一步，避免建議立刻走回頭路
 * @returns {Move|null}
 */
export function findHint(board, lastMove) {
  let best = null
  let bestScore = -Infinity
  for (const move of legalMoves(board)) {
    const s = score(board, move, lastMove)
    if (s > bestScore) {
      best = move
      bestScore = s
    }
  }
  return best
}
