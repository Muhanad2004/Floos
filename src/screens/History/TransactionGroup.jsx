// src/screens/History/TransactionGroup.jsx
import { formatDateHeader } from '../../utils/dateUtils'
import TransactionRow from './TransactionRow'
import styles from './History.module.css'

export default function TransactionGroup({ dateKey, transactions, onTapRow }) {
  return (
    <div className={styles.group}>
      <div className={styles.groupHeader}>{formatDateHeader(dateKey)}</div>
      {transactions.map(tx => (
        <TransactionRow key={tx.id} transaction={tx} onTap={onTapRow} />
      ))}
    </div>
  )
}
