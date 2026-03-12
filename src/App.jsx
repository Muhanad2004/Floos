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
  const [activeTab, setActiveTab] = useState('dashboard')
  const { settings } = useApp()

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
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
