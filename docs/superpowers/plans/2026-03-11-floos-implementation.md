# Floos Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready iOS PWA for tracking OMR income and expenses with a cash-register numpad, grouped history, and a clean dashboard.

**Architecture:** React app (Vite) with a single AppContext holding all transactions and settings state. Utility modules handle pure logic (storage, amount queue, date formatting). Components are stateless or locally-stateful; screens compose them. The edit modal is a BottomSheet rendered from History — it never touches Add tab state.

**Tech Stack:** React 18, Vite 5, vite-plugin-pwa, Vitest, @testing-library/react, @testing-library/jest-dom, jsdom, CSS Modules

---

## File Map

```
Floos/
  index.html
  vite.config.js
  package.json
  public/
    icon.png                    ← 512×512 PNG (must be provided before PWA build)
  src/
    main.jsx                    ← React root, applies theme class to <html>
    App.jsx                     ← Tab state, renders active screen + TabBar
    App.module.css
    index.css                   ← CSS custom properties for light/dark themes, resets
    constants/
      categories.js             ← INCOME_CATEGORIES, EXPENSE_CATEGORIES arrays
    utils/
      storage.js                ← readTransactions, writeTransactions, readSettings, writeSettings
      amountUtils.js            ← queueToDisplay, queueToAmount, amountToQueue, isQueueZero
      dateUtils.js              ← formatDateHeader, formatTime12h, groupByDay, getMonthTotals, getBalance
    context/
      AppContext.jsx             ← createContext, AppProvider, useApp hook
    components/
      BottomSheet/
        BottomSheet.jsx         ← backdrop + swipe-down-dismissible sheet
        BottomSheet.module.css
      TabBar/
        TabBar.jsx
        TabBar.module.css
      ModeToggle/
        ModeToggle.jsx          ← Income | Expense pill toggle
        ModeToggle.module.css
      AmountDisplay/
        AmountDisplay.jsx       ← formats queue → "X.XXX OMR", ghost at zero
        AmountDisplay.module.css
      CategorySelector/
        CategorySelector.jsx    ← horizontal scrollable pill chips
        CategorySelector.module.css
      NumPad/
        NumPad.jsx              ← 3×4 grid, calls onDigit / onBackspace / onConfirm
        NumPad.module.css
      EntryForm/
        EntryForm.jsx           ← composes toggle + display + selector + notes + numpad
        EntryForm.module.css
    screens/
      Dashboard/
        Dashboard.jsx
        Dashboard.module.css
      Entry/
        Entry.jsx               ← thin wrapper: renders EntryForm for Add tab
        Entry.module.css
      History/
        History.jsx             ← search bar + grouped list + bottom sheet orchestration
        History.module.css
        TransactionRow.jsx      ← single tappable row
        TransactionGroup.jsx    ← date header + list of rows
      Settings/
        Settings.jsx
        Settings.module.css
    test/
      setup.js
      utils/
        storage.test.js
        amountUtils.test.js
        dateUtils.test.js
      components/
        EntryForm.test.jsx
      screens/
        Dashboard.test.jsx
```

---

## Chunk 1: Project Scaffold & Tooling

### Task 1: Scaffold the Vite React project ✅ DONE

### Task 2: Configure Vite, Vitest, and PWA plugin

**Files:**
- Modify: `vite.config.js`
- Create: `src/test/setup.js`

- [ ] **Step 1: Replace vite.config.js**

```js
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'Floos',
        short_name: 'Floos',
        description: 'Personal finance tracker for OMR',
        theme_color: '#10B981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true
  }
})
```

- [ ] **Step 2: Create test setup file**

```js
// src/test/setup.js
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Add test script to package.json**

In `package.json`, ensure scripts includes:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Run tests (expect 0 tests, no failures)**

```bash
npm run test:run
```
Expected: `Test Files  0 passed` — no errors.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js package.json src/test/setup.js
git commit -m "chore: configure Vite, Vitest, and PWA plugin"
```

---

## Chunk 2: Data Foundation

### Task 3: Category constants

**Files:**
- Create: `src/constants/categories.js`

- [ ] **Step 1: Write categories module**

```js
// src/constants/categories.js
export const INCOME_CATEGORIES = ['Salary', 'Gift', 'Savings', 'Family', 'Other']
export const EXPENSE_CATEGORIES = ['Fuel', 'Groceries', 'Snacks', 'Bills', 'Other']

export function getCategoriesForType(type) {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/categories.js
git commit -m "feat: add category constants"
```

---

### Task 4: Storage utility (TDD)

