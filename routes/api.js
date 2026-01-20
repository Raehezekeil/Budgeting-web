const express = require('express');
const router = express.Router();
const db = require('../database');
const requireAuth = require('../middleware/auth');

// Apply middleware to all routes in this router
router.use(requireAuth);

// --- TRANSACTIONS ---

// GET /api/transactions
router.get('/transactions', (req, res) => {
    const userId = req.session.userId;
    const sql = `SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST /api/transactions
router.post('/transactions', (req, res) => {
    const userId = req.session.userId;
    const { type, amount, category, date, notes } = req.body;

    if (!amount || !category || !date) {
        return res.status(400).json({ error: 'Amount, category, and date are required.' });
    }

    const sql = `INSERT INTO transactions (user_id, type, amount, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [userId, type || 'expense', amount, category, date, notes], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

// DELETE /api/transactions/:id
router.delete('/transactions/:id', (req, res) => {
    const userId = req.session.userId;
    const txId = req.params.id;

    const sql = `DELETE FROM transactions WHERE id = ? AND user_id = ?`;
    db.run(sql, [txId, userId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Transaction not found or denied.' });
        res.json({ message: 'Deleted successfully.' });
    });
});

// --- BUDGETS ---

router.get('/budgets', (req, res) => {
    const userId = req.session.userId;
    db.all(`SELECT * FROM budgets WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/budgets', (req, res) => {
    const userId = req.session.userId;
    const { category, limit_amount, period } = req.body;

    // Upsert logic could go here, for now just Insert
    const sql = `INSERT INTO budgets (user_id, category, limit_amount, period) VALUES (?, ?, ?, ?)`;
    db.run(sql, [userId, category, limit_amount, period || 'monthly'], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, user_id: userId, category, limit_amount, period });
    });
});

// --- GOALS ---

router.get('/goals', (req, res) => {
    const userId = req.session.userId;
    db.all(`SELECT * FROM goals WHERE user_id = ?`, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/goals', (req, res) => {
    const userId = req.session.userId;
    const { name, target_amount, current_amount, deadline } = req.body;

    const sql = `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [userId, name, target_amount, current_amount || 0, deadline], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

// --- SETTINGS ---

router.get('/settings', (req, res) => {
    const userId = req.session.userId;
    db.get(`SELECT * FROM settings WHERE user_id = ?`, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

router.post('/settings', (req, res) => {
    const userId = req.session.userId;
    const { theme, currency, language } = req.body;

    const sql = `INSERT INTO settings (user_id, theme, currency, language) VALUES (?, ?, ?, ?)
                 ON CONFLICT(user_id) DO UPDATE SET theme=excluded.theme, currency=excluded.currency, language=excluded.language`;

    db.run(sql, [userId, theme, currency, language], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Settings saved.' });
    });
});

module.exports = router;
