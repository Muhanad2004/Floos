// src/utils/exportPdf.js
import { jsPDF } from 'jspdf'

const GREEN  = [61, 220, 104]   // #3ddc68
const RED    = [239, 68, 68]    // #EF4444
const DARK   = [30, 30, 30]     // #1e1e1e
const MUTED  = [107, 114, 128]  // #6b7280
const BORDER = [229, 231, 235]  // #e5e7eb
const WHITE  = [255, 255, 255]
const LIGHT  = [248, 249, 251]

// px per mm at 96 DPI
const PX_PER_MM = 96 / 25.4

function isArabic(text) {
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatTime(isoString) {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
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

// Intentionally separate from dateUtils.groupByDay — uses en-GB formatted strings as display labels
function groupByDay(transactions) {
  const map = {}
  for (const tx of transactions) {
    const d = new Date(tx.createdAt)
    const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    if (!map[key]) map[key] = []
    map[key].push(tx)
  }
  return Object.entries(map).sort((a, b) => {
    const da = new Date(a[1][0].createdAt)
    const db = new Date(b[1][0].createdAt)
    return db - da
  })
}

function groupByMonth(transactions) {
  const map = {}
  for (const tx of transactions) {
    const d = new Date(tx.createdAt)
    const key = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    if (!map[key]) map[key] = { income: 0, expense: 0, date: d }
    map[key][tx.type] += tx.amount
  }
  return Object.entries(map).sort((a, b) => a[1].date - b[1].date)
}

// Renders Arabic text on an offscreen canvas using the browser's native text engine.
// Returns a PNG data URL and the canvas dimensions in mm.
function makeArabicImage(text, { fontSize = 8.5, color = MUTED, bold = false } = {}) {
  const SCALE = 3
  const pxFont = fontSize * (96 / 72) * SCALE
  const weight = bold ? 'bold' : 'normal'
  const fontStack = `${weight} ${pxFont}px 'Segoe UI', 'Arabic UI', Tahoma, Arial, sans-serif`

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = fontStack
  const measuredW = ctx.measureText(text).width
  canvas.width  = Math.ceil(measuredW) + 8 * SCALE
  canvas.height = Math.ceil(pxFont * 1.5)

  // White background so the image blends with PDF row backgrounds
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.font      = fontStack
  ctx.direction = 'rtl'
  ctx.textAlign = 'right'
  ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`
  ctx.fillText(text, canvas.width - 4 * SCALE, pxFont * 1.05)

  return {
    dataUrl: canvas.toDataURL('image/png'),
    widthMM:  canvas.width  / SCALE / PX_PER_MM,
    heightMM: canvas.height / SCALE / PX_PER_MM,
  }
}

// Places Arabic text in the PDF right-aligned to `rightX`, baseline at `baseY`.
function addArabicText(doc, text, rightX, baseY, opts = {}) {
  const { dataUrl, widthMM, heightMM } = makeArabicImage(text, opts)
  doc.addImage(dataUrl, 'PNG', rightX - widthMM, baseY - heightMM * 0.78, widthMM, heightMM)
}

export function exportToPdf(transactions) {
  if (transactions.length === 0) return

  const sorted       = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const firstDate    = formatDate(sorted[0].createdAt)
  const lastDate     = formatDate(sorted[sorted.length - 1].createdAt)

  const expenses     = transactions.filter(t => t.type === 'expense')
  const incomes      = transactions.filter(t => t.type === 'income')
  const totalIncome  = incomes.reduce((s, t)  => s + t.amount, 0)
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
  const net          = totalIncome - totalExpense

  const msSpan       = new Date(sorted[sorted.length - 1].createdAt) - new Date(sorted[0].createdAt)
  const daySpan      = Math.max(1, Math.round(msSpan / 86_400_000) + 1)
  const avgDaily     = totalExpense / daySpan

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const PW = 210
  const PH = 297
  const ML = 16
  const MR = 16
  const CW = PW - ML - MR
  let y = 0

  function checkPageBreak(needed = 10) {
    if (y + needed > PH - 20) {
      doc.addPage()
      y = 20
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
  doc.text('Spending Report', ML + 22, 14)
  doc.text(`${firstDate} – ${lastDate}`, PW - MR, 14, { align: 'right' })

  y = 30

  // ── Summary box ─────────────────────────────────────────────────────────────
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(ML, y, CW, 22, 3, 3, 'F')

  const col = CW / 3
  const summaryItems = [
    { label: 'Income',   value: `OMR ${formatAmount(totalIncome)}`,  color: GREEN },
    { label: 'Expenses', value: `OMR ${formatAmount(totalExpense)}`, color: RED   },
    { label: 'Net',      value: `OMR ${formatAmount(net)}`,          color: net >= 0 ? GREEN : RED },
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
    doc.text(item.value, cx, y + 17, { align: 'center' })
  })

  y += 22 + 4

  // ── Stats strip ─────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.roundedRect(ML, y, CW, 12, 2, 2, 'F')

  const statsItems = [
    { label: 'Transactions', value: String(transactions.length) },
    { label: 'Expenses',     value: String(expenses.length) },
    { label: 'Days',         value: String(daySpan) },
    { label: 'Daily Avg',    value: `OMR ${formatAmount(avgDaily)}` },
  ]
  const statCol = CW / statsItems.length
  statsItems.forEach((s, i) => {
    const cx = ML + statCol * i + statCol / 2
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(s.label.toUpperCase(), cx, y + 4.5, { align: 'center' })
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    doc.text(s.value, cx, y + 9.5, { align: 'center' })
  })

  y += 12 + 10

  // ── Monthly breakdown (only when report spans multiple months) ────────────
  const monthGroups = groupByMonth(transactions)
  if (monthGroups.length > 1) {
    checkPageBreak(14 + monthGroups.length * 7 + 8)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...MUTED)
    doc.text('MONTHLY BREAKDOWN', ML, y)
    y += 4

    // Column headers
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...MUTED)
    doc.text('Month',    ML + 3,           y + 5)
    doc.text('Income',   ML + CW * 0.38,   y + 5)
    doc.text('Expenses', ML + CW * 0.58,   y + 5)
    doc.text('Net',      ML + CW,          y + 5, { align: 'right' })
    y += 7

    monthGroups.forEach(([month, data], i) => {
      const monthNet = data.income - data.expense
      doc.setFillColor(...(i % 2 === 0 ? WHITE : LIGHT))
      doc.rect(ML, y, CW, 7, 'F')

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)
      doc.text(month, ML + 3, y + 5)

      doc.setTextColor(...GREEN)
      doc.text(`OMR ${formatAmount(data.income)}`,  ML + CW * 0.38, y + 5)

      doc.setTextColor(...RED)
      doc.text(`OMR ${formatAmount(data.expense)}`, ML + CW * 0.58, y + 5)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(monthNet >= 0 ? GREEN : RED))
      doc.text(`OMR ${formatAmount(monthNet)}`, ML + CW, y + 5, { align: 'right' })

      y += 7
    })

    doc.setDrawColor(...BORDER)
    doc.line(ML, y, ML + CW, y)
    y += 10
  }

  // ── Category breakdown with visual bars ──────────────────────────────────
  const expenseCats = aggregateByCategory(transactions, 'expense')
  const incomeCats  = aggregateByCategory(transactions, 'income')

  function renderCategoryTable(label, rows, type) {
    checkPageBreak(14 + rows.length * 8)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...MUTED)
    doc.text(label.toUpperCase(), ML, y)
    y += 4

    const total    = rows.reduce((s, r) => s + r[1], 0)
    const rowH     = 8
    const BAR_X    = ML + CW * 0.44
    const BAR_MAXW = CW * 0.34
    const COLOR    = type === 'expense' ? RED : GREEN
    const TINT     = COLOR.map(c => Math.min(255, c + 100))

    rows.forEach(([cat, amount], i) => {
      doc.setFillColor(...(i % 2 === 0 ? WHITE : LIGHT))
      doc.rect(ML, y, CW, rowH, 'F')

      const pct  = total > 0 ? amount / total : 0
      const barW = BAR_MAXW * pct

      // Percentage bar
      if (barW > 0) {
        doc.setFillColor(...TINT)
        doc.rect(BAR_X, y + 2.2, barW, 3.5, 'F')
      }

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK)
      doc.text(cat, ML + 3, y + 5.5)

      doc.setTextColor(...MUTED)
      doc.text(`${Math.round(pct * 100)}%`, BAR_X - 2, y + 5.5, { align: 'right' })

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...COLOR)
      doc.text(`OMR ${formatAmount(amount)}`, ML + CW, y + 5.5, { align: 'right' })

      y += rowH
    })

    doc.setDrawColor(...BORDER)
    doc.line(ML, y, ML + CW, y)
    y += 8
  }

  if (expenseCats.length) renderCategoryTable('Expenses by Category', expenseCats, 'expense')
  if (incomeCats.length)  renderCategoryTable('Income by Category',   incomeCats,  'income')

  // ── Top 5 largest expenses ────────────────────────────────────────────────
  const top5 = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5)
  if (top5.length > 0) {
    checkPageBreak(14 + top5.length * 7 + 8)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...MUTED)
    doc.text('TOP EXPENSES', ML, y)
    y += 4

    top5.forEach((tx, i) => {
      doc.setFillColor(...(i % 2 === 0 ? WHITE : LIGHT))
      doc.rect(ML, y, CW, 7, 'F')

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text(tx.category, ML + 3, y + 5)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...MUTED)
      doc.text(formatDate(tx.createdAt), ML + CW * 0.50, y + 5)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...RED)
      doc.text(`OMR ${formatAmount(tx.amount)}`, ML + CW, y + 5, { align: 'right' })

      y += 7
    })

    doc.setDrawColor(...BORDER)
    doc.line(ML, y, ML + CW, y)
    y += 10
  }

  // ── All transactions grouped by day ──────────────────────────────────────
  checkPageBreak(14)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...MUTED)
  doc.text('ALL TRANSACTIONS', ML, y)
  y += 6

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
    if (dayIncome  > 0) doc.text(`+${formatAmount(dayIncome)} OMR`,  ML + CW - (dayExpense > 0 ? 42 : 2), y + 5.5, { align: 'right' })
    if (dayExpense > 0) doc.text(`-${formatAmount(dayExpense)} OMR`, ML + CW, y + 5.5, { align: 'right' })
    y += 8

    for (let i = 0; i < txs.length; i++) {
      const tx       = txs[i]
      const hasNote  = Boolean(tx.note)
      const rowH     = hasNote ? 11 : 8
      checkPageBreak(rowH)

      const isIncome = tx.type === 'income'
      doc.setFillColor(...(i % 2 === 0 ? WHITE : LIGHT))
      doc.rect(ML, y, CW, rowH, 'F')

      // Category
      const textY = hasNote ? y + 4.5 : y + 5.5
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...DARK)
      doc.text(tx.category, ML + 3, textY)

      // Time (right of note area)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...MUTED)
      doc.text(formatTime(tx.createdAt), ML + CW * 0.63, textY, { align: 'right' })

      // Note (second line)
      if (hasNote) {
        const noteY = y + 8.8
        if (isArabic(tx.note)) {
          // Arabic: render via browser canvas for correct shaping + RTL
          addArabicText(doc, tx.note, ML + CW * 0.62, noteY, { fontSize: 7.5, color: MUTED })
        } else {
          doc.setFontSize(7.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(...MUTED)
          const note = tx.note.length > 55 ? tx.note.slice(0, 52) + '...' : tx.note
          doc.text(note, ML + 3, noteY)
        }
      }

      // Amount
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...(isIncome ? GREEN : RED))
      doc.text(`${isIncome ? '+' : '-'}${formatAmount(tx.amount)}`, ML + CW, textY, { align: 'right' })

      y += rowH
    }
    y += 3
  }

  // ── Footer on each page ──────────────────────────────────────────────────
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
