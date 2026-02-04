# Expense Tracker PWA - Standard Operating Procedure (SOP)

## Project Overview
Build a lightweight Progressive Web App (PWA) for tracking income and expenses in Omani Riyals (OMR) using vanilla JavaScript, CSS3, and IndexedDB. The app must be simple, fast, and fully functional offline.

**Primary Target Platform:** iOS (iPhone/iPad) as PWA installed via Safari

### Currency Specifications
- **Primary Currency**: Omani Riyal (OMR)
- **Currency Symbol**: ر.ع. (or "OMR" for compatibility)
- **Subdivisions**: 1 Riyal = 1000 Baisa
- **Decimal Places**: 3 (e.g., 1.500 OMR = 1 Riyal and 500 Baisa)
- **Display Format**: "ر.ع. X,XXX.XXX" or "OMR X,XXX.XXX"
- **Input Format**: Accept up to 3 decimal places
- **Minimum Value**: 0.001 OMR (1 Baisa)

### iOS PWA Considerations
- Optimized for Safari/WebKit rendering
- Safe area insets for notched devices (iPhone X and later)
- Home screen icon and splash screens
- Standalone display mode (no browser chrome)
- iOS-specific touch gestures and interactions
- Keyboard behavior and input handling
- Status bar styling
- Prevent zoom and overscroll
- Haptic feedback where appropriate

---

## Tech Stack Requirements

### Core Technologies
- **HTML5** - Semantic markup
- **Vanilla JavaScript** (ES6+) - No frameworks
- **CSS3** - Custom properties for theming
- **IndexedDB** - Local data storage
- **Service Workers** - PWA functionality and offline support
- **Web App Manifest** - App installability

### External Libraries (Minimal)
- **jsPDF** (~150KB) - PDF generation
- **jspdf-autotable** - Table formatting for PDFs
- Both should be loaded from CDN or bundled in final build

---

## File Structure

```
/
├── index.html
├── manifest.json
├── sw.js
├── css/
│   └── styles.css
├── js/
│   ├── app.js          # Main application logic
│   ├── db.js           # IndexedDB operations
│   ├── pdf.js          # PDF export functionality
│   └── ui.js           # UI state management
└── icons/
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-120x120.png      # iPhone non-retina
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-167x167.png      # iPad Pro
    ├── icon-180x180.png      # iPhone retina (apple-touch-icon)
    ├── icon-192x192.png
    ├── icon-384x384.png
    ├── icon-512x512.png
    └── splash/               # iOS splash screens
        ├── splash-640x1136.png   # iPhone SE, 5s
        ├── splash-750x1334.png   # iPhone 8, 7, 6s
        ├── splash-1125x2436.png  # iPhone X, XS, 11 Pro
        ├── splash-1242x2208.png  # iPhone 8+, 7+, 6s+
        ├── splash-1242x2688.png  # iPhone XS Max, 11 Pro Max
        ├── splash-828x1792.png   # iPhone 11, XR
        ├── splash-1170x2532.png  # iPhone 12/13/14 Pro
        ├── splash-1284x2778.png  # iPhone 14 Pro Max
        ├── splash-1536x2048.png  # iPad Mini, Air
        └── splash-2048x2732.png  # iPad Pro 12.9"
```

## iOS PWA Configuration

### HTML Meta Tags (Required for iOS)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no">
  
  <!-- iOS PWA Meta Tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Floos">
  
  <!-- Theme Color -->
  <meta name="theme-color" content="#3B82F6" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0F172A" media="(prefers-color-scheme: dark)">
  
  <!-- Apple Touch Icon -->
  <link rel="apple-touch-icon" href="/icons/icon-180x180.png">
  
  <!-- iOS Splash Screens (abbreviated - see full list in documentation) -->
  <link rel="apple-touch-startup-image" href="/icons/splash/splash-1170x2532.png">
  
  <link rel="manifest" href="/manifest.json">
  <title>Floos</title>
</head>
```

### iOS Safe Area & Touch Optimizations

```css
/* Safe area insets for notched devices */
:root {
  --sat: env(safe-area-inset-top);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
  --sar: env(safe-area-inset-right);
}

/* Prevent iOS zoom on input focus */
input, select, textarea { font-size: 16px; }

/* Smooth iOS scrolling */
#app-container {
  -webkit-overflow-scrolling: touch;
  height: 100vh;
  overflow-y: auto;
}

/* Hardware acceleration */
.animate {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

/* Disable text selection except inputs */
* { -webkit-touch-callout: none; -webkit-user-select: none; }
input, textarea { -webkit-user-select: text; user-select: text; }
```

### iOS Keyboard & Gesture Handling

```javascript
// Keyboard appearance handling
window.visualViewport?.addEventListener('resize', () => {
  const vh = window.visualViewport.height;
  document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
});

// Swipe gesture for delete
function enableSwipeToDelete(element) {
  let startX = 0;
  element.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  element.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (diff > 100) showDeleteButton(element);
  });
}