**Files:**
- Create: `src/utils/storage.js`
- Create: `src/test/utils/storage.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/test/utils/storage.test.js
import { readTransactions, writeTransactions, readSettings, writeSettings } from '../../utils/storage'

beforeEach(() => localStorage.clear())

describe('readTransactions', () => {
  it('returns empty array when key is absent', () => {
    expect(readTransactions()).toEqual([])
  })

  it('returns parsed array when valid JSON is stored', () => {
    const data = [{ id: '1', amount: 1.5 }]
    localStorage.setItem('floos_transactions', JSON.stringify(data))
    expect(readTransactions()).toEqual(data)
  })

  it('returns empty array when stored JSON is corrupt', () => {
    localStorage.setItem('floos_transactions', 'not-json{{{')
    expect(readTransactions()).toEqual([])
  })
})

describe('writeTransactions', () => {
  it('serializes and stores transactions', () => {
    const data = [{ id: '1', amount: 2.5 }]
    writeTransactions(data)
    expect(JSON.parse(localStorage.getItem('floos_transactions'))).toEqual(data)
  })
})

describe('readSettings', () => {
  it('returns default settings when key is absent', () => {
    expect(readSettings()).toEqual({ theme: 'system' })
  })

  it('returns parsed settings when valid JSON is stored', () => {
    localStorage.setItem('floos_settings', JSON.stringify({ theme: 'dark' }))
    expect(readSettings()).toEqual({ theme: 'dark' })
  })

  it('returns default settings when stored JSON is corrupt', () => {
    localStorage.setItem('floos_settings', '{{invalid')
    expect(readSettings()).toEqual({ theme: 'system' })
  })
})

describe('writeSettings', () => {
  it('serializes and stores settings', () => {
    writeSettings({ theme: 'light' })
    expect(JSON.parse(localStorage.getItem('floos_settings'))).toEqual({ theme: 'light' })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test:run -- src/test/utils/storage.test.js
```
Expected: FAIL — `Cannot find module '../../utils/storage'`

- [ ] **Step 3: Implement storage module**

```js
// src/utils/storage.js
const TRANSACTIONS_KEY = 'floos_transactions'
const SETTINGS_KEY = 'floos_settings'
const DEFAULT_SETTINGS = { theme: 'system' }

export function readTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) ?? '[]') ?? []
  } catch {
    return []
  }
}

export function writeTransactions(transactions) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
}

export function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function writeSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function clearAllData() {
  localStorage.removeItem(TRANSACTIONS_KEY)
  localStorage.removeItem(SETTINGS_KEY)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test:run -- src/test/utils/storage.test.js
```
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/storage.js src/test/utils/storage.test.js
git commit -m "feat: add storage utility with error handling"
```

---

### Task 5: Amount utilities (TDD)

The numpad maintains a queue of digit presses (max 7). The queue maps to a 7-slot display (4 integer + 3 decimal).

**Files:**
- Create: `src/utils/amountUtils.js`
- Create: `src/test/utils/amountUtils.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/test/utils/amountUtils.test.js
import { queueToDisplay, queueToAmount, amountToQueue, isQueueZero } from '../../utils/amountUtils'

describe('queueToDisplay', () => {
  it('returns "0.000" for empty queue', () => {
    expect(queueToDisplay([])).toBe('0.000')
  })

  it('single digit fills rightmost decimal place', () => {
    expect(queueToDisplay([1])).toBe('0.001')
  })

  it('three digits fill decimal part', () => {
    expect(queueToDisplay([1, 5, 0])).toBe('0.150')
  })

  it('four digits use one integer place', () => {
    expect(queueToDisplay([1, 5, 0, 0])).toBe('1.500')
  })

  it('seven digits fills all slots', () => {
    expect(queueToDisplay([9, 9, 9, 9, 9, 9, 9])).toBe('9999.999')
  })

  it('leading zero presses stay in decimal', () => {
    expect(queueToDisplay([0, 0, 0, 0, 0, 0, 1])).toBe('0.001')
  })
})

describe('queueToAmount', () => {
  it('returns 0 for empty queue', () => {
    expect(queueToAmount([])).toBe(0)
  })

  it('returns correct amount for [1,5,0]', () => {
    expect(queueToAmount([1, 5, 0])).toBeCloseTo(0.15, 5)
  })

  it('returns correct amount for [1,5,0,0]', () => {
    expect(queueToAmount([1, 5, 0, 0])).toBeCloseTo(1.5, 5)
  })
})

describe('amountToQueue', () => {
  it('returns [] for 0', () => {
    expect(amountToQueue(0)).toEqual([])
  })

  it('converts 1.5 to [1,5,0,0]', () => {
    expect(amountToQueue(1.5)).toEqual([1, 5, 0, 0])
  })

  it('converts 0.1 to [1,0,0]', () => {
    expect(amountToQueue(0.1)).toEqual([1, 0, 0])
  })

  it('converts 0.001 to [1]', () => {
    expect(amountToQueue(0.001)).toEqual([1])
  })

  it('round-trips: amountToQueue then queueToAmount', () => {
    const amounts = [1.5, 0.1, 0.001, 9999.999, 100, 0.015]
    for (const a of amounts) {
      expect(queueToAmount(amountToQueue(a))).toBeCloseTo(a, 5)
    }
  })
})

