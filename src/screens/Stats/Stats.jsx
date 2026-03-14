// src/screens/Stats/Stats.jsx
import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import styles from './Stats.module.css'

const EXPENSE_COLORS = {
  Groceries:      '#3ddc68',
  Dining:         '#3B82F6',
  Snacks:         '#F59E0B',
  Bills:          '#EF4444',
  Laundromat:     '#8B5CF6',
  Phone:          '#06B6D4',
  Shopping:       '#EC4899',
  Health:         '#84CC16',
  Subscriptions:  '#F97316',
  'Personal Care':'#6366F1',
  Other:          '#9ca3af',
}

const INCOME_COLORS = {
  Salary:     '#3ddc68',
  Gift:       '#3B82F6',
  Investment: '#F59E0B',
  Savings:    '#8B5CF6',
  Other:      '#9ca3af',
}

function aggregateByCategory(transactions, type, colorMap) {
  const map = {}
  for (const tx of transactions) {
    if (tx.type !== type) continue
    map[tx.category] = (map[tx.category] || 0) + tx.amount
  }
  const total = Object.values(map).reduce((a, b) => a + b, 0)
  const slices = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      color: colorMap[label] || '#9ca3af',
      pct: total > 0 ? value / total : 0,
    }))
  return { total, slices }
}

// ── SVG Pie Chart ─────────────────────────────────────────────────────────────

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 360) {
    const p1 = polarToCartesian(cx, cy, r, 0)
    const p2 = polarToCartesian(cx, cy, r, 180)
    return [
      `M ${cx} ${cy}`,
      `L ${p1.x} ${p1.y}`,
      `A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`,
      `A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`,
      'Z',
    ].join(' ')
  }
  const s = polarToCartesian(cx, cy, r, startAngle)
  const e = polarToCartesian(cx, cy, r, endAngle)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

function PieChart({ slices }) {
  const [active, setActive] = useState(null)
  const SIZE = 180
  const cx = SIZE / 2
  const cy = SIZE / 2
  const R = 78
  const R_ACTIVE = 88

  let angle = 0
  const paths = slices.map((s, i) => {
    const sweep = s.pct * 360
    const start = angle
    angle += sweep
    return { ...s, start, end: angle, isActive: active === i }
  })

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.pie}>
      {paths.map((p, i) => (
        <path
          key={p.label}
          d={arcPath(cx, cy, p.isActive ? R_ACTIVE : R, p.start, p.end)}
          fill={p.color}
          onClick={() => setActive(active === i ? null : i)}
          style={{ cursor: 'pointer', transition: 'd 0.15s' }}
        />
      ))}
    </svg>
  )
}

// ── Chart Section ─────────────────────────────────────────────────────────────

function ChartSection({ title, data, emptyMsg, negative }) {
  if (data.slices.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.empty}>{emptyMsg}</div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.chartWrap}>
        <PieChart slices={data.slices} />
        <div className={styles.legend}>
          {data.slices.map(s => (
            <div key={s.label} className={styles.legendRow}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              <span className={styles.legendLabel}>{s.label}</span>
              <span className={`${styles.legendAmount} ${negative ? styles.negative : styles.positive}`}>
                {s.value.toFixed(3)}
              </span>
              <span className={styles.legendPct}>{Math.round(s.pct * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Stats Screen ──────────────────────────────────────────────────────────────

export default function Stats() {
  const { transactions } = useApp()

  const expenses = useMemo(() => aggregateByCategory(transactions, 'expense', EXPENSE_COLORS), [transactions])
  const income = useMemo(() => aggregateByCategory(transactions, 'income', INCOME_COLORS), [transactions])

  const net = income.total - expenses.total
  const topExpense = expenses.slices[0] ?? null

  return (
    <div className={styles.screen}>
      <div className={styles.scroll}>
        <ChartSection
          title="Expenses"
          data={expenses}
          emptyMsg="No expenses recorded"
          negative
        />

        {topExpense && (
          <div className={styles.callout}>
            <span className={styles.calloutDot} style={{ background: topExpense.color }} />
            <span className={styles.calloutText}>
              <strong>{topExpense.label}</strong> is {Math.round(topExpense.pct * 100)}% of your spending
            </span>
          </div>
        )}

        <ChartSection
          title="Income"
          data={income}
          emptyMsg="No income recorded"
        />

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Income</span>
            <span className={`${styles.summaryAmount} ${styles.positive}`}>{income.total.toFixed(3)}</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Expenses</span>
            <span className={`${styles.summaryAmount} ${styles.negative}`}>{expenses.total.toFixed(3)}</span>
          </div>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Net</span>
            <span className={`${styles.summaryAmount} ${net >= 0 ? styles.positive : styles.negative}`}>
              {net.toFixed(3)}
            </span>
          </div>
        </div>

        <div className={styles.bottomPad} />
      </div>
    </div>
  )
}
