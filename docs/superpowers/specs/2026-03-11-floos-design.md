# Floos — Expense & Income Tracker PWA
**Date:** 2026-03-11
**Currency:** Omani Riyal (OMR, 3 decimal places / fils)
**Platform:** iOS PWA (Vite + React)
**Storage:** localStorage only

---

## Overview

Floos is a personal finance tracker PWA optimized for iOS home screen use. It allows the user to quickly log income and expenses using a cash-register-style numpad, browse history grouped by day with full-text note search, and view a clean balance dashboard.

---

## Tech Stack

- **Framework:** React (via Vite)
- **PWA:** vite-plugin-pwa (handles service worker, iOS manifest, icons)
- **Styling:** CSS modules or plain CSS (no UI library)
- **Storage:** Two localStorage keys:
  - `floos_transactions` — JSON array of transaction objects
  - `floos_settings` — JSON object for app preferences
- **No backend, no authentication**

### localStorage Error Handling
If either key contains unparseable JSON (corruption, browser bug, storage quota error), the app treats it as empty/default and continues normally. No error toast or warning is shown. This is a deliberate tradeoff — no backup or recovery mechanism exists.

---

## Navigation

Bottom tab bar with 4 equal-width tabs (iOS safe area aware). The **Add tab is visually prominent** — it uses a filled circle icon or elevated pill style to stand out from the other three tabs.

**Default active tab on first launch (and every launch):** Dashboard (Tab 1).

| Tab | Position | Label | Screen |
|-----|----------|-------|--------|
| 1 | Left | Home | Dashboard |
| 2 | Center-left (prominent) | Add | Entry |
| 3 | Center-right | History | Transactions |
| 4 | Right | Settings | Settings |

---

## Color Conventions (used throughout)

- **Positive / Income:** Green (`#10B981`)
- **Negative / Expense:** Red/Orange (`#EF4444`)
- **Neutral:** Default body text color (inherits from active theme — no special color, just normal text)

These three terms — green, red, neutral — are used consistently in all screen descriptions below.

---

## Data Model

### Transactions (`floos_transactions`)
Stored as a JSON array. The `amount` field is a plain JSON number (e.g. `1.5`, not `"1.500"`); the UI always formats it to 3 decimal places on render. IDs are generated with `crypto.randomUUID()`.

```json
{
  "id": "crypto.randomUUID()",
  "type": "income" | "expense",
  "amount": 1.5,
  "category": "string",
  "note": "optional string, max 100 characters",
  "createdAt": "UTC ISO 8601 string, e.g. 2026-03-11T18:30:00.000Z"
}
```

`createdAt` is always stored as a UTC ISO 8601 string (`new Date().toISOString()`). All date display and grouping converts to the user's **local timezone** before extracting the date. `createdAt` is set once at creation and **never modified during edits**.

**Category values are scoped by type and enforced at the application layer:**
- Income categories: `Salary`, `Gift`, `Savings`, `Family`, `Other`
- Expense categories: `Fuel`, `Groceries`, `Snacks`, `Bills`, `Other`

Note: `Savings` is an income category representing a **withdrawal from a savings account into your spending wallet** (money coming in to your tracked balance).

### Settings (`floos_settings`)
```json
{
  "theme": "light" | "dark" | "system"
}
```
Default when key is absent or unparseable: `{ "theme": "system" }`.

All settings are held in React state (initialized from localStorage on mount). Components read from React state, never directly from localStorage. This ensures instant updates without re-reads.

---

## Screens

### 1. Entry Screen (Add Tab)

The primary interaction screen. Layout (top to bottom):

1. **Mode Toggle** — Pill-shaped segmented control: `Income | Expense`. Color shifts: green for income, red for expense. **When the mode is switched, the category selection is automatically cleared.**

2. **Amount Display** — Large centered amount, e.g. `0.000 OMR`. Neutral/ghost style at zero, fills to solid text color as digits are entered.
   - Fixed 3-decimal structure (OMR fils). The decimal point is always present and fixed.
   - Right-to-left fill: pressing 1→5→0 yields `0.150 OMR`
   - **Cap rule:** The input maintains a queue of up to 7 digit-presses. Each press of 0–9 adds one entry to the queue regardless of the resulting display value. Once 7 presses are queued, further digit presses are silently ignored. Backspace removes the last entry from the queue.
   - Example: pressing 0,0,0,0,0,0,1 fills the queue to 7 and displays `0.001`. The queue is full; further presses are ignored until the user backspaces. This is intentional — the user should backspace to correct mistakes.
   - Maximum displayable value: `9999.999 OMR`.

3. **Category Selector** — Horizontal scrollable row of pill chips. Categories shown depend on current mode. One must be selected to enable submission.

4. **Notes Field** — Optional single-line text input. Maximum 100 characters. Placeholder: "Add a note...".
   - When focused, the OS keyboard appears and the **custom numpad is hidden**.
   - When the notes field loses focus, the custom numpad reappears.

