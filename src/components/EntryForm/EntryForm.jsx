// src/components/EntryForm/EntryForm.jsx
import { useState } from 'react'
import BalanceSummary from '../BalanceSummary/BalanceSummary'
import AmountDisplay from '../AmountDisplay/AmountDisplay'
import CategorySelector from '../CategorySelector/CategorySelector'
import NumPad from '../NumPad/NumPad'
import { addDigit, removeDigit, queueToAmount, amountToQueue, isQueueZero } from '../../utils/amountUtils'
import styles from './EntryForm.module.css'

export default function EntryForm({ onSubmit, initialValues, isEdit = false }) {
  const [mode, setMode] = useState(initialValues?.type ?? 'expense')
  const [queue, setQueue] = useState(
    initialValues?.amount ? amountToQueue(initialValues.amount) : []
  )
  const [category, setCategory] = useState(initialValues?.category ?? null)
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [notesFocused, setNotesFocused] = useState(false)

  function handleModeToggle() {
    setMode(m => (m === 'income' ? 'expense' : 'income'))
    setCategory(null)
  }

  const confirmDisabled = isQueueZero(queue) || !category

  function handleConfirm() {
    if (confirmDisabled) return
    onSubmit({ type: mode, amount: queueToAmount(queue), category, note })
    if (!isEdit) {
      setQueue([])
      setCategory(null)
      setNote('')
    }
  }

  return (
    <div className={styles.form}>
      <BalanceSummary />

      <div className={styles.middle}>
        <div className={styles.amountWrap}>
          <AmountDisplay queue={queue} />
        </div>

        <div className={styles.notesWrap}>
          <input
            className={styles.notesInput}
            type="text"
            placeholder="Add a note..."
            maxLength={100}
            value={note}
            onChange={e => setNote(e.target.value)}
            onFocus={() => setNotesFocused(true)}
            onBlur={() => setNotesFocused(false)}
          />
        </div>
      </div>

      {!notesFocused && (
        <>
          <div className={styles.categoryRow}>
            <div className={styles.categoryScroll}>
              <CategorySelector mode={mode} selected={category} onSelect={setCategory} />
            </div>
            <div className={styles.modeDivider} />
            <button
              className={`${styles.modeBtn} ${styles[mode]}`}
              onClick={handleModeToggle}
            >
              {mode === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>

          <div className={styles.numPadWrap}>
            <NumPad
              mode={mode}
              confirmDisabled={confirmDisabled}
              confirmLabel={isEdit ? 'Save' : '✓'}
              onDigit={d => setQueue(q => addDigit(q, d))}
              onBackspace={() => setQueue(q => removeDigit(q))}
              onConfirm={handleConfirm}
            />
          </div>
        </>
      )}
    </div>
  )
}
