# Category Picker Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the horizontal-scrolling category chip strip with a 50/50 two-button row — left opens a BottomSheet picker, right toggles income/expense.

**Architecture:** Delete `CategorySelector` and inline category rendering inside EntryForm's BottomSheet. The `categoryRow` becomes a true flex row with two equal-width halves: a `CategoryPickerButton` on the left and the existing mode toggle on the right. The BottomSheet renders category chips in a wrapping grid.

**Tech Stack:** React 19, CSS Modules, Lucide React (ChevronUp icon), existing BottomSheet component.

---

## Current layout (for reference)

```
[ chip  chip  chip  chip → scroll ] | [ Income/Expense ]
```

## Target layout

```
[ ⌃  Groceries (or "Category")    ] [ Income/Expense  ]
         ↓ tap
   BottomSheet slides up:
   [ Groceries ] [ Dining ] [ Snacks ]
   [ Bills    ] [ Phone  ] [ Shopping ]
   ...
```

---

## Files

| Action | Path |
|--------|------|
| Modify | `src/components/EntryForm/EntryForm.jsx` |
| Modify | `src/components/EntryForm/EntryForm.module.css` |
| Delete | `src/components/CategorySelector/CategorySelector.jsx` |
| Delete | `src/components/CategorySelector/CategorySelector.module.css` |

---

## Task 1: Wire up the BottomSheet in EntryForm

**Files:**
- Modify: `src/components/EntryForm/EntryForm.jsx`

- [ ] **Step 1: Add `sheetOpen` state and BottomSheet import**

Open `src/components/EntryForm/EntryForm.jsx`. Add these imports at the top:

```jsx
import { ChevronUp } from 'lucide-react'
import BottomSheet from '../BottomSheet/BottomSheet'
import { getCategoriesForType } from '../../constants/categories'
```

Add state inside the component (after the existing `useState` calls):

```jsx
const [sheetOpen, setSheetOpen] = useState(false)
```

- [ ] **Step 2: Replace the `categoryRow` JSX**

Find this block:

```jsx
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
```

Replace it with:

```jsx
<div className={styles.categoryRow}>
  <button
    className={`${styles.categoryPickerBtn} ${category ? styles[mode] : ''}`}
    onClick={() => setSheetOpen(true)}
  >
    <ChevronUp size={16} strokeWidth={2} />
    <span>{category ?? 'Category'}</span>
  </button>
  <button
    className={`${styles.modeBtn} ${styles[mode]}`}
    onClick={handleModeToggle}
  >
    {mode === 'income' ? 'Income' : 'Expense'}
  </button>
</div>

<BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
  <div className={styles.sheetContent}>
    <p className={styles.sheetTitle}>Category</p>
    <div className={styles.sheetGrid}>
      {getCategoriesForType(mode).map(cat => (
        <button
          key={cat}
          className={`${styles.sheetChip} ${styles[mode]} ${category === cat ? styles.selected : ''}`}
          onClick={() => { setCategory(cat); setSheetOpen(false) }}
        >
          {cat}
        </button>
      ))}
    </div>
  </div>
</BottomSheet>
```

- [ ] **Step 3: Remove the old CategorySelector import**

Delete this line from the imports:

```jsx
import CategorySelector from '../CategorySelector/CategorySelector'
```

- [ ] **Step 4: Verify the app renders without crashing**

Run `npm run dev` and open the Entry tab. The row should show two buttons side-by-side. Tapping the left opens a sheet. No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/EntryForm/EntryForm.jsx
git commit -m "feat: replace category scroll with picker button + BottomSheet"
```

---

## Task 2: Style the new row and BottomSheet

**Files:**
- Modify: `src/components/EntryForm/EntryForm.module.css`

- [ ] **Step 1: Restyle `.categoryRow` to a 50/50 split**

Find the existing `.categoryRow`, `.categoryScroll`, `.modeDivider`, and `.modeBtn` blocks. Replace them entirely with:

```css
/* Category row — two equal halves */
.categoryRow {
  display: flex;
  align-items: stretch;
  padding: 8px 16px 10px;
  gap: 8px;
}

/* Left: category picker button */
.categoryPickerBtn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--color-border);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  transition: all 0.15s;
}

.categoryPickerBtn.income {
  background: var(--color-green);
  border-color: var(--color-green);
  color: white;
}

.categoryPickerBtn.expense {
  background: var(--color-red);
  border-color: var(--color-red);
  color: white;
}

/* Right: mode toggle button */
.modeBtn {
  flex: 1;
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
}

.modeBtn.income {
  background: var(--color-green);
  color: white;
}

.modeBtn.expense {
  background: var(--color-red);
  color: white;
}

/* BottomSheet content */
.sheetContent {
  padding: 0 16px 8px;
}

.sheetTitle {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 14px;
}

.sheetGrid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sheetChip {
  padding: 9px 18px;
  border-radius: 999px;
  border: 1.5px solid var(--color-border);
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  transition: all 0.15s;
  white-space: nowrap;
}

.sheetChip.income.selected {
  background: var(--color-green);
  border-color: var(--color-green);
  color: white;
}

.sheetChip.expense.selected {
  background: var(--color-red);
  border-color: var(--color-red);
  color: white;
}
```

- [ ] **Step 2: Verify visual appearance**

Run `npm run dev`. Check:
- Both buttons are the same width (50/50)
- Left button shows ChevronUp + "Category" when nothing selected
- Left button turns green/red and shows category name when one is selected
- Mode toggle button is unchanged in appearance
- BottomSheet shows a wrapping grid of chips, correct color highlighting on selected chip

- [ ] **Step 3: Commit**

```bash
git add src/components/EntryForm/EntryForm.module.css
git commit -m "style: 50/50 category picker row and BottomSheet chip grid"
```

---

## Task 3: Clean up CategorySelector

**Files:**
- Delete: `src/components/CategorySelector/CategorySelector.jsx`
- Delete: `src/components/CategorySelector/CategorySelector.module.css`

- [ ] **Step 1: Confirm CategorySelector is no longer imported anywhere**

```bash
grep -r "CategorySelector" src/
```

Expected: no results (only the files themselves).

- [ ] **Step 2: Delete the files**

```bash
rm src/components/CategorySelector/CategorySelector.jsx
rm src/components/CategorySelector/CategorySelector.module.css
rmdir src/components/CategorySelector
```

- [ ] **Step 3: Run tests to confirm nothing broke**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove CategorySelector (replaced by inline BottomSheet picker)"
```
