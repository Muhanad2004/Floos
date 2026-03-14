// src/utils/dateUtils.js

function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isoToLocalDateString(isoString) {
  return toLocalDateString(new Date(isoString))
}

export function formatDateHeader(dateStr, now = new Date()) {
  const todayStr = toLocalDateString(now)
  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = toLocalDateString(yesterdayDate)

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'

  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatTime12h(date) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function groupByDay(transactions) {
  const map = {}
  for (const tx of transactions) {
    const key = isoToLocalDateString(tx.createdAt)
    if (!map[key]) map[key] = []
    map[key].push(tx)
  }
  const sorted = {}
  Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .forEach(key => {
      sorted[key] = map[key].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    })
  return sorted
}

export function getMonthTotals(transactions, now = new Date()) {
  const year = now.getFullYear()
  const month = now.getMonth()

  return transactions.reduce(
    (acc, tx) => {
      const d = new Date(tx.createdAt)
      if (d.getFullYear() === year && d.getMonth() === month) {
        if (tx.type === 'income') acc.income += tx.amount
        else acc.expense += tx.amount
      }
      return acc
    },
    { income: 0, expense: 0 }
  )
}

export function getBalance(transactions) {
  return transactions.reduce((acc, tx) => {
    return tx.type === 'income' ? acc + tx.amount : acc - tx.amount
  }, 0)
}
