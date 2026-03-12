// src/components/CategorySelector/CategorySelector.jsx
import { getCategoriesForType } from '../../constants/categories'
import styles from './CategorySelector.module.css'

export default function CategorySelector({ mode, selected, onSelect }) {
  const categories = getCategoriesForType(mode)
  return (
    <div className={styles.scroll}>
      {categories.map(cat => (
        <button
          key={cat}
          className={`${styles.chip} ${selected === cat ? styles.selected : ''} ${styles[mode]}`}
          onClick={() => onSelect(selected === cat ? null : cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
