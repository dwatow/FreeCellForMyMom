import { describe, expect, it } from 'vitest'
import { cardCode } from '../src/core/cards.js'
import { createMsRand, dealGame, isValidGameNumber } from '../src/core/deal.js'

/** 依發牌順序把 8 欄轉回 Rosetta Code 的逐列格式 */
function rows(columns) {
  const lines = []
  for (let r = 0; r < 7; r++) {
    lines.push(columns.filter((c) => c.length > r).map((c) => cardCode(c[r])).join(' '))
  }
  return lines
}

describe('createMsRand', () => {
  it('與微軟 C runtime rand() 的前幾個輸出相同（seed = 1）', () => {
    const rand = createMsRand(1)
    expect([rand(), rand(), rand(), rand(), rand()]).toEqual([41, 18467, 6334, 26500, 19169])
  })
})

describe('dealGame', () => {
  it('#1 與微軟牌局相同', () => {
    expect(rows(dealGame(1))).toEqual([
      'JD 2D 9H JC 5D 7H 7C 5H',
      'KD KC 9S 5S AD QC KH 3H',
      '2S KS 9D QD JS AS AH 3C',
      '4C 5C TS QH 4H AC 4D 7S',
      '3S TD 4S TH 8H 2C JH 7D',
      '6D 8S 8D QS 6C 3D 8C TC',
      '6S 9C 2H 6H',
    ])
  })

  it('#617 與微軟牌局相同', () => {
    expect(rows(dealGame(617))).toEqual([
      '7D AD 5C 3S 5S 8C 2D AH',
      'TD 7S QD AC 6D 8H AS KH',
      'TH QC 3H 9D 6S 8D 3D TC',
      'KD 5H 9S 3C 8S 7H 4D JS',
      '4C QS 9C 9H 7C 6H 2C 2S',
      '4S TS 2H 5D JC 6C JH QH',
      'JD KS KC 4H',
    ])
  })

  it('每局都是完整的 52 張、前 4 欄 7 張後 4 欄 6 張', () => {
    for (const n of [1, 11982, 32000, 1000000]) {
      const cols = dealGame(n)
      expect(cols.map((c) => c.length)).toEqual([7, 7, 7, 7, 6, 6, 6, 6])
      expect(cols.flat().sort((a, b) => a - b)).toEqual(Array.from({ length: 52 }, (_, i) => i))
    }
  })

  it('拒絕範圍外的局號', () => {
    expect(() => dealGame(0)).toThrow(RangeError)
    expect(() => dealGame(1000001)).toThrow(RangeError)
    expect(() => dealGame(1.5)).toThrow(RangeError)
    expect(isValidGameNumber(500000)).toBe(true)
  })
})
