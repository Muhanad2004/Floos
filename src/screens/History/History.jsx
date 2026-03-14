// src/screens/History/History.jsx
import { useState, useMemo } from 'react'
import { X, Share2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { groupByDay } from '../../utils/dateUtils'
import { exportToPdf } from '../../utils/exportPdf'
import TransactionGroup from './TransactionGroup'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import EntryForm from '../../components/EntryForm/EntryForm'
import styles from './History.module.css'

const FILTERS = ['All', 'Income', 'Expenses']

export default function History() {
  const { transactions, updateTransaction, deleteTransaction } = useApp()
  const [search, setSearch]           = useState('')
  const [selectedTx, setSelectedTx]   = useState(null)
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEdit, setShowEdit]       = useState(false)
  const [showExport, setShowExport]   = useState(false)
  const [exportFilter, setExportFilter] = useState('All')

  const filtered = search.trim()
    ? transactions.filter(tx => tx.note && tx.note.toLowerCase().includes(search.toLowerCase()))
    : transactions

  const groups = groupByDay(filtered)
  const isEmpty = transactions.length === 0
  const noResults = !isEmpty && Object.keys(groups).length === 0

  const exportTransactions = useMemo(() => {
    if (exportFilter === 'Income')   return transactions.filter(t => t.type === 'income')
    if (exportFilter === 'Expenses') return transactions.filter(t => t.type === 'expense')
    return transactions
  }, [transactions, exportFilter])

  function handleTapRow(tx) {
    setSelectedTx(tx)
    setShowActions(true)
  }

  function handleEdit() {
    setShowActions(false)
    setShowEdit(true)
  }

  function handleDelete() {
    setShowActions(false)
    setShowDeleteConfirm(true)
  }

  function confirmDelete() {
    deleteTransaction(selectedTx.id)
    setShowDeleteConfirm(false)
    setSelectedTx(null)
  }

  function handleEditSubmit({ type, amount, category, note }) {
    updateTransaction(selectedTx.id, { type, amount, category, note: note.trim() || undefined })
    setShowEdit(false)
    setSelectedTx(null)
  }

  function handleExport() {
    exportToPdf(exportTransactions)
    setShowExport(false)
  }

  return (
    <div className={styles.screen}>
      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          type="search"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className={styles.exportBtn}
          onClick={() => setShowExport(true)}
          disabled={transactions.length === 0}
          aria-label="Export PDF"
        >
          <Share2 size={18} strokeWidth={2} />
        </button>
      </div>

      <div className={styles.list}>
        {isEmpty && (
          <div className={styles.emptyState}>No transactions yet. Tap + to add one.</div>
        )}
        {noResults && (
          <div className={styles.emptyState}>No results for "{search}".</div>
        )}
        {Object.entries(groups).map(([dateKey, txs]) => (
          <TransactionGroup key={dateKey} dateKey={dateKey} transactions={txs} onTapRow={handleTapRow} />
        ))}
      </div>

      {/* Export sheet */}
      <BottomSheet isOpen={showExport} onClose={() => setShowExport(false)}>
        <div className={styles.exportSheet}>
          <span className={styles.exportTitle}>Export PDF</span>

          <div className={styles.filterToggle}>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${exportFilter === f ? styles.filterActive : ''}`}
                onClick={() => setExportFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <p className={styles.exportCount}>
            {exportTransactions.length} transaction{exportTransactions.length !== 1 ? 's' : ''} selected
          </p>

          <button
            className={styles.exportConfirmBtn}
            onClick={handleExport}
            disabled={exportTransactions.length === 0}
          >
            Export PDF
          </button>
          <button className={styles.sheetBtn} onClick={() => setShowExport(false)}>Cancel</button>
        </div>
      </BottomSheet>

      {/* Row actions */}
      <BottomSheet isOpen={showActions} onClose={() => setShowActions(false)}>
        <div className={styles.sheetActions}>
          <button className={styles.sheetBtn} onClick={handleEdit}>Edit</button>
          <button className={`${styles.sheetBtn} ${styles.destructive}`} onClick={handleDelete}>Delete</button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <div className={styles.sheetActions}>
          <p className={styles.sheetMessage}>Delete this transaction?</p>
          <button className={`${styles.sheetBtn} ${styles.destructive}`} onClick={confirmDelete}>Delete</button>
          <button className={styles.sheetBtn} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={showEdit} onClose={() => setShowEdit(false)}>
        <div className={styles.editHeader}>
          <span className={styles.editTitle}>Edit Transaction</span>
          <button className={styles.closeBtn} onClick={() => setShowEdit(false)}><X size={18} strokeWidth={2} /></button>
        </div>
        {selectedTx && (
          <EntryForm initialValues={selectedTx} isEdit onSubmit={handleEditSubmit} />
        )}
      </BottomSheet>
    </div>
  )
}
