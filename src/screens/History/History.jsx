// src/screens/History/History.jsx
import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { groupByDay } from '../../utils/dateUtils'
import TransactionGroup from './TransactionGroup'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import EntryForm from '../../components/EntryForm/EntryForm'
import styles from './History.module.css'

export default function History() {
  const { transactions, updateTransaction, deleteTransaction } = useApp()
  const [search, setSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState(null)
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const filtered = search.trim()
    ? transactions.filter(tx => tx.note && tx.note.toLowerCase().includes(search.toLowerCase()))
    : transactions

  const groups = groupByDay(filtered)
  const isEmpty = transactions.length === 0
  const noResults = !isEmpty && Object.keys(groups).length === 0

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
          <button className={styles.closeBtn} onClick={() => setShowEdit(false)}>×</button>
        </div>
        {selectedTx && (
          <EntryForm initialValues={selectedTx} isEdit onSubmit={handleEditSubmit} />
        )}
      </BottomSheet>
    </div>
  )
}