// Optional haptic feedback
function haptic(type = 'light') {
  navigator.vibrate?.([10, 20, 30][['light','medium','heavy'].indexOf(type)] || 10);
}
```


---

## Data Model

### Transaction Object Structure
```javascript
{
  id: timestamp_unique_id,          // Primary key
  amount: number,                   // Transaction amount in OMR (positive, 3 decimals)
  type: "income" | "expense",       // Transaction type
  category: string,                 // Dynamic based on type
  note: string | null,              // Optional description
  date: ISO8601_string,             // Full date and time
  createdAt: timestamp,             // For sorting
}
```

**Amount Storage Notes:**
- Store as number with 3 decimal precision
- Example: 15.250 OMR (15 Riyals and 250 Baisa)
- Always validate to 3 decimal places maximum
- Display with proper OMR formatting

### Categories Configuration
```javascript
const CATEGORIES = {
  income: ["Salary", "Gift", "Freelance", "Other"],
  expense: ["Groceries", "Snacks", "Laundromat", "Barber", "Fuel", "Other"]
};
```

### IndexedDB Schema
- **Database Name**: `FlooExpenseTracker`
- **Version**: 1
- **Object Store**: `transactions`
  - **keyPath**: `id`
  - **Indexes**:
    - `date` (for time-based queries)
    - `type` (for filtering income/expense)
    - `category` (for category breakdowns)

---

## UI/UX Specifications

### 1. Initial Screen (Entry Form Modal)

**On App Load:**
- Display modal/overlay with entry form
- Form should be centered and prominent
- Background should show blurred/darkened dashboard

**Entry Form Components:**
1. **Amount Input**
   - Type: `number`
   - Placeholder: "0.000" or "Enter amount in OMR"
   - Required field
   - Autofocus on load
   - Accept decimal values (3 decimal places for Baisa precision)
   - Step: 0.001 (smallest unit = 1 Baisa)
   - Pattern: Allow only numbers and one decimal point
   - Visual prefix/suffix: Show "ر.ع." label or symbol

2. **Type Toggle Switch**
   - Default: "Expense"
   - Options: "Expense" | "Income"
   - Visual indicator (color change)
   - Switches category dropdown dynamically

3. **Category Dropdown**
   - Dynamically populated based on type selection
   - When type = "expense": Show expense categories
   - When type = "income": Show income categories
   - Default selection: First category in list

4. **Note Field (Optional)**
   - Type: `textarea`
   - Placeholder: "Add note (optional)"
   - Max length: 200 characters
   - Not required

5. **Date/Time Display**
   - Auto-populated with current date and time
   - Format: "DD MMM YYYY, HH:MM" (e.g., "04 Feb 2026, 14:30")
   - Read-only display (not editable during creation)

6. **Action Buttons**
   - **Save Button**: Submit transaction
   - **Close/Cancel Button**: Close modal and show dashboard

**Form Behavior:**
- Validate amount > 0 before submission
- Clear form after successful save
- Show success feedback (brief animation/message)
- Auto-close modal after save OR keep open based on user preference (add setting)

---

### 2. Dashboard View

**Layout Structure:**

#### Top Section: Summary Card
- **Current Balance**
  - Large, prominent display
  - Calculation: Total Income - Total Expenses
  - Color coded: Green (positive), Red (negative), Gray (zero)
  - Format: "ر.ع. X,XXX.XXX" (3 decimal places)
  - Example: "ر.ع. 1,250.500"
  - Arabic numeral support optional

- **Quick Stats Row**
  - Total Income (current filter period)
  - Total Expenses (current filter period)
  - Number of transactions

#### Time Filter Bar
- **Filter Options**: All Time | Today | This Week | This Month | Custom Range
- Default: "All Time"
- Applies to both transaction list and summary calculations
- Highlight active filter

#### Transaction List (Scrollable)
- **Display Properties:**
  - Newest first (sort by `createdAt` DESC)
  - Infinite scroll or paginated (recommend infinite scroll)
  - Empty state message when no transactions

- **Transaction Card Layout:**
  ```
  [Category Icon] Category Name          ±Amount
  Note (if exists)                    Date/Time
  ```

- **Visual Distinctions:**
  - **Income**: Green amount text (e.g., `+ر.ع. 500.000`)
  - **Expense**: Red amount text (e.g., `-ر.ع. 50.250`)
  - Amount always shows sign (+ or -)
  - Always show 3 decimal places for consistency
  - Font weight: Bold for amount
  - Subtle separator between cards

- **Interaction:**
  - Tap/click on transaction card to open edit modal
  - Swipe gesture for quick delete (optional, mobile-friendly)

#### Floating Action Button (FAB)
- Position: Bottom right corner
- Icon: "+" symbol
- Action: Opens entry form modal
- Always visible while scrolling

---

### 3. Edit Transaction Modal

**Triggered by:** Clicking on any transaction in the list

**Form Fields:**
1. Amount (editable)
2. Type toggle (editable - triggers category change)
3. Category dropdown (editable, dynamic)
4. Note (editable)
5. **Date/Time Picker** (editable - unlike creation)
   - Allow manual date/time selection
   - Default to current transaction's date/time

**Action Buttons:**
- **Update**: Save changes
- **Delete**: Remove transaction (with confirmation)
- **Cancel**: Close without changes

**Delete Confirmation:**
- Show inline confirmation: "Are you sure you want to delete this transaction?"
- Options: "Delete" (destructive color) | "Cancel"

---

### 4. Settings Page

**Access:** Gear icon in header or hamburger menu

**Settings Options:**

1. **Theme**
   - Light Mode / Dark Mode toggle
   - Persist preference in localStorage
   - Apply immediately on change

2. **Data Management**
   - **Export Data (JSON)**
     - Button: "Export to JSON"
     - Downloads: `floos_backup_YYYYMMDD.json`
     - Contains all transactions
   
   - **Import Data (JSON)**
     - Button: "Import from JSON"
     - File picker for .json files
     - Validates structure before import
     - Option: Merge or Replace existing data
     - Show preview of import data
   
   - **Export PDF Report**
     - Button: "Generate PDF Report"
     - Creates comprehensive report (see PDF section)
   
   - **Clear All Data**
     - Button: "Clear All Data" (RED/Destructive styling)
     - **Two-step confirmation:**
       1. Warning modal: "This will delete ALL transactions permanently. This cannot be undone."
       2. Confirmation input: Type "DELETE" to confirm
     - Only proceed if confirmation matches exactly
     - Clear IndexedDB + localStorage + cache

3. **App Info**
   - Version number (e.g., "v1.0.0")
   - Last updated date
   - Offline/Online status indicator (live)

4. **About**
   - Brief description
   - Developer credits (optional)

---

## PDF Export Specifications

### File Naming Convention
- Format: `Floos_[StartDate]_[EndDate].pdf`
- Date format: `MMMDD` (e.g., `Jan20`, `Feb10`)
- Example: `Floos_Jan20_Feb10.pdf`
- If only one transaction: `Floos_Feb04.pdf`
- All-time with multiple dates: Use earliest to latest

### PDF Content Structure

**Page 1: Summary Report**

1. **Header**
   - Title: "Floos Expense Report"
   - Date range: "January 20, 2026 - February 10, 2026"
   - Generated on: Current date/time

2. **Balance Summary**
   - Total Income: ر.ع. X,XXX.XXX
   - Total Expenses: ر.ع. X,XXX.XXX
   - Net Balance: ر.ع. X,XXX.XXX (green if positive, red if negative)
   - All amounts with 3 decimal places

3. **Category Breakdown**
   
   **Income by Category:**
   - Table format:
     ```
     Category    | Amount          | % of Total Income
     ------------|-----------------|------------------
     Salary      | ر.ع. 5,000.000  | 83.3%
     Freelance   | ر.ع. 1,000.000  | 16.7%
     ------------|-----------------|------------------
     Total       | ر.ع. 6,000.000  | 100%
     ```
   
   **Expenses by Category:**
   - Same table format as above

4. **Full Transaction List**
   - Table format:
     ```
     Date       | Type    | Category    | Amount             | Note
     -----------|---------|-------------|--------------------|-------------
     Feb 10     | Expense | Groceries   | -ر.ع. 50.250       | Weekly shop
     Feb 09     | Income  | Salary      | +ر.ع. 2,500.000    | Monthly pay
     ```
   - Sort: Newest first
   - Color coding: Green text for income, Red for expense
   - Include all fields except internal IDs
   - Always show 3 decimal places

**Styling:**
- Professional, clean layout
- Use tables with borders
- Consistent fonts (sans-serif)
- Adequate padding and margins
- Page numbers if multiple pages

---

## Service Worker Implementation

### Caching Strategy

**Static Assets (Cache First):**
- HTML files
- CSS files
- JavaScript files
- Icons/images
- Fonts (if any)

**Dynamic Content (Network First, Cache Fallback):**
- Any future API calls
- CDN resources (jsPDF)

**Cache Versioning:**
```javascript
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `floos-cache-${CACHE_VERSION}`;
```

**Update Strategy:**
- On new version, delete old caches
- Re-cache all static assets
- Show update notification to user

### Offline Functionality
- All core features work offline (add, edit, delete, view)
- PDF generation works offline if library is cached
- Show offline indicator in UI
- Queue sync operations if future API integration

---

## Theme System

### Design Philosophy

**Core Principles:**
- **Minimalism**: Clean, uncluttered interface with focus on functionality
- **Clarity**: Information hierarchy that makes data easy to scan
- **Efficiency**: Fast interactions, minimal clicks to accomplish tasks
- **Trust**: Professional appearance that instills confidence in financial tracking
- **Accessibility**: Readable, comfortable for extended use

**Visual Language:**
- Modern, flat design (no skeuomorphism)
- Generous white space (breathing room)
- Subtle shadows for depth (elevation system)
- Smooth, purposeful animations (200-300ms)
- Consistent spacing using 8px grid system

---

### Typography

**Font Family:**
- Primary: System font stack for performance
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
               "Helvetica Neue", Arial, sans-serif;
  ```
