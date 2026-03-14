// src/screens/Settings/Settings.jsx
import { useState } from 'react'
import { Sun, Moon, Monitor, RefreshCw, Trash2, AlertTriangle, ChevronRight } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import styles from './Settings.module.css'

const THEMES = [
  { key: 'light',  label: 'Light',  Icon: Sun },
  { key: 'dark',   label: 'Dark',   Icon: Moon },
  { key: 'system', label: 'System', Icon: Monitor },
]

export default function Settings() {
  const { settings, updateSettings, eraseTransactions, eraseAllData } = useApp()
  const [confirm, setConfirm] = useState(null) // 'transactions' | 'reset'

  async function handleRefresh() {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg?.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  async function handleReset() {
    eraseAllData()
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
    const dbs = await window.indexedDB?.databases?.()
    if (dbs) await Promise.all(dbs.map(db => window.indexedDB.deleteDatabase(db.name)))
    document.cookie.split(';').forEach(c => {
      document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'
    })
    window.location.reload()
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Settings</h1>

      {/* Appearance */}
      <p className={styles.sectionLabel}>Appearance</p>
      <div className={styles.group}>
        <div className={styles.row}>
          <div className={`${styles.iconBox} ${styles.purple}`}>
            <Monitor size={17} strokeWidth={2} />
          </div>
          <span className={styles.rowLabel}>Theme</span>
          <div className={styles.themeToggle}>
            {THEMES.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`${styles.themeOption} ${settings.theme === key ? styles.active : ''}`}
                onClick={() => updateSettings({ theme: key })}
                aria-label={label}
              >
                <Icon size={15} strokeWidth={2} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* App */}
      <p className={styles.sectionLabel}>App</p>
      <div className={styles.group}>
        <button className={styles.row} onClick={handleRefresh}>
          <div className={`${styles.iconBox} ${styles.blue}`}>
            <RefreshCw size={17} strokeWidth={2} />
          </div>
          <span className={styles.rowLabel}>Refresh App</span>
          <ChevronRight size={16} strokeWidth={2} className={styles.chevron} />
        </button>
      </div>

      {/* Data */}
      <p className={styles.sectionLabel}>Data</p>
      <div className={styles.group}>
        <button className={styles.row} onClick={() => setConfirm('transactions')}>
          <div className={`${styles.iconBox} ${styles.orange}`}>
            <Trash2 size={17} strokeWidth={2} />
          </div>
          <span className={styles.rowLabel}>Erase Transactions</span>
          <ChevronRight size={16} strokeWidth={2} className={styles.chevron} />
        </button>

        <div className={styles.rowDivider} />

        <button className={`${styles.row} ${styles.danger}`} onClick={() => setConfirm('reset')}>
          <div className={`${styles.iconBox} ${styles.red}`}>
            <AlertTriangle size={17} strokeWidth={2} />
          </div>
          <span className={styles.rowLabel}>Reset App</span>
          <ChevronRight size={16} strokeWidth={2} className={styles.chevron} />
        </button>
      </div>

      {/* Erase transactions confirm */}
      <BottomSheet isOpen={confirm === 'transactions'} onClose={() => setConfirm(null)}>
        <div className={styles.confirmSheet}>
          <p className={styles.confirmMsg}>
            This will permanently delete all your transactions. Your settings will be kept.
          </p>
          <button
            className={`${styles.sheetBtn} ${styles.destructive}`}
            onClick={() => { eraseTransactions(); setConfirm(null) }}
          >
            Erase Transactions
          </button>
          <button className={styles.sheetBtn} onClick={() => setConfirm(null)}>Cancel</button>
        </div>
      </BottomSheet>

      {/* Reset app confirm */}
      <BottomSheet isOpen={confirm === 'reset'} onClose={() => setConfirm(null)}>
        <div className={styles.confirmSheet}>
          <p className={styles.confirmMsg}>
            This will permanently delete all transactions, reset settings, and clear all cached data.
          </p>
          <button
            className={`${styles.sheetBtn} ${styles.destructive}`}
            onClick={handleReset}
          >
            Reset App
          </button>
          <button className={styles.sheetBtn} onClick={() => setConfirm(null)}>Cancel</button>
        </div>
      </BottomSheet>
    </div>
  )
}
