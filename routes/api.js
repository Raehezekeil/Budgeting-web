const express = require('express');
const router = express.Router();
const db = require('../database');
const requireAuth = require('../middleware/auth');

// Apply middleware to all routes in this router
router.use(requireAuth);

// --- TRANSACTIONS ---

// GET /api/transactions
router.get('/transactions', async (req, res) => {
    const userId = req.session.userId;
    try {
        const rs = await db.execute({
            sql: `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`,
            args: [userId]
        });
        res.json(rs.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/transactions
router.post('/transactions', async (req, res) => {
    const userId = req.session.userId;
    const { type, amount, category, date, notes } = req.body;

    if (!amount || !category || !date) {
        return res.status(400).json({ error: 'Amount, category, and date are required.' });
    }

    try {
        const sql = `INSERT INTO transactions (user_id, type, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)`;
        const rs = await db.execute({
            sql,
            args: [userId, type || 'expense', amount, category, date, notes]
        });
        res.json({ id: Number(rs.lastInsertRowid), ...req.body });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/transactions/:id
router.delete('/transactions/:id', async (req, res) => {
    const userId = req.session.userId;
    const txId = req.params.id;

    try {
        const sql = `DELETE FROM transactions WHERE id = ? AND user_id = ?`;
        const rs = await db.execute({ sql, args: [txId, userId] });

        if (rs.rowsAffected === 0) return res.status(404).json({ error: 'Transaction not found or denied.' });
        res.json({ message: 'Deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- BUDGETS ---

// --- BUDGETS ---

router.get('/budgets', async (req, res) => {
    const userId = req.session.userId;
    try {
        const rs = await db.execute({ sql: `SELECT * FROM budgets WHERE user_id = ?`, args: [userId] });
        res.json(rs.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/budgets', async (req, res) => {
    const userId = req.session.userId;
    const { category, limit_amount, period } = req.body;

    try {
        const sql = `INSERT INTO budgets (user_id, category, limit_amount, period) VALUES (?, ?, ?, ?)`;
        const rs = await db.execute({
            sql,
            args: [userId, category, limit_amount, period || 'monthly']
        });
        res.json({ id: Number(rs.lastInsertRowid), user_id: userId, category, limit_amount, period });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- GOALS ---

router.get('/goals', async (req, res) => {
    const userId = req.session.userId;
    try {
        const rs = await db.execute({ sql: `SELECT * FROM goals WHERE user_id = ?`, args: [userId] });
        res.json(rs.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/goals', async (req, res) => {
    const userId = req.session.userId;
    const { name, target_amount, current_amount, deadline } = req.body;

    try {
        const sql = `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)`;
        const rs = await db.execute({
            sql,
            args: [userId, name, target_amount, current_amount || 0, deadline]
        });
        res.json({ id: Number(rs.lastInsertRowid), ...req.body });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- SETTINGS ---

router.get('/settings', async (req, res) => {
    const userId = req.session.userId;
    try {
        const rs = await db.execute({ sql: `SELECT * FROM settings WHERE user_id = ?`, args: [userId] });
        res.json(rs.rows[0] || {});
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings', async (req, res) => {
    const userId = req.session.userId;
    const { theme, currency, language } = req.body;

    const sql = `INSERT INTO settings (user_id, theme, currency, language) VALUES (?, ?, ?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET theme=excluded.theme, currency=excluded.currency, language=excluded.language`;

    try {
        await db.execute({ sql, args: [userId, theme, currency, language] });
        res.json({ message: 'Settings saved.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
