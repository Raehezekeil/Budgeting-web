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

// Serve built assets (Vite output)
app.use(express.static(path.join(__dirname, 'dist')));
// Fallback to public if needed (or for local dev without build)
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
// Serve Frontend
app.get('/', (req, res) => {
    // Serve welcome page as the landing page
    if (require('fs').existsSync(path.join(__dirname, 'dist', 'welcome.html'))) {
        res.sendFile(path.join(__dirname, 'dist', 'welcome.html'));
    } else {
        res.sendFile(path.join(__dirname, 'welcome.html'));
    }
});

app.get('*', (req, res) => {
    // Try dist first, then root
    // If requesting specific file (e.g. login.html), serve it
    const requestedPath = req.path.substring(1);
    const distPath = path.join(__dirname, 'dist', requestedPath);

    if (requestedPath && require('fs').existsSync(path.join(__dirname, requestedPath))) {
        res.sendFile(path.join(__dirname, requestedPath));
    } else if (require('fs').existsSync(distPath)) {
        res.sendFile(distPath);
    } else {
        // Fallback to index.html for SPA routing (if any) or login
        // But for this app, we might just 404 or redirect to /
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
