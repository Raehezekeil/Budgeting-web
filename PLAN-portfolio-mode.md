# Plan: Portfolio "Demo Mode" Transformation

> **Goal:** Convert the application into a reliable, high-fidelity "Portfolio Piece".
> **Strategy:** "Facade Pattern" - The app tries to use the backend, but gracefully falls back to **rich local demo data** instantly if anything fails. It *always* looks good.

## 🛑 Current Blockers
1.  **Onboarding Loop:** User is stuck on "Welcome" because `finishOnboarding` fails to save state/hide modal.
2.  **Empty State Risk:** A fresh login has no data, looking "broken" to a recruiter.

---

## 🟢 Phase 1: The "Escape Hatch" (Immediate Fixes)
**Agent: `frontend-specialist`**

- [ ] **Task 1.1: Fix `finishOnboarding` Logic**
    - **Input:** `script.js`
    - **Action:**
        - Ensure overlay is hidden via CSS class manipulation.
        - **Force Save:** `localStorage.setItem('onboarding_complete', 'true')`.
        - **Ignore DB Errors:** If the cloud save fails, don't block the user.
    - **Verify:** User clicks "Let's Flow" -> Dashboard appears.

---

## 🟢 Phase 2: "Demo Mode" Data Engine
**Agent: `frontend-specialist`**

- [ ] **Task 2.1: Create `DemoData` Factory**
    - **Action:** Create a helper that generates:
        - 15 diverse transactions (Uber, Starbucks, Rent, Salary).
        - 5 Budgets (Groceries: Warning level, Rent: On Track).
        - 3 Goals (1 Completed, 1 Active).
    - **Trigger:** On Dashboard load, if `state.transactions.length === 0`:
        - **Auto-Seed:** Inject this data into `state` and save to `localStorage`.
        - **Notify:** Show toast "Empty account detected: Demo Data Loaded for Portfolio".

- [ ] **Task 2.2: Persistence Facade**
    - **Action:** Update `saveState()` to write to `localStorage` *first*, then try DB asynchronously. This ensures data survives a reload even if the API is down.

---

## 🟢 Phase 3: Visual Polish (Recruiter Candy)
**Agent: `frontend-specialist`**

- [ ] **Task 3.1: Confetti & Animations**
    - **Action:** Ensure the "Goal Complete" confetti works reliably.
    - **Action:** Add subtle entry animations for dashboard cards (`animate-fade-in-up`).

---

## ✅ Phase X: Verification
- [ ] **Scenario:** Open Incognito -> Log In (Nuclear Bypass) -> See Onboarding -> Click Skip -> **See Full Dashboard with Data**.
