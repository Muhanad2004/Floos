// ===================================
// Floos Expense Tracker - UI Layer
// UI State Management and Rendering
// ===================================

// Modal Management
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        haptic('light');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            resetTransactionForm();
        }, 300); // Wait for transition
    }
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// View Management
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    // Show selected view
    const view = document.getElementById(viewId);
    if (view) {
        view.classList.add('active');
    }

    // Hide FAB on settings view
    const fab = document.getElementById('fab');
    if (viewId === 'settings-view') {
        fab.style.display = 'none';
    } else {
        fab.style.display = 'flex';
    }
}

// Render Transaction List
function renderTransactions(transactions) {
    const listContainer = document.getElementById('transaction-list');
    const emptyState = document.getElementById('empty-state');

    // Category emoji icons
    const categoryIcons = {
        'Salary': '💰',
        'Gift': '🎁',
        'Freelance': '💻',
        'Groceries': '🛒',
        'Snacks': '🍿',
        'Laundromat': '👕',
        'Barber': '✂️',
        'Fuel': '⛽',
        'Other': '📋'
    };

    if (!transactions || transactions.length === 0) {
        listContainer.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }

    emptyState.classList.remove('show');

    listContainer.innerHTML = transactions.map(transaction => {
        const date = new Date(transaction.date);
        const formattedDate = formatDate(date);
        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const amountSign = transaction.type === 'income' ? '+' : '-';
        const formattedAmount = formatOMR(transaction.amount);
        const icon = categoryIcons[transaction.category] || '📋';

        return `
      <div class="transaction-card" data-id="${transaction.id}">
        <div class="transaction-icon ${amountClass}">${icon}</div>
        <div class="transaction-info">
          <p class="transaction-category">${transaction.category}</p>
          <p class="transaction-note">${transaction.note ? escapeHtml(transaction.note) : formattedDate}</p>
        </div>
        <div class="transaction-amount-wrapper">
          <p class="transaction-amount ${amountClass}">${amountSign}${formattedAmount}</p>
          ${transaction.note ? `<p class="transaction-date">${formattedDate}</p>` : ''}
        </div>
      </div>
    `;
    }).join('');

    // Add click listeners to transaction cards
    document.querySelectorAll('.transaction-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            openEditModal(id);
        });
    });
}

// Update Summary Card
function updateSummary(transactions) {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpenses += t.amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    // Update balance
    const balanceEl = document.getElementById('current-balance');
    balanceEl.textContent = formatOMR(balance);
    balanceEl.classList.remove('positive', 'negative');
    if (balance > 0) {
        balanceEl.classList.add('positive');
    } else if (balance < 0) {
        balanceEl.classList.add('negative');
    }

    // Update stats
    document.getElementById('total-income').textContent = formatOMR(totalIncome);
    document.getElementById('total-expenses').textContent = formatOMR(totalExpenses);
}

// Format OMR Currency
function formatOMR(amount, showSymbol = true) {
    const formatted = amount.toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return showSymbol ? `ر.ع. ${formatted}` : formatted;
}

// Parse OMR Input
function parseOMR(input) {
    const cleaned = input.replace(/[,\s]/g, '');
    const amount = parseFloat(cleaned);

    if (isNaN(amount) || amount <= 0) return null;

    // Round to 3 decimal places
    return Math.round(amount * 1000) / 1000;
}

// Validate OMR Amount
function validateOMR(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return false;
    if (amount < 0.001) return false;
    if (amount > 999999.999) return false;

    const decimals = (amount.toString().split('.')[1] || '').length;
    return decimals <= 3;
}

// Format Date
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Populate Category Dropdown
function populateCategoryDropdown(type) {
    const categorySelect = document.getElementById('category-select');
    const categories = CATEGORIES[type];

    categorySelect.innerHTML = categories.map(cat =>
        `<option value="${cat}">${cat}</option>`
    ).join('');
}