describe('isQueueZero', () => {
  it('returns true for empty queue', () => {
    expect(isQueueZero([])).toBe(true)
  })

  it('returns true for all-zero queue', () => {
    expect(isQueueZero([0, 0, 0])).toBe(true)
  })

  it('returns false when any non-zero digit is present', () => {
    expect(isQueueZero([0, 0, 1])).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test:run -- src/test/utils/amountUtils.test.js
```

- [ ] **Step 3: Implement amount utilities**

```js
// src/utils/amountUtils.js
const MAX_DIGITS = 7
const DECIMAL_PLACES = 3
const INT_PLACES = MAX_DIGITS - DECIMAL_PLACES // 4

export function queueToDisplay(queue) {
  const padded = Array(MAX_DIGITS - queue.length).fill(0).concat(queue)
  const intNum = parseInt(padded.slice(0, INT_PLACES).join(''), 10)
  const decStr = padded.slice(INT_PLACES).join('')
  return `${intNum}.${decStr}`
}

export function queueToAmount(queue) {
  if (queue.length === 0) return 0
  return parseFloat(queueToDisplay(queue))
}

export function amountToQueue(amount) {
  if (amount === 0) return []
  const str = amount.toFixed(DECIMAL_PLACES).replace('.', '')
  const padded = str.padStart(MAX_DIGITS, '0')
  const trimmed = padded.replace(/^0+/, '')
  if (!trimmed) return []
  return trimmed.split('').map(Number)
}

export function isQueueZero(queue) {
  return queue.every(d => d === 0)
}

export function addDigit(queue, digit) {
  if (queue.length >= MAX_DIGITS) return queue
  return [...queue, digit]
}

export function removeDigit(queue) {
  return queue.slice(0, -1)
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test:run -- src/test/utils/amountUtils.test.js
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/amountUtils.js src/test/utils/amountUtils.test.js
git commit -m "feat: add amount queue utilities with TDD"
```

---

### Task 6: Date utilities (TDD)

**Files:**
- Create: `src/utils/dateUtils.js`
- Create: `src/test/utils/dateUtils.test.js`

- [ ] **Step 1: Write failing tests**

```js
// src/test/utils/dateUtils.test.js
import { formatDateHeader, formatTime12h, groupByDay, getMonthTotals } from '../../utils/dateUtils'

const TODAY_UTC_NOON = new Date('2026-03-11T12:00:00.000Z')

function localNoon(dateStr) {
  return dateStr + 'T12:00:00.000Z'
}

describe('formatDateHeader', () => {
  it('returns "Today" for today\'s date', () => {
    const dateStr = new Date(localNoon('2026-03-11')).toLocaleDateString('en-CA')
    expect(formatDateHeader(dateStr, TODAY_UTC_NOON)).toBe('Today')
  })

  it('returns "Yesterday" for yesterday', () => {
    const dateStr = new Date(localNoon('2026-03-10')).toLocaleDateString('en-CA')
    expect(formatDateHeader(dateStr, TODAY_UTC_NOON)).toBe('Yesterday')
  })

  it('returns formatted date for older dates', () => {
    const dateStr = new Date(localNoon('2026-03-08')).toLocaleDateString('en-CA')
    const result = formatDateHeader(dateStr, TODAY_UTC_NOON)
    expect(result).toMatch(/March 8, 2026/)
  })
})

describe('formatTime12h', () => {
  it('returns a string matching 12-hour time format', () => {
    const result = formatTime12h(new Date())
    expect(result).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
  })
})

describe('groupByDay', () => {
  it('returns empty object for empty transactions', () => {
    expect(groupByDay([])).toEqual({})
  })

  it('groups transactions by local date string', () => {
    const txs = [
      { id: '1', createdAt: '2026-03-11T08:00:00.000Z', amount: 1, type: 'income', category: 'Salary' },
      { id: '2', createdAt: '2026-03-11T10:00:00.000Z', amount: 2, type: 'expense', category: 'Fuel' },
      { id: '3', createdAt: '2026-03-10T09:00:00.000Z', amount: 3, type: 'income', category: 'Gift' },
    ]
    const groups = groupByDay(txs)
    const keys = Object.keys(groups)
    expect(keys).toHaveLength(2)
    expect(groups[keys[0]]).toHaveLength(2)
    expect(groups[keys[1]]).toHaveLength(1)
  })

  it('sorts groups most-recent-first', () => {
    const txs = [
      { id: '1', createdAt: '2026-03-09T08:00:00.000Z', amount: 1, type: 'income', category: 'Salary' },
      { id: '2', createdAt: '2026-03-11T08:00:00.000Z', amount: 2, type: 'income', category: 'Salary' },
    ]
    const keys = Object.keys(groupByDay(txs))
    expect(new Date(keys[0]) > new Date(keys[1])).toBe(true)
  })
})

describe('getMonthTotals', () => {
  it('returns zeros for empty transactions', () => {
    expect(getMonthTotals([], new Date())).toEqual({ income: 0, expense: 0 })
  })

  it('sums income and expense for current month only', () => {
    const now = new Date('2026-03-15T00:00:00.000Z')
    const txs = [
      { id: '1', createdAt: '2026-03-10T00:00:00.000Z', amount: 100, type: 'income', category: 'Salary' },
      { id: '2', createdAt: '2026-03-10T00:00:00.000Z', amount: 20, type: 'expense', category: 'Fuel' },
      { id: '3', createdAt: '2026-02-10T00:00:00.000Z', amount: 50, type: 'income', category: 'Salary' },
    ]
    const result = getMonthTotals(txs, now)
    expect(result.income).toBeCloseTo(100, 5)
    expect(result.expense).toBeCloseTo(20, 5)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test:run -- src/test/utils/dateUtils.test.js
```

- [ ] **Step 3: Implement date utilities**

```js
// src/utils/dateUtils.js

function toLocalDateString(isoString) {
  const d = new Date(isoString)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateHeader(dateStr, now = new Date()) {
  const todayStr = toLocalDateString(now.toISOString())
  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = toLocalDateString(yesterdayDate.toISOString())

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
    const key = toLocalDateString(tx.createdAt)
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test:run -- src/test/utils/dateUtils.test.js
```

- [ ] **Step 5: Commit**

```bash
git add src/utils/dateUtils.js src/test/utils/dateUtils.test.js
git commit -m "feat: add date utilities with TDD"
```

---

### Task 7: App Context

**Files:**
- Create: `src/context/AppContext.jsx`

- [ ] **Step 1: Write AppContext**

```jsx
// src/context/AppContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'
import { readTransactions, writeTransactions, readSettings, writeSettings, clearAllData } from '../utils/storage'

export const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState(() => readTransactions())
  const [settings, setSettings] = useState(() => readSettings())

  const addTransaction = useCallback((tx) => {
    const next = [tx, ...transactions]
    setTransactions(next)
    writeTransactions(next)
  }, [transactions])

  const updateTransaction = useCallback((id, updates) => {
    const next = transactions.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
    setTransactions(next)
    writeTransactions(next)
  }, [transactions])

  const deleteTransaction = useCallback((id) => {
    const next = transactions.filter(tx => tx.id !== id)
    setTransactions(next)
    writeTransactions(next)
  }, [transactions])

  const updateSettings = useCallback((updates) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    writeSettings(next)
  }, [settings])

  const eraseAllData = useCallback(() => {
    clearAllData()
    setTransactions([])
    setSettings({ theme: 'system' })
  }, [])

  return (
    <AppContext.Provider value={{
      transactions,
      settings,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      updateSettings,
      eraseAllData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: add AppContext with transaction and settings state"
```

---

## Chunk 3: UI Components

### Task 8: Global CSS and theme system

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Write global CSS with theme variables**

```css
/* src/index.css */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --color-green: #10B981;
  --color-red: #EF4444;
  --color-bg: #ffffff;
  --color-surface: #f3f4f6;
  --color-border: #e5e7eb;
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-text-ghost: #d1d5db;
  --color-tab-bar-bg: #ffffff;
  --color-tab-bar-border: #e5e7eb;
  --color-sheet-bg: #ffffff;
  --color-overlay: rgba(0, 0, 0, 0.4);
}

html[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-border: #334155;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-text-ghost: #334155;
  --color-tab-bar-bg: #1e293b;
  --color-tab-bar-border: #334155;
  --color-sheet-bg: #1e293b;
  --color-overlay: rgba(0, 0, 0, 0.6);
}

/* System theme: follow OS dark mode preference when no explicit theme is set */
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]):not([data-theme="dark"]) {
    --color-bg: #0f172a;
    --color-surface: #1e293b;
    --color-border: #334155;
    --color-text: #f1f5f9;
    --color-text-muted: #94a3b8;
    --color-text-ghost: #334155;
    --color-tab-bar-bg: #1e293b;
    --color-tab-bar-border: #334155;
    --color-sheet-bg: #1e293b;
    --color-overlay: rgba(0, 0, 0, 0.6);
  }
}

html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  height: 100%;
  -webkit-text-size-adjust: 100%;
}

body {
  height: 100%;
  overscroll-behavior: none;
}

#root {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

input {
  font: inherit;
  color: inherit;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add global CSS with light/dark theme variables"
```

---

### Task 9: BottomSheet component

**Files:**
- Create: `src/components/BottomSheet/BottomSheet.jsx`
- Create: `src/components/BottomSheet/BottomSheet.module.css`

- [ ] **Step 1: Write BottomSheet component**

```jsx
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
```

```css
/* src/components/BottomSheet/BottomSheet.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.15s ease;
}

.sheet {
  width: 100%;
  background: var(--color-sheet-bg);
  border-radius: 16px 16px 0 0;
  padding: 8px 0 calc(16px + env(safe-area-inset-bottom)) 0;
  animation: slideUp 0.25s ease;
}

.handle {
  width: 36px;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  margin: 0 auto 12px;
}

@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/BottomSheet/
git commit -m "feat: add BottomSheet component with swipe-to-dismiss"
```

---

### Task 10: TabBar component

**Files:**
- Create: `src/components/TabBar/TabBar.jsx`
- Create: `src/components/TabBar/TabBar.module.css`

- [ ] **Step 1: Write TabBar**

```jsx
// src/components/TabBar/TabBar.jsx
import styles from './TabBar.module.css'

const TABS = [
  { id: 'dashboard', label: 'Home', icon: '⊞' },
  { id: 'entry', label: 'Add', icon: '+', prominent: true },
  { id: 'history', label: 'History', icon: '≡' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className={styles.tabBar}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${tab.prominent ? styles.prominent : ''} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
```

```css
/* src/components/TabBar/TabBar.module.css */
.tabBar {
  display: flex;
  align-items: stretch;
  background: var(--color-tab-bar-bg);
  border-top: 1px solid var(--color-tab-bar-border);
  padding-bottom: env(safe-area-inset-bottom);
  flex-shrink: 0;
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  gap: 2px;
  color: var(--color-text-muted);
  transition: color 0.15s;
  min-height: 56px;
}

.tab.active { color: var(--color-green); }

.prominent .icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-green);
  color: white;
  border-radius: 50%;
  font-size: 1.5rem;
  line-height: 1;
}

.tab.prominent { color: var(--color-text-muted); }
.icon { font-size: 1.2rem; }
.label { font-size: 0.65rem; font-weight: 500; }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TabBar/
git commit -m "feat: add TabBar component"
```

---

### Task 11: ModeToggle component

**Files:**
- Create: `src/components/ModeToggle/ModeToggle.jsx`
- Create: `src/components/ModeToggle/ModeToggle.module.css`

- [ ] **Step 1: Write ModeToggle**

```jsx
// src/components/ModeToggle/ModeToggle.jsx
import styles from './ModeToggle.module.css'

export default function ModeToggle({ mode, onChange }) {
  return (
    <div className={`${styles.toggle} ${styles[mode]}`}>
      <button
        className={`${styles.option} ${mode === 'income' ? styles.selected : ''}`}
        onClick={() => onChange('income')}
      >Income</button>
      <button
        className={`${styles.option} ${mode === 'expense' ? styles.selected : ''}`}
        onClick={() => onChange('expense')}
      >Expense</button>
    </div>
  )
}
```

```css
/* src/components/ModeToggle/ModeToggle.module.css */
.toggle {
  display: flex;
  background: var(--color-surface);
  border-radius: 999px;
  padding: 3px;
  gap: 2px;
  width: fit-content;
  margin: 0 auto;
}

.option {
  padding: 6px 24px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
  color: var(--color-text-muted);
}

.income .option.selected { background: var(--color-green); color: white; }
.expense .option.selected { background: var(--color-red); color: white; }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ModeToggle/
git commit -m "feat: add ModeToggle component"
```

---

### Task 12: AmountDisplay component

**Files:**
- Create: `src/components/AmountDisplay/AmountDisplay.jsx`
- Create: `src/components/AmountDisplay/AmountDisplay.module.css`

- [ ] **Step 1: Write AmountDisplay**

```jsx
// src/components/AmountDisplay/AmountDisplay.jsx
import { queueToDisplay, isQueueZero } from '../../utils/amountUtils'
import styles from './AmountDisplay.module.css'

export default function AmountDisplay({ queue }) {
  const display = queueToDisplay(queue)
  const isEmpty = isQueueZero(queue)

  return (
    <div className={`${styles.display} ${isEmpty ? styles.ghost : ''}`}>
      <span className={styles.amount}>{display}</span>
      <span className={styles.currency}>OMR</span>
    </div>
  )
}
```

```css
/* src/components/AmountDisplay/AmountDisplay.module.css */
.display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.amount {
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  transition: color 0.15s;
}

.currency {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.ghost .amount { color: var(--color-text-ghost); }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AmountDisplay/
git commit -m "feat: add AmountDisplay component"
```

---

### Task 13: CategorySelector component

**Files:**
- Create: `src/components/CategorySelector/CategorySelector.jsx`
- Create: `src/components/CategorySelector/CategorySelector.module.css`

- [ ] **Step 1: Write CategorySelector**

```jsx
// src/components/CategorySelector/CategorySelector.jsx
import { getCategoriesForType } from '../../constants/categories'
import styles from './CategorySelector.module.css'

export default function CategorySelector({ mode, selected, onSelect }) {
  const categories = getCategoriesForType(mode)
  return (
    <div className={styles.scroll}>
      {categories.map(cat => (
        <button
          key={cat}
          className={`${styles.chip} ${selected === cat ? styles.selected : ''} ${styles[mode]}`}
          onClick={() => onSelect(selected === cat ? null : cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
```

```css
/* src/components/CategorySelector/CategorySelector.module.css */
.scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 0 16px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.scroll::-webkit-scrollbar { display: none; }

.chip {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1.5px solid var(--color-border);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  transition: all 0.15s;
  white-space: nowrap;
}

.chip.income.selected { background: var(--color-green); border-color: var(--color-green); color: white; }
.chip.expense.selected { background: var(--color-red); border-color: var(--color-red); color: white; }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/CategorySelector/
git commit -m "feat: add CategorySelector component"
```

---

### Task 14: NumPad component

**Files:**
- Create: `src/components/NumPad/NumPad.jsx`
- Create: `src/components/NumPad/NumPad.module.css`

- [ ] **Step 1: Write NumPad**

```jsx
// src/components/NumPad/NumPad.jsx
import styles from './NumPad.module.css'

const LAYOUT = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
]

export default function NumPad({ onDigit, onBackspace, onConfirm, confirmDisabled, confirmLabel = '✓', mode }) {
  function handleKey(key) {
    if (key === '⌫') onBackspace()
    else if (key === 'CONFIRM') { if (!confirmDisabled) onConfirm() }
    else onDigit(parseInt(key, 10))
  }

  const flatKeys = LAYOUT.flat()

  return (
    <div className={styles.grid}>
      {flatKeys.map((key, i) => {
        const isConfirm = key === '✓'
        const displayKey = isConfirm ? confirmLabel : key
        return (
          <button
            key={i}
            className={`
              ${styles.key}
              ${isConfirm ? styles.confirm : ''}
              ${isConfirm ? styles[mode] : ''}
              ${isConfirm && confirmDisabled ? styles.disabled : ''}
            `}
            onClick={() => handleKey(isConfirm ? 'CONFIRM' : key)}
          >
            {displayKey}
          </button>
        )
      })}
    </div>
  )
}
```

```css
/* src/components/NumPad/NumPad.module.css */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 16px;
}

.key {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  border-radius: 12px;
  background: var(--color-surface);
  font-size: 1.4rem;
  font-weight: 500;
  color: var(--color-text);
  transition: opacity 0.1s, transform 0.1s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.key:active { transform: scale(0.95); opacity: 0.7; }
.confirm.income { background: var(--color-green); color: white; }
.confirm.expense { background: var(--color-red); color: white; }
.confirm.disabled { opacity: 0.35; }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NumPad/
git commit -m "feat: add NumPad component"
```

---

### Task 15: EntryForm component

**Files:**
- Create: `src/components/EntryForm/EntryForm.jsx`
- Create: `src/components/EntryForm/EntryForm.module.css`
- Create: `src/test/components/EntryForm.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/test/components/EntryForm.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EntryForm from '../../components/EntryForm/EntryForm'

const noop = () => {}

describe('EntryForm', () => {
  it('shows income categories by default', () => {
    render(<EntryForm onSubmit={noop} />)
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.queryByText('Fuel')).not.toBeInTheDocument()
  })

  it('shows expense categories when mode is switched to expense', async () => {
    const user = userEvent.setup()
    render(<EntryForm onSubmit={noop} />)
    await user.click(screen.getByText('Expense'))
    expect(screen.getByText('Fuel')).toBeInTheDocument()
    expect(screen.queryByText('Salary')).not.toBeInTheDocument()
  })

  it('does not call onSubmit when confirm is tapped with no category', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<EntryForm onSubmit={onSubmit} />)
    await user.click(screen.getByText('1'))
    await user.click(screen.getByText('✓'))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npm run test:run -- src/test/components/EntryForm.test.jsx
```

- [ ] **Step 3: Implement EntryForm**

```jsx
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
        <NumPad
          mode={mode}
          confirmDisabled={confirmDisabled}
          confirmLabel={isEdit ? 'Save' : '✓'}
          onDigit={d => setQueue(q => addDigit(q, d))}
          onBackspace={() => setQueue(q => removeDigit(q))}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
```

```css
/* src/components/EntryForm/EntryForm.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 0;
  height: 100%;
}

.amountWrap { padding: 8px 16px; }
.notesWrap { padding: 0 16px; }

.notesInput {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
}

.notesInput:focus { border-color: var(--color-green); }
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test:run -- src/test/components/EntryForm.test.jsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/EntryForm/
git commit -m "feat: add EntryForm shared component"
```

---

## Chunk 4: Screens & App Shell

### Task 16: App shell (tab routing + theme)

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Create: `src/App.module.css`

- [ ] **Step 1: Write main.jsx**

```jsx
// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppProvider } from './context/AppContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
)
```

- [ ] **Step 2: Write App.jsx**

```jsx
// src/App.jsx
import { useState, useEffect } from 'react'
import { useApp } from './context/AppContext'
import TabBar from './components/TabBar/TabBar'
import Dashboard from './screens/Dashboard/Dashboard'
import Entry from './screens/Entry/Entry'
import History from './screens/History/History'
import Settings from './screens/Settings/Settings'
import styles from './App.module.css'

const SCREENS = { dashboard: Dashboard, entry: Entry, history: History, settings: Settings }

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { settings } = useApp()

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const Screen = SCREENS[activeTab]

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        <Screen />
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
```

```css
/* src/App.module.css */
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
}

.main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
```

- [ ] **Step 3: Create placeholder screens**

```jsx
// src/screens/Dashboard/Dashboard.jsx
export default function Dashboard() { return <div>Dashboard</div> }
// src/screens/Entry/Entry.jsx
export default function Entry() { return <div>Entry</div> }
// src/screens/History/History.jsx
export default function History() { return <div>History</div> }
// src/screens/Settings/Settings.jsx
export default function Settings() { return <div>Settings</div> }
```

- [ ] **Step 4: Verify app compiles and renders**

```bash
npm run dev
```
Open `http://localhost:5173` — should see "Dashboard" with tab bar at bottom.

- [ ] **Step 5: Commit**

```bash
git add src/main.jsx src/App.jsx src/App.module.css src/screens/
git commit -m "feat: add app shell with tab routing and theme system"
```

---

### Task 17: Dashboard screen

**Files:**
- Modify: `src/screens/Dashboard/Dashboard.jsx`
- Create: `src/screens/Dashboard/Dashboard.module.css`
- Create: `src/test/screens/Dashboard.test.jsx`

- [ ] **Step 1: Write failing tests**

```jsx
// src/test/screens/Dashboard.test.jsx
import { render, screen } from '@testing-library/react'
import Dashboard from '../../screens/Dashboard/Dashboard'
import { AppContext } from '../../context/AppContext'

function renderWithContext(transactions) {
  const ctx = {
    transactions,
    settings: { theme: 'system' },
    addTransaction: () => {},
    updateTransaction: () => {},
    deleteTransaction: () => {},
    updateSettings: () => {},
    eraseAllData: () => {},
  }
  return render(
    <AppContext.Provider value={ctx}>
      <Dashboard />
    </AppContext.Provider>
  )
}

describe('Dashboard', () => {
  it('shows 0.000 with no transactions', () => {
    renderWithContext([])
    expect(screen.getByText('Balance')).toBeInTheDocument()
    expect(screen.getByTestId('balance-amount').textContent).toBe('0.000')
  })

  it('shows correct all-time balance', () => {
    renderWithContext([
      { id: '1', type: 'income', amount: 100, category: 'Salary', createdAt: new Date().toISOString() },
      { id: '2', type: 'expense', amount: 30, category: 'Fuel', createdAt: new Date().toISOString() },
    ])
    expect(screen.getByTestId('balance-amount').textContent).toBe('70.000')
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npm run test:run -- src/test/screens/Dashboard.test.jsx
```

- [ ] **Step 3: Implement Dashboard**

```jsx
// src/screens/Dashboard/Dashboard.jsx
import { useApp } from '../../context/AppContext'
import { getBalance, getMonthTotals } from '../../utils/dateUtils'
import styles from './Dashboard.module.css'

function amountColorClass(amount, styles) {
  if (amount > 0) return styles.positive
  if (amount < 0) return styles.negative
  return ''
}

export default function Dashboard() {
  const { transactions } = useApp()
  const balance = getBalance(transactions)
  const { income, expense } = getMonthTotals(transactions)

  return (
    <div className={styles.screen}>
      <section className={styles.balanceSection}>
        <span className={styles.balanceLabel}>Balance</span>
        <span
          className={`${styles.balanceAmount} ${amountColorClass(balance, styles)}`}
          data-testid="balance-amount"
        >
          {Math.abs(balance).toFixed(3)}
        </span>
        <span className={styles.currency}>OMR</span>
      </section>

      <section className={styles.monthSection}>
        <div className={styles.monthItem}>
          <span className={`${styles.monthAmount} ${income > 0 ? styles.positive : ''}`}>
            {income.toFixed(3)}
          </span>
          <span className={styles.monthLabel}>Income</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.monthItem}>
          <span className={`${styles.monthAmount} ${expense > 0 ? styles.negative : ''}`}>
            {expense.toFixed(3)}
          </span>
          <span className={styles.monthLabel}>Expenses</span>
        </div>
      </section>
    </div>
  )
}
```

```css
/* src/screens/Dashboard/Dashboard.module.css */
.screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  height: 100%;
  padding: 32px 24px;
}

.balanceSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.balanceLabel {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  font-weight: 600;
}

.balanceAmount {
  font-size: 4rem;
  font-weight: 800;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
}

.currency { font-size: 1rem; color: var(--color-text-muted); }

.positive { color: var(--color-green); }
.negative { color: var(--color-red); }

.monthSection {
  display: flex;
  align-items: center;
  gap: 32px;
  background: var(--color-surface);
  border-radius: 16px;
  padding: 20px 32px;
}

.monthItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.monthAmount {
  font-size: 1.4rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.monthLabel {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.divider {
  width: 1px;
  height: 40px;
  background: var(--color-border);
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npm run test:run -- src/test/screens/Dashboard.test.jsx
```

- [ ] **Step 5: Commit**

```bash
git add src/screens/Dashboard/ src/test/screens/Dashboard.test.jsx
git commit -m "feat: implement Dashboard screen"
```

---

### Task 18: Entry screen

**Files:**
- Modify: `src/screens/Entry/Entry.jsx`
- Create: `src/screens/Entry/Entry.module.css`

- [ ] **Step 1: Implement Entry screen**

```jsx
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
```

```css
/* src/screens/Entry/Entry.module.css */
.screen {
  height: 100%;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 2: Verify in browser** — add a transaction, switch to Dashboard and confirm balance updates.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Entry/
git commit -m "feat: implement Entry screen"
```

---

### Task 19: History screen

**Files:**
- Modify: `src/screens/History/History.jsx`
- Create: `src/screens/History/History.module.css`
- Create: `src/screens/History/TransactionRow.jsx`
- Create: `src/screens/History/TransactionGroup.jsx`

- [ ] **Step 1: Write TransactionRow**

```jsx
// src/screens/History/TransactionRow.jsx
import { formatTime12h } from '../../utils/dateUtils'
import styles from './History.module.css'

export default function TransactionRow({ transaction, onTap }) {
  const isIncome = transaction.type === 'income'
  const time = formatTime12h(new Date(transaction.createdAt))

  return (
    <button className={styles.row} onClick={() => onTap(transaction)}>
      <div className={styles.rowLeft}>
        <span className={styles.rowCategory}>{transaction.category}</span>
        {transaction.note && (
          <span className={styles.rowNote}>{transaction.note}</span>
        )}
      </div>
      <div className={styles.rowRight}>
        <span className={`${styles.rowAmount} ${isIncome ? styles.positive : styles.negative}`}>
          {isIncome ? '+' : '-'}{transaction.amount.toFixed(3)}
        </span>
        <span className={styles.rowTime}>{time}</span>
      </div>
    </button>
  )
}
```

- [ ] **Step 2: Write TransactionGroup**

```jsx
// src/screens/History/TransactionGroup.jsx
import { formatDateHeader } from '../../utils/dateUtils'
import TransactionRow from './TransactionRow'
import styles from './History.module.css'

export default function TransactionGroup({ dateKey, transactions, onTapRow }) {
  return (
    <div className={styles.group}>
      <div className={styles.groupHeader}>{formatDateHeader(dateKey)}</div>
      {transactions.map(tx => (
        <TransactionRow key={tx.id} transaction={tx} onTap={onTapRow} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write History screen**

```jsx
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
```

```css
/* src/screens/History/History.module.css */
.screen { display: flex; flex-direction: column; height: 100%; }

.searchWrap {
  padding: 12px 16px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.searchInput {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.95rem;
  outline: none;
}

.searchInput:focus { border-color: var(--color-green); }

.list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }

.emptyState {
  text-align: center;
  color: var(--color-text-muted);
  padding: 60px 24px;
  line-height: 1.6;
}

.group { padding: 0; }

.groupHeader {
  padding: 12px 16px 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  background: var(--color-bg);
  gap: 12px;
}

.row:active { background: var(--color-surface); }

.rowLeft { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.rowCategory { font-size: 0.95rem; font-weight: 600; }

.rowNote {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.rowRight { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.rowAmount { font-size: 0.95rem; font-weight: 700; font-variant-numeric: tabular-nums; }
.rowTime { font-size: 0.75rem; color: var(--color-text-muted); }

.positive { color: var(--color-green); }
.negative { color: var(--color-red); }

.sheetActions { display: flex; flex-direction: column; padding: 8px 16px; gap: 4px; }
.sheetMessage { text-align: center; padding: 8px 0 12px; color: var(--color-text-muted); font-size: 0.9rem; }
.sheetBtn { padding: 16px; text-align: center; font-size: 1rem; font-weight: 500; border-radius: 10px; background: var(--color-surface); }
.sheetBtn.destructive { color: var(--color-red); font-weight: 600; }

.editHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 8px;
}

.editTitle { font-size: 1rem; font-weight: 700; }
.closeBtn { font-size: 1.5rem; color: var(--color-text-muted); padding: 4px 8px; }
```

- [ ] **Step 4: Verify in browser** — confirm grouping, search, edit, delete.

- [ ] **Step 5: Commit**

```bash
git add src/screens/History/
git commit -m "feat: implement History screen with search, edit, and delete"
```

---

### Task 20: Settings screen

**Files:**
- Modify: `src/screens/Settings/Settings.jsx`
- Create: `src/screens/Settings/Settings.module.css`

- [ ] **Step 1: Implement Settings screen**

```jsx
// src/screens/Settings/Settings.jsx
import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import styles from './Settings.module.css'

const THEMES = ['light', 'dark', 'system']

export default function Settings() {
  const { settings, updateSettings, eraseAllData } = useApp()
  const [showConfirm, setShowConfirm] = useState(false)

  function handleErase() {
    eraseAllData()
    setShowConfirm(false)
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Settings</h1>

      <section className={styles.section}>
        <label className={styles.sectionLabel}>Theme</label>
        <div className={styles.themeToggle}>
          {THEMES.map(t => (
            <button
              key={t}
              className={`${styles.themeOption} ${settings.theme === t ? styles.active : ''}`}
              onClick={() => updateSettings({ theme: t })}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.spacer} />

      <button className={styles.eraseBtn} onClick={() => setShowConfirm(true)}>
        Erase All Data
      </button>

      <BottomSheet isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className={styles.confirmSheet}>
          <p className={styles.confirmMsg}>
            This will permanently delete all your transactions and reset settings.
          </p>
          <button className={`${styles.sheetBtn} ${styles.destructive}`} onClick={handleErase}>
            Erase Everything
          </button>
          <button className={styles.sheetBtn} onClick={() => setShowConfirm(false)}>Cancel</button>
        </div>
      </BottomSheet>
    </div>
  )
}
```

```css
/* src/screens/Settings/Settings.module.css */
.screen { display: flex; flex-direction: column; height: 100%; padding: 24px 16px; }
.title { font-size: 1.5rem; font-weight: 800; margin-bottom: 32px; }
.section { margin-bottom: 24px; }

.sectionLabel {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  font-weight: 600;
  margin-bottom: 10px;
}

.themeToggle {
  display: flex;
  background: var(--color-surface);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}

.themeOption {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.themeOption.active {
  background: var(--color-bg);
  color: var(--color-text);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.spacer { flex: 1; }

.eraseBtn {
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-red);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.confirmSheet { padding: 8px 16px; display: flex; flex-direction: column; gap: 8px; }

.confirmMsg {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  padding: 8px 0 12px;
  line-height: 1.5;
}

.sheetBtn {
  padding: 16px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  background: var(--color-surface);
  text-align: center;
}

.sheetBtn.destructive { color: var(--color-red); font-weight: 600; }
```

- [ ] **Step 2: Verify in browser** — change theme (applies instantly), erase data.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Settings/
git commit -m "feat: implement Settings screen"
```

---

## Chunk 5: PWA & iOS Polish

### Task 21: PWA icon and iOS meta tags

**Files:**
- Modify: `index.html`
- Add: `public/icon.png` (manual — user provides 512×512 PNG)

- [ ] **Step 1: Update index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Floos" />
    <meta name="theme-color" content="#10B981" />
    <link rel="apple-touch-icon" href="/icon.png" />
    <title>Floos</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create placeholder icon if needed**

If `public/icon.png` doesn't exist, create a placeholder 512×512 PNG using any tool. The app will run without it but PWA manifest will warn.

- [ ] **Step 3: Run all tests**

```bash
npm run test:run
```
Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
git add index.html public/
git commit -m "feat: add PWA meta tags and iOS home screen support"
```

---

### Task 22: Final polish pass

- [ ] **Step 1: Run full test suite**

```bash
npm run test:run
```
All tests pass.

- [ ] **Step 2: Build and preview**

```bash
npm run build && npm run preview
```
Open `http://localhost:4173`, verify the app works end-to-end.

- [ ] **Step 3: Final commit if any changes**

```bash
git add -A
git commit -m "polish: final iOS and UX fixes"
```

---

## Test Coverage Summary

| Module | Tests |
|--------|-------|
| `storage.js` | 8 unit tests |
| `amountUtils.js` | 11 unit tests |
| `dateUtils.js` | 7 unit tests |
| `EntryForm.jsx` | 3 component tests |
| `Dashboard.jsx` | 2 component tests |
