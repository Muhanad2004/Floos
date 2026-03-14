// src/components/BalanceSummary/BalanceSummary.jsx
import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { getBalance, getMonthTotals } from '../../utils/dateUtils'
import styles from './BalanceSummary.module.css'

function amountColorClass(amount, styles) {
  if (amount > 0) return styles.positive
  if (amount < 0) return styles.negative
  return ''
}

export default function BalanceSummary() {
  const { transactions } = useApp()
  const balance = useMemo(() => getBalance(transactions), [transactions])
  const { income, expense } = useMemo(() => getMonthTotals(transactions), [transactions])

  return (
    <div className={styles.wrapper}>
      <section className={styles.balanceSection}>
        <span className={styles.balanceLabel}>Balance</span>
        <span
          className={`${styles.balanceAmount} ${amountColorClass(balance, styles)}`}
          data-testid="balance-amount"
        >
          {Math.abs(balance).toFixed(3)}
        </span>
        <span className={styles.currency}>OMR</span>
      </section>

      <section className={styles.monthSection}>
        <div className={styles.monthItem}>
          <span className={`${styles.monthAmount} ${income > 0 ? styles.positive : ''}`}>
            {income.toFixed(3)}
          </span>
          <span className={styles.monthLabel}>Income</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.monthItem}>
          <span className={`${styles.monthAmount} ${expense > 0 ? styles.negative : ''}`}>
            {expense.toFixed(3)}
          </span>
          <span className={styles.monthLabel}>Expenses</span>
        </div>
      </section>
    </div>
  )
}
