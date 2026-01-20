
// --- PORTFOLIO DEMO MODE & ONBOARDING ---

function nextStep(step) {
    document.querySelectorAll('.onboarding-step').forEach(el => el.classList.add('d-none'));
    const target = document.getElementById(`step-${step}`);
    if (target) {
        target.classList.remove('d-none');
        target.classList.add('animate-fade-in');
    }
}

async function finishOnboarding(skip = false) {
    console.log('Finishing Onboarding...');

    // 1. Capture Goal (if not skipped)
    if (!skip) {
        const goalName = document.getElementById('ob-goal-name')?.value;
        const goalAmount = document.getElementById('ob-goal-amount')?.value;

        if (goalName && goalAmount) {
            state.goals.push({
                id: Date.now(),
                name: goalName,
                target: parseFloat(goalAmount) || 1000,
                current: 0,
                type: 'savings',
                active: true,
                linkedCategory: 'none',
                icon: '🚀'
            });
            // Try cloud save (fire and forget)
            try {
                if (typeof client !== 'undefined' && client.models && client.models.Goal) {
                    client.models.Goal.create({
                        name: goalName,
                        targetAmount: parseFloat(goalAmount),
                        currentAmount: 0
                    });
                }
            } catch (e) { console.warn('Cloud save skipped (Demo Mode)', e); }
        }
    }

    // 2. Hide Overlay (Robust)
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) {
        overlay.classList.add('d-none');
        overlay.style.display = 'none'; // Double tap
    }

    // 3. Mark Complete (Local Storage First)
    localStorage.setItem('flowstate_onboarding_complete', 'true');

    // 4. Seed Demo Data if Empty
    // Only if transactions are empty, we assume it's a "fresh" demo user
    if (state.transactions.length === 0) {
        seedDemoData();
    }

    // 5. Refresh
    saveState();
    render();
    if (typeof showToast === 'function') showToast('Welcome to FlowState!');
}

function seedDemoData() {
    console.log('Seeding Portfolio Demo Data...');

    // 1. Transactions
    const now = new Date();
    const subDays = (d) => new Date(now.getTime() - (d * 86400000)).toISOString().split('T')[0];

    const demoTx = [
        { date: subDays(0), type: 'expense', amount: 4.50, category: 'dining', notes: 'Starbucks Coffee' },
        { date: subDays(1), type: 'expense', amount: 15.00, category: 'transport', notes: 'Uber Ride' },
        { date: subDays(2), type: 'expense', amount: 120.00, category: 'groceries', notes: 'Whole Foods Market' },
        { date: subDays(4), type: 'income', amount: 2500.00, category: 'income', notes: 'Salary Deposit' },
        { date: subDays(5), type: 'expense', amount: 14.99, category: 'entertainment', notes: 'Netflix Subscription' },
        { date: subDays(6), type: 'expense', amount: 45.00, category: 'dining', notes: 'Dinner at Mario\'s' },
        { date: subDays(10), type: 'expense', amount: 1200.00, category: 'rent', notes: 'Monthly Rent' },
        { date: subDays(12), type: 'expense', amount: 65.00, category: 'groceries', notes: 'Trader Joe\'s' },
    ];

    demoTx.forEach(t => {
        state.transactions.push({
            id: Date.now() + Math.random(),
            ...t
        });
    });

    // 2. Goals (if empty)
    if (state.goals.length === 0) {
        state.goals.push({
            id: Date.now() + 1,
            name: 'Emergency Fund',
            target: 5000,
            current: 2450,
            type: 'savings',
            icon: '🛡️',
            active: true
        });
    }

    // 3. Budgets
    state.budgets['groceries'] = 500;
    state.budgets['dining'] = 200;
    state.budgets['transport'] = 150;
    state.budgets['entertainment'] = 100;
    state.budgets['rent'] = 1250;

    if (typeof showToast === 'function') showToast('Portfolio Demo Data Loaded 🚀');
}

// Export to window
window.nextStep = nextStep;
window.finishOnboarding = finishOnboarding;
window.seedDemoData = seedDemoData;
