document.addEventListener('DOMContentLoaded', () => {
    const themeSelector = document.getElementById('theme-selector');
    const passwordForm = document.getElementById('password-form');

    // Load current theme preference
    themeSelector.value = localStorage.getItem('theme') || 'light';

    // Theme change handler
    themeSelector.addEventListener('change', async (e) => {
        const theme = e.target.value;
        try {
            const response = await fetch('/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ theme })
            });

            if (response.ok) {
                localStorage.setItem('theme', theme);
                document.documentElement.classList.toggle('dark', theme === 'dark');
                showNotification('Theme updated successfully', 'success');
            }
        } catch (error) {
            showNotification('Failed to update theme', 'error');
        }
    });

    // Password change handler
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(passwordForm);
        
        if (formData.get('new_password') !== formData.get('confirm_password')) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch('/profile', {
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
            if (response.ok) {
                passwordForm.reset();
                showNotification('Password updated successfully', 'success');
            } else {
                showNotification(data.error || 'Failed to update password', 'error');
            }
        } catch (error) {
            showNotification('Failed to update password', 'error');
        }
    });
});