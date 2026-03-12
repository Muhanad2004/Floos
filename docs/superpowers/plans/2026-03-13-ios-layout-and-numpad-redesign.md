# iOS Layout & Numpad Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the iOS PWA layout so it renders correctly on first load with no gap, and redesign the Entry screen so the numpad sits at the bottom of the screen for comfortable one-handed use.

**Architecture:** Replace all CSS height-calculation hacks (`100dvh`, `window.innerHeight`, `-webkit-fill-available`) with a single `position: fixed; inset: 0` on `#root` — the production-proven approach used by major iOS PWAs. Then restructure the Entry form so controls are compact at the top and the numpad is pinned to the bottom half of the screen where the thumb naturally reaches.

**Tech Stack:** React 18, CSS Modules, iOS PWA (`viewport-fit=cover`)

---

## Why the gap keeps happening

Every approach so far has tried to *calculate* the correct height:
- `100dvh` — not computed correctly on first iOS paint
- `window.innerHeight` — measured before safe areas are resolved
- `-webkit-fill-available` — inconsistent across iOS versions

`position: fixed; inset: 0` does not calculate — it **declares**. The browser places the element exactly at the screen edges. Safe areas are still inside this box and handled with `padding`. This is how the iOS App Store, Twitter/X, and Instagram Web work. It is reliable on first paint, every time.

---

## File Map

```
src/index.css                              ← simplify html/body, change #root to position:fixed
src/main.jsx                               ← remove window.innerHeight hack
src/App.module.css                         ← simplify .app; .main gets overflow:hidden
src/components/AmountDisplay/
  AmountDisplay.module.css                 ← reduce font from 3rem → 2rem (frees vertical space)
src/components/ModeToggle/
  ModeToggle.module.css                    ← tighten padding slightly
src/components/CategorySelector/
  CategorySelector.module.css              ← tighten padding slightly
src/components/EntryForm/
  EntryForm.module.css                     ← compact top, numpad pinned bottom via margin-top:auto
  EntryForm.jsx                            ← no structural change, just CSS classes
src/components/NumPad/
  NumPad.module.css                        ← fixed key height 52px, gap 6px, no height:100%
```

---

## Chunk 1: Root Layout Fix

### Task 1: Replace height hacks with `position: fixed; inset: 0`

**Files:**
- Modify: `src/index.css`
- Modify: `src/main.jsx`
- Modify: `src/App.module.css`

**How it works after this change:**
```
#root  → position: fixed; inset: 0   (covers entire screen, always, on first paint)
  .app → flex: 1; flex column        (fills #root)
    .main → flex: 1; overflow: hidden (fills between top padding and TabBar)
    TabBar → flex-shrink: 0; padding-bottom: env(safe-area-inset-bottom)
```

- [ ] **Step 1: Update `src/index.css`**

Replace the entire `html`, `body`, and `#root` blocks with:

```css
html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-text-size-adjust: 100%;
}

body {
  overscroll-behavior: none;
}

#root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top);
}
```

- [ ] **Step 2: Remove the JS height hack from `src/main.jsx`**

Delete these lines entirely:

```js
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}
setAppHeight()
window.addEventListener('resize', setAppHeight)
```

- [ ] **Step 3: Simplify `src/App.module.css`**

```css
/* src/App.module.css */
.app {
  display: flex;
  flex-direction: column;
  flex: 1;
  background: var(--color-bg);
  overflow: hidden;
}

.main {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run
```
Expected: all 39 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/main.jsx src/App.module.css
git commit -m "fix: use position:fixed inset:0 for root layout — eliminates iOS first-paint gap"
```

---

## Chunk 2: Compact Top Controls

The goal is to shrink the controls above the numpad so more screen height is available for the numpad to sit lower. Each control only needs a small reduction — together they free ~60–80px.

### Task 2: Shrink AmountDisplay font

**Files:**
- Modify: `src/components/AmountDisplay/AmountDisplay.module.css`

Current: `font-size: 3rem` (≈ 48px tall). Target: `2rem` (≈ 32px). Still clearly readable, saves ~16px.

- [ ] **Step 1: Update AmountDisplay CSS**

```css
/* src/components/AmountDisplay/AmountDisplay.module.css */
.display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
}

