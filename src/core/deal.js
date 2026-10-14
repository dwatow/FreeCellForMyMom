export const MIN_GAME = 1
export const MAX_GAME = 1000000
export const COLUMNS = 8

const MODULUS = 2 ** 31

/**
 * 微軟 C runtime 的 rand()：state = (214013 * state + 2531011) mod 2^31，輸出 state >> 16。
 * 乘積最大約 4.6e14，仍在 Number 可精確表示的範圍內。
 * @param {number} seed
 * @returns {() => number} 每次呼叫回傳 0～32767
 */
export function createMsRand(seed) {
  let state = seed
  return () => {
    state = (214013 * state + 2531011) % MODULUS
    return Math.floor(state / 65536)
  }
}

/** @param {unknown} n */
export function isValidGameNumber(n) {
  return Number.isInteger(n) && n >= MIN_GAME && n <= MAX_GAME
}

/**
 * 依微軟新接龍的演算法發牌。
 * @param {number} gameNumber 1～1,000,000
 * @returns {number[][]} 8 欄，每欄由底（最先發）到頂（可操作的那張）
 */
export function dealGame(gameNumber) {
  if (!isValidGameNumber(gameNumber)) {
    throw new RangeError(`局號必須是 ${MIN_GAME}～${MAX_GAME} 的整數：${gameNumber}`)
  }
  const rand = createMsRand(gameNumber)
  const deck = Array.from({ length: 52 }, (_, i) => i)
  const columns = Array.from({ length: COLUMNS }, () => [])
  for (let dealt = 0; deck.length > 0; dealt++) {
    const pick = rand() % deck.length
    const last = deck.length - 1
    ;[deck[pick], deck[last]] = [deck[last], deck[pick]]
    columns[dealt % COLUMNS].push(deck.pop())
  }
  return columns
}

/** @returns {number} 隨機局號 */
export function randomGameNumber() {
  return MIN_GAME + Math.floor(Math.random() * (MAX_GAME - MIN_GAME + 1))
}
