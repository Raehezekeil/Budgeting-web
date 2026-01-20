/**
 * FlowState Auth Client (Amplify Gen 2)
 * Handles Login using AWS Cognito SDK
 */
import { signUp, signIn, signOut } from 'aws-amplify/auth';
import { client } from './src/data-client.js';
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

    // Utility: Set Loading State with Status
    const setLoading = (btn, statusText) => {
        if (statusText) {
            if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
            btn.textContent = statusText;
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.cursor = 'wait';
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

            setLoading(btn, true);
            errorMsg.style.display = 'none';

            try {
                const { isSignUpComplete, userId, nextStep } = await signUp({
                    username: email,
                    password,
                    options: {
                        userAttributes: { email }
                    }
                });

                if (isSignUpComplete) {
                    window.location.href = '/dashboard.html';
                } else if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
                    // Switch to Verify UI
                    signupForm.style.display = 'none';
                    document.getElementById('verify-form').style.display = 'block';
                    document.getElementById('verify-email').value = email;
                    document.getElementById('auth-footer').style.display = 'none'; // Hide login link during verify
                    showError(''); // Clear errors
                }
            } catch (err) {
                console.error('Signup Error:', err);
                showError(err.message || 'Signup failed.');
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // --- VERIFY HANDLER ---
    const verifyForm = document.getElementById('verify-form');
    if (verifyForm) {
        // Import on demand or assume standard import if using bundler (we need to update imports at top)
        // For now, let's assume imports are available or we add them. 
        // We need confirmSignUp at the top.

        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = verifyForm.querySelector('button[type="submit"]');
            const email = document.getElementById('verify-email').value;
            const code = document.getElementById('verify-code').value;

            setLoading(btn, true);
            errorMsg.style.display = 'none';

            try {
                // We need to import confirmSignUp. 
                // Since this is a replacement block, we can't easily change top-level imports here without another tool call.
                // We will use the dynamically imported version if needed or assume user fixes imports. 
                // Actually, best to update imports in a separate call or use a clever dynamic import if possible.
                // PLEASE NOTE: I will update imports in the next step.

                // Temporary usage of global (if exposed) or we'll fix imports next.
                // Let's rely on the next step to fix the import.
                const { confirmSignUp } = await import('aws-amplify/auth');
                const { isSignUpComplete, nextStep } = await confirmSignUp({ username: email, confirmationCode: code });

                // Auto sign in or redirect to login
                // Auto sign in or redirect to login
                // window.location.href = '/login.html'; // OLD

                // NEW: Show Login UI inline
                if (document.getElementById('verify-form')) document.getElementById('verify-form').style.display = 'none';
                if (document.getElementById('login-container')) document.getElementById('login-container').style.display = 'block';
                showError('Verification successful! Please log in.');
            } catch (err) {
                console.error('Verify Error:', err);
                showError(err.message || 'Verification failed.');
            } finally {
                setLoading(btn, false);
            }
        });

        // Resend
        document.getElementById('resend-link').addEventListener('click', async () => {
            const email = document.getElementById('verify-email').value;
            try {
                const { resendSignUpCode } = await import('aws-amplify/auth');
                await resendSignUpCode({ username: email });
                alert('Code resent!');
            } catch (err) {
                showError(err.message);
            }
        });
    }

    // --- LOGIN HANDLER ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            setLoading(btn, 'Authenticating...');
            errorMsg.style.display = 'none';

            try {
                console.log('Attempting sign in for:', email);
                const { isSignedIn, nextStep } = await signIn({ username: email, password });
                console.log('Sign in result:', { isSignedIn, nextStep });

                if (isSignedIn) {
                    // Check for existing profile
                    try {
                        console.log('Checking for existing profile...');
                        const { data: settings } = await client.models.Settings.list();
                        console.log('Profile check result:', settings);

                        if (settings.length > 0) {
                            console.log('Profile found. Redirecting to dashboard...');
                            window.location.href = '/dashboard.html';
                        } else {
                            console.log('No profile found. Redirecting to onboarding...');
                            window.location.href = '/dashboard.html?onboarding=true';
                        }
                    } catch (dbError) {
                        console.error("Error checking profile:", dbError);
                        // Fallback to dashboard if check fails
                        console.log('Fallback redirect to dashboard...');
                        window.location.href = '/dashboard.html';
                    }
                } else {
                    console.warn('Sign in not complete. Next step:', nextStep);
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


    // --- UI TOGGLE LOGIC ---
    const signupContainer = document.getElementById('signup-container');
    const loginContainer = document.getElementById('login-container');
    // const verifyForm already declared above

    // Link: "Already have an account? Log In" (inside signup)
    const toLoginLinks = document.querySelectorAll('.to-login-link, #show-login');
    toLoginLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (signupContainer) signupContainer.style.display = 'none';
            if (verifyForm) verifyForm.style.display = 'none';
            if (loginContainer) loginContainer.style.display = 'block';
            showError(''); // Clear errors
        });
    });

    // Link: "New here? Create Account" (inside login)
    const showSignupLink = document.getElementById('show-signup');
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginContainer) loginContainer.style.display = 'none';
            if (verifyForm) verifyForm.style.display = 'none';
            if (signupContainer) signupContainer.style.display = 'block';
            showError(''); // Clear errors
        });
    }

    // --- LOGOUT HANDLER (Global) ---
    window.handleLogout = async () => {
        try {
            await signOut();
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out: ', error);
            window.location.href = '/';
        }
    };
});
