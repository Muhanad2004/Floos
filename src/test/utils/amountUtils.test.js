// src/test/utils/amountUtils.test.js
import { queueToDisplay, queueToAmount, amountToQueue, isQueueZero } from '../../utils/amountUtils'

describe('queueToDisplay', () => {
  it('returns "0.000" for empty queue', () => {
    expect(queueToDisplay([])).toBe('0.000')
  })

  it('single digit fills rightmost decimal place', () => {
    expect(queueToDisplay([1])).toBe('0.001')
  })

  it('three digits fill decimal part', () => {
    expect(queueToDisplay([1, 5, 0])).toBe('0.150')
  })

  it('four digits use one integer place', () => {
    expect(queueToDisplay([1, 5, 0, 0])).toBe('1.500')
  })

  it('seven digits fills all slots', () => {
    expect(queueToDisplay([9, 9, 9, 9, 9, 9, 9])).toBe('9999.999')
  })

  it('leading zero presses stay in decimal', () => {
    expect(queueToDisplay([0, 0, 0, 0, 0, 0, 1])).toBe('0.001')
  })
})

describe('queueToAmount', () => {
  it('returns 0 for empty queue', () => {
    expect(queueToAmount([])).toBe(0)
  })

  it('returns correct amount for [1,5,0]', () => {
    expect(queueToAmount([1, 5, 0])).toBeCloseTo(0.15, 5)
  })

  it('returns correct amount for [1,5,0,0]', () => {
    expect(queueToAmount([1, 5, 0, 0])).toBeCloseTo(1.5, 5)
  })
})

describe('amountToQueue', () => {
  it('returns [] for 0', () => {
    expect(amountToQueue(0)).toEqual([])
  })

  it('converts 1.5 to [1,5,0,0]', () => {
    expect(amountToQueue(1.5)).toEqual([1, 5, 0, 0])
  })

  it('converts 0.1 to [1,0,0]', () => {
    expect(amountToQueue(0.1)).toEqual([1, 0, 0])
  })

  it('converts 0.001 to [1]', () => {
    expect(amountToQueue(0.001)).toEqual([1])
  })

  it('round-trips: amountToQueue then queueToAmount', () => {
    const amounts = [1.5, 0.1, 0.001, 9999.999, 100, 0.015]
    for (const a of amounts) {
      expect(queueToAmount(amountToQueue(a))).toBeCloseTo(a, 5)
    }
  })
})

describe('isQueueZero', () => {
  it('returns true for empty queue', () => {
    expect(isQueueZero([])).toBe(true)
  })

  it('returns true for all-zero queue', () => {
    expect(isQueueZero([0, 0, 0])).toBe(true)
  })

  it('returns false when any non-zero digit is present', () => {
    expect(isQueueZero([0, 0, 1])).toBe(false)
  })
})
