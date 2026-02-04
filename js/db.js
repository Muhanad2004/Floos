// ===================================
// Floos Expense Tracker - Database Layer
// IndexedDB Operations
// ===================================

const DB_NAME = 'FloosExpenseTracker';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

let db = null;

// Initialize Database
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database failed to open');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

                // Create indexes
                objectStore.createIndex('date', 'date', { unique: false });
                objectStore.createIndex('type', 'type', { unique: false });
                objectStore.createIndex('category', 'category', { unique: false });
                objectStore.createIndex('createdAt', 'createdAt', { unique: false });

                console.log('Object store created');
            }
        };
    });
}

// Add Transaction
async function addTransaction(transaction) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(transaction);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get Transaction by ID
async function getTransaction(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get All Transactions
async function getAllTransactions() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by createdAt descending (newest first)
            const transactions = request.result.sort((a, b) => b.createdAt - a.createdAt);
            resolve(transactions);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Update Transaction
async function updateTransaction(id, updates) {
    return new Promise(async (resolve, reject) => {
        try {
            const transaction = await getTransaction(id);
            if (!transaction) {
                reject(new Error('Transaction not found'));
                return;
            }

            const updatedTransaction = { ...transaction, ...updates };

            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(updatedTransaction);

            request.onsuccess = () => {
                resolve(updatedTransaction);
            };

            request.onerror = () => {
                reject(request.error);
            };
        } catch (error) {
            reject(error);
        }
    });
}

// Delete Transaction
async function deleteTransaction(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Clear All Transactions
async function clearAllTransactions() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get Transactions by Date Range
async function getTransactionsByDateRange(startDate, endDate) {
    return new Promise(async (resolve, reject) => {
        try {
            const allTransactions = await getAllTransactions();
            const filtered = allTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= startDate && tDate <= endDate;
            });
            resolve(filtered);
        } catch (error) {
            reject(error);
        }
    });
}

// Get Transactions by Type
async function getTransactionsByType(type) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('type');
        const request = index.getAll(type);

        request.onsuccess = () => {
            const transactions = request.result.sort((a, b) => b.createdAt - a.createdAt);
            resolve(transactions);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Get Transactions by Category
async function getTransactionsByCategory(category) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('category');
        const request = index.getAll(category);

        request.onsuccess = () => {
            const transactions = request.result.sort((a, b) => b.createdAt - a.createdAt);
            resolve(transactions);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

// Export all transactions as JSON
async function exportToJSON() {
    try {
        const transactions = await getAllTransactions();
        const exportData = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            transactionCount: transactions.length,
            transactions: transactions
        };
        return JSON.stringify(exportData, null, 2);
    } catch (error) {
        throw error;
    }
}

// Import transactions from JSON
async function importFromJSON(jsonData) {
    try {
        const data = JSON.parse(jsonData);

        // Validate structure
        if (!data.transactions || !Array.isArray(data.transactions)) {
            throw new Error('Invalid backup file format');
        }

        // Add all transactions
        const results = [];
        for (const transaction of data.transactions) {
            // Ensure transaction has required fields
            if (transaction.id && transaction.amount && transaction.type && transaction.category) {
                try {
                    await addTransaction(transaction);
                    results.push({ success: true, id: transaction.id });
                } catch (error) {
                    // If transaction already exists, skip it
                    results.push({ success: false, id: transaction.id, error: 'Already exists' });
                }
            }
        }

        return results;
    } catch (error) {
        throw error;
    }
}
