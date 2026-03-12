// src/context/AppContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { readTransactions, writeTransactions, readSettings, writeSettings, clearAllData } from '../utils/storage'

export const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState(() => readTransactions())
  const [settings, setSettings] = useState(() => readSettings())

  const addTransaction = useCallback((tx) => {
    const next = [tx, ...transactions]
    setTransactions(next)
    writeTransactions(next)
  }, [transactions])

  const updateTransaction = useCallback((id, updates) => {
    const next = transactions.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    setTransactions(next)
    writeTransactions(next)
  }, [transactions])

  const deleteTransaction = useCallback((id) => {
    const next = transactions.filter(tx => tx.id !== id)
    setTransactions(next)
    writeTransactions(next)
  }, [transactions])

  const updateSettings = useCallback((updates) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    writeSettings(next)
  }, [settings])

  const eraseAllData = useCallback(() => {
    clearAllData()
    setTransactions([])
    setSettings({ theme: 'system' })
  }, [])

  return (
    <AppContext.Provider value={{
      transactions,
      settings,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateSettings,
      eraseAllData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