5. **Numpad** — Visible only when notes field is not focused. 3×4 grid, positions fixed:

   ```
   [ 1 ] [ 2 ] [ 3 ]
   [ 4 ] [ 5 ] [ 6 ]
   [ 7 ] [ 8 ] [ 9 ]
   [ ⌫ ] [ 0 ] [ ✓ ]
   ```

   - `⌫` = Backspace (removes last queued digit press)
   - `✓` = Confirm/Submit — filled, colored. **Disabled if:** amount is `0.000` OR no category is selected. Tapping while disabled is silently ignored (no haptic or visual feedback).

**On submit:** transaction saved to localStorage, amount resets to `0.000` (queue cleared), category deselects, note clears.

#### Edit Mode
Editing is initiated from the History screen. It opens as a **modal sheet presented on top of the History screen** — it does not navigate to or modify the Add tab's state.

- The sheet header reads "Edit Transaction" with a close (×) button.
- **Pre-filling the numpad queue:** convert the stored amount to its 3-decimal string representation (e.g. `1.5` → `"1.500"`), strip the decimal point to get the digit string (`"1500"`), and initialize the queue with those digits (`[1, 5, 0, 0]`). Backspace then removes from the right of this queue.
- The mode toggle and category are pre-filled with the existing transaction's values.
- **When the mode toggle is switched inside the edit modal, the category selection is automatically cleared.**
- The note field is pre-filled with the existing note (if any).
- The Submit button reads "Save Changes".
- `createdAt` is **never modified on save** — the transaction retains its original timestamp.
- On save: the existing transaction is updated in place by `id` in localStorage and React state. The modal dismisses and History refreshes.
- **Dismissal:** Tapping ×, tapping the backdrop, or swiping down dismisses the modal without saving. If the OS keyboard is open when the user swipes down, the first swipe dismisses the keyboard; a second swipe then dismisses the modal (standard iOS behavior).

---

### 2. History Screen

1. **Search bar** — Always visible at top. Filters by note text (case-insensitive).
   - Transactions with no note are **hidden** whenever the search bar contains any text. This is intentional.
   - Empty search bar shows all transactions.

2. **Transaction list** — Grouped by day. All grouping uses `createdAt` converted to the user's **local timezone**:
   - Date headers: "Today", "Yesterday", or formatted date (e.g. "March 8, 2026")
   - Each row is **fully tappable** (entire row is the touch target). Row shows: category label, note (secondary text with CSS `text-overflow: ellipsis`, only if present), amount (green for income / red for expense), time in **12-hour format** (e.g. "6:30 PM"), muted.

3. **Empty states:**
   - No transactions at all: centered message — "No transactions yet. Tap + to add one."
   - Search returns no results: centered message — "No results for '[query]'."

4. **Tap interaction** — Opens a **bottom sheet** with:
   - **Edit** — opens the Edit Mode modal (see above)
   - **Delete** — opens a second confirmation bottom sheet with a red "Delete" button and "Cancel". Swiping down or tapping the backdrop is equivalent to "Cancel". On confirm, transaction is removed from localStorage and the list refreshes. **The active search query is preserved** after deletion — the list re-filters with the existing query.

---

### 3. Dashboard Screen

All calculations use `createdAt` converted to the user's **local timezone**. "This Month" uses the current calendar month calculated via `new Date()` on each render (not cached).

Clean and minimal, top to bottom:

1. **Balance** — Large centered number. Label: "Balance".
   - Green if positive, red if negative, neutral if exactly zero.
   - All-time total: sum of all income minus sum of all expenses.

2. **This Month** — Two numbers side by side:
   - Left: current calendar month income total (green, labeled "Income")
   - Right: current calendar month expense total (red, labeled "Expenses")
   - If either is zero, display `0.000` in neutral color.

**First launch / no transactions:** Balance shows `0.000` neutral. Both monthly figures show `0.000` neutral.

---

### 4. Settings Screen

1. **Theme** — Light / Dark / System segmented control. Selection is read from and written to React state (which syncs to `floos_settings` in localStorage). Initial selection on mount reads from localStorage, defaulting to "System" if absent.

2. **Erase All Data** — Red destructive button at the bottom. Tapping opens an in-app confirmation bottom sheet (not a native `confirm()`) with a red "Erase Everything" button and "Cancel". Swiping down or tapping the backdrop is equivalent to "Cancel".

   On confirm:
   - Both `floos_transactions` and `floos_settings` are removed from localStorage.
   - React state is immediately updated: transactions reset to `[]`, theme reset to `"system"`. (Removing `floos_settings` is intentional for a clean reset, even though the absent-key default already handles it.)
   - The app reflects the system theme instantly without a reload. The Settings screen re-renders with "System" selected.
   - The service worker and its pre-cached assets are **not** cleared — only localStorage is affected.

---

## PWA / iOS Specifics

- `manifest.json`: `display: standalone`, `theme_color: "#10B981"` (green)
- Icon source: `public/icon.png`, 512×512 PNG. `vite-plugin-pwa` generates all required sizes.
- `apple-mobile-web-app-capable` meta tag
- Safe area insets via `env(safe-area-inset-*)` CSS (bottom tab bar, top notch/dynamic island)
- Offline-capable via service worker (all assets pre-cached, app works with no network)

---

## Out of Scope

- User accounts / cloud sync
- Multiple currencies
- Export / import
- Charts or visualizations
- Recurring transactions
- Budgeting / limits
- Search by category or amount
