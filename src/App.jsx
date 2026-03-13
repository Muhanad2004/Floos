// src/App.jsx
import { useState, useEffect } from 'react'
import { useApp } from './context/AppContext'
import TabBar from './components/TabBar/TabBar'
import Dashboard from './screens/Dashboard/Dashboard'
import Entry from './screens/Entry/Entry'
import History from './screens/History/History'
import Settings from './screens/Settings/Settings'
import styles from './App.module.css'

const SCREENS = { dashboard: Dashboard, entry: Entry, history: History, settings: Settings }

export default function App() {
  const [activeTab, setActiveTab] = useState('entry')
  const { settings } = useApp()

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)

    const updateThemeColor = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      const color = isDark ? '#1e1e1e' : '#ffffff'
      document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', color))
    }

    updateThemeColor()

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', updateThemeColor)
      return () => mq.removeEventListener('change', updateThemeColor)
    }
  }, [settings.theme])

  const Screen = SCREENS[activeTab]

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <Screen />
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
