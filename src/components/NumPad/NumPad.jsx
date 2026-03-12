// src/components/NumPad/NumPad.jsx
import styles from './NumPad.module.css'

const LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
]

export default function NumPad({ onDigit, onBackspace, onConfirm, confirmDisabled, confirmLabel = '✓', mode }) {
  function handleKey(key) {
    if (key === '⌫') onBackspace()
    else if (key === 'CONFIRM') { if (!confirmDisabled) onConfirm() }
    else onDigit(parseInt(key, 10))
  }

  const flatKeys = LAYOUT.flat()

  return (
    <div className={styles.grid}>
      {flatKeys.map((key, i) => {
        const isConfirm = key === '✓'
        const displayKey = isConfirm ? confirmLabel : key
        return (
          <button
            key={i}
            className={`
              ${styles.key}
              ${isConfirm ? styles.confirm : ''}
              ${isConfirm ? styles[mode] : ''}
              ${isConfirm && confirmDisabled ? styles.disabled : ''}
            `}
            onClick={() => handleKey(isConfirm ? 'CONFIRM' : key)}
            disabled={isConfirm && confirmDisabled}
          >
            {displayKey}
          </button>
        )
      })}
    </div>
  )
}