- Alternative: "Inter" or "DM Sans" from Google Fonts (if loaded)
- Arabic text support: Include "Noto Sans Arabic" for proper ر.ع. rendering

**Type Scale:**
```css
--font-size-xs: 12px     /* Labels, captions */
--font-size-sm: 14px     /* Body text, secondary info */
--font-size-base: 16px   /* Main body text */
--font-size-lg: 20px     /* Section headings */
--font-size-xl: 24px     /* Card titles */
--font-size-2xl: 32px    /* Balance display */
--font-size-3xl: 48px    /* Hero numbers (optional) */
```

**Font Weights:**
```css
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

**Line Heights:**
```css
--line-height-tight: 1.2   /* Headings */
--line-height-normal: 1.5  /* Body text */
--line-height-relaxed: 1.7 /* Long-form content */
```

---

### Color System

#### Light Mode Palette
```css
/* Backgrounds */
--bg-primary: #FFFFFF        /* Main background */
--bg-secondary: #F8F9FA      /* Cards, panels */
--bg-tertiary: #F1F3F5       /* Hover states, subtle backgrounds */
--bg-overlay: rgba(0,0,0,0.5) /* Modal backdrop */

/* Text */
--text-primary: #212529      /* Main text, high emphasis */
--text-secondary: #6C757D    /* Supporting text, medium emphasis */
--text-tertiary: #ADB5BD     /* Disabled text, low emphasis */
--text-inverse: #FFFFFF      /* Text on dark backgrounds */

