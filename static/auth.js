// Auth handling
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.get('username'),
                        password: formData.get('password')
                    })
                });

                const data = await response.json();
                
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    showNotification(data.error || 'Login failed', 'error');
                }
            } catch (error) {
                showNotification('An error occurred', 'error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            
            if (formData.get('password') !== formData.get('confirm_password')) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.get('username'),
                        email: formData.get('email'),
                        password: formData.get('password')
                    })
                });

                const data = await response.json();
                
                if (response.ok) {
                    window.location.href = '/login';
                    showNotification('Registration successful! Please login.', 'success');
                } else {
                    showNotification(data.error || 'Registration failed', 'error');
                }
            } catch (error) {
                showNotification('An error occurred', 'error');
            }
        });
    }
});

const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white z-50`;
    notification.textContent = message;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
};