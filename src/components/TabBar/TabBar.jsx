// src/components/TabBar/TabBar.jsx
import { BarChart2, CirclePlus, History, Settings } from 'lucide-react'
import styles from './TabBar.module.css'

const TABS = [
  { id: 'stats', label: 'Stats', Icon: BarChart2 },
  { id: 'entry', label: 'Add', Icon: CirclePlus, prominent: true },
  { id: 'history', label: 'History', Icon: History },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className={styles.tabBar}>
      {TABS.map(({ id, label, Icon, prominent }) => (
        <button
          key={id}
          className={`${styles.tab} ${prominent ? styles.prominent : ''} ${activeTab === id ? styles.active : ''}`}
          onClick={() => onTabChange(id)}
          aria-label={label}
        >
          <span className={styles.icon}><Icon size={prominent ? 28 : 22} strokeWidth={1.8} /></span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </nav>
  )
}
