# Floos - Expense Tracker PWA

A lightweight Progressive Web App for tracking income and expenses in Omani Riyals (OMR). Built with vanilla JavaScript, optimized for iOS devices with full offline support.

## Features

✨ **Core Functionality**
- Track income and expenses with OMR currency (3 decimal precision)
- Categorized transactions (Salary, Groceries, Fuel, etc.)
- Real-time balance calculation
- Time-based filtering (Today, Week, Month, All Time)
- Add, edit, and delete transactions

🎨 **Modern UI**
- Light and dark themes
- Smooth animations and transitions
- iOS-optimized design with safe area support
- Responsive layout for all screen sizes

💾 **Data Management**
- Export transactions to JSON (backup)
- Import transactions from JSON (restore)
- Generate PDF reports with category breakdowns
- Clear all data with confirmation

📱 **PWA Features**
- Install as standalone app on iOS/Android
- Full offline functionality
- Service worker caching
- Fast load times (<2s)

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom properties for theming
- **Vanilla JavaScript** (ES6+) - No frameworks
- **IndexedDB** - Local data storage
- **Service Workers** - Offline support
- **jsPDF** - PDF generation

## Installation

### Local Development

1. Clone or download this repository
2. Serve the files using any static server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

3. Open `http://localhost:8000` in your browser

### Install as PWA

**On iOS (Safari):**
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

**On Android (Chrome):**
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen"
4. Tap "Add"

## Deployment to GitHub Pages

1. Create a new repository on GitHub
2. Push your code to the repository:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/floos.git
git push -u origin main
```

3. Enable GitHub Pages:
   - Go to repository Settings
   - Navigate to Pages section
   - Select "main" branch as source
   - Click Save

4. Your app will be available at: `https://YOUR_USERNAME.github.io/floos/`

### Important Notes for GitHub Pages

- The app uses absolute paths starting with `/`. If deploying to a subdirectory, update paths in:
  - `index.html` (CSS, JS, manifest links)
  - `manifest.json` (start_url, scope, icon paths)
  - `sw.js` (STATIC_ASSETS array)

- For subdirectory deployment (e.g., `/floos/`), add this to your paths:
  ```html
  <link rel="stylesheet" href="/floos/css/styles.css">
  ```

## Usage

### Adding a Transaction

1. Click the blue **+** button (FAB) in the bottom right
2. Enter the amount in OMR (supports 3 decimals)
3. Select type: Income or Expense
4. Choose a category
5. Add an optional note
6. Click **Save**

### Editing a Transaction

1. Tap on any transaction in the list
2. Modify the details
3. Click **Update** to save or **Delete** to remove

### Filtering Transactions

Use the filter buttons at the top:
- **All Time** - Show all transactions
- **Today** - Show today's transactions
- **This Week** - Show this week's transactions
- **This Month** - Show this month's transactions

### Exporting Data

**JSON Backup:**
1. Go to Settings (gear icon)
2. Tap "Export to JSON"
3. Save the file for backup

**PDF Report:**
1. Go to Settings
2. Tap "Generate PDF Report"
3. PDF includes balance summary, category breakdown, and full transaction list

### Importing Data

1. Go to Settings
2. Tap "Import from JSON"
3. Select your backup file
4. Transactions will be imported (duplicates skipped)

## Currency Format

- **Symbol**: ر.ع. (Omani Riyal)
- **Decimals**: 3 (for Baisa precision)
- **Format**: ر.ع. X,XXX.XXX
- **Example**: ر.ع. 1,250.500 (1 Riyal and 250 Baisa)

## Browser Support

- ✅ Safari (iOS 12+)
- ✅ Chrome (Android & Desktop)
- ✅ Firefox (Desktop)
- ✅ Edge (Desktop)

## Offline Support

The app works completely offline after the first visit:
- All transactions stored locally in IndexedDB
- Service worker caches static assets
- PDF generation works offline (if library cached)
- Online/offline status indicator in Settings

## Privacy

- **100% Local** - All data stored on your device
- **No tracking** - No analytics or external services
- **No server** - No data sent to any server
- **Your data, your control** - Export/import anytime

## File Structure

```
/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
├── css/
│   └── styles.css     # All styles with theme system
├── js/
│   ├── app.js         # Main application logic
│   ├── db.js          # IndexedDB operations
│   ├── ui.js          # UI state management
│   └── pdf.js         # PDF export functionality
└── icons/             # App icons (to be generated)
```

## Customization

### Adding Categories

Edit the `CATEGORIES` object in `js/app.js`:

```javascript
const CATEGORIES = {
  income: ['Salary', 'Gift', 'Freelance', 'Other'],
  expense: ['Groceries', 'Snacks', 'Laundromat', 'Barber', 'Fuel', 'Other']
};
```

### Changing Theme Colors

Edit CSS custom properties in `css/styles.css`:

```css
:root {
  --accent-color: #3B82F6;  /* Primary blue */
  --income-color: #10B981;  /* Green */
  --expense-color: #EF4444; /* Red */
}
```

## Troubleshooting

**App not installing as PWA:**
- Ensure you're using HTTPS (or localhost)
- Check that manifest.json is accessible
- Verify service worker is registered (check browser console)

**Data not persisting:**
- Check if IndexedDB is enabled in browser settings
- Ensure you're not in private/incognito mode
- Check browser storage quota

**PDF export not working:**
- Ensure internet connection for first-time library load
- Check browser console for errors
- Libraries are cached after first successful load

## License

This project is open source and available for personal and commercial use.

## Credits

Built with ❤️ for personal finance tracking in Oman.

**Libraries Used:**
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation
- [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) - PDF tables

---

**Version:** 1.0.0  
**Last Updated:** February 2026
