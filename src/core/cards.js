/**
 * 牌以 0～51 的整數表示，排列與微軟發牌演算法相同：
 * id = (rank - 1) * 4 + suit，suit 依序為 梅花、方塊、紅心、黑桃。
 * @typedef {number} CardId
 */

export const SUITS = ['clubs', 'diamonds', 'hearts', 'spades']
export const SUIT_LETTERS = ['C', 'D', 'H', 'S']
export const SUIT_SYMBOLS = ['♣', '♦', '♥', '♠']
export const SUIT_NAMES = ['梅花', '方塊', '紅心', '黑桃']
export const RANK_LABELS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

/** @param {CardId} id @returns {number} 1（A）～13（K） */
export const rankOf = (id) => Math.floor(id / 4) + 1

/** @param {CardId} id @returns {number} 0～3 */
export const suitOf = (id) => id % 4

/** @param {CardId} id */
export const isRed = (id) => suitOf(id) === 1 || suitOf(id) === 2

/** @param {number} rank @param {number} suit @returns {CardId} */
export const cardId = (rank, suit) => (rank - 1) * 4 + suit

/**
 * 兩字元代號，例如 "AC"、"TD"、"KS"，與 Rosetta Code 的輸出格式相同。
 * @param {CardId} id
 */
export function cardCode(id) {
  const rank = rankOf(id)
  return (rank === 10 ? 'T' : RANK_LABELS[rank]) + SUIT_LETTERS[suitOf(id)]
}

/** @param {CardId} id 給螢幕閱讀器與 title 用的名稱，例如「紅心 Q」 */
export const cardLabel = (id) => `${SUIT_NAMES[suitOf(id)]} ${RANK_LABELS[rankOf(id)]}`
