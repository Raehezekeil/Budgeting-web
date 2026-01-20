// --- AUTH CHECK ---
(async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (!data.authenticated) {
            window.location.href = '/login.html';
        } else {
            // Optional: Store user info globally
            window.currentUser = data.user;
            console.log('Logged in as:', data.user.name);
        }
    } catch (err) {
        console.error('Auth check failed', err);
        window.location.href = '/login.html';
    }
})();

// --- LOGOUT ---
async function handleLogout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (e) {
        console.error("Logout failed", e);
        window.location.href = '/login.html';
    }
}
window.handleLogout = handleLogout;

// 1. CONFIG: Categories
const categories = [
    { id: 'uncategorized', name: 'Uncategorized', type: 'expense', icon: '❓', default: 0 },
    { id: 'income', name: 'Income', type: 'income', icon: '💰', default: 0 },
    { id: 'rent', name: 'Rent', type: 'expense', icon: '🏠', default: 1200 },
    { id: 'groceries', name: 'Groceries', type: 'expense', icon: '🍎', default: 450 },
    { id: 'transport', name: 'Transport', type: 'expense', icon: '🚌', default: 100 },
    { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: '🎬', default: 100 },
    { id: 'dining', name: 'Dining Out', type: 'expense', icon: '🍜', default: 150 }
];

// 2. BRAND LOGO MAPPING
const brandMap = {
    'uber': 'uber.com',
    'lyft': 'lyft.com',
    'taco bell': 'tacobell.com',
    'mcdonalds': 'mcdonalds.com',
    'whole foods': 'wholefoodsmarket.com',
    'spotify': 'spotify.com',
    'netflix': 'netflix.com',
    'amazon': 'amazon.com',
    'apple': 'apple.com',
    'starbucks': 'starbucks.com',
    'shell': 'shell.com',
    'target': 'target.com',
    'walmart': 'walmart.com',
    'cvs': 'cvs.com'
};

// Mobile Sidebar Toggle
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('mobile-overlay');
    if (sb) sb.classList.toggle('show');
    if (ov) {
        if (sb.classList.contains('show')) {
            ov.classList.remove('d-none');
        } else {
            ov.classList.add('d-none');
        }
    }
}
window.toggleSidebar = toggleSidebar;

// --- PERIOD SELECTOR ---
function renderPeriodSelector() {
    const displayMonth = document.getElementById('period-display-month');
    const selectYear = document.getElementById('period-year-select');

    // Safety check: if simple display exists (legacy HTML support)
    const simpleDisplay = document.getElementById('period-display');
    const date = new Date(state.viewPeriod.year, state.viewPeriod.month - 1);

    if (simpleDisplay && !displayMonth) {
        simpleDisplay.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        return;
    }

    if (displayMonth) displayMonth.textContent = date.toLocaleString('default', { month: 'long' });

    if (selectYear) {
        // Populate if empty
        if (selectYear.options.length === 0) {
            const currentYear = new Date().getFullYear();
            for (let y = currentYear - 5; y <= currentYear + 5; y++) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = y;
                selectYear.appendChild(opt);
            }
        }
        selectYear.value = state.viewPeriod.year;
    }
}

function prevPeriod() {
    if (state.viewPeriod.month === 1) {
        state.viewPeriod.month = 12;
        state.viewPeriod.year--;
    } else {
        state.viewPeriod.month--;
    }
    saveState();
    render();
}

function nextPeriod() {
    if (state.viewPeriod.month === 12) {
        state.viewPeriod.month = 1;
        state.viewPeriod.year++;
    } else {
        state.viewPeriod.month++;
    }
    saveState();
    render();
}

function resetPeriod() {
    const now = new Date();
    state.viewPeriod = { year: now.getFullYear(), month: now.getMonth() + 1 };
    saveState();
    render();
}

function setPeriodYear(year) {
    state.viewPeriod.year = parseInt(year);
    saveState();
    render();
}

function getPeriodDateRange() {
    const start = new Date(state.viewPeriod.year, state.viewPeriod.month - 1, 1);
    const end = new Date(state.viewPeriod.year, state.viewPeriod.month, 0); // Last day of month
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

// 3. STATE
let state = {
    settings: { // Kept for legacy compatibility if needed, but we will sync with appSettings
        name: 'Rae Rice',
        email: 'rae@example.com',
        photo: 'images/team1.jpg',
        occupation: 'Designer',
        phone: '',
        location: '',
        dob: '',
        financialGoals: '',
        currency: 'USD',
        startDay: 1,
        notifications: { weekly: true, inactivity: true }
    },
    // New Robust Architecture
    appSettings: {
        profile: {
            name: 'Rae Rice',
            occupation: 'Designer',
            phone: '',
            location: '',
            financialGoals: '',
            currency: 'USD',
            budgetStartDay: 1
        },
        display: {
            dateFormat: 'YYYY-MM-DD',
            darkMode: false
        },
        notifications: {
            weeklySummary: true,
            lowBalance: false
        }
    },
    viewPeriod: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }, // 1-indexed
    transactions: [],
    budgets: {},
    goals: []
};

// 4. INIT
document.addEventListener('DOMContentLoaded', () => {
    checkOnboarding();
    checkInactivity();
    checkInactivity();
    populateCategorySelect();
    populateFilterCategorySelect(); // New
    populateGlobalCategorySelect(); // Global Search
    populateGoalCategorySelect(); // Goals
    setupSettingsListeners(); // NEW: Init Settings Listeners
    setupProfileListeners(); // NEW: Init Profile Listeners
    // renderSettings(); // Removed legacy direct call, lazily loaded via switchView
    updateDateRangeFromSettings();
    processRecurringTransactions(); // Process any due recurring bills

    render();

    // Listeners
    document.getElementById('auto-suggest-btn').addEventListener('click', autoSuggestBudgets);
    document.getElementById('add-form').addEventListener('submit', handleAddTransaction);
    document.getElementById('add-goal-btn').addEventListener('click', handleAddGoal);
    document.getElementById('update-report-btn').addEventListener('click', renderReport);
    // Profile Image Upload
    const pUpload = document.getElementById('profile-upload');
    if (pUpload) pUpload.addEventListener('change', handlePictureUpload);

    // Form Submissions
    if (document.getElementById('settings-form')) document.getElementById('settings-form').addEventListener('submit', handleSaveSettings);
    if (document.getElementById('profile-form')) document.getElementById('profile-form').addEventListener('submit', handleSaveProfile);

    // Period Dropdown
    const pSel = document.getElementById('dash-period-select');
    if (pSel) pSel.addEventListener('change', () => render());

    // Profile & Settings Listeners
    if (document.getElementById('profile-upload')) document.getElementById('profile-upload').addEventListener('change', handlePictureUpload);
    if (document.getElementById('settings-form')) document.getElementById('settings-form').addEventListener('submit', handleSaveSettings);

    // Global Search Listeners
    const searchInput = document.getElementById('val-search');
    const catSelect = document.getElementById('val-category');
    const typeSelect = document.getElementById('val-type');

    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                state.filters.search = searchInput.value.toLowerCase();
                renderFilteredGlobals();
            }, 250);
        });
    }

    if (catSelect) {
        catSelect.addEventListener('change', function () {
            state.filters.category = this.value;
            renderFilteredGlobals();
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener('change', function () {
            state.filters.type = this.value;
            renderFilteredGlobals();
        });
    }

    // INITIAL FETCH
    fetchAllData();
});

async function fetchAllData() {
    try {
        // Transactions
        const txRes = await fetch('/api/data/transactions');
        const txData = await txRes.json();
        state.transactions = txData;

        // Budgets
        const bRes = await fetch('/api/data/budgets');
        const bData = await bRes.json();
        state.budgets = {};
        bData.forEach(b => {
            state.budgets[b.category] = b.limit_amount;
        });

        // Goals
        const gRes = await fetch('/api/data/goals');
        const gData = await gRes.json();
        state.goals = gData;

        // Settings
        const sRes = await fetch('/api/data/settings');
        const sData = await sRes.json();
        if (sData) {
            if (sData.theme) state.appSettings.display.darkMode = (sData.theme === 'dark');
            if (sData.currency) { state.appSettings.profile.currency = sData.currency; state.settings.currency = sData.currency; }
            // ... map other settings ...
        }

        render();
        console.log('Data fetched and rendered');
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// --- GLOBAL SEARCH LOGIC ---

function populateGlobalCategorySelect() {
    const sel = document.getElementById('val-category');
    if (!sel) return;
    // Keep first option
    sel.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icon} ${c.name}`;
        sel.appendChild(opt);
    });
}

function resetFilters() {
    state.filters = { search: '', category: 'all', type: 'all' };
    if (document.getElementById('val-search')) document.getElementById('val-search').value = '';
    if (document.getElementById('val-category')) document.getElementById('val-category').value = 'all';
    if (document.getElementById('val-type')) document.getElementById('val-type').value = 'all';
    renderFilteredGlobals();
}

function getGlobalFilteredTransactions() {
    const { start, end } = getPeriodDateRange();

    return state.transactions.filter(t => {
        // 1. Period Match
        const d = new Date(t.date);
        const inPeriod = d >= start && d <= end;
        if (!inPeriod) return false;

        // 2. Search Match (Notes or Category Name)
        // 2. Search Match (Notes or Category Name)
        let matchesSearch = true;
        if (state.filters.search) {
            const term = state.filters.search.toLowerCase(); // Ensure lowercase
            const catInfo = categories.find(c => c.id === t.category);
            const catName = catInfo ? catInfo.name.toLowerCase() : '';
            const note = (t.notes || '').toLowerCase();
            if (!note.includes(term) && !catName.includes(term)) {
                matchesSearch = false;
            }
        }

        // 3. Category Match
        let matchesCat = true;
        if (state.filters.category !== 'all') {
            if (t.category !== state.filters.category) matchesCat = false;
        }

        // 4. Type Match
        let matchesType = true;
        if (state.filters.type !== 'all') {
            if (t.type !== state.filters.type) matchesType = false;
        }

        return matchesSearch && matchesCat && matchesType;
    });
}

function renderFilteredGlobals() {
    // Re-renders the current view using the filtered dataset
    render();
}


// --- TRANSACTIONS PAGE LOGIC ---

function populateFilterCategorySelect() {
    const sel = document.getElementById('filter-category');
    if (!sel) return;
    // Keep first "All" option
    // sel.innerHTML = '<option value="all">All Categories</option>'; 
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icon} ${c.name}`;
        sel.appendChild(opt);
    });
}

function changeTxMonth(offset) {
    state.txViewDate.setMonth(state.txViewDate.getMonth() + offset);
    renderTransactionsPage();
}