/* Semantic Colors */
--income-color: #10B981      /* Green - positive, income */
--income-hover: #059669      /* Darker green for hover */
--income-light: #D1FAE5      /* Light green background */

--expense-color: #EF4444     /* Red - negative, expense */
--expense-hover: #DC2626     /* Darker red for hover */
--expense-light: #FEE2E2     /* Light red background */

--accent-color: #3B82F6      /* Blue - primary actions */
--accent-hover: #2563EB      /* Darker blue for hover */
--accent-light: #DBEAFE      /* Light blue background */

--warning-color: #F59E0B     /* Orange - warnings, offline status */
--warning-light: #FEF3C7

--success-color: #10B981     /* Success messages */
--error-color: #EF4444       /* Error messages */

/* Borders & Dividers */
--border-color: #E5E7EB
--border-strong: #D1D5DB
--divider-color: #F3F4F6

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

#### Dark Mode Palette
```css
/* Backgrounds */
--bg-primary: #0F172A        /* Main background (slate-900) */
--bg-secondary: #1E293B      /* Cards, panels (slate-800) */
--bg-tertiary: #334155       /* Hover states (slate-700) */
--bg-overlay: rgba(0,0,0,0.7)

/* Text */
--text-primary: #F1F5F9      /* Main text (slate-100) */
--text-secondary: #94A3B8    /* Supporting text (slate-400) */
--text-tertiary: #64748B     /* Disabled text (slate-500) */
--text-inverse: #0F172A      /* Text on light backgrounds */

/* Semantic Colors (adjusted for dark mode) */
--income-color: #34D399      /* Lighter green for contrast */
--income-hover: #10B981
--income-light: #064E3B      /* Dark green background */

--expense-color: #F87171     /* Lighter red for contrast */
--expense-hover: #EF4444
--expense-light: #7F1D1D     /* Dark red background */

--accent-color: #60A5FA      /* Lighter blue */
--accent-hover: #3B82F6
--accent-light: #1E3A8A      /* Dark blue background */

--warning-color: #FBBF24     /* Lighter orange */
--warning-light: #78350F

--success-color: #34D399
--error-color: #F87171

/* Borders & Dividers */
--border-color: #334155
--border-strong: #475569
--divider-color: #1E293B

/* Shadows (more subtle in dark mode) */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5)
```

---

