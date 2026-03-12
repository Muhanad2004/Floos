// src/test/utils/dateUtils.test.js
import { formatDateHeader, formatTime12h, groupByDay, getMonthTotals } from '../../utils/dateUtils'

const TODAY_UTC_NOON = new Date('2026-03-11T12:00:00.000Z')

function localNoon(dateStr) {
  return dateStr + 'T12:00:00.000Z'
}

describe('formatDateHeader', () => {
  it('returns "Today" for today\'s date', () => {
    const dateStr = new Date(localNoon('2026-03-11')).toLocaleDateString('en-CA')
    expect(formatDateHeader(dateStr, TODAY_UTC_NOON)).toBe('Today')
  })

  it('returns "Yesterday" for yesterday', () => {
    const dateStr = new Date(localNoon('2026-03-10')).toLocaleDateString('en-CA')
    expect(formatDateHeader(dateStr, TODAY_UTC_NOON)).toBe('Yesterday')
  })

  it('returns formatted date for older dates', () => {
    const dateStr = new Date(localNoon('2026-03-08')).toLocaleDateString('en-CA')
    const result = formatDateHeader(dateStr, TODAY_UTC_NOON)
    expect(result).toMatch(/March 8, 2026/)
  })
})

describe('formatTime12h', () => {
  it('returns a string matching 12-hour time format', () => {
    const result = formatTime12h(new Date())
    expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
  })
})

describe('groupByDay', () => {
  it('returns empty object for empty transactions', () => {
    expect(groupByDay([])).toEqual({})
  })

  it('groups transactions by local date string', () => {
    const txs = [
      { id: '1', createdAt: '2026-03-11T08:00:00.000Z', amount: 1, type: 'income', category: 'Salary' },
      { id: '2', createdAt: '2026-03-11T10:00:00.000Z', amount: 2, type: 'expense', category: 'Fuel' },
      { id: '3', createdAt: '2026-03-10T09:00:00.000Z', amount: 3, type: 'income', category: 'Gift' },
    ]
    const groups = groupByDay(txs)
    const keys = Object.keys(groups)
    expect(keys).toHaveLength(2)
    expect(groups[keys[0]]).toHaveLength(2)
    expect(groups[keys[1]]).toHaveLength(1)
  })

  it('sorts groups most-recent-first', () => {
    const txs = [
      { id: '1', createdAt: '2026-03-09T08:00:00.000Z', amount: 1, type: 'income', category: 'Salary' },
      { id: '2', createdAt: '2026-03-11T08:00:00.000Z', amount: 2, type: 'income', category: 'Salary' },
    ]
    const keys = Object.keys(groupByDay(txs))
    expect(new Date(keys[0]) > new Date(keys[1])).toBe(true)
  })
})

describe('getMonthTotals', () => {
  it('returns zeros for empty transactions', () => {
    expect(getMonthTotals([], new Date())).toEqual({ income: 0, expense: 0 })
  })

  it('sums income and expense for current month only', () => {
    const now = new Date('2026-03-15T00:00:00.000Z')
    const txs = [
      { id: '1', createdAt: '2026-03-10T00:00:00.000Z', amount: 100, type: 'income', category: 'Salary' },
      { id: '2', createdAt: '2026-03-10T00:00:00.000Z', amount: 20, type: 'expense', category: 'Fuel' },
      { id: '3', createdAt: '2026-02-10T00:00:00.000Z', amount: 50, type: 'income', category: 'Salary' },
    ]
    const result = getMonthTotals(txs, now)
    expect(result.income).toBeCloseTo(100, 5)
    expect(result.expense).toBeCloseTo(20, 5)
  })
})