function setTxFilter(type) {
    state.txFilterType = type;
    // Update Button Styles
    const btnAll = document.getElementById('btn-filter-all');
    const btnExp = document.getElementById('btn-filter-exp');
    const btnInc = document.getElementById('btn-filter-inc');

    [btnAll, btnExp, btnInc].forEach(b => {
        b.classList.remove('bg-dark', 'text-white', 'fw-bold');
        b.classList.add('text-muted');
    });

    const activeBtn = type === 'all' ? btnAll : (type === 'expense' ? btnExp : btnInc);
    activeBtn.classList.add('bg-dark', 'text-white', 'fw-bold');
    activeBtn.classList.remove('text-muted');

    renderTransactionsPage();
}

async function deleteTransaction(id) {
    if (confirm("Delete this transaction?")) {
        try {
            const res = await fetch(`/api/data/transactions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                state.transactions = state.transactions.filter(t => t.id !== id);
                render(); // Update Dashboard
                renderTransactionsPage(); // Update List
                showToast("Transaction deleted");
            } else {
                showToast("Error deleting transaction");
            }
        } catch (err) {
            console.error(err);
            showToast("Network error");
        }
    }
}

function renderTransactionsPage(preFilteredTx) {
    const list = document.getElementById('transaction-list-full');
    if (!list) return;
    list.innerHTML = '';

    // 1. Update Header Month
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const m = state.viewPeriod.month - 1;
    const y = state.viewPeriod.year;
    document.getElementById('tx-month-display').textContent = `${monthNames[m]} ${y}`;

    // 2. Base Data: Use Globally Filtered Data if available, otherwise fetch it
    let data = preFilteredTx;
    if (!data) {
        data = getGlobalFilteredTransactions();
    }

    // 3. Apply Page-Specific Filters
    const catFilterEl = document.getElementById('filter-category');
    const catFilter = catFilterEl ? catFilterEl.value : 'all';
    const typeFilter = state.txFilterType; // 'all', 'income', 'expense'

    const filtered = data.filter(t => {
        const matchType = typeFilter === 'all' || t.type === typeFilter;
        const matchCat = catFilter === 'all' || t.category === catFilter;
        return matchType && matchCat;
    });

    if (filtered.length === 0) {
        document.getElementById('tx-empty-state').classList.remove('d-none');
    } else {
        document.getElementById('tx-empty-state').classList.add('d-none');
    }

    // 3. Group by Date
    const grouped = {};
    const nowStr = new Date().toISOString().split('T')[0];
    const yestDate = new Date(); yestDate.setDate(yestDate.getDate() - 1);
    const yestStr = yestDate.toISOString().split('T')[0];

    filtered.forEach(t => {
        let label = t.date;
        if (t.date === nowStr) label = "Today";
        else if (t.date === yestStr) label = "Yesterday";
        else {
            // Format nicer? e.g. "Jan 24"
            const dParts = t.date.split('-'); // YYYY-MM-DD
            label = `${monthNames[parseInt(dParts[1]) - 1]} ${dParts[2]}`;
            // append year if diff? nah, month filter handles it
        }

        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(t);
    });

    // 4. Render Groups
    // Sort labels? If sorting by date descending, keys might mess up order unless we maintain it.
    // Easier: Unique dates sorted descending
    const uniqueDates = [...new Set(filtered.map(t => t.date))].sort().reverse();

    uniqueDates.forEach(dateKey => {
        // Re-derive label
        let label = dateKey;
        if (dateKey === nowStr) label = "Today";
        else if (dateKey === yestStr) label = "Yesterday";
        else {
            const dParts = dateKey.split('-');
            label = `${monthNames[parseInt(dParts[1]) - 1]} ${dParts[2]}`;
        }

        // Group Header
        const header = document.createElement('h6');
        header.className = 'text-muted small fw-bold text-uppercase tracking-wider mt-4 mb-3 ps-3';
        header.textContent = label;
        list.appendChild(header);

        // Card Wrapper for Group
        const card = document.createElement('div');
        card.className = 'card bg-neo-card border-0 shadow-sm rounded-4 overflow-hidden mb-2';
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-0';

        // Render Items inside group
        // Filter filtered list again or just grab from grouped? 
        // We didn't Populate grouped fully sorted. Let's just filter `filtered` for this dateKey
        const dayItems = filtered.filter(t => t.date === dateKey);

        dayItems.forEach((t, idx) => {
            const cat = categories.find(c => c.id === t.category) || { icon: '💸', name: 'Other', id: 'other' };
            const logoUrl = getMerchantLogo(t.notes);
            let iconHtml = `<span class="fs-5">${cat.icon}</span>`;
            if (logoUrl) iconHtml = `<img src="${logoUrl}" class="rounded-circle" width="32" height="32" alt="${t.notes}">`;

            const isExp = t.type === 'expense';
            const displayAmount = isExp ? `-${formatMoney(t.amount)}` : `+${formatMoney(t.amount)}`;
            const colorClass = isExp ? 'text-white' : 'text-green';
            const borderClass = idx === dayItems.length - 1 ? '' : 'border-bottom border-secondary opacity-50'; // Divider

            const div = document.createElement('div');
            div.className = `d-flex justify-content-between align-items-center px-4 py-3 ${borderClass}`;
            div.innerHTML = `
                <div class="d-flex align-items-center gap-3">
                    <div class="icon-box bg-dark rounded-circle d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;">
                        ${iconHtml}
                    </div>
                    <div>
                        <span class="d-block fw-bold text-white">${t.notes}</span>
                        <small class="text-muted" style="font-size: 0.8rem;">${cat.name}</small>
                    </div>
                </div>
                <div class="text-end">
                    <span class="d-block fw-bold ${colorClass}">${displayAmount}</span>
                    <button class="btn btn-link text-muted p-0 text-decoration-none" style="font-size: 0.7rem;" onclick="deleteTransaction(${t.id})">Delete</button>
                </div>
            `;
            cardBody.appendChild(div);
        });

        card.appendChild(cardBody);
        list.appendChild(card);
    });
}
window.renderTransactionsPage = renderTransactionsPage;
window.changeTxMonth = changeTxMonth;
window.setTxFilter = setTxFilter;
window.deleteTransaction = deleteTransaction;


// --- PRESERVED LOGIC ---

function changeBudgetMonth(offset) {
    state.viewDate.setMonth(state.viewDate.getMonth() + offset);
    renderBudgetsPage();
}

function renderBudgetsPage() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const m = state.viewDate.getMonth();
    const y = state.viewDate.getFullYear();
    document.getElementById('budget-month-display').textContent = `${monthNames[m]} ${y}`;
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 0);
    const currentTx = state.transactions.filter(t => {
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd && t.type === 'expense';
    });
    let totalPlanned = 0;
    let totalSpent = 0;
    const list = document.getElementById('budget-rows-container');
    list.innerHTML = '';
    categories.forEach(cat => {
        const budget = state.budgets[cat.id] || 0;
        const spent = currentTx.filter(t => t.category === cat.id).reduce((sum, t) => sum + t.amount, 0);
        totalPlanned += budget;
        totalSpent += spent;
        const remaining = budget - spent;
        const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : (spent > 0 ? 100 : 0);
        let barColor = 'bg-primary';
        let statusText = `${formatMoney(remaining)} left`;
        let statusColor = 'text-muted';
        if (budget === 0 && spent === 0) {
            statusText = 'No limit set';
        } else if (spent > budget) {
            barColor = 'bg-neo-pink';
            statusText = `Over by ${formatMoney(spent - budget)}`;
            statusColor = 'text-neo-pink';
        } else if (percent > 85) {
            barColor = 'bg-warning';
        }

        const col = document.createElement('div');
        col.className = 'col-md-6 col-xl-4';
        col.innerHTML = `
            <div class="card bg-neo-card border-0 shadow-sm p-3 rounded-4 h-100">
                <div class="d-flex align-items-center gap-3 mb-3">
                    <span class="fs-4 bg-dark rounded-circle icon-box text-white">${cat.icon}</span>
                    <div class="flex-grow-1">
                        <h6 class="fw-bold text-white m-0">${cat.name}</h6>
                        <small class="${statusColor}" style="font-size: 0.8rem;">${statusText}</small>
                    </div>
                    <div class="text-end">
                         <div class="input-group input-group-sm" style="width: 100px;">
                            <span class="input-group-text bg-dark border-0 text-muted">$</span>
                            <input type="number" 
                                class="form-control bg-dark border-0 text-white fw-bold text-end" 
                                value="${budget > 0 ? budget : ''}" 
                                placeholder="0"
                                onchange="updateBudget('${cat.id}', this.value)">
                        </div>
                    </div>
                </div>
                 <div class="d-flex justify-content-between mb-1" style="font-size: 0.75rem;">
                    <span class="text-muted">Spent: ${formatMoney(spent)}</span>
                    <span class="text-muted">${percent}%</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar ${barColor}" role="progressbar" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
        list.appendChild(col);
    });
    document.getElementById('bg-total-planned').textContent = formatMoney(totalPlanned);
    document.getElementById('bg-total-spent').textContent = formatMoney(totalSpent);
    const totalLeft = totalPlanned - totalSpent;
    document.getElementById('bg-total-left').textContent = formatMoney(totalLeft);
    const leftEl = document.getElementById('bg-total-left');
    if (totalLeft < 0) { leftEl.className = "fw-bold text-neo-pink m-0 mt-2"; }
    else { leftEl.className = "fw-bold text-green m-0 mt-2"; }
}

async function updateBudget(catId, value) {
    const val = parseFloat(value);

    try {
        const res = await fetch('/api/data/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: catId,
                limit_amount: isNaN(val) ? 0 : val
            })
        });

        if (res.ok) {
            if (isNaN(val) || val < 0) {
                delete state.budgets[catId];
            } else {
                state.budgets[catId] = val;
            }
            renderBudgetsPage();
            render();
            showToast("Budget updated");
        } else {
            showToast("Error updating budget");
        }
    } catch (err) {
        console.error(err);
        showToast("Network error");
    }
}
window.changeBudgetMonth = changeBudgetMonth;
window.updateBudget = updateBudget;


function switchView(viewName) {
    state.currentView = viewName; // Track for shortcuts
    const views = ['dashboard', 'transactions', 'budgets', 'categories', 'goals', 'reports', 'settings', 'profile', 'calendar'];

    // 1. Mobile Sidebar Close
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('mobile-overlay');
    if (sb && sb.classList.contains('show')) {
        sb.classList.remove('show');
        if (ov) ov.classList.add('d-none');
    }

    // 2. Manage View Containers
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) {
            if (v === viewName) {
                el.classList.remove('d-none');
                // Trigger specific renders
                if (v === 'budgets') renderBudgetsPage();
                if (v === 'transactions') renderTransactionsPage();
                if (v === 'categories') renderCategoriesPage();
                if (v === 'goals') renderGoalsPage();
                if (v === 'reports') renderReportsPage(); // Use new page render wrapper
                if (v === 'profile') renderProfilePage();
                if (v === 'settings') renderSettingsPage();
                if (v === 'calendar') renderCalendarPage();
                if (v === 'goals') renderGoalsPage();
            } else {
                el.classList.add('d-none');
            }
        }
    });

    // 3. Manage Tab Styling
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        link.classList.add('text-white');
        if (link.getAttribute('onclick').includes(`'${viewName}'`)) {
            link.classList.add('active');
            link.classList.remove('text-white');
        }
    });

    // Scroll to top
    window.scrollTo(0, 0);
}
window.switchView = switchView;

