// main.js
class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.isSubmitting = false;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.currency = localStorage.getItem('currency') || 'USD';
        this.dateFormat = localStorage.getItem('dateFormat') || 'YYYY-MM-DD';

        this.setupEventListeners();
        this.loadTransactions();
        this.initializeTheme();
        this.updateMonthlySummary();
    }

    setupEventListeners() {
        // Add Transaction Form
        const addForm = document.getElementById('add-transaction-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => this.handleAddTransaction(e));
        }

        // Delete Transaction Buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-transaction')) {
                this.handleDeleteTransaction(e);
            }
        });

        // Filter Form
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', (e) => this.handleFilter(e));
        }

        // Theme Toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Currency Selector
        const currencySelector = document.getElementById('currency-selector');
        if (currencySelector) {
            currencySelector.addEventListener('change', (e) => this.updateCurrency(e.target.value));
        }
    }

    async handleAddTransaction(e) {
        e.preventDefault();
        if (this.isSubmitting) return;

        this.isSubmitting = true;
        const form = e.target;
        const formData = new FormData(form);

        try {
            const response = await fetch('/add_transaction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: formData.get('date'),
                    amount: formData.get('amount'),
                    category: formData.get('category'),
                    description: formData.get('description')
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('Transaction added successfully', 'success');
                form.reset();
                await this.loadTransactions();
                await this.updateMonthlySummary();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to add transaction', 'error');
        } finally {
            this.isSubmitting = false;
        }
    }

    async handleDeleteTransaction(e) {
        const id = e.target.dataset.id;
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        try {
            const response = await fetch(`/transaction/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('Transaction deleted successfully', 'success');
                await this.loadTransactions();
                await this.updateMonthlySummary();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to delete transaction', 'error');
        }
    }

    async loadTransactions() {
        try {
            const response = await fetch('/transactions');
            const data = await response.json();
            
            if (data.success) {
                this.transactions = data.transactions;
                this.renderTransactions();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to load transactions', 'error');
        }
    }

    async updateMonthlySummary() {
        try {
            const response = await fetch('/monthly-summary');
            const data = await response.json();
            
            if (data.success) {
                this.renderMonthlySummary(data);
            }
        } catch (error) {
            console.error('Failed to update monthly summary:', error);
        }
    }

    renderTransactions() {
        const container = document.getElementById('transactions-container');
        if (!container) return;

        const html = this.transactions.map(transaction => `
            <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                            ${this.escapeHtml(transaction.description)}
                        </h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            ${this.formatDate(transaction.date)} - ${this.escapeHtml(transaction.category)}
                        </p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-lg font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                            ${this.formatCurrency(transaction.amount)}
                        </span>
                        <button 
                            class="delete-transaction text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            data-id="${transaction.id}">
                            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderMonthlySummary(data) {
        const incomeElement = document.getElementById('monthly-income');
        const expensesElement = document.getElementById('monthly-expenses');
        const balanceElement = document.getElementById('monthly-balance');

        if (incomeElement) {
            incomeElement.textContent = this.formatCurrency(data.income);
        }
        if (expensesElement) {
            expensesElement.textContent = this.formatCurrency(Math.abs(data.expenses));
        }
        if (balanceElement) {
            balanceElement.textContent = this.formatCurrency(data.balance);
            balanceElement.className = data.balance >= 0 ? 'text-green-600' : 'text-red-600';
        }
    }

    async handleFilter(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const params = new URLSearchParams({
            category: formData.get('category') || '',
            start_date: formData.get('start_date') || '',
            end_date: formData.get('end_date') || ''
        });

        try {
            const response = await fetch(`/transactions?${params}`);
            const data = await response.json();
            
            if (data.success) {
                this.transactions = data.transactions;
                this.renderTransactions();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to filter transactions', 'error');
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        html.classList.toggle('dark');
        this.currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
    }

    initializeTheme() {
        if (this.currentTheme === 'dark' || 
            (this.currentTheme === 'system' && 
             window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    updateCurrency(newCurrency) {
        this.currency = newCurrency;
        localStorage.setItem('currency', newCurrency);
        this.renderTransactions();
        this.updateMonthlySummary();
    }

    formatCurrency(amount) {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return formatter.format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notification-message');
        
        if (notification && notificationMessage) {
            notification.className = `fixed bottom-4 right-4 ${
                type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white px-6 py-4 rounded-lg shadow-lg`;
            notificationMessage.textContent = message;
            notification.classList.remove('hidden');
            
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new FinanceTracker();
});