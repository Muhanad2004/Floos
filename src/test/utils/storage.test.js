// src/test/utils/storage.test.js
import { readTransactions, writeTransactions, readSettings, writeSettings } from '../../utils/storage'

beforeEach(() => localStorage.clear())

describe('readTransactions', () => {
  it('returns empty array when key is absent', () => {
    expect(readTransactions()).toEqual([])
  })

  it('returns parsed array when valid JSON is stored', () => {
    const data = [{ id: '1', amount: 1.5 }]
    localStorage.setItem('floos_transactions', JSON.stringify(data))
    expect(readTransactions()).toEqual(data)
  })

  it('returns empty array when stored JSON is corrupt', () => {
    localStorage.setItem('floos_transactions', 'not-json{{{')
    expect(readTransactions()).toEqual([])
  })
})

describe('writeTransactions', () => {
  it('serializes and stores transactions', () => {
    const data = [{ id: '1', amount: 2.5 }]
    writeTransactions(data)
    expect(JSON.parse(localStorage.getItem('floos_transactions'))).toEqual(data)
  })
})

describe('readSettings', () => {
  it('returns default settings when key is absent', () => {
    expect(readSettings()).toEqual({ theme: 'system' })
  })

  it('returns parsed settings when valid JSON is stored', () => {
    localStorage.setItem('floos_settings', JSON.stringify({ theme: 'dark' }))
    expect(readSettings()).toEqual({ theme: 'dark' })
  })

  it('returns default settings when stored JSON is corrupt', () => {
    localStorage.setItem('floos_settings', '{{invalid')
    expect(readSettings()).toEqual({ theme: 'system' })
  })
})

describe('writeSettings', () => {
  it('serializes and stores settings', () => {
    writeSettings({ theme: 'light' })
    expect(JSON.parse(localStorage.getItem('floos_settings'))).toEqual({ theme: 'light' })
  })
})