// Open Edit Modal
async function openEditModal(id) {
    try {
        const transaction = await getTransaction(id);
        if (!transaction) return;

        // Populate form
        const form = document.getElementById('transaction-form');
        form.dataset.editId = id;
        form.querySelector('[name="type"][value="' + transaction.type + '"]').checked = true;

        // Trigger change event to populate categories
        populateCategoryDropdown(transaction.type);

        form.querySelector('[name="amount"]').value = transaction.amount;
        form.querySelector('[name="category"]').value = transaction.category;
        form.querySelector('[name="date"]').value = transaction.date.split('T')[0];
        form.querySelector('[name="note"]').value = transaction.note || '';

        // Show delete button
        document.getElementById('delete-btn-wrapper').style.display = 'block';
        document.getElementById('delete-btn').onclick = () => confirmDeleteTransaction(id);

        document.getElementById('modal-title').textContent = 'Edit Transaction';
        showModal('transaction-modal');
        haptic('medium');
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showToast('Error loading transaction', 'error');
    }
}

// Reset Transaction Form
function resetTransactionForm() {
    const form = document.getElementById('transaction-form');
    form.reset();
    delete form.dataset.editId;

    // Reset to default state
    document.getElementById('modal-title').textContent = 'Add Transaction';
    document.getElementById('type-expense').checked = true;
    populateCategoryDropdown('expense');
    document.getElementById('date-group').style.display = 'none';
    document.getElementById('delete-btn').style.display = 'none';
}

// Confirm Delete Transaction
function confirmDeleteTransaction(transactionId) {
    hideModal('transaction-modal');

    const confirmModal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').textContent = 'Delete Transaction';
    document.getElementById('confirm-message').textContent = 'Are you sure you want to delete this transaction? This action cannot be undone.';
    document.getElementById('confirm-input').style.display = 'none';

    const confirmBtn = document.getElementById('confirm-ok');
    confirmBtn.onclick = async () => {
        try {
            await deleteTransaction(transactionId);
            hideModal('confirm-modal');
            showToast('Transaction deleted', 'success');
            await loadAndRenderTransactions();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            showToast('Failed to delete transaction', 'error');
        }
    };

    showModal('confirm-modal');
}

// Confirm Clear All Data
function confirmClearAllData() {
    const confirmModal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').textContent = 'Clear All Data';
    document.getElementById('confirm-message').textContent = 'This will delete ALL transactions, cache, and force a fresh download. Type DELETE to confirm.';

    const confirmInput = document.getElementById('confirm-input');
    confirmInput.style.display = 'block';
    confirmInput.value = '';

    const confirmBtn = document.getElementById('confirm-ok');
    confirmBtn.onclick = async () => {
        if (confirmInput.value === 'DELETE') {
            try {
                // Clear transactions
                await clearAllTransactions();

                // Clear localStorage
                localStorage.clear();

                // Clear all caches (service worker caches)
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                }

                // Unregister service worker
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(
                        registrations.map(registration => registration.unregister())
                    );
                }

                hideModal('confirm-modal');
                showToast('All data and cache cleared. Reloading...', 'success');

                // Wait a moment then reload to get fresh version
                setTimeout(() => {
                    window.location.reload(true);
                }, 1500);

            } catch (error) {
                console.error('Error clearing data:', error);
                showToast('Failed to clear data', 'error');
            }
        } else {
            showToast('Please type DELETE to confirm', 'error');
        }
    };

    showModal('confirm-modal');
}

// Update Online Status
function updateOnlineStatus() {
    const statusBadge = document.getElementById('online-status');
    if (navigator.onLine) {
        statusBadge.className = 'status-badge status-online';
        statusBadge.innerHTML = '<span class="status-dot"></span>Online';
    } else {
        statusBadge.className = 'status-badge status-offline';
        statusBadge.innerHTML = '<span class="status-dot"></span>Offline';
    }
}

// iOS Keyboard Handling
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        const vh = window.visualViewport.height;
        document.documentElement.style.setProperty('--viewport-height', `${vh}px`);
    });
}

// Haptic Feedback (optional, iOS)
function haptic(type = 'light') {
    if (navigator.vibrate) {
        const duration = { light: 10, medium: 20, heavy: 30 }[type] || 10;
        navigator.vibrate(duration);
    }
}
