require('dotenv').config();
const express = require('express');
const cookieSession = require('cookie-session');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup - Stateless for Cloud/Serverless
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'your-secret-key'],
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
}));

// Mock Passport serialization for cookie-session
app.use((req, res, next) => {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb) => { cb(); };
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb) => { cb(); };
    }
    next();
});

// Passport Config
const passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/api'));

// Serve Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