### Spacing System (8px Grid)

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
```

**Usage Guidelines:**
- Component padding: Use md (16px) as default
- Section spacing: Use lg-xl (24-32px)
- Inline spacing: Use sm (8px)
- Form field gaps: Use md (16px)

---

### Border Radius System

```css
--radius-sm: 4px    /* Buttons, small elements */
--radius-md: 8px    /* Cards, inputs */
--radius-lg: 12px   /* Modals, large cards */
--radius-xl: 16px   /* Hero sections */
--radius-full: 9999px /* Circular elements, pills */
```

---

### Component-Specific Design

#### Buttons

**Primary Button (Save, Add):**
```css
background: var(--accent-color)
color: var(--text-inverse)
padding: 12px 24px
border-radius: var(--radius-md)
font-weight: var(--font-weight-medium)
box-shadow: var(--shadow-sm)
transition: all 200ms ease

hover:
  background: var(--accent-hover)
  box-shadow: var(--shadow-md)
  transform: translateY(-1px)

active:
  transform: translateY(0)
  box-shadow: var(--shadow-sm)
```

**Secondary Button (Cancel):**
```css
background: transparent
color: var(--text-secondary)
border: 1px solid var(--border-color)
padding: 12px 24px
border-radius: var(--radius-md)

hover:
  background: var(--bg-tertiary)
  border-color: var(--border-strong)
```

**Destructive Button (Delete):**
```css
background: var(--expense-color)
color: white
/* Same dimensions as primary */

hover:
  background: var(--expense-hover)
```

**FAB (Floating Action Button):**
```css
width: 56px
height: 56px
border-radius: var(--radius-full)
background: var(--accent-color)
color: white
box-shadow: var(--shadow-lg)
position: fixed
bottom: 24px
right: 24px
display: flex
align-items: center
justify-content: center
font-size: 24px

hover:
  box-shadow: var(--shadow-xl)
  transform: scale(1.05)
```

---

#### Cards & Containers

**Transaction Card:**
```css
background: var(--bg-secondary)
border-radius: var(--radius-md)
padding: var(--spacing-md)
margin-bottom: var(--spacing-sm)
border: 1px solid var(--border-color)
transition: all 150ms ease

hover:
  border-color: var(--border-strong)
  box-shadow: var(--shadow-sm)
  cursor: pointer
```

**Summary Card:**
```css
background: var(--bg-secondary)
border-radius: var(--radius-lg)
padding: var(--spacing-xl)
box-shadow: var(--shadow-md)
border: 1px solid var(--border-color)
```

**Modal/Dialog:**
```css
background: var(--bg-primary)
border-radius: var(--radius-lg)
padding: var(--spacing-xl)
max-width: 500px
box-shadow: var(--shadow-xl)
animation: modal-appear 200ms ease
```

---

#### Form Elements

**Input Field:**
```css
background: var(--bg-primary)
border: 1px solid var(--border-color)
border-radius: var(--radius-md)
padding: 12px 16px
font-size: var(--font-size-base)
color: var(--text-primary)
transition: border-color 150ms ease

focus:
  outline: none
  border-color: var(--accent-color)
  box-shadow: 0 0 0 3px var(--accent-light)

error:
  border-color: var(--error-color)
```

**Toggle Switch (Income/Expense):**
```css
/* Track */
width: 200px
height: 40px
border-radius: var(--radius-full)
background: var(--bg-tertiary)
position: relative
display: flex

/* Options */
flex: 1
text-align: center
padding: 8px
z-index: 2
font-weight: var(--font-weight-medium)
color: var(--text-secondary)
transition: color 200ms ease

/* Slider */
position: absolute
width: 50%
height: 100%
border-radius: var(--radius-full)
background: var(--expense-color) /* default */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1)

/* When income selected */
background: var(--income-color)
transform: translateX(100%)
```

**Dropdown/Select:**
```css
/* Same as input field with dropdown icon */
appearance: none
background-image: url('data:image/svg+xml...') /* down chevron */
background-position: right 12px center
background-repeat: no-repeat
padding-right: 40px
```

---

#### Status Indicators

**Online/Offline Badge:**
```css
display: inline-flex
align-items: center
gap: var(--spacing-xs)
padding: 4px 12px
border-radius: var(--radius-full)
font-size: var(--font-size-xs)
font-weight: var(--font-weight-medium)

/* Online */
background: var(--success-light)
color: var(--success-color)

/* Offline */
background: var(--warning-light)
color: var(--warning-color)

/* Dot indicator */
width: 6px
height: 6px
border-radius: 50%
background: currentColor
animation: pulse 2s infinite
```

**Version Badge:**
```css
font-size: var(--font-size-xs)
color: var(--text-tertiary)
padding: 2px 8px
background: var(--bg-tertiary)
border-radius: var(--radius-sm)
```

---

#### Animations

**Modal Appear:**
```css
@keyframes modal-appear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

