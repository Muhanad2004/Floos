// src/components/EntryForm/EntryForm.jsx
import { useState } from 'react'
import ModeToggle from '../ModeToggle/ModeToggle'
import AmountDisplay from '../AmountDisplay/AmountDisplay'
import CategorySelector from '../CategorySelector/CategorySelector'
import NumPad from '../NumPad/NumPad'
import { addDigit, removeDigit, queueToAmount, amountToQueue, isQueueZero } from '../../utils/amountUtils'
import styles from './EntryForm.module.css'

export default function EntryForm({ onSubmit, initialValues, isEdit = false }) {
  const [mode, setMode] = useState(initialValues?.type ?? 'income')
  const [queue, setQueue] = useState(
    initialValues?.amount ? amountToQueue(initialValues.amount) : []
  )
  const [category, setCategory] = useState(initialValues?.category ?? null)
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [notesFocused, setNotesFocused] = useState(false)

  function handleModeChange(newMode) {
    setMode(newMode)
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
      <ModeToggle mode={mode} onChange={handleModeChange} />
      <div className={styles.amountWrap}>
        <AmountDisplay queue={queue} />
      </div>
      <CategorySelector mode={mode} selected={category} onSelect={setCategory} />
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
      {!notesFocused && (
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
      )}
    </div>
  )
}
