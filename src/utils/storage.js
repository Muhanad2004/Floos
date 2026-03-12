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
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data))
}

export function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? { theme: 'system' }
  } catch {
    return { theme: 'system' }
  }
}

export function writeSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