**Toast Slide In:**
```css
@keyframes toast-slide {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Pulse (for status dot):**
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

**Loading Spinner:**
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

### Layout Guidelines

**Container Max Width:**
- Mobile: 100% (with 16px padding)
- Tablet: 768px
- Desktop: 1024px (centered)

**Header:**
```css
height: 64px
background: var(--bg-primary)
border-bottom: 1px solid var(--border-color)
box-shadow: var(--shadow-sm)
display: flex
align-items: center
justify-content: space-between
padding: 0 var(--spacing-lg)
position: sticky
top: 0
z-index: 100
```

**Main Content Area:**
```css
padding: var(--spacing-lg)
max-width: 1024px
margin: 0 auto
```

**Bottom Navigation (Mobile):**
```css
height: 64px
background: var(--bg-primary)
border-top: 1px solid var(--border-color)
position: fixed
bottom: 0
width: 100%
display: flex
justify-content: space-around
z-index: 100
```

---

### Micro-interactions

**Button Press:**
- Scale down slightly (0.98) on active state
- Subtle shadow reduction
- 100ms transition

**Card Tap:**
- Slight elevation increase
- Border color intensifies
- 150ms transition

**Toggle Switch:**
- Smooth sliding animation (300ms cubic-bezier)
- Color fade transition
- Haptic feedback (if supported)

**Input Focus:**
- Border color change
- Subtle glow effect (box-shadow)
- 150ms transition

**List Item Delete (Swipe):**
- Reveal delete button on swipe
- Fade out item on confirm
- 200ms transition

---

### Responsive Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 480px   /* Small phones */
--breakpoint-md: 768px   /* Tablets */
--breakpoint-lg: 1024px  /* Small laptops */
--breakpoint-xl: 1280px  /* Large screens */
```

**Mobile (< 768px):**
- Single column layout
- Full-width cards
- Bottom navigation
- Larger touch targets (48px min)
- Simplified header

**Tablet (768px - 1024px):**
- Two column layout for stats
- Side-by-side filters
- Standard navigation

**Desktop (> 1024px):**
- Optimal line length (65-75 characters)
- Hover states active
- Keyboard shortcuts visible
- Multi-column layouts where appropriate

---

### Accessibility Enhancements

**Focus Indicators:**
```css
*:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

**Skip to Content Link:**
- Hidden by default
- Visible on keyboard focus
- Positioned at top of page

**Color Contrast:**
- All text meets WCAG AA standards (4.5:1)
- Interactive elements meet AAA (7:1)
- Never rely on color alone for information

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Icon System

**Recommended Icon Library:**
- **Lucide Icons** (lightweight, consistent)
- **Heroicons** (Tailwind's icon set)
- **Feather Icons** (minimal, clean)

**Icon Sizes:**
```css
--icon-xs: 16px
--icon-sm: 20px
--icon-md: 24px
--icon-lg: 32px
--icon-xl: 48px
```

**Common Icons Needed:**
- Plus (+) - Add transaction, FAB
- X (×) - Close modal, delete
- Check (✓) - Confirm, success
- Chevron Down (⌄) - Dropdown indicator
- Calendar - Date picker
- Settings (⚙) - Settings page
- Download (⬇) - Export functions
- Upload (⬆) - Import function
- Trash (🗑) - Delete action
- Edit (✎) - Edit transaction
- Filter (⧉) - Time filters
- Menu (≡) - Mobile navigation
- Circle (●) - Status indicator

**Icon Colors:**
- Default: `var(--text-secondary)`
- Active: `var(--text-primary)`
- Accent: `var(--accent-color)`
- Success: `var(--income-color)`
- Danger: `var(--expense-color)`

---

### Empty States

**No Transactions:**
```
┌─────────────────────────────┐
│                             │
│         [Icon: 📊]          │
│                             │
│   No transactions yet       │
│   Start tracking your       │
│   expenses and income       │
│                             │
│      [+ Add Transaction]    │
│                             │
└─────────────────────────────┘
```

**Styling:**
- Center aligned
- Large icon (64px, muted color)
- Text: var(--text-secondary)
- Call-to-action button below
- Generous padding

---

### Loading States

**Skeleton Screens:**
- Use for initial data load
- Animated gradient shimmer
- Match actual content structure
- Subtle, non-distracting

**Spinner:**
- Center screen for full-page loads
- Inline for button actions
- Color: var(--accent-color)
- Size: 24px default

**Progress Indicators:**
- For longer operations (PDF generation, import)
- Show percentage if possible
- Descriptive text: "Generating report..."

---

### Toast Notifications

**Position:** Top center or bottom center
**Duration:** 2-3 seconds (auto-dismiss)
**Max Width:** 400px

**Styling:**
```css
background: var(--bg-primary)
border: 1px solid var(--border-color)
border-radius: var(--radius-md)
padding: var(--spacing-md)
box-shadow: var(--shadow-lg)
display: flex
align-items: center
gap: var(--spacing-sm)

