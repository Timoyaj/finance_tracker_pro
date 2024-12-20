// settings.js
class Settings {
    constructor() {
        this.setupEventListeners();
        this.loadPreferences();
    }

    setupEventListeners() {
        // Profile Form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Password Form
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }

        // Theme Selector
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => this.handleThemeChange(e));
        }

        // Preferences
        const currencySelector = document.getElementById('currency-selector');
        const dateFormatSelector = document.getElementById('date-format-selector');

        if (currencySelector) {
            currencySelector.addEventListener('change', (e) => this.handlePreferenceChange('currency', e.target.value));
        }

        if (dateFormatSelector) {
            dateFormatSelector.addEventListener('change', (e) => this.handlePreferenceChange('dateFormat', e.target.value));
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        try {
            const response = await fetch('/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.get('email')
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('Profile updated successfully');
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to update profile', 'error');
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        if (formData.get('new_password') !== formData.get('confirm_password')) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch('/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: formData.get('current_password'),
                    new_password: formData.get('new_password')
                })
            });

            const data = await response.json();
            if (data.success) {
                this.showNotification('Password updated successfully');
                form.reset();
            } else {
                this.showNotification(data.error, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to update password', 'error');
        }
    }

    handleThemeChange(e) {
        const theme = e.target.value;
        localStorage.setItem('theme', theme);
        this.applyTheme(theme);
    }

    applyTheme(theme) {
        const html = document.documentElement;
        if (theme === 'system') {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                html.classList.add('dark');
            } else {
                html.classList.remove('dark');
            }
        } else if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }

    handlePreferenceChange(key, value) {
        localStorage.setItem(key, value);
        this.showNotification('Preferences updated successfully');
    }

    // Continuing settings.js
    loadPreferences() {
        // Load theme
        const savedTheme = localStorage.getItem('theme') || 'system';
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.value = savedTheme;
            this.applyTheme(savedTheme);
        }

        // Load currency
        const savedCurrency = localStorage.getItem('currency') || 'USD';
        const currencySelector = document.getElementById('currency-selector');
        if (currencySelector) {
            currencySelector.value = savedCurrency;
        }

        // Load date format
        const savedDateFormat = localStorage.getItem('dateFormat') || 'YYYY-MM-DD';
        const dateFormatSelector = document.getElementById('date-format-selector');
        if (dateFormatSelector) {
            dateFormatSelector.value = savedDateFormat;
        }
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

// Initialize settings on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new Settings();
});