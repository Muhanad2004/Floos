// src/components/BottomSheet/BottomSheet.jsx
import { useEffect, useRef } from 'react'
import styles from './BottomSheet.module.css'

export default function BottomSheet({ isOpen, onClose, children }) {
  const handleRef = useRef(null)
  const startYRef = useRef(null)

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return
    function onTouchStart(e) { startYRef.current = e.touches[0].clientY }
    function onTouchEnd(e) {
      if (startYRef.current === null) return
      const delta = e.changedTouches[0].clientY - startYRef.current
      if (delta > 80) onClose()
      startYRef.current = null
    }
    handle.addEventListener('touchstart', onTouchStart)
    handle.addEventListener('touchend', onTouchEnd)
    return () => {
      handle.removeEventListener('touchstart', onTouchStart)
      handle.removeEventListener('touchend', onTouchEnd)
    }
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div ref={handleRef} className={styles.handle} />
        {children}
      </div>
    </div>
  )
}
