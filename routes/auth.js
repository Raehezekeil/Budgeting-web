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
        db.run(sql, [name, email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'Email already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }

            // Auto-login after signup
            req.session.userId = this.lastID;
            req.session.name = name;
            req.session.email = email;

            res.json({ message: 'Signup successful', user: { id: this.lastID, name, email } });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during signup.' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required.' });
    }

    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
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
    });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Could not log out.' });
        res.clearCookie('connect.sid'); // Default session cookie name
        res.json({ message: 'Logged out.' });
    });
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
