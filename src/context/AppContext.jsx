// src/context/AppContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { readTransactions, writeTransactions, readSettings, writeSettings, clearAllData } from '../utils/storage'

export const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState(() => readTransactions())
  const [settings, setSettings] = useState(() => readSettings())

  const addTransaction = useCallback((tx) => {
    setTransactions(prev => {
      const next = [tx, ...prev]
      writeTransactions(next)
      return next
    })
  }, [])

  const updateTransaction = useCallback((id, updates) => {
    setTransactions(prev => {
      const next = prev.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
      writeTransactions(next)
      return next
    })
  }, [])

  const deleteTransaction = useCallback((id) => {
    setTransactions(prev => {
      const next = prev.filter(tx => tx.id !== id)
      writeTransactions(next)
      return next
    })
  }, [])

  const updateSettings = useCallback((updates) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    writeSettings(next)
  }, [settings])

  const eraseAllData = useCallback(() => {
    clearAllData()
    setTransactions([])
    setSettings(readSettings())
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