// --- CATEGORIES LOGIC ---

function renderCategoriesPage() {
    // 1. Clear Lists
    const expList = document.getElementById('cat-list-expense');
    const incList = document.getElementById('cat-list-income');
    if (!expList || !incList) return;

    expList.innerHTML = '';
    incList.innerHTML = '';

    categories.forEach(cat => {
        // Skip system categories from visual list if desired, but "Uncategorized" allows edits? 
        // Let's hide Uncategorized from deletion, but show it for reference?
        // Actually, user wants to manage them. Uncategorized shouldn't be deleted though.

        const isUncat = cat.id === 'uncategorized';

        const li = document.createElement('li');
        li.className = 'list-group-item bg-transparent border-bottom border-secondary opacity-75 py-3 d-flex justify-content-between align-items-center';

        // Delete Button HTML
        const deleteBtn = isUncat ?
            `<span class="text-muted small" title="System Category">🔒</span>` :
            `<button class="btn btn-sm btn-link text-danger p-0 opacity-50 hover-opacity-100" onclick="deleteCategory('${cat.id}')">
                <iconify-icon icon="material-symbols:delete-outline" width="20"></iconify-icon>
             </button>`;

        li.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <span class="fs-4 bg-dark rounded-circle icon-box text-white d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">${cat.icon}</span>
                <span class="fw-bold text-white">${cat.name}</span>
            </div>
            <div class="d-flex gap-3 align-items-center">
                ${deleteBtn}
            </div>
        `;

        if (cat.type === 'income') {
            incList.appendChild(li);
        } else {
            expList.appendChild(li);
        }
    });
}

function promptAddCategory(type) {
    const name = prompt(`Enter name for new ${type} category:`);
    if (!name) return;
    const icon = prompt("Enter an emoji/icon for it (e.g. 🌮):", "🏷️");
    addCategory(name, type, icon || "🏷️");
}

function addCategory(name, type, icon) {
    const id = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Check dupe
    if (categories.find(c => c.id === id)) {
        alert("A category with this name already exists!");
        return;
    }

    categories.push({
        id: id,
        name: name.trim(),
        type: type,
        icon: icon,
        default: 0
    });

    renderCategoriesPage();
    populateCategorySelect(); // Update dropdowns
    populateFilterCategorySelect();
    alert("Category created!");
}

function deleteCategory(id) {
    // 1. Find Usage
    const usageCount = state.transactions.filter(t => t.category === id).length;

    // 2. Confirm
    let msg = `Delete category?`;
    if (usageCount > 0) {
        msg = `This category is used in ${usageCount} transactions.\n\nDelete it and move transactions to 'Uncategorized'?`;
    }

    if (!confirm(msg)) return;

    // 3. Move Transactions
    if (usageCount > 0) {
        state.transactions.forEach(t => {
            if (t.category === id) {
                t.category = 'uncategorized';
            }
        });
    }

    // 4. Remove from Array
    const idx = categories.findIndex(c => c.id === id);
    if (idx > -1) {
        categories.splice(idx, 1);
    }

    // 5. Cleanup Budgets
    if (state.budgets[id]) {
        delete state.budgets[id];
    }

    // 6. Update UI
    renderCategoriesPage();
    populateCategorySelect();
    populateFilterCategorySelect();
    render(); // Update dashboard stats if things moved
}

window.renderCategoriesPage = renderCategoriesPage;
window.promptAddCategory = promptAddCategory;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;

// Check inactivity helper
function checkInactivity() {
    const lastLogin = localStorage.getItem('flowstate_last_login');
    const now = Date.now();
    if (lastLogin) {
        const days = (now - parseInt(lastLogin)) / (1000 * 60 * 60 * 24);
        if (days > 7 && state.settings.notifications.inactivity) {
            setTimeout(() => {
                alert("📣 [Simulated Email]\n\nSubject: We missed you, Rae!\n\nIt's been over a week. Come check your latest budget reports.");
            }, 2000);
        }
    }
    localStorage.setItem('flowstate_last_login', now.toString());
}
window.checkInactivity = checkInactivity;

function simulateEmail() {
    alert("🔄 Connecting to SMTP Server...\n\n✅ SENT!\n\nSubject: Weekly Summary\nTo: " + state.settings.email + "\n\nYour top spending category this week was: " + "Groceries");
}
window.simulateEmail = simulateEmail;

function checkOnboarding() {
    if (!localStorage.getItem('flowstate_setup_v1')) {
        document.getElementById('onboarding-overlay').classList.remove('d-none');
    }
}
function nextStep(stepNum) {
    document.querySelectorAll('.onboarding-step').forEach(el => el.classList.add('d-none'));
    document.getElementById(`step-${stepNum}`).classList.remove('d-none');
}
function finishOnboarding(skipped) {
    state.transactions = [];
    state.budgets = {};
    state.goals = [];
    if (!skipped) {
        const goalName = document.getElementById('ob-goal-name').value;
        const goalAmount = parseFloat(document.getElementById('ob-goal-amount').value);
        if (goalName && goalAmount > 0) {
            state.goals.push({ id: Date.now(), name: goalName, target: goalAmount, current: 0, icon: '🎯' });
        }
    }
    localStorage.setItem('flowstate_setup_v1', 'true');
    document.getElementById('onboarding-overlay').classList.add('d-none');
    render();
    alert("Welcome to FlowState! Your dashboard is ready.");
}
window.nextStep = nextStep;
window.finishOnboarding = finishOnboarding;

function populateCategorySelect() {
    const sel = document.getElementById('t-category');
    if (!sel) return;
    sel.innerHTML = '';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.icon} ${c.name}`;
        sel.appendChild(opt);
    });
}

function updateDateRangeFromSettings() {
    const startDay = parseInt(state.settings.startDay) || 1;
    const now = new Date(); // Uses current date
    const currentDay = now.getDate();
    let start, end;
    if (currentDay >= startDay) {
        start = new Date(now.getFullYear(), now.getMonth(), startDay);
        end = new Date(now.getFullYear(), now.getMonth() + 1, startDay - 1);
    } else {
        start = new Date(now.getFullYear(), now.getMonth() - 1, startDay);
        end = new Date(now.getFullYear(), now.getMonth(), startDay - 1);
    }
    const fmt = d => d.toISOString().split('T')[0];
    const sInput = document.getElementById('report-start');
    const eInput = document.getElementById('report-end');
    if (sInput) sInput.value = fmt(start);
    if (eInput) eInput.value = fmt(end);
    renderReport();
}

function renderSettings() {
    const s = state.settings;

    // Profile Card
    const preview = document.getElementById('profile-preview');
    if (preview) preview.src = s.photo || 'images/team1.jpg';

    if (document.getElementById('profile-display-name')) document.getElementById('profile-display-name').textContent = s.name;
    if (document.getElementById('profile-display-occ')) document.getElementById('profile-display-occ').textContent = s.occupation || 'Member';

    // Stats
    const stats = getProfileStats();
    if (document.getElementById('stat-tx-count')) document.getElementById('stat-tx-count').textContent = stats.txCount;
    if (document.getElementById('stat-months-count')) document.getElementById('stat-months-count').textContent = stats.months;

    // Form Fields
    if (document.getElementById('set-name')) document.getElementById('set-name').value = s.name;
    if (document.getElementById('set-occupation')) document.getElementById('set-occupation').value = s.occupation || '';
    if (document.getElementById('set-dob')) {
        document.getElementById('set-dob').value = s.dob || '';
        if (s.dob) {
            const age = new Date().getFullYear() - new Date(s.dob).getFullYear();
            const ageEl = document.getElementById('age-display');
            if (ageEl) ageEl.textContent = `${age} years old`;
        }
    }
    if (document.getElementById('set-phone')) document.getElementById('set-phone').value = s.phone || '';
    if (document.getElementById('set-location')) document.getElementById('set-location').value = s.location || '';
    if (document.getElementById('set-goals')) document.getElementById('set-goals').value = s.financialGoals || '';

    // App Config
    if (document.getElementById('set-currency')) document.getElementById('set-currency').value = s.currency;
    if (document.getElementById('set-start-day')) document.getElementById('set-start-day').value = s.startDay;

    // Header Updates
    const topName = document.querySelector('h4.fw-semibold');
    if (topName) topName.textContent = `Good Evening, ${s.name.split(' ')[0]}`;
    const topImg = document.querySelector('.rounded-circle[alt="Profile"]');
    if (topImg && s.photo) topImg.src = s.photo;

    // Profile Page Preview Sync (if open)
    const profPreview = document.getElementById('profile-preview');
    if (profPreview && s.photo) profPreview.src = s.photo;

    renderDashboardStatsFooter();
}

// --- PROFILE LOGIC (Restored) ---

function renderProfilePage() {
    const s = state.appSettings.profile; // Sync with new structure

    // Profile Image
    const preview = document.getElementById('profile-preview');
    if (preview && s.photo) preview.src = s.photo;

    // Header & Stats
    if (document.getElementById('profile-display-name')) document.getElementById('profile-display-name').textContent = s.name;
    if (document.getElementById('profile-display-occ')) document.getElementById('profile-display-occ').textContent = s.occupation || 'Member';

    // Profile Stats
    const stats = getProfileStats();
    if (document.getElementById('stat-tx-count')) document.getElementById('stat-tx-count').textContent = stats.txCount;
    if (document.getElementById('stat-months-count')) document.getElementById('stat-months-count').textContent = stats.months;

    // Form Fields
    setInput('prof-name', s.name);
    setInput('prof-occupation', s.occupation);
    setInput('prof-phone', s.phone);
    setInput('prof-location', s.location);
    setInput('prof-goals', s.financialGoals);
}



// --- SETTINGS LOGIC ---

function renderSettingsPage() {
    // 1. Load from State
    const s = state.appSettings;

    // Profile
    setInput('set-name', s.profile.name);
    setInput('set-occupation', s.profile.occupation);
    setInput('set-currency', s.profile.currency);
    setInput('set-start-day', s.profile.budgetStartDay);

    // Display
    setInput('set-dark-mode', s.display.darkMode, true);
    setInput('set-date-format', s.display.dateFormat);
    if (s.display.darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');

    // Notifications
    setInput('set-notif-weekly', s.notifications.weeklySummary, true);
    setInput('set-notif-low', s.notifications.lowBalance, true);
}

function setupProfileListeners() {
    // Attach listeners to Profile inputs
    const inputs = document.querySelectorAll('#view-profile input, #view-profile textarea');
    inputs.forEach(input => {
        if (input.type === 'file') return; // Handled separately
        input.addEventListener('input', debounce((e) => saveProfileField(e.target), 500));
    });

    // Profile Photo Upload
    const uploadInput = document.getElementById('profile-upload');
    if (uploadInput) {
        uploadInput.addEventListener('change', handlePictureUpload);
    }

    // Profile Form Manual Save (Prevent Reload)
    const profForm = document.getElementById('profile-form');
    if (profForm) {
        profForm.addEventListener('submit', handleSaveProfile);
    }
}

function handlePictureUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showToast("Image too large. Max 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
        const result = evt.target.result;

        // Update State
        state.appSettings.profile.photo = result;
        state.settings.photo = result; // Legacy sync

        // Update UI
        const preview = document.getElementById('profile-preview');
        if (preview) preview.src = result;

        const topImg = document.querySelector('.rounded-circle[alt="Profile"]');
        if (topImg) topImg.src = result;

        saveState();
        showToast("Profile photo updated!");
    };
    reader.readAsDataURL(file);
}

