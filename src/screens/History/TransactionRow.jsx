// src/screens/History/TransactionRow.jsx
import { formatTime12h } from '../../utils/dateUtils'
import styles from './History.module.css'

export default function TransactionRow({ transaction, onTap }) {
  const isIncome = transaction.type === 'income'
  const time = formatTime12h(new Date(transaction.createdAt))

  return (
    <button className={styles.row} onClick={() => onTap(transaction)}>
      <div className={styles.rowLeft}>
        <span className={styles.rowCategory}>{transaction.category}</span>
        {transaction.note && (
          <span className={styles.rowNote}>{transaction.note}</span>
        )}
      </div>
      <div className={styles.rowRight}>
        <span className={`${styles.rowAmount} ${isIncome ? styles.positive : styles.negative}`}>
          {isIncome ? '+' : '-'}{transaction.amount.toFixed(3)}
        </span>
        <span className={styles.rowTime}>{time}</span>
      </div>
    </button>
  )
}
