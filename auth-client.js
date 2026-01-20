/**
 * FlowState Auth Client
 * Handles Login, Signup, and UI Feedback
 */

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-msg');

    // Utility: Show Error
    const showError = (message) => {
        if (!errorMsg) return;
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        // Shake animation
        errorMsg.style.animation = 'none';
        errorMsg.offsetHeight; /* trigger reflow */
        errorMsg.style.animation = 'shake 0.5s';
    };

    // Utility: Set Loading State
    const setLoading = (btn, isLoading) => {
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = 'Please wait...';
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.textContent = btn.dataset.originalText || 'Submit';
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    };

    // --- SIGNUP HANDLER ---
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button[type="submit"]');

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            setLoading(btn, true);
            errorMsg.style.display = 'none';

            try {
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    // Success! Redirect to Dashboard
                    window.location.href = '/dashboard.html';
                } else {
                    showError(data.error || 'Signup failed. Please try again.');
                }
            } catch (err) {
                console.error(err);
                showError('Network error. Check your connection.');
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // --- LOGIN HANDLER ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            setLoading(btn, true);
            errorMsg.style.display = 'none';

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    // Success! Redirect to Dashboard
                    window.location.href = '/dashboard.html';
                } else {
                    showError(data.error || 'Invalid email or password.');
                }
            } catch (err) {
                console.error(err);
                showError('Network error. Check your connection.');
            } finally {
                setLoading(btn, false);
            }
        });
    }
});