function saveProfileField(el) {
    const s = state.appSettings.profile;
    const id = el.id;

    if (id === 'prof-name') s.name = el.value;
    if (id === 'prof-occupation') s.occupation = el.value;
    if (id === 'prof-phone') s.phone = el.value;
    if (id === 'prof-location') s.location = el.value;
    if (id === 'prof-goals') s.financialGoals = el.value;

    saveState();
    // Sync Header if Name changed
    if (id === 'prof-name') {
        renderProfilePage(); // Text update
        renderSettingsPage(); // Sync with Settings input
    }
}

function setupSettingsListeners() {
    // 2. Attach Auto-Save Listeners
    const inputs = document.querySelectorAll('#view-settings input, #view-settings select');
    inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            saveSetting(e.target);
        });
        // specific text inputs might want input event for faster feeling? 
        // Let's stick to change for now to avoid spamming save, or debounce input.
        if (input.type === 'text' || input.type === 'number') {
            input.addEventListener('input', debounce((e) => saveSetting(e.target), 500));
        }
    });

    // 3. Import/Export Listeners
    document.getElementById('btn-export')?.addEventListener('click', exportData);
    document.getElementById('btn-clear-data')?.addEventListener('click', clearAllData);

    // File Import
    const dropzone = document.getElementById('import-dropzone');
    const fileInput = document.getElementById('import-file');
    if (dropzone && fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
        // Drag styling
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-primary'); });
        dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.classList.remove('border-primary'); });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('border-primary');
            if (e.dataTransfer.files.length) handleFileUpload({ target: { files: e.dataTransfer.files } });
        });
    }
}

function setInput(id, val, isCheck = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (isCheck) el.checked = val;
    else el.value = val;
}

function saveSetting(el) {
    const s = state.appSettings;
    const id = el.id;

    if (id === 'set-name') s.profile.name = el.value;
    if (id === 'set-occupation') s.profile.occupation = el.value;
    if (id === 'set-currency') s.profile.currency = el.value;
    if (id === 'set-start-day') s.profile.budgetStartDay = parseInt(el.value);

    if (id === 'set-dark-mode') {
        s.display.darkMode = el.checked;
        document.body.classList.toggle('dark-mode', el.checked);
    }
    if (id === 'set-date-format') s.display.dateFormat = el.value;

    if (id === 'set-notif-weekly') s.notifications.weeklySummary = el.checked;
    if (id === 'set-notif-low') s.notifications.lowBalance = el.checked;

    // Sync Legacy State
    state.settings.currency = s.profile.currency;
    state.settings.startDay = s.profile.budgetStartDay;
    state.settings.name = s.profile.name;

    // Persist
    saveState();

    // Side Effects
    if (id === 'set-currency' || id === 'set-start-day') {
        render(); // Re-render currency symbols / dates
    }

    // Visual Feedback
    showToast("Setting saved");

    // Sync with API
    try {
        fetch('/api/data/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                theme: state.appSettings.display.darkMode ? 'dark' : 'light',
                currency: state.appSettings.profile.currency,
                language: 'en'
            })
        });
    } catch (e) { console.error("Sync failed", e); }
}

function toggleSection(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('d-none');
}
window.toggleSection = toggleSection;

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Toast helper
function showToast(msg) {
    // Create simple toast if not exists
    let toast = document.getElementById('toast-msg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-msg';
        toast.className = 'position-fixed bottom-0 end-0 m-4 bg-dark text-white px-4 py-2 rounded-pill shadow-sm transition-all opacity-0';
        toast.style.zIndex = '9999';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.remove('opacity-0', 'translate-y-5');
    setTimeout(() => toast.classList.add('opacity-0'), 2000);
}

// --- DATA MANAGEMENT ---

function exportData() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowstate_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function clearAllData() {
    if (confirm("⚠️ ARE YOU SURE?\n\nThis will permanently delete ALL transactions, budgets, and settings.\nThere is no undo.")) {
        localStorage.removeItem('flowstate_data_v1'); // Assuming this key
        localStorage.removeItem('flowstate_setup_v1');
        location.reload();
    }
}



function handleSaveProfile(e) {
    e.preventDefault();
    const s = state.appSettings.profile;

    s.name = document.getElementById('prof-name').value;
    s.occupation = document.getElementById('prof-occupation').value;
    s.phone = document.getElementById('prof-phone').value;
    s.location = document.getElementById('prof-location').value;
    s.financialGoals = document.getElementById('prof-goals').value;

    state.settings.name = s.name; // Legacy Sync

    saveState();
    renderProfilePage();

    // Update Header Name
    const topName = document.querySelector('h4.fw-semibold');
    if (topName) topName.textContent = `Good Evening, ${s.name.split(' ')[0]}`;

    showToast("Profile saved successfully!");
}

function triggerFileSelect() {
    document.getElementById('profile-upload').click();
}

function getProfileStats() {
    const txCount = state.transactions.length;
    let months = 0;
    let memberSince = new Date().getFullYear();

    if (txCount > 0) {
        // Unique months
        const unique = new Set(state.transactions.map(t => t.date.substring(0, 7)));
        months = unique.size;
        // Oldest tx
        const oldest = state.transactions[state.transactions.length - 1].date; // Assumes desc order
        memberSince = new Date(oldest).getFullYear();
    }

    // Simulating "Member Since" if no transactions, use current year or hardcoded
    return { txCount, months, memberSince };
}

function renderDashboardStatsFooter() {
    const footer = document.getElementById('dash-footer-stats');
    if (!footer) return;
    const stats = getProfileStats();
    footer.innerHTML = `
        <small class="text-muted d-block text-center mt-4 mb-2">
            Member since ${stats.memberSince} • <strong>${stats.txCount}</strong> transactions tracked across <strong>${stats.months}</strong> months.
        </small>
    `;
}

// Make globally available
window.triggerFileSelect = triggerFileSelect;
window.handlePictureUpload = handlePictureUpload;

function autoSuggestBudgets() {
    state.budgets = {};
    categories.forEach(cat => {
        state.budgets[cat.id] = cat.default;
    });
    document.getElementById('budget-empty-state').classList.add('d-none');
    render();
    renderBudgetsPage(); // Update budget page if open
}

async function handleAddTransaction(e) {
    e.preventDefault();
    const isIncome = document.getElementById('type-inc').checked;
    const amount = parseFloat(document.getElementById('t-amount').value);
    const category = document.getElementById('t-category').value;
    const dateVal = document.getElementById('t-date').value;
    const notes = document.getElementById('t-notes').value;

    // Recurring Fields
    const isRecurring = document.getElementById('t-recurring').checked;
    const frequency = document.getElementById('t-frequency').value;

    if (!amount || amount <= 0) return;
    const now = new Date();
    // Default to today if date not set
    let dateObj = dateVal ? new Date(dateVal) : now;
    // Handle 'yesterday' legacy keyword or specific date
    /* if (dateVal === 'yesterday') ... (legacy logic handled by date input being YYYY-MM-DD now?) */
    // The HTML input type="date" returns YYYY-MM-DD. If empty, we use today.
    if (!dateVal) {
        dateObj = now;
    }
    const dateStr = dateObj.toISOString().split('T')[0];

    // 1. Transaction Object (Prepare for API)
    const newTxPayload = {
        type: isIncome ? 'income' : 'expense',
        amount: amount,
        category: category,
        date: dateStr,
        notes: notes || (isIncome ? 'Income' : 'Expense')
    };

    try {
        const res = await fetch('/api/data/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTxPayload)
        });
        const savedTx = await res.json();

        if (res.ok) {
            state.transactions.unshift(savedTx);
            showToast("Transaction added");

            // Auto-track Goals
            checkGoalAutoTrack(savedTx);

            // Reset Form
            e.target.reset();
            document.getElementById('type-exp').checked = true;
            document.getElementById('t-recurring').checked = false;
            document.getElementById('rec-opts').classList.add('d-none');

            // Render
            render();
            renderBudgetsPage();
            renderTransactionsPage();
        } else {
            showToast("Error adding transaction");
        }
    } catch (err) {
        console.error(err);
        showToast("Network error");
    }

    // 2. Recurring Rule (Still local for now, or update API to support it?)
    // Leaving recurring as local-only or todo for later API expansion
    if (isRecurring) {
        // ... (Keep existing recurring logic if it stores locally, or warn user)
        showToast("Recurring support coming to API soon!");
    }
}

function calculateNextDue(currentDateStr, freq) {
    const d = new Date(currentDateStr);
    // Correct for timezone offset if needed, but assuming simple date math
    // Set to noon to avoid DST/midnight issues
    d.setHours(12, 0, 0, 0);

    if (freq === 'daily') d.setDate(d.getDate() + 1);
    if (freq === 'weekly') d.setDate(d.getDate() + 7);
    if (freq === 'monthly') d.setMonth(d.getMonth() + 1);
    if (freq === 'yearly') d.setFullYear(d.getFullYear() + 1);

    return d.toISOString().split('T')[0];
}

function processRecurringTransactions() {
    if (!state.recurring) state.recurring = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr); // Compare strings or midnight dates

    let addedCount = 0;

    state.recurring.forEach(rule => {
        if (!rule.active) return;

        // While due date is in the past or today...
        // Use a loop to catch up missed recurring (e.g. if app wasn't opened for a month)
        // Guard against infinite loop with max iterations
        let loops = 0;
        while (new Date(rule.nextDue) <= today && loops < 12) {
            // Check Smart Skip (Duplicate Detection)
            // Look for a transaction with same Amount + Category within +/- 2 days of due date
            const dueDate = new Date(rule.nextDue);
            const isDupe = state.transactions.some(t => {
                if (t.amount !== rule.amount || t.category !== rule.category) return false;
                const tDate = new Date(t.date);
                const diff = Math.abs(tDate - dueDate);
                return diff < (86400000 * 3); // 3 days buffer
            });

            if (!isDupe) {
                const newTx = {
                    id: Date.now() + Math.random(), // Unique ID
                    type: rule.type,
                    amount: rule.amount,
                    category: rule.category,
                    date: rule.nextDue,
                    notes: rule.notes + ' (Auto)'
                };
                state.transactions.unshift(newTx);
                addedCount++;
            }

            // Advance Date
            rule.nextDue = calculateNextDue(rule.nextDue, rule.frequency);
            loops++;
        }
    });

    if (addedCount > 0) {
        saveState();
        showToast(`Processed ${addedCount} recurring bills`);
        render(); // Update views with new data
    }
}

