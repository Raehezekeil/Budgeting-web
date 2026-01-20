const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('cookie-session');
const passport = require('passport');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(require('morgan')('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve built assets (Vite output)
app.use(express.static(path.join(__dirname, 'dist'), { index: false }));
// Fallback to root for assets if not in dist (for simple setups)
app.use(express.static(__dirname, { index: false }));

// Session Setup - Stateless for Cloud/Serverless
app.use(session({
    name: 'session',
    keys: [process.env.SESSION_SECRET || 'secret_key'],
    maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
}));

// Mock Passport Serialization compatibility for cookie-session
app.use((req, res, next) => {
    if (req.session && req.session.passport) {
        req.session.passport.user = req.session.passport.user;
    }
    next();
});

// Passport Config
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/api'));

// Serve Frontend
app.get('/', (req, res) => {
    // Force logout on visiting root
    req.session = null;
    // Serve index.html (which is now properly the signup page physically)
    if (require('fs').existsSync(path.join(__dirname, 'dist', 'index.html'))) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.get('*', (req, res) => {
    const requestedPath = req.path.substring(1);
    const distPath = path.join(__dirname, 'dist', requestedPath);

    // Check if the request is for a specific file that exists
    if (requestedPath && require('fs').existsSync(path.join(__dirname, requestedPath))) {
        res.sendFile(path.join(__dirname, requestedPath));
    } else if (require('fs').existsSync(distPath)) {
        res.sendFile(distPath);
    } else {
        // For fallback:
        // Serve dashboard.html (the app) for client-side routing
        if (require('fs').existsSync(path.join(__dirname, 'dist', 'dashboard.html'))) {
            res.sendFile(path.join(__dirname, 'dist', 'dashboard.html'));
        } else {
            res.sendFile(path.join(__dirname, 'dashboard.html'));
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
