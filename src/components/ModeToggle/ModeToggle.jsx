// src/components/ModeToggle/ModeToggle.jsx
import styles from './ModeToggle.module.css'

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className={`${styles.toggle} ${styles[mode]}`}>
      <button
        className={`${styles.option} ${mode === 'income' ? styles.selected : ''}`}
        onClick={() => onChange('income')}
      >Income</button>
      <button
        className={`${styles.option} ${mode === 'expense' ? styles.selected : ''}`}
        onClick={() => onChange('expense')}
      >Expense</button>
    </div>
  )
}