function renderUpcomingTransactions() {
    const list = document.getElementById('upcoming-list');
    if (!list) return;
    list.innerHTML = '';

    if (!state.recurring || state.recurring.length === 0) {
        list.innerHTML = '<li class="list-group-item bg-transparent text-muted text-center small border-0 py-4">No recurring bills set up.</li>';
        return;
    }

    // Sort by next due
    const upcoming = state.recurring
        .filter(r => r.active)
        .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
        .slice(0, 5); // Show top 5

    upcoming.forEach(r => {
        const due = new Date(r.nextDue);
        // Fix timezone display issue by treating it as local YMD
        const parts = r.nextDue.split('-');
        const localDue = new Date(parts[0], parts[1] - 1, parts[2]);

        const dayName = localDue.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = localDue.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const cat = categories.find(c => c.id === r.category) || { icon: '📅', name: 'Bill' };

        const li = document.createElement('li');
        li.className = 'list-group-item bg-transparent border-bottom border-secondary opacity-75 d-flex justify-content-between align-items-center py-3';
        li.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <div class="text-center bg-dark rounded px-2 py-1" style="min-width: 50px;">
                    <small class="d-block text-danger fw-bold lh-1" style="font-size: 0.65rem;">${dayName.toUpperCase()}</small>
                    <span class="d-block text-white fw-bold fs-5 lh-1">${localDue.getDate()}</span>
                </div>
                <div>
                    <span class="d-block text-white fw-medium">${r.notes || cat.name}</span>
                    <small class="text-muted" style="font-size: 0.8rem;">${r.frequency}</small>
                </div>
            </div>
            <span class="fw-bold text-white">${formatMoney(r.amount)}</span>
        `;
        list.appendChild(li);
    });
}

async function handleAddGoal() {
    const name = prompt("Name your new goal:");
    if (!name) return;
    const target = parseFloat(prompt("Target amount ($):"));
    if (!target) return;

    try {
        const res = await fetch('/api/data/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                target_amount: target,
                current_amount: 0,
                deadline: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
            })
        });

        const savedGoal = await res.json();

        if (res.ok) {
            state.goals.push({
                id: savedGoal.id,
                name: savedGoal.name,
                target: savedGoal.target_amount,
                current: savedGoal.current_amount,
                icon: '🎯'
            });
            if (typeof renderGoalsPage === 'function') renderGoalsPage();
            else if (typeof renderGoals === 'function') renderGoals();
            else render(); // Fallback

            showToast("Goal created!");
        } else {
            showToast("Error creating goal");
        }
    } catch (err) {
        showToast("Network error");
    }
}

function depositToGoal(id) {
    const amount = 50;
    const goal = state.goals.find(g => g.id === id);
    if (goal) { goal.current += amount; renderGoals(); }
}

function render() {
    try {
        renderPeriodSelector();

        // Use Global Filter Logic
        const periodTx = getGlobalFilteredTransactions();

        // Update Filter Count UI
        const countEl = document.getElementById('filter-count');
        if (countEl) {
            const totalInPeriod = state.transactions.filter(t => {
                const d = new Date(t.date);
                const { start, end } = getPeriodDateRange();
                return d >= start && d <= end;
            }).length;

            if (state.filters.search || state.filters.category !== 'all' || state.filters.type !== 'all') {
                countEl.textContent = `${periodTx.length} / ${totalInPeriod} found`;
            } else {
                countEl.textContent = '';
            }
        }

        renderBudgetGrid(periodTx);
        renderSummary(periodTx);
        renderMiniTransactions(periodTx);
        renderGoals();

        // Updated Dashboard Elements
        renderDashboardUpgrade(periodTx);
        renderUpcomingTransactions(); // Render upcoming bills
        renderDashboardStatsFooter();

        renderReport(periodTx);
        renderTransactionsPage(periodTx);
    } catch (e) {
        console.error("Render Error:", e);
        // Fallback or alert?
    }
}

// --- NEW DASHBOARD LOGIC ---

// --- DATA IMPORT LOGIC ---
let pendingImportData = [];

function handleFileUpload(e) {
    const files = e.target.files;
    if (!files.length) return;
    const file = files[0];

    // 1. Size Check
    if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (evt) {
        const text = evt.target.result;
        if (file.name.endsWith('.csv')) {
            processCSV(text);
        } else if (file.name.endsWith('.json')) {
            processJSON(text);
        } else {
            alert("Unsupported format. Use CSV or JSON.");
        }
    }
    reader.readAsText(file);
}

function processCSV(text) {
    // 1. Strict Column Order: Date, Type, Amount, Category, Notes
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) return alert("Empty CSV");

    // Header Check
    const header = lines[0].toLowerCase();
    if (!header.includes('date') || !header.includes('type') || !header.includes('amount')) {
        alert("Invalid CSV format. Expected: Date, Type, Amount, Category, Notes");
        return;
    }

    const parsed = [];
    const errors = [];

    // Parse Rows
    for (let i = 1; i < lines.length; i++) {
        // Simple Split (Naive, but fits requirements "no libraries")
        // Handling quotes is complex without library, assume clean CSV for now as per prompt request "simple regex"
        // Let's use flexible split
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

        if (cols.length < 3) continue; // Skip malformed

        const [date, type, amt, cat, notes] = cols;

        // Validation
        const amount = parseFloat(amt);
        if (!Date.parse(date) || isNaN(amount)) {
            errors.push(`Row ${i + 1}: Invalid date or amount`);
            continue;
        }

        parsed.push({
            id: Date.now() + i, // Temp ID
            date: new Date(date).toISOString().split('T')[0],
            type: type.toLowerCase().includes('inc') ? 'income' : 'expense',
            amount: Math.abs(amount),
            category: cat ? cat.toLowerCase() : 'uncategorized',
            notes: notes || 'Importec CSV'
        });
    }

    if (parsed.length === 0) return alert("No valid transactions found.");

    // Check Duplicates (naive check based on date/amount/notes)
    const unique = [];
    let dupeCount = 0;
    parsed.forEach(p => {
        const isDupe = state.transactions.some(t =>
            t.date === p.date && t.amount === p.amount && t.notes === p.notes
        );
        if (isDupe) dupeCount++;
        else unique.push(p);
    });

    if (dupeCount > 0) {
        if (confirm(`Found ${dupeCount} duplicates. Skip them?\nClick OK to Import Only New (${unique.length})\nClick Cancel to Import ALL (${parsed.length})`)) {
            pendingImportData = unique;
        } else {
            pendingImportData = parsed;
        }
    } else {
        pendingImportData = parsed;
    }

    previewImport(pendingImportData);
}

function processJSON(text) {
    try {
        const data = JSON.parse(text);
        if (!data.transactions || !Array.isArray(data.transactions)) {
            throw new Error("Invalid Backup JSON");
        }
        // Basic check passed
        pendingImportData = data.transactions; // Limit to transactions for now, or full restore?
        // Prompt says "JSON (full backup)". Let's assume we restore everything?
        // But the requirements say "Preview imported data". 
        // Let's preview transactions.
        previewImport(pendingImportData);
    } catch (e) {
        alert("JSON Parse Error: " + e.message);
    }
}

function previewImport(list) {
    const previewArea = document.getElementById('import-preview-area');
    const tbody = document.getElementById('import-preview-body');
    const stats = document.getElementById('import-stats');
    const confirmBtn = document.getElementById('btn-confirm-import');
    const cancelBtn = document.getElementById('btn-cancel-import');

    if (!previewArea || !tbody) return;

    previewArea.classList.remove('d-none');
    stats.textContent = `${list.length} valid items found`;
    tbody.innerHTML = '';

    // Show first 10
    list.slice(0, 10).forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.date}</td>
            <td>${t.type}</td>
            <td>${formatMoney(t.amount)}</td>
            <td>${t.category}</td>
            <td>${t.notes}</td>
        `;
        tbody.appendChild(tr);
    });

    if (list.length > 10) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="5" class="text-center text-muted">...and ${list.length - 10} more</td>`;
        tbody.appendChild(tr);
    }

    // Listeners (clones to remove old listeners)
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    document.getElementById('btn-confirm-import').addEventListener('click', () => {
        if (list.length === 0) return;
        state.transactions.push(...list);

        // We might also want to merge categories if they don't exist?
        // For now, let's just stick to transactions.

        saveState();
        render(); // Update all views

        previewArea.classList.add('d-none');
        document.getElementById('import-file').value = ''; // Reset input
        showToast(`Successfully imported ${list.length} transactions!`);

        // Go to Transactions Page to see results?
        // User didn't request explicit navigation, but refresh.
    });

    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    document.getElementById('btn-cancel-import').addEventListener('click', () => {
        pendingImportData = [];
        previewArea.classList.add('d-none');
        document.getElementById('import-file').value = '';
    });
}

// --- CALENDAR LOGIC ---

function changeCalendarMonth(offset) {
    if (offset === 0) {
        state.calViewDate = new Date();
    } else {
        state.calViewDate.setMonth(state.calViewDate.getMonth() + offset);
    }
    renderCalendarPage();
}

function renderCalendarPage() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('cal-month-display');
    if (!grid) return;

    const viewDate = state.calViewDate;
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-indexed

    // Header
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (label) label.textContent = `${monthNames[month]} ${year}`;

    // Grid Calc
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Prepare Data
    const dayMap = {}; // { 1: [], 2: [] ... }

    // 1. Actuals
    state.transactions.forEach(t => {
        const d = new Date(t.date);
        // Look for match in CURRENT view month
        if (d.getFullYear() === year && d.getMonth() === month) {
            const dayNum = d.getDate();
            if (!dayMap[dayNum]) dayMap[dayNum] = [];
            dayMap[dayNum].push({ type: 'actual', data: t });
        }
    });

    // 2. Projections (Recurring)
    // Only project if viewed month is >= current month (roughly) or simply project forward from nextDue
    if (state.recurring) {
        state.recurring.forEach(r => {
            if (!r.active) return;
            // logic: iterate from r.nextDue. If instance falls in viewMonth, add it.
            // Stop if instance > viewMonth end.
            let ptr = new Date(r.nextDue);
            const viewEnd = new Date(year, month + 1, 0);
            const viewStart = new Date(year, month, 1);

            // Safety: max 5 years forward
            let limit = 0;
            while (ptr <= viewEnd && limit < 60) { // 60 loops ~ 12 monthly * 5 years
                if (ptr >= viewStart && ptr <= viewEnd) {
                    const dayNum = ptr.getDate();
                    if (!dayMap[dayNum]) dayMap[dayNum] = [];
                    // Avoid dupe if actual exists? 
                    // Naive check: if we have an ACTUAL with same amount/cat on this day, skip projection
                    const hasActual = dayMap[dayNum].some(i =>
                        i.type === 'actual' && i.data.amount === r.amount && i.data.category === r.category
                    );

                    if (!hasActual) {
                        dayMap[dayNum].push({ type: 'projected', data: r });
                    }
                }
                // Advance
                ptr = new Date(calculateNextDue(ptr.toISOString().split('T')[0], r.frequency));

                // Optimization: if freq is yearly/monthly and we are far past, break
                if (ptr > viewEnd) break;
                limit++;
            }
        });
    }

    grid.innerHTML = '';

    // Render Empty Slots
    for (let i = 0; i < firstDay; i++) {
        const cel = document.createElement('div');
        cel.className = 'bg-transparent';
        grid.appendChild(cel);
    }

    // Render Days
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayNum = today.getDate();

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        const isToday = isCurrentMonth && d === todayNum;
        const bgClass = isToday ? 'bg-dark border-primary' : 'bg-dark';
        const borderClass = isToday ? 'border border-2' : 'border border-secondary opacity-75';

        const items = dayMap[d] || [];

        let pills = '';
        items.slice(0, 3).forEach(item => { // limit to 3
            const tx = item.data;
            const isExp = (tx.type === 'expense');
            const color = isExp ? 'text-white' : 'text-green';
            const opacity = item.type === 'projected' ? 'opacity-50' : '';
            const icon = item.type === 'projected' ? '⏳' : '';
            // tiny dot style
            pills += `<div class="d-flex align-items-center gap-1 small ${color} ${opacity}" style="font-size: 0.65rem; white-space: nowrap; overflow: hidden;">
                <span>${isExp ? '•' : '+'}</span>
                <span class="text-truncate">${icon}${formatMoney(tx.amount)}</span>
            </div>`;
        });

        if (items.length > 3) {
            pills += `<div class="text-muted small lh-1" style="font-size: 0.6rem;">+${items.length - 3} more</div>`;
        }

        cell.className = `rounded-3 p-2 d-flex flex-column h-100 ${bgClass} ${borderClass}`;
        cell.style.minHeight = '100px';
        cell.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span class="fw-bold ${isToday ? 'text-primary' : 'text-muted'}">${d}</span>
            </div>
            <div class="d-flex flex-column gap-1 overflow-hidden">
                ${pills}
            </div>
        `;
        grid.appendChild(cell);
    }
}
window.changeCalendarMonth = changeCalendarMonth;
window.renderCalendarPage = renderCalendarPage;

