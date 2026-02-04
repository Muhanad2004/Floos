// ===================================
// Floos Expense Tracker - Main App
// Application Logic and Event Handlers
// ===================================

// Categories Configuration
const CATEGORIES = {
    income: ['Salary', 'Gift', 'Freelance', 'Other'],
    expense: ['Groceries', 'Snacks', 'Laundromat', 'Barber', 'Fuel', 'Other']
};

// Current filter state
let currentFilter = 'all';
let currentTransactions = [];

// Initialize App
async function initApp() {
    try {
        // Initialize database
        await initDB();

        // Load theme
        loadTheme();

        // Load and render transactions
        await loadAndRenderTransactions();

        // Setup event listeners
        setupEventListeners();

        // Update online status
        updateOnlineStatus();

        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to initialize app', 'error');
    }
}

// Load and Render Transactions
async function loadAndRenderTransactions() {
    try {
        let transactions = await getAllTransactions();

        // Apply current filter
        transactions = applyFilter(transactions, currentFilter);

        currentTransactions = transactions;
        renderTransactions(transactions);
        updateSummary(transactions);
    } catch (error) {
        console.error('Error loading transactions:', error);
        showToast('Failed to load transactions', 'error');
    }
}

// Apply Date Filter
function applyFilter(transactions, filter) {
    const now = new Date();

    switch (filter) {
        case 'today':
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            return transactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= startOfToday && tDate <= endOfToday;
            });

        case 'week':
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return transactions.filter(t => new Date(t.date) >= startOfWeek);

        case 'month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return transactions.filter(t => new Date(t.date) >= startOfMonth);

        case 'all':
        default:
            return transactions;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // FAB - Open add transaction modal
    document.getElementById('fab').addEventListener('click', () => {
        resetTransactionForm();
        showModal('transaction-modal');
    });

    // Empty state add button
    document.getElementById('empty-add-btn')?.addEventListener('click', () => {
        resetTransactionForm();
        showModal('transaction-modal');
    });

    // Close modal buttons
    document.getElementById('close-modal').addEventListener('click', () => {
        hideModal('transaction-modal');
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        hideModal('transaction-modal');
    });

    // Modal overlay click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                const modal = overlay.closest('.modal');
                if (modal) {
                    hideModal(modal.id);
                }
            }
        });
    });

    // Transaction form submission
    document.getElementById('transaction-form').addEventListener('submit', handleTransactionSubmit);

    // Type toggle - update categories
    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            populateCategoryDropdown(e.target.value);
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Apply filter
            currentFilter = e.target.dataset.filter;
            loadAndRenderTransactions();
        });
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Settings navigation
    document.getElementById('settings-btn').addEventListener('click', () => {
        showView('settings-view');
    });

    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        showView('dashboard-view');
    });

    // Data management buttons
    document.getElementById('export-json-btn').addEventListener('click', handleExportJSON);
    document.getElementById('import-json-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });
    document.getElementById('import-file-input').addEventListener('change', handleImportJSON);
    document.getElementById('export-pdf-btn').addEventListener('click', handleExportPDF);
    document.getElementById('clear-data-btn').addEventListener('click', confirmClearAllData);

    // Confirm modal buttons
    document.getElementById('confirm-cancel').addEventListener('click', () => {
        hideModal('confirm-modal');
    });

    // Online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initialize category dropdown
    populateCategoryDropdown('expense');
}

// Handle Transaction Form Submit
async function handleTransactionSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    // Parse and validate amount
    const amountInput = formData.get('amount');
    const amount = parseOMR(amountInput);

    if (!amount || !validateOMR(amount)) {
        showToast('Please enter a valid amount (0.001 - 999,999.999 OMR)', 'error');
        return;
    }

    const type = formData.get('type');
    const category = formData.get('category');
    const note = formData.get('note')?.trim() || null;

    try {
        // Check if editing or adding
        const editId = form.dataset.editId;

        if (editId) {
            // Update existing transaction
            const dateInput = formData.get('date');
            const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

            await updateTransaction(editId, {
                amount,
                type,
                category,
                note,
                date
            });

            showToast('Transaction updated', 'success');
        } else {
            // Add new transaction
            const transaction = {
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                amount,
                type,
                category,
                note,
                date: new Date().toISOString(),
                createdAt: Date.now()
            };

            await addTransaction(transaction);
            showToast('Transaction added', 'success');
        }

        // Close modal and refresh
        hideModal('transaction-modal');
        await loadAndRenderTransactions();

    } catch (error) {
        console.error('Error saving transaction:', error);
        showToast('Failed to save transaction', 'error');
    }
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('floos-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggle(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('floos-theme', newTheme);
    updateThemeToggle(newTheme);

    haptic('light');
}

function updateThemeToggle(theme) {
    const options = document.querySelectorAll('.theme-option');
    options.forEach(option => {
        option.classList.remove('active');
        if ((theme === 'light' && option.textContent === 'Light') ||
            (theme === 'dark' && option.textContent === 'Dark')) {
            option.classList.add('active');
        }
    });
}

// Export to JSON
async function handleExportJSON() {
    try {
        const jsonData = await exportToJSON();
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const filename = `floos_backup_${today}.json`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        showToast('Data exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Failed to export data', 'error');
    }
}

// Import from JSON
async function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const jsonData = event.target.result;
            const results = await importFromJSON(jsonData);

            const successCount = results.filter(r => r.success).length;
            showToast(`Imported ${successCount} transactions`, 'success');

            await loadAndRenderTransactions();
        } catch (error) {
            console.error('Error importing data:', error);
            showToast('Invalid file format', 'error');
        }
    };

    reader.readAsText(file);
    e.target.value = ''; // Reset file input
}

// Export to PDF (placeholder - will be implemented in pdf.js)
async function handleExportPDF() {
    try {
        if (typeof generatePDF === 'function') {
            await generatePDF(currentTransactions);
        } else {
            showToast('PDF export not available', 'error');
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Failed to generate PDF', 'error');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
