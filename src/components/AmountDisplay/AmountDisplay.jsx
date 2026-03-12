// src/components/AmountDisplay/AmountDisplay.jsx
import { queueToDisplay, isQueueZero } from '../../utils/amountUtils'
import styles from './AmountDisplay.module.css'

export default function AmountDisplay({ queue }) {
  const display = queueToDisplay(queue)
  const isEmpty = isQueueZero(queue)

  return (
    <div className={`${styles.display} ${isEmpty ? styles.ghost : ''}`}>
      <span className={styles.amount}>{display}</span>
      <span className={styles.currency}>OMR</span>
    </div>
  )
}