function checkGoalAutoTrack(tx) {
    if (!state.goals) return;
    let updated = false;
    state.goals.forEach(g => {
        if (g.completed) return;
        // Logic: if goal is savings, we look for 'income' or specific category?
        // Actually, user might link "Vacation" goal to "Vacation" category (Expense).
        // If it's a "savings" goal, usually transferring money TO it is an expense in normal tracking, 
        // OR it's income tagged as 'savings'.
        // Let's use exact category match.
        // If type is 'savings' and we have an Expense carrying that category, it means we 'spent' money into that bucket?
        // Or if type is 'debt', an expense means paying it off.

        if (tx.category === g.linkedCategory) {
            // Check direction?
            // For now, assume any transaction in that category counts towards the progress.
            // Absolute value to be safe.
            const amt = Math.abs(tx.amount);
            g.current += amt;
            if (g.current >= g.target) {
                g.current = g.target;
                g.completed = true;
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                showToast(`🎉 Goal Reached: ${g.name}!`);
            } else {
                showToast(`Goal Updated: ${g.name} (+${formatMoney(amt)})`);
            }
            updated = true;
        }
    });
    if (updated) {
        saveState();
        renderGoalsPage(); // Refresh if open
    }
}

function renderGoalsPage() {
    const list = document.getElementById('goals-list');
    if (!list) return;

    const activeCount = state.goals.filter(g => !g.completed).length;
    if (document.getElementById('active-goals-count')) document.getElementById('active-goals-count').textContent = activeCount;

    list.innerHTML = '';

    // Sort: Active first, then by due date
    const sorted = [...state.goals].sort((a, b) => {
        if (a.completed === b.completed) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return a.completed ? 1 : -1;
    });

    if (sorted.length === 0) {
        list.innerHTML = `<div class="text-center py-5 text-muted">No goals yet. Dream big!</div>`;
        return;
    }

    sorted.forEach(g => {
        const pct = Math.min(100, Math.round((g.current / g.target) * 100));
        const rem = g.target - g.current;
        const color = g.type === 'savings' ? 'var(--bs-success)' : 'var(--bs-warning)'; // Green vs Orange
        // Conic Gradient
        const gradient = `conic-gradient(${color} ${pct}%, #2c2d30 ${pct}% 100%)`;

        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        card.innerHTML = `
            <div class="card bg-neo-card border-0 rounded-4 shadow-sm h-100 position-relative overflow-hidden">
                ${g.completed ? '<div class="position-absolute top-0 end-0 bg-success text-white px-3 py-1 rounded-bl-3 small fw-bold">COMPLETED</div>' : ''}
                <div class="card-body p-4 d-flex flex-column">
                    <div class="d-flex align-items-center gap-3 mb-4">
                        <div class="position-relative d-flex justify-content-center align-items-center" style="width: 80px; height: 80px;">
                            <div class="rounded-circle" style="width: 100%; height: 100%; background: ${gradient};"></div>
                            <div class="position-absolute bg-neo-card rounded-circle d-flex justify-content-center align-items-center" style="width: 65px; height: 65px; top: 7.5px; left: 7.5px;">
                                <span class="fw-bold text-white small">${pct}%</span>
                            </div>
                        </div>
                        <div>
                            <span class="badge bg-dark text-muted mb-1 rounded-pill border border-secondary font-monospace" style="font-size: 0.65rem;">${g.type.toUpperCase()}</span>
                            <h5 class="fw-bold text-white m-0">${g.name}</h5>
                            <small class="text-muted">${g.subTitle || 'Keep going!'}</small>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="d-flex justify-content-between text-muted small mb-1">
                            <span>Current</span>
                            <span>Target</span>
                        </div>
                        <div class="d-flex justify-content-between fw-bold text-white">
                            <span>${formatMoney(g.current)}</span>
                            <span>${formatMoney(g.target)}</span>
                        </div>
                    </div>

                    <div class="mt-auto d-flex justify-content-between align-items-center pt-3 border-top border-secondary opacity-75">
                         <div class="d-flex align-items-center gap-2">
                            ${!g.completed ? `
                            <button class="btn btn-sm btn-outline-light rounded-circle" style="width:32px;height:32px" onclick="quickAddGoal(${g.id}, 50)" title="Add $50">+50</button>
                            <button class="btn btn-sm btn-outline-light rounded-circle" style="width:32px;height:32px" onclick="quickAddGoal(${g.id}, 100)" title="Add $100">+100</button>
                            ` : ''}
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-link text-muted p-0" data-bs-toggle="dropdown">•••</button>
                            <ul class="dropdown-menu dropdown-menu-dark">
                                <li><a class="dropdown-item" href="#" onclick="editGoal(${g.id})">Edit</a></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteGoal(${g.id})">Delete</a></li>
                            </ul>
                        </div>
                    </div>
                     <small class="text-muted d-block mt-2" style="font-size: 0.7rem;">
                        ${g.linkedCategory !== 'none' ? `Tracks: ${getCategoryName(g.linkedCategory)}` : 'Manual Entry'}
                     </small>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function quickAddGoal(id, amt) {
    const g = state.goals.find(x => x.id === id);
    if (!g) return;
    g.current += amt;
    if (g.current >= g.target) {
        g.current = g.target;
        g.completed = true;
        // Confetti if available
        if (typeof confetti === 'function') confetti();
        showToast(`🎉 ${g.name} Completed!`);
    } else {
        showToast(`Added $${amt} to ${g.name}`);
    }
    saveState();
    renderGoalsPage();
}

function handleAddGoalSubmit(e) {
    e.preventDefault();
    // Logic to parse form and add to state.goals
    // For brevity, assuming similar structure to others
    const name = document.getElementById('goal-name').value;
    const target = parseFloat(document.getElementById('goal-target').value);
    const type = document.getElementById('goal-type').value;
    const linked = document.getElementById('goal-cat').value;

    state.goals.push({
        id: Date.now(),
        name,
        type, // 'savings' or 'debt'
        target,
        current: 0,
        linkedCategory: linked,
        active: true,
        dueDate: document.getElementById('goal-date').value
    });
    saveState();
    renderGoalsPage();
    bootstrap.Modal.getInstance(document.getElementById('goalModal')).hide();
    e.target.reset();
}

function deleteGoal(id) {
    if (!confirm("Delete this goal?")) return;
    state.goals = state.goals.filter(g => g.id !== id);
    saveState();
    renderGoalsPage();
}
function editGoal(id) {
    alert("Edit feature coming in next update!");
}
// Helper
function getCategoryName(id) {
    const c = categories.find(x => x.id === id);
    return c ? c.name : id;
}

window.renderGoalsPage = renderGoalsPage;
window.quickAddGoal = quickAddGoal;
window.deleteGoal = deleteGoal;
window.editGoal = editGoal;
window.handleAddGoalSubmit = handleAddGoalSubmit;

// --- RESTORED DASHBOARD LOGIC ---
function renderDashboardUpgrade(periodTx) {
    // 1. Use passed filtered transactions (periodTx)
    const { start, end } = getPeriodDateRange();

    // 2. Metrics (Budget Focus)
    const totalBudget = Object.values(state.budgets).reduce((a, b) => a + b, 0);
    const totalSpent = periodTx.reduce((sum, t) => t.type === 'expense' ? sum + t.amount : sum, 0);
    const remaining = totalBudget - totalSpent;

    if (document.getElementById('dash-budget')) document.getElementById('dash-budget').textContent = formatMoney(totalBudget);
    if (document.getElementById('dash-spent')) document.getElementById('dash-spent').textContent = formatMoney(totalSpent);

    const remEl = document.getElementById('dash-remaining');
    if (remEl) {
        remEl.textContent = formatMoney(remaining);
        remEl.className = remaining < 0 ? 'fw-bold text-danger' : 'fw-bold text-green';
    }

    // 3. Budget Snapshot
    const status = getBudgetStatus(start, end);
    renderBudgetSnapshot(status);

    // 4. Insights
    const metrics = { budget: totalBudget, spent: totalSpent, remaining: remaining };
    const insights = getDashboardInsights(metrics, status, start, end);
    const insightBox = document.getElementById('dash-insight-box');
    const insightText = document.getElementById('dash-insight-text');
    if (insightBox && insightText) {
        insightText.innerHTML = insights.text;
        insightBox.className = `card border-0 p-4 rounded-4 text-white h-100 ${insights.bgData}`;
    }
}

function getPeriodDates(type) {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (type === 'week') {
        const day = now.getDay() || 7;
        if (day !== 1) start.setHours(-24 * (day - 1));
        end.setHours(23, 59, 59);
    } else if (type === 'month') {
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
    } else if (type === 'last-month') {
        start.setMonth(start.getMonth() - 1, 1);
        end.setDate(0);
    } else if (type === 'year') {
        start.setMonth(0, 1);
        end.setMonth(11, 31);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function getDashboardMetrics(start, end) {
    // Total Budget (Adjust for period? For simplicity, we use monthly budget * months in period, 
    // but for "week" we might divide. Let's assume budgets are monthly.)

    // Simple logic: If view is month/last-month, take budgets as is.
    // If year, multiply by 12. If week, divide by 4.
    let multiplier = 1;
    const days = (end - start) / (1000 * 60 * 60 * 24);
    if (days > 360) multiplier = 12;
    else if (days < 8) multiplier = 0.25;

    let totalBudget = 0;
    Object.values(state.budgets).forEach(b => totalBudget += (b * multiplier));

    // If no budgets set, maybe sum expenses? No, standard is 0.
    if (totalBudget === 0 && Object.keys(state.budgets).length === 0) {
        // Fallback: maybe they haven't set budgets.
    }

    // Total Spent in Period
    const periodTx = state.transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end && t.type === 'expense';
    });

    const totalSpent = periodTx.reduce((sum, t) => sum + t.amount, 0);

    return {
        budget: totalBudget,
        spent: totalSpent,
        remaining: totalBudget - totalSpent
    };
}

function getBudgetStatus(start, end) {
    // Need category spending for this period
    const counts = { onTrack: 0, over: 0, total: 0, warnings: [] };
    const multiplier = (end - start) / (1000 * 60 * 60 * 24) < 8 ? 0.25 : 1; // Approx for week

    Object.keys(state.budgets).forEach(catId => {
        counts.total++;
        const limit = state.budgets[catId] * multiplier;
        const spent = state.transactions
            .filter(t => t.category === catId && t.type === 'expense')
            .filter(t => { const d = new Date(t.date); return d >= start && d <= end; })
            .reduce((sum, t) => sum + t.amount, 0);

        if (spent > limit) {
            counts.over++;
            const catInfo = categories.find(c => c.id === catId);
            if (counts.warnings.length < 3) counts.warnings.push(catInfo ? catInfo.name : catId);
        } else {
            counts.onTrack++;
        }
    });
    return counts;
}

function renderBudgetSnapshot(status) {
    const el = document.getElementById('dash-budget-widget');
    if (!el) return;

    if (status.total === 0) {
        el.innerHTML = `<p class="text-muted m-0">No budgets set.</p>`;
        return;
    }

    const healthEmoji = status.over === 0 ? '😎' : (status.over < 3 ? '😬' : '😱');

    let pills = '';
    if (status.over > 0) {
        pills = status.warnings.map(n => `<span class="badge bg-danger-subtle text-danger border border-danger opacity-75">${n}</span>`).join(' ');
        if (status.warnings.length < status.over) pills += ` +${status.over - status.warnings.length}`;
    } else {
        pills = `<span class="badge bg-soft-green text-green border border-success opacity-75">All good!</span>`;
    }

    el.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
                <h5 class="fw-bold text-white m-0">Budget Health</h5>
                <small class="text-muted">${status.onTrack} / ${status.total} categories on track</small>
            </div>
            <div class="fs-1">${healthEmoji}</div>
        </div>
        <div class="d-flex flex-wrap gap-2">
            ${pills}
        </div>
    `;
}

function getDashboardInsights(metrics, status, start, end) {
    // 1. Budget Alerts
    if (status.over > 0) {
        return {
            text: `You've exceeded the budget in <strong>${status.over} categories</strong>. Check your spending!`,
            bgData: 'bg-neo-pink' // Define css gradient? Or just use pink class
        };
    }

    // 2. Savings Celebration
    if (metrics.remaining > (metrics.budget * 0.2) && metrics.budget > 0) {
        return {
            text: `Looking great! You have <strong>${formatMoney(metrics.remaining)}</strong> left to spend or save this period.`,
            bgData: 'bg-neo-green'
        };
    }

    // 3. No Activity
    const lastTx = state.transactions[0];
    if (lastTx) {
        const d = new Date(lastTx.date);
        const daysAgo = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
        if (daysAgo > 3) {
            return {
                text: `It's been <strong>${daysAgo} days</strong> since your last transaction. Don't forget to log!`,
                bgData: 'bg-neo-blue'
            };
        }
    }

    return {
        text: `Welcome back! Stay focused on your goals.`,
        bgData: 'bg-marine' // default gradient
    };
}


function renderReportsPage() {
    const view = document.getElementById('view-reports');
    if (!view) return;

    // Inject HTML if missing
    if (!document.getElementById('report-start')) {
        view.innerHTML = `
            <div class="row mb-5 align-items-end">
                <div class="col-md-8">
                    <h2 class="fw-bold text-white mb-1">Financial Report</h2>
                    <p class="text-muted mb-0">Deep dive into your spending habits.</p>
                </div>
                <div class="col-md-4">
                     <div class="d-flex gap-2 bg-neo-card p-2 rounded-3 border border-secondary shadow-sm">
                        <input type="date" id="report-start" class="form-control bg-transparent border-0 text-white py-1 text-center" onchange="renderReport()">
                        <span class="text-muted align-self-center">-</span>
                        <input type="date" id="report-end" class="form-control bg-transparent border-0 text-white py-1 text-center" onchange="renderReport()">
                     </div>
                </div>
            </div>
            
            <div class="row g-4 mb-5">
                 <div class="col-md-4">
                    <div class="card bg-neo-card border-0 p-4 rounded-4 shadow-sm text-center">
                        <small class="text-muted uppercase tracking-wide">TOTAL INCOME</small>
                        <h3 class="text-white fw-bold my-2" id="report-income">$0</h3>
                    </div>
                 </div>
                 <div class="col-md-4">
                    <div class="card bg-neo-card border-0 p-4 rounded-4 shadow-sm text-center">
                        <small class="text-muted uppercase tracking-wide">TOTAL EXPENSE</small>
                        <h3 class="text-neo-pink fw-bold my-2" id="report-expense">$0</h3>
                        <small id="trend-expense" class="d-block mt-1 fw-medium" style="font-size: 11px;"></small>
                    </div>
                 </div>
                 <div class="col-md-4">
                    <div class="card bg-neo-card border-0 p-4 rounded-4 shadow-sm text-center">
                        <small class="text-muted uppercase tracking-wide">NET FLOW</small>
                        <h3 class="text-neo-green fw-bold my-2" id="report-net">$0</h3>
                    </div>
                 </div>
            </div>

            <div class="card bg-neo-card border-0 p-5 rounded-4 shadow-sm">
                <h5 class="text-white fw-bold mb-4">Top Spending Categories</h5>
                <div id="report-category-list"></div>
            </div>
        `;

        // Init dates from Global Period state by default
        const { start, end } = getPeriodDateRange();
        // Format YYYY-MM-DD
        const fmt = d => d.toISOString().split('T')[0];
        document.getElementById('report-start').value = fmt(start);
        document.getElementById('report-end').value = fmt(end);
    }
    renderReport();
}

function renderReport(preFilteredTx) {
    // If passed data, use it. If not (e.g. custom date range mode), use date inputs.
    // The previous implementation used custom start/end inputs.
    // We want Global Filters to apply ON TOP OF the date range if reasonable?
    // OR: The requirements said "Reports: filter transactions before generating summary"

    // If preFilteredTx is passed (from global render), we use that as the BASE, 
    // but the Reports page has its own Date Inputs. 
    // Actually, "getGlobalFilteredTransactions" ALREADY matches the "Global Period".
    // Does the Report page use Global Period OR Custom Period?
    // Based on previous code: it reads #report-start/end.
    // Let's decide: Report Page uses Custom Period + Global Filters (Search/Cat/Type).

    const sInput = document.getElementById('report-start');
    if (!sInput) return;
    const startInput = sInput.value;
    const endInput = document.getElementById('report-end').value;
    if (!startInput || !endInput) return;
    const start = new Date(startInput);
    const end = new Date(endInput);
    end.setHours(23, 59, 59);

    // Get ALL transactions in this custom range
    let rangeTx = state.transactions.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
    });

    // NOW apply Global Filters (except date) to this custom range
    if (state.filters.search || state.filters.category !== 'all' || state.filters.type !== 'all') {
        rangeTx = rangeTx.filter(t => {
            // Search
            let matchesSearch = true;
            if (state.filters.search) {
                const term = state.filters.search;
                const catInfo = categories.find(c => c.id === t.category);
                const catName = catInfo ? catInfo.name.toLowerCase() : '';
                if (!t.notes.toLowerCase().includes(term) && !catName.includes(term)) matchesSearch = false;
            }
            // Cat
            let matchesCat = true;
            if (state.filters.category !== 'all' && t.category !== state.filters.category) matchesCat = false;
            // Type
            let matchesType = true;
            if (state.filters.type !== 'all' && t.type !== state.filters.type) matchesType = false;

            return matchesSearch && matchesCat && matchesType;
        });
    }
    let income = 0; let expense = 0; let catTotals = {};
    rangeTx.forEach(t => {
        if (t.type === 'income') { income += t.amount; }
        else {
            expense += t.amount;
            catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
        }
    });
    const net = income - expense;
    const duration = end - start;
    const prevEnd = new Date(start.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - duration);
    const prevTx = state.transactions.filter(t => {
        const d = new Date(t.date);
        return d >= prevStart && d <= prevEnd;
    });
    let prevExpense = prevTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currency = state.settings.currency === 'USD' ? '$' : (state.settings.currency === 'EUR' ? '€' : '£');
    const money = n => currency + n.toLocaleString();
    if (document.getElementById('report-income')) document.getElementById('report-income').textContent = money(income);
    if (document.getElementById('report-expense')) document.getElementById('report-expense').textContent = money(expense);
    if (document.getElementById('report-net')) document.getElementById('report-net').textContent = money(net);
    const trendDisplay = document.getElementById('trend-expense');
    if (trendDisplay) {
        if (prevExpense > 0) {
            const diff = ((expense - prevExpense) / prevExpense) * 100;
            if (diff < 0) { trendDisplay.innerHTML = `<span class="text-green">⬇ ${Math.abs(Math.round(diff))}% vs prior</span>`; }
            else { trendDisplay.innerHTML = `<span class="text-danger">⬆ ${Math.round(diff)}% vs prior</span>`; }
        } else { trendDisplay.innerHTML = '<span class="text-muted">--</span>'; }
    }
    const list = document.getElementById('report-category-list');
    if (!list) return;
    list.innerHTML = '';
    const sortedCats = Object.keys(catTotals).map(id => {
        return {
            id: id, amount: catTotals[id],
            def: categories.find(c => c.id === id) || { name: 'Other', icon: '❓' }
        };
    }).sort((a, b) => b.amount - a.amount).slice(0, 5);
    const totalExpForBars = Math.max(expense, 1);
    sortedCats.forEach((item, index) => {
        const percent = Math.round((item.amount / totalExpForBars) * 100);
        const div = document.createElement('div');
        div.className = 'mb-3';
        div.innerHTML = `
            <div class="d-flex justify-content-between mb-1">
                <span class="fw-medium text-white">
                    ${item.def.icon} ${item.def.name}
                </span>
                <span class="fw-bold text-white">${money(item.amount)}</span>
            </div>
            <div class="chart-bar-container">
                <div class="chart-bar chart-bar-${index}" style="width: ${percent}%"></div>
            </div>
        `;
        list.appendChild(div);
    });
    if (sortedCats.length === 0) list.innerHTML = '<p class="text-muted text-center py-3">No expenses in this period.</p>';
}