/* Success */
border-left: 4px solid var(--success-color)

/* Error */
border-left: 4px solid var(--error-color)

/* Info */
border-left: 4px solid var(--accent-color)
```

---

### Theme Toggle Animation

**Smooth Transition:**
```css
/* Apply to all color-changing elements */
transition: 
  background-color 200ms ease,
  color 200ms ease,
  border-color 200ms ease;
```

**Toggle Button:**
- Sun icon for light mode
- Moon icon for dark mode
- Rotate animation on switch (180deg)
- Position: Header right side

---

### Cultural Considerations (Oman)

**RTL Support (Optional Enhancement):**
- While English is primary, consider RTL for Arabic numbers
- Proper rendering of ر.ع. symbol
- Date format: Support both DD/MM/YYYY and ١٢/٠٤/٢٠٢٦

**Currency Display:**
- Always show ر.ع. symbol prominently
- Consistent 3-decimal format
- Comma separators for thousands (1,000.000)
- Space between symbol and number: "ر.ع. 1,250.500"

**Color Sensitivity:**
- Green and red are culturally appropriate for financial contexts
- Avoid excessive use of certain colors if cultural significance exists

---

### Performance Optimizations

**CSS:**
- Use CSS custom properties for theming (instant switch)
- Minimize reflows (use transform/opacity for animations)
- Contain layout with `contain: layout style`
- GPU acceleration for smooth animations

**Images/Icons:**
- Use SVG for all icons (scalable, themeable)
- Inline critical SVGs
- Lazy load non-critical assets

**Fonts:**
- System fonts preferred (zero load time)
- If custom fonts: preload, font-display: swap
- Subset fonts to required characters

---

## Theme System

### Theme Persistence and Toggle

**Theme Storage:**
```css
localStorage key: 'floos-theme'
values: 'light' | 'dark'
default: 'light'
```
- Smooth transition animations (200ms)
- Persist in `localStorage` key: `floos-theme`
- Apply on page load before render (prevent flash)

---

## Status Indicators

### Online/Offline Indicator
- **Location**: Top right corner or status bar
- **Online**: Green dot + "Online" text (small, subtle)
- **Offline**: Orange dot + "Offline" text
- **Update**: Real-time using `navigator.onLine` events

### Version Number
- **Location**: Settings page or footer
- **Format**: "v1.0.0"
- **Source**: From manifest.json or hardcoded constant
- **Update Check**: Compare cached version with service worker version
- **Notification**: Show badge/banner when update available: "New version available. Refresh to update."

---

## Form Validation Rules

### Amount Field
- Required
- Must be > 0
- Minimum: 0.001 OMR (1 Baisa)
- Maximum 3 decimal places (for Baisa precision)
- Maximum value: 999,999.999 OMR
- No negative numbers allowed
- Validation message: "Please enter a valid amount in OMR (e.g., 10.500)"
- Format on blur: Always show 3 decimals (e.g., "10" becomes "10.000")

### Category Field
- Required
- Must match one of predefined categories
- No custom categories allowed

### Note Field
- Optional
- Maximum 200 characters
- Trim whitespace

### Date Field (Edit mode)
- Cannot be in the future
- Reasonable past limit: 10 years back
- Format validation: ISO 8601

---

## Currency Utility Functions

### Formatting Functions (JavaScript)

```javascript
/**
 * Format number as Omani Riyal
 * @param {number} amount - Amount in OMR
 * @param {boolean} showSymbol - Whether to show ر.ع. symbol
 * @returns {string} Formatted amount
 */
function formatOMR(amount, showSymbol = true) {
  const formatted = amount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return showSymbol ? `ر.ع. ${formatted}` : formatted;
}

/**
 * Parse user input to valid OMR amount
 * @param {string} input - User input string
 * @returns {number|null} Parsed amount or null if invalid
 */
function parseOMR(input) {
  // Remove commas and spaces
  const cleaned = input.replace(/[,\s]/g, '');
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount) || amount <= 0) return null;
  
  // Round to 3 decimal places (Baisa precision)
  return Math.round(amount * 1000) / 1000;
}

/**
 * Validate OMR amount
 * @param {number} amount - Amount to validate
 * @returns {boolean} Whether amount is valid
 */
function validateOMR(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return false;
  if (amount < 0.001) return false; // Minimum 1 Baisa
  if (amount > 999999.999) return false; // Maximum value
  
  // Check decimal places
  const decimals = (amount.toString().split('.')[1] || '').length;
  return decimals <= 3;
}

/**
 * Convert Baisa to Riyal
 * @param {number} baisa - Amount in Baisa
 * @returns {number} Amount in Riyal
 */
