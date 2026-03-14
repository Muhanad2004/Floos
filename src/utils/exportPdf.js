// src/utils/exportPdf.js
import { jsPDF } from 'jspdf'

const GREEN  = [61, 220, 104]   // #3ddc68
const RED    = [239, 68, 68]    // #EF4444
const DARK   = [30, 30, 30]     // #1e1e1e
const MUTED  = [107, 114, 128]  // #6b7280
const BORDER = [229, 231, 235]  // #e5e7eb
const WHITE  = [255, 255, 255]

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(amount) {
  return amount.toFixed(3)
}

function aggregateByCategory(transactions, type) {
  const map = {}
  for (const tx of transactions) {
    if (tx.type !== type) continue
    map[tx.category] = (map[tx.category] || 0) + tx.amount
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

// Intentionally separate from dateUtils.groupByDay — this version uses formatted en-GB strings
// as keys ("01 Jan 2024") since they serve as the display labels in PDF section headers.
function groupByDay(transactions) {
  const map = {}
  for (const tx of transactions) {
    const d = new Date(tx.createdAt)
    const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    if (!map[key]) map[key] = []
    map[key].push(tx)
  }
  // Sort keys descending by date
  return Object.entries(map).sort((a, b) => {
    const da = new Date(a[1][0].createdAt)
    const db = new Date(b[1][0].createdAt)
    return db - da
  })
}

export function exportToPdf(transactions) {
  if (transactions.length === 0) return

  const sorted = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const firstDate = formatDate(sorted[0].createdAt)
  const lastDate  = formatDate(sorted[sorted.length - 1].createdAt)

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = totalIncome - totalExpense

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = 210   // page width
  const PH = 297   // page height
  const ML = 16    // margin left
  const MR = 16    // margin right
  const CW = PW - ML - MR  // content width
  let y = 0

  function checkPageBreak(needed = 10) {
    if (y + needed > PH - 16) {
      doc.addPage()
      y = 16
    }
  }

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, PW, 22, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Floos', ML, 14)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text('Transaction Report', ML + 22, 14)

  doc.setTextColor(180, 180, 180)
  doc.text(`${firstDate} – ${lastDate}`, PW - MR, 14, { align: 'right' })

  y = 30

  // ── Summary box ─────────────────────────────────────────────────────────────
  const boxH = 22
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(ML, y, CW, boxH, 3, 3, 'F')

  const col = CW / 3
  const summaryItems = [
    { label: 'Income',   value: formatAmount(totalIncome),  color: GREEN },
    { label: 'Expenses', value: formatAmount(totalExpense), color: RED   },
    { label: 'Net',      value: formatAmount(net),          color: net >= 0 ? GREEN : RED },
  ]
  summaryItems.forEach((item, i) => {
    const cx = ML + col * i + col / 2
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    doc.text(item.label.toUpperCase(), cx, y + 8, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...item.color)
    doc.text(`OMR ${item.value}`, cx, y + 17, { align: 'center' })
  })

  y += boxH + 10

  // ── Category breakdown ───────────────────────────────────────────────────────
  const expenseCats = aggregateByCategory(transactions, 'expense')
  const incomeCats  = aggregateByCategory(transactions, 'income')

  function renderCategoryTable(label, rows, type) {
    checkPageBreak(14 + rows.length * 7)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...MUTED)
    doc.text(label.toUpperCase(), ML, y)
    y += 4

    const total = rows.reduce((s, r) => s + r[1], 0)
    const rowH = 7

    rows.forEach(([cat, amount], i) => {
      const bg = i % 2 === 0 ? [255, 255, 255] : [248, 249, 251]
      doc.setFillColor(...bg)
      doc.rect(ML, y, CW, rowH, 'F')

      const pct = total > 0 ? Math.round((amount / total) * 100) : 0

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)
      doc.text(cat, ML + 3, y + 5)

      doc.setTextColor(...MUTED)
      doc.text(`${pct}%`, ML + CW * 0.55, y + 5)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(type === 'expense' ? RED : GREEN))
      doc.text(`OMR ${formatAmount(amount)}`, ML + CW, y + 5, { align: 'right' })

      y += rowH
    })

    // bottom border
    doc.setDrawColor(...BORDER)
    doc.line(ML, y, ML + CW, y)
    y += 8
  }

  if (expenseCats.length) renderCategoryTable('Expenses by Category', expenseCats, 'expense')
  if (incomeCats.length)  renderCategoryTable('Income by Category',   incomeCats,  'income')

  // ── Transaction list ─────────────────────────────────────────────────────────
  const groups = groupByDay(transactions)

  for (const [dateLabel, txs] of groups) {
    checkPageBreak(14)

    // Day header
    doc.setFillColor(...DARK)
    doc.rect(ML, y, CW, 8, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    doc.text(dateLabel, ML + 3, y + 5.5)

    const dayIncome  = txs.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0)
    const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    if (dayIncome > 0)  doc.text(`+${formatAmount(dayIncome)} OMR`,  ML + CW - (dayExpense > 0 ? 42 : 2), y + 5.5, { align: 'right' })
    if (dayExpense > 0) doc.text(`-${formatAmount(dayExpense)} OMR`, ML + CW, y + 5.5, { align: 'right' })
    y += 8

    for (let i = 0; i < txs.length; i++) {
      checkPageBreak(8)
      const tx = txs[i]
      const isIncome = tx.type === 'income'
      const bg = i % 2 === 0 ? WHITE : [248, 249, 251]
      doc.setFillColor(...bg)
      doc.rect(ML, y, CW, 8, 'F')

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text(tx.category, ML + 3, y + 5.5)

      if (tx.note) {
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MUTED)
        const note = tx.note.length > 40 ? tx.note.slice(0, 37) + '...' : tx.note
        doc.text(note, ML + 40, y + 5.5)
      }

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(isIncome ? GREEN : RED))
      doc.text(`${isIncome ? '+' : '-'}${formatAmount(tx.amount)}`, ML + CW, y + 5.5, { align: 'right' })

      y += 8
    }
    y += 3
  }

  // ── Footer on each page ──────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    doc.text(
      `Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      ML, PH - 8
    )
    doc.text(`Page ${p} of ${pageCount}`, PW - MR, PH - 8, { align: 'right' })
  }

  const filename = `Floos_${firstDate.replace(/ /g, '-')}_to_${lastDate.replace(/ /g, '-')}.pdf`
  doc.save(filename)
}