.amount {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  transition: color 0.15s;
}

.currency {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.ghost .amount { color: var(--color-text-ghost); }
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```
Expected: 39 pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/AmountDisplay/AmountDisplay.module.css
git commit -m "design: reduce amount display font size to free vertical space for numpad"
```

---

### Task 3: Tighten ModeToggle and CategorySelector padding

**Files:**
- Modify: `src/components/ModeToggle/ModeToggle.module.css`
- Modify: `src/components/CategorySelector/CategorySelector.module.css`

- [ ] **Step 1: Update ModeToggle CSS**

Reduce option padding from `6px 24px` → `5px 20px`:

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
  padding: 5px 20px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
  color: var(--color-text-muted);
}

.income .option.selected { background: var(--color-green); color: white; }
.expense .option.selected { background: var(--color-red); color: white; }
```

- [ ] **Step 2: Update CategorySelector CSS**

Reduce chip padding from `8px 16px` → `6px 14px`:

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
  padding: 6px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--color-border);
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  transition: all 0.15s;
  white-space: nowrap;
}

.chip.income.selected { background: var(--color-green); border-color: var(--color-green); color: white; }
.chip.expense.selected { background: var(--color-red); border-color: var(--color-red); color: white; }
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```
Expected: 39 pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ModeToggle/ModeToggle.module.css src/components/CategorySelector/CategorySelector.module.css
git commit -m "design: tighten toggle and category chip padding for compact entry layout"
```

---

## Chunk 3: Numpad at the Bottom

The numpad should:
1. Have **fixed key height** (52px) — enough for a comfortable tap target, but not oversized
2. Sit at the **bottom** of the entry form via `margin-top: auto` on the wrapper
3. Have **bottom padding** that respects the safe area so keys aren't behind the home indicator

### Task 4: Redesign EntryForm layout and NumPad sizing

**Files:**
- Modify: `src/components/EntryForm/EntryForm.module.css`
- Modify: `src/components/NumPad/NumPad.module.css`

**Layout after this change:**
```
.form (flex column, height: 100%)
  ModeToggle         ← natural height ~34px
  amountWrap         ← natural height ~32px
  CategorySelector   ← natural height ~36px
  notesWrap          ← natural height ~44px
  numPadWrap         ← margin-top: auto; pushes to bottom
    NumPad grid      ← 4 rows × 52px + gaps = ~240px total
                        padding-bottom: env(safe-area-inset-bottom)
```

- [ ] **Step 1: Update EntryForm CSS**

```css
/* src/components/EntryForm/EntryForm.module.css */
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0 0;
  height: 100%;
  overflow: hidden;
}

.amountWrap { padding: 0 16px; }
.notesWrap { padding: 0 16px; }

.notesInput {
  width: 100%;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s;
}

.notesInput:focus { border-color: var(--color-green); }

.numPadWrap {
  margin-top: auto;
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 2: Update NumPad CSS**

Keys get a fixed `52px` height. No more `height: 100%` on the grid — it's now a fixed-size block that sits at the bottom.

```css
/* src/components/NumPad/NumPad.module.css */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 0 16px 8px;
}

.key {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: 12px;
  background: var(--color-surface);
  font-size: 1.3rem;
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

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```
Expected: 39 pass.

- [ ] **Step 4: Build to verify no errors**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/EntryForm/EntryForm.module.css src/components/NumPad/NumPad.module.css
git commit -m "design: pin numpad to bottom of entry screen with fixed 52px key height"
```

- [ ] **Step 6: Push**

```bash
git push
```

---

## Expected result on device

On iPhone (e.g. 390×844, safe-area-top 59px, safe-area-bottom 34px):

| Region | Height |
|---|---|
| Status bar (safe area) | 59px (via `padding-top` on `#root`) |
| Top controls | ~150px (toggle + amount + categories + notes + gaps) |
| Empty space (breathing room) | ~240px |
| NumPad (4 rows × 52px + gaps) | ~242px |
| TabBar + home indicator | ~90px |
| **Total** | **781px ≈ 844 − 59 ≈ correct** |

The numpad sits in the bottom third of the screen — exactly where the thumb rests when holding the phone with one hand.
