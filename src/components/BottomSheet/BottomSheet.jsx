// src/components/BottomSheet/BottomSheet.jsx
import { useEffect, useRef } from 'react'
import styles from './BottomSheet.module.css'

export default function BottomSheet({ isOpen, onClose, children }) {
  const sheetRef = useRef(null)
  const startYRef = useRef(null)

  useEffect(() => {
    const sheet = sheetRef.current
    if (!sheet) return
    function onTouchStart(e) { startYRef.current = e.touches[0].clientY }
    function onTouchEnd(e) {
      if (startYRef.current === null) return
      const delta = e.changedTouches[0].clientY - startYRef.current
      if (delta > 80) onClose()
      startYRef.current = null
    }
    sheet.addEventListener('touchstart', onTouchStart)
    sheet.addEventListener('touchend', onTouchEnd)
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart)
      sheet.removeEventListener('touchend', onTouchEnd)
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div ref={sheetRef} className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />
        {children}
      </div>
    </div>
  )
}
