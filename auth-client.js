/**
 * FlowState Auth Client (Amplify Gen 2)
 * Handles Login using AWS Cognito SDK
 */
import { signUp, signIn, signOut } from 'aws-amplify/auth';
import './src/amplify-config.js'; // Configures Amplify

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

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            // Note: Name might require custom attributes in Cognito or separate DB profile

            setLoading(btn, true);
            errorMsg.style.display = 'none';

            try {
                const { isSignUpComplete, userId, nextStep } = await signUp({
                    username: email,
                    password,
                    options: {
                        userAttributes: {
                            email
                            // name: name // Add if configured in Cognito standard attributes
                        }
                    }
                });

                if (isSignUpComplete) {
                    // Success! Redirect to Dashboard
                    // Note: Ideally show a "Check your email for verification" screen if auto-verify is off
                    // For now, assuming dev/sandbox might auto-verify or we handle it
                    window.location.href = '/dashboard.html';
                } else if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
                    // Need code verification logic
                    showError('Verification code sent to email. Please check (feature pending UI).');
                    // TODO: Redirect to verify page
                }
            } catch (err) {
                console.error('Signup Error:', err);
                showError(err.message || 'Signup failed.');
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
                const { isSignedIn, nextStep } = await signIn({ username: email, password });

                if (isSignedIn) {
                    window.location.href = '/dashboard.html';
                } else {
                    showError('Login requires strict verification.');
                }
            } catch (err) {
                console.error('Login Error:', err);
                showError(err.message || 'Invalid credentials.');
            } finally {
                setLoading(btn, false);
            }
        });
    }


    // --- GLOBAL LOGOUT ---
    window.handleLogout = async () => {
        try {
            await signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    };
});
