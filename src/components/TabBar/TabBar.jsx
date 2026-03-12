// src/components/TabBar/TabBar.jsx
import styles from './TabBar.module.css'

const TABS = [
  { id: 'dashboard', label: 'Home', icon: '⊞' },
  { id: 'entry', label: 'Add', icon: '+', prominent: true },
  { id: 'history', label: 'History', icon: '≡' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className={styles.tabBar}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${tab.prominent ? styles.prominent : ''} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