function baisaToRiyal(baisa) {
  return baisa / 1000;
}

/**
 * Convert Riyal to Baisa
 * @param {number} riyal - Amount in Riyal
 * @returns {number} Amount in Baisa
 */
function riyalToBaisa(riyal) {
  return Math.round(riyal * 1000);
}
```

### Display Examples
```javascript
// Input: 1250.5
// Output: "ر.ع. 1,250.500"

// Input: 0.001
// Output: "ر.ع. 0.001"

// Input: 1500
// Output: "ر.ع. 1,500.000"
```

---

## User Feedback & Error Handling

### Success Messages
- Transaction added: "Transaction saved successfully" (2s toast)
- Transaction updated: "Transaction updated" (2s toast)
- Transaction deleted: "Transaction deleted" (2s toast)
- Data exported: "Export successful" (2s toast)
- Data imported: "Imported X transactions" (2s toast)

### Error Messages
- Invalid amount: "Please enter a valid amount"
- Network error: "Operation failed. Please try again."
- Import error: "Invalid file format. Please select a valid backup file."
- Database error: "Unable to save. Please try again."

### Loading States
- Show spinner/skeleton when:
  - Loading transactions
  - Generating PDF
  - Importing data
- Disable buttons during operations

---

## Performance Requirements

### Load Time
- First contentful paint: < 1s
- Time to interactive: < 2s
- Total bundle size: < 200KB (excluding jsPDF)

### Optimization
- Minify CSS/JS in production
- Compress images (icons)
- Lazy load jsPDF library (only when export needed)
- Debounce search/filter inputs (if implemented)
- Virtual scrolling for large transaction lists (>100 items)

---

## Accessibility Requirements

### Keyboard Navigation
- All interactive elements keyboard accessible
- Logical tab order
- Visible focus indicators
- Escape key closes modals

### Screen Reader Support
- Semantic HTML elements
- ARIA labels where needed
- Alt text for icons
- Form labels properly associated

### Visual Accessibility
- Color contrast ratio: 4.5:1 minimum
- Text size: 16px minimum
- Touch targets: 44x44px minimum
- No information conveyed by color alone

---

## Testing Checklist

### Functionality
- [ ] Add income transaction
- [ ] Add expense transaction
- [ ] Edit transaction (all fields)
- [ ] Delete transaction
- [ ] View all transactions
- [ ] Filter by time period
- [ ] Calculate balance correctly
- [ ] Export to JSON
- [ ] Import from JSON
- [ ] Generate PDF report
- [ ] Clear all data (with confirmation)
- [ ] Toggle theme (persist)
- [ ] Work offline completely

### PWA
- [ ] Install on desktop
- [ ] Install on mobile
- [ ] Add to home screen
- [ ] Launch as standalone app
- [ ] Offline functionality
- [ ] Service worker caching
- [ ] Update mechanism

### Responsive Design
- [ ] Mobile (320px - 480px)
- [ ] Tablet (481px - 768px)
- [ ] Desktop (769px+)
- [ ] Landscape orientation
- [ ] Portrait orientation

### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

---

## Development Notes

### Code Quality
- Use ES6+ features (const/let, arrow functions, async/await)
- Modular code structure (separate concerns)
- Meaningful variable/function names
- Comment complex logic
- Error handling for all async operations
- No console.logs in production

### State Management
- Keep state in memory for active session
- Sync with IndexedDB on changes
- Invalidate cache when data changes
- Optimistic UI updates

### Security Considerations
- Validate all user inputs
- Sanitize data before storage
- No eval() or innerHTML with user data
- CSP headers in manifest
- HTTPS only in production

---

## Deployment

### Build Process
1. Minify JavaScript files
2. Minify CSS files
3. Optimize images
4. Generate manifest.json
5. Configure service worker
6. Test on localhost
7. Test on different devices

### Hosting Options
- GitHub Pages (free, simple)
- Netlify (free tier, easy deploys)
- Vercel (free tier, optimized)
- Any static hosting service

### Post-Deployment
- Test installation on real devices
- Verify offline functionality
- Monitor for errors (optional analytics)
- Collect user feedback

---

## Future Enhancement Ideas (Out of Scope for v1.0)

- Recurring transactions
- Budget limits and alerts
- Multi-currency support
- Data sync across devices (with backend)
- Charts and visualizations
- Search functionality
- Tags/labels for transactions
- Receipt photo attachments
- Export to CSV/Excel
- Spending insights/analytics
- Custom category creation

---

## Version History

### v1.0.0 (Initial Release)
- Core transaction management (add, edit, delete)
- Income and expense tracking
- Category organization
- PDF export
- JSON backup/restore
- Light/dark theme
- Offline support
- PWA installation

---

**End of SOP**
