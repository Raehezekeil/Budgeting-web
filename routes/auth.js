const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
const db = require('../database');

// Signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
        try {
            const rs = await db.execute({ sql, args: [name, email, hashedPassword] });
            const userId = rs.lastInsertRowid;

            // Auto-login (Cookie Session)
            req.session.userId = Number(userId); // LibSQL returns bigint usually, safe to cast? Yes for now.
            req.session.name = name;
            req.session.email = email;

            res.json({ message: 'Signup successful', user: { id: Number(userId), name, email } });
        } catch (dbErr) {
            if (dbErr.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists.' });
            }
            throw dbErr;
        }
    } catch (err) {
        console.error("Signup Error", err);
        res.status(500).json({ error: 'Server error during signup.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
    }

    try {
        const sql = `SELECT * FROM users WHERE email = ?`;
        const rs = await db.execute({ sql, args: [email] });
        const user = rs.rows[0];

        if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.userId = user.id;
            req.session.name = user.name;
            req.session.email = user.email;
            res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
        } else {
            res.status(401).json({ error: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error("Login Error", err);
        res.status(500).json({ error: 'Database error.' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    req.session = null; // Clear cookie-session
    res.json({ message: 'Logged out.' });
});

// Me (Session Check)
router.get('/me', (req, res) => {
    // Check Passport session OR custom session
    const user = req.user || (req.session.userId ? { id: req.session.userId, name: req.session.name, email: req.session.email } : null);

    if (user) {
        res.json({ authenticated: true, user: user });
    } else {
        res.json({ authenticated: false });
    }
});

// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        // Successful authentication
        // Sync custom session vars (optional, but good for consistency)
        req.session.userId = req.user.id;
        req.session.name = req.user.name;
        req.session.email = req.user.email;
        res.redirect('/');
    }
);

module.exports = router;
