// src/screens/Settings/Settings.jsx
import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import styles from './Settings.module.css'

const THEMES = ['light', 'dark', 'system']

export default function Settings() {
  const { settings, updateSettings, eraseAllData } = useApp()
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleErase() {
    eraseAllData()
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(r => r.unregister()))
    }
    window.location.reload()
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Settings</h1>

      <section className={styles.section}>
        <label className={styles.sectionLabel}>Theme</label>
        <div className={styles.themeToggle}>
          {THEMES.map(t => (
            <button
              key={t}
              className={`${styles.themeOption} ${settings.theme === t ? styles.active : ''}`}
              onClick={() => updateSettings({ theme: t })}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.spacer} />

      <button className={styles.eraseBtn} onClick={() => setShowConfirm(true)}>
        Erase All Data
      </button>

      <BottomSheet isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className={styles.confirmSheet}>
          <p className={styles.confirmMsg}>
            This will permanently delete all your transactions and reset settings.
          </p>
          <button className={`${styles.sheetBtn} ${styles.destructive}`} onClick={handleErase}>
            Erase Everything
          </button>
          <button className={styles.sheetBtn} onClick={() => setShowConfirm(false)}>Cancel</button>
        </div>
      </BottomSheet>
    </div>
  )
}
