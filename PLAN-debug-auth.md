# Plan: Debug and Fix Authentication Redirect (Expanded)

> **Goal:** Resolve persistent "silent failure" on login and implement a robust "Nuclear Bypass" strategy with post-login onboarding checks.

## 🛑 Problem Analysis
- **Symptom:** User clicks Sign In -> sees status text -> no redirect.
- **Root Cause Candidate 1:** `client.models.Settings` call is failing/hanging due to strict RLS (Row Level Security) or unauthenticated state during the transition.
- **Root Cause Candidate 2:** Promises are not resolving correctly in the race condition.
- **Root Cause Candidate 3:** Browser security policy is blocking the data fetch before a "real" page navigation.

---

## 🟢 Phase 1: Backend & Configuration Audit
**Agent: `backend-specialist`**

- [ ] **Task 1.1: Verify Amplify Outputs & Config**
    - **Input:** `amplify_outputs.json`, `src/amplify-config.js`
    - **Detail:** Check if `userPoolId`, `userPoolClientId`, and `apiUrl` are populated and match expected format.
    - **Output:** Verified configuration.

- [ ] **Task 1.2: Verify Data Model Schema**
    - **Input:** `amplify/data/resource.ts`
    - **Detail:** Confirm `Settings` model allows `allow.owner()` for `create`, `read`, `update`.
    - **Goal:** Ensure the "Profile Check" *can* actually succeed if we run it.

---

## 🟢 Phase 2: Frontend Refactor (The "Nuclear Bypass")
**Agent: `frontend-specialist`**

- [ ] **Task 2.1: Implement "Nuclear Option" in `auth-client.js`**
    - **Action:** Remove ALL data fetching logic from the login success block.
    - **Logic:**
        ```javascript
        if (isSignedIn) {
            setLoading(btn, 'Success! Redirecting...');
            window.location.href = '/dashboard.html';
        }
        ```
    - **Goal:** Guaranteed entry to the app.

- [ ] **Task 2.2: Implement "Deferred Onboarding Check" in `dashboard.js`**
    - **Action:** In `dashboard.js` (on load):
        1. Wait for Auth (using `fetchAuthSession` or `getCurrentUser`).
        2. Once auth confirmed, run the `client.models.Settings.list()` check.
        3. If NO profile -> Trigger the "Let's Get Started" modal immediately.
    - **Benefit:** If this check hangs, the user is *already* seeing the dashboard UI (skeleton state), which is infinitely better than being stuck on the login screen.

- [ ] **Task 2.3: Clean Up UI Feedback**
    - **Action:** Ensure buttons reset properly if any error occurs. Ensure "Authenticating..." text is cleared on error.

---

## 🟢 Phase 3: Verification & UX Polish
**Agent: `test-engineer`**

- [ ] **Task 3.1: End-to-End Login Test**
    - **Scenario:**
        1. Clear Local Storage / Cookies.
        2. Login with existing user.
        3. Verify immediate redirection (< 500ms).
        4. Verify Dashboard loads.
        5. Verify Onboarding Modal appears *only* if needed.

- [ ] **Task 3.2: Error Boundary Check**
    - **Scenario:** Force a network disconnect then click login.
    - **Verify:** Useful error message appears ("Network Error") instead of hanging.

---

## ✅ Phase X: Final Checklist
- [ ] Login -> Dashboard is instant.
- [ ] No console errors during transition.
- [ ] Onboarding modal works correctly when landing on Dashboard.
- [ ] Code is committed and pushed.