function renderGoals() {
    const grid = document.getElementById('goals-grid');
    if (!grid) return;
    grid.innerHTML = '';
    let totalSaved = 0; let totalTarget = 0;
    if (state.goals.length === 0) {
        grid.innerHTML = '<p class="text-muted text-center col-12 py-4">No active goals. Click "New Goal" to dream big!</p>';
        updateDonut(0, 0, 0);
        return;
    }
    state.goals.forEach(g => {
        totalSaved += g.current;
        totalTarget += g.target;
        const percent = Math.min(100, Math.round((g.current / g.target) * 100));
        const col = document.createElement('div');
        col.className = 'col-md-6 col-xl-4';
        col.innerHTML = `
            <div class="card h-100 goal-card border-0 shadow-sm rounded-4 p-3 position-relative">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="fs-4 bg-light rounded-circle icon-box">${g.icon}</span>
                    <button class="btn btn-sm goal-btn-deposit rounded-pill px-3 py-1" onclick="depositToGoal(${g.id})">
                        + $50
                    </button>
                </div>
                <h6 class="fw-bold m-0 mb-1 text-white">${g.name}</h6>
                <div class="d-flex align-items-end gap-2 mb-2">
                    <span class="fs-4 fw-bold text-main">${formatMoney(g.current)}</span>
                    <small class="text-muted mb-1" style="font-size: 11px;">/ ${formatMoney(g.target)}</small>
                </div>
                <div class="progress mb-2" style="height: 6px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${percent}%"></div>
                </div>
                <div class="d-flex justify-content-between">
                   <small class="text-green fw-bold" style="font-size: 10px;">${percent}%</small>
                   <small class="text-muted" style="font-size: 10px;">On Track</small>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
    updateDonut(totalSaved, totalTarget, totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0);
}

function updateDonut(saved, target, percent) {
    const donut = document.getElementById('total-progress-donut');
    if (donut) {
        donut.style.setProperty('--p', percent);
        document.getElementById('total-progress-text').textContent = percent + '%';
        document.getElementById('total-saved-display').textContent = formatMoney(saved);
        document.getElementById('total-target-display').textContent = formatMoney(target);
    }
}

function populateGoalCategorySelect() {
    const select = document.getElementById('goal-cat');
    if (!select) return;
    // Keep first option (Manual)
    select.innerHTML = '<option value="none">-- Manual Entry Only --</option>';

    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.icon} ${cat.name}`;
        select.appendChild(opt);
    });
}

