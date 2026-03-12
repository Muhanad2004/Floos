// src/screens/Entry/Entry.jsx
import EntryForm from '../../components/EntryForm/EntryForm'
import { useApp } from '../../context/AppContext'
import styles from './Entry.module.css'

export default function Entry() {
  const { addTransaction } = useApp()

  function handleSubmit({ type, amount, category, note }) {
    addTransaction({
      id: crypto.randomUUID(),
      type,
      amount,
      category,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className={styles.screen}>
      <EntryForm onSubmit={handleSubmit} />
    </div>
  )
}
