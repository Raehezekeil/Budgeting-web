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
    // Force logout on visiting the root URL
    req.session = null;

    // Serve signup page as the landing page (per user request)
    if (require('fs').existsSync(path.join(__dirname, 'dist', 'signup.html'))) {
        res.sendFile(path.join(__dirname, 'dist', 'signup.html'));
    } else {
        res.sendFile(path.join(__dirname, 'signup.html'));
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
        // If it looks like a welcome page request or root, try welcome
        // Otherwise try index.html (dashboard) ONLY if user is logged in logic handle by frontend
        // But simpler: just serve welcome.html as fallback for unknown routes to capture new users
        // Or serve index.html? Let's serve welcome.html to be safe for this "Landing Page" focus
        if (require('fs').existsSync(path.join(__dirname, 'welcome.html'))) {
            res.sendFile(path.join(__dirname, 'welcome.html'));
        } else {
            res.sendFile(path.join(__dirname, 'index.html'));
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