// --- CONFETTI ---
function confetti(opts) {
    // Simple particle explosion
    const colors = ['#88B267', '#CF5B5B', '#F39C12', '#5DBED3', '#ffffff'];
    const particles = [];
    const particleCount = opts && opts.particleCount ? opts.particleCount : 100;

    // Create canvas overlay
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
            size: Math.random() * 5 + 2
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.5; // gravity
            p.alpha -= 0.01;
            if (p.alpha > 0) {
                active = true;
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        if (active) requestAnimationFrame(animate);
        else document.body.removeChild(canvas);
    }
    animate();
}

function renderBudgetGrid() {
    const grid = document.getElementById('budget-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const budgetKeys = Object.keys(state.budgets);
    if (budgetKeys.length === 0) {
        const empty = document.getElementById('budget-empty-state');
        if (empty) empty.classList.remove('d-none');
        return;
    } else {
        const empty = document.getElementById('budget-empty-state');
        if (empty) empty.classList.add('d-none');
    }
    const relevantCategories = categories.filter(c => state.budgets[c.id] !== undefined);
    relevantCategories.forEach(cat => {
        const budget = state.budgets[cat.id];
        const spent = calculateSpent(cat.id);
        const remaining = budget - spent;
        const percent = Math.min(100, Math.round((spent / budget) * 100));
        let barClass = 'bg-success'; let statusText = 'On Track'; let statusColor = 'text-green';
        if (percent >= 80 && percent < 100) { barClass = 'bg-warning'; statusText = 'Careful'; statusColor = 'text-info'; }
        else if (percent >= 100) { barClass = 'bg-danger'; statusText = 'Over Budget'; statusColor = 'text-orange'; }
        const col = document.createElement('div');
        col.className = 'col-md-6 col-xl-4';
        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm rounded-4 p-3">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="d-flex align-items-center gap-3">
                        <div class="icon-box bg-light rounded-circle fs-5">${cat.icon}</div>
                        <div>
                            <h6 class="fw-bold m-0 text-white">${cat.name}</h6>
                            <small class="text-muted ${statusColor} fw-semibold" style="font-size: 11px;">${statusText}</small>
                        </div>
                    </div>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar ${barClass}" role="progressbar" style="width: ${percent}%"></div>
                </div>
                <div class="d-flex justify-content-between mt-2" style="font-size: 11px;">
                    <span class="text-muted">left: ${formatMoney(remaining)}</span>
                    <span class="text-muted">${Math.round((spent / budget) * 100)}%</span>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

function renderSummary() {
    const keys = Object.keys(state.budgets);
    let totalBudget = 0; let totalSpent = 0;
    keys.forEach(id => totalBudget += state.budgets[id]);
    totalSpent = state.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalRemaining = totalBudget - totalSpent;
    let health = 100; if (totalBudget > 0) health = Math.max(0, Math.round(((totalBudget - totalSpent) / totalBudget) * 100));

    if (document.getElementById('total-budget-display')) document.getElementById('total-budget-display').textContent = formatMoney(totalBudget);
    if (document.getElementById('total-spent-display')) document.getElementById('total-spent-display').textContent = formatMoney(totalSpent);
    if (document.getElementById('total-remaining-display')) document.getElementById('total-remaining-display').textContent = formatMoney(totalRemaining);
    if (document.getElementById('health-score-display')) document.getElementById('health-score-display').textContent = health + '%';

    // Also update Sidebar Total if exists
    if (document.getElementById('sidebar-total')) document.getElementById('sidebar-total').textContent = formatMoney(totalBudget);
}

function renderMiniTransactions() {
    const list = document.getElementById('transaction-list-mini');
    list.innerHTML = '';
    if (state.transactions.length === 0) {
        list.innerHTML = '<li class="list-group-item bg-transparent text-muted text-center border-0 py-4">No transactions yet. Add one above!</li>';
        return;
    }
    state.transactions.slice(0, 5).forEach(t => {
        const cat = categories.find(c => c.id === t.category) || { icon: '💸', name: 'Other', id: 'other' };
        const logoUrl = getMerchantLogo(t.notes);
        let iconHtml = `<span class="fs-5">${cat.icon}</span>`;
        if (logoUrl) iconHtml = `<img src="${logoUrl}" class="rounded-circle" width="32" height="32" alt="${t.notes}">`;
        const isExp = t.type === 'expense';
        const displayAmount = isExp ? `-${formatMoney(t.amount)}` : `+${formatMoney(t.amount)}`;
        const colorClass = isExp ? 'text-white' : 'text-green';
        const li = document.createElement('li');
        li.className = 'list-group-item border-0 d-flex justify-content-between align-items-center px-4 py-3';
        li.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <div class="icon-box bg-light rounded-circle" style="width: 40px; height: 40px;">
                    ${iconHtml}
                </div>
                <div>
                    <span class="d-block fw-medium text-white">${t.notes}</span>
                    <small class="text-muted" style="font-size: 11px;">${t.date}</small>
                </div>
            </div>
            <span class="fw-bold ${colorClass}">${displayAmount}</span>
        `;
        list.appendChild(li);
    });
}

function getMerchantLogo(note) {
    if (!note) return null;
    const lower = note.toLowerCase();
    for (const [key, domain] of Object.entries(brandMap)) {
        if (lower.includes(key)) { return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`; }
    }
    return null;
}

function calculateSpent(catId) {
    return state.transactions.filter(t => t.category === catId && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
}

function formatMoney(num) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

window.depositToGoal = depositToGoal;

// --- KEYBOARD SHORTCUTS ---

document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') { e.target.blur(); return; }
        return; // Ignore if typing
    }

    // Global: Search (/)
    if (e.key === '/') {
        e.preventDefault();
        const searchBox = document.getElementById('val-search');
        if (searchBox) {
            searchBox.focus();
            // Show hint or pulse?
        }
        return;
    }

    // Global: Help (?)
    if (e.key === '?') {
        e.preventDefault();
        toggleShortcutsHelp();
        return;
    }

    // Global: Escape
    if (e.key === 'Escape') {
        const helpModal = document.getElementById('shortcuts-modal');
        const modal = document.querySelector('.modal.show'); // Bootstrap modal if any
        if (helpModal && !helpModal.classList.contains('d-none')) {
            helpModal.classList.add('d-none');
        } else if (modal) {
            // Close bootstrap modal if using that system
        } else {
            // Maybe clear filters?
            // resetFilters(); 
        }
        return;
    }

    // Navigation (1-8)
    if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        const navMap = {
            '1': 'dashboard', '2': 'transactions', '3': 'budgets',
            '4': 'categories', '5': 'goals', '6': 'reports',
            '4': 'categories', '5': 'goals', '6': 'reports',
            '7': 'profile', '8': 'settings', // Updated map for restored profile
            '4': 'categories', '5': 'goals', '6': 'reports',
            '7': 'profile', '8': 'settings', // Updated map for restored profile
            '9': 'calendar',
            '0': 'goals'
        };
        switchView(navMap[e.key]);
        return;
    }

    // Actions
    if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        // Context aware?
        if (state.currentView === 'transactions') {
            // Focus add form? Or scroll to it?
            document.getElementById('t-amount').focus();
        } else if (state.currentView === 'budgets' || state.currentView === 'categories' || state.currentView === 'goals') {
            // Maybe trigger specific add modls?
            // For now just focus Transaction add as primary action
            switchView('dashboard');
            setTimeout(() => document.getElementById('t-amount').focus(), 100);
        }
        return;
    }
});

function toggleShortcutsHelp() {
    const el = document.getElementById('shortcuts-modal');
    if (el) el.classList.toggle('d-none');
}
window.toggleShortcutsHelp = toggleShortcutsHelp;
