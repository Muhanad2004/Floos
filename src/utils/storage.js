// src/utils/storage.js
const TRANSACTIONS_KEY = 'floos_transactions'
const SETTINGS_KEY = 'floos_settings'

export function readTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY)) ?? []
  } catch {
    return []
  }
}

export function writeTransactions(data) {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data))
  } catch {
    // QuotaExceededError (e.g. iOS Safari private browsing) — state kept in memory
  }
}

export function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? { theme: 'system' }
  } catch {
    return { theme: 'system' }
  }
}

export function writeSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // QuotaExceededError (e.g. iOS Safari private browsing) — state kept in memory
  }
}

export function clearAllData() {
  localStorage.removeItem(TRANSACTIONS_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}
