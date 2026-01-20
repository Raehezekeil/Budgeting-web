const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = process.env.DB_PATH || './budget-app.db';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database at ' + dbPath, err.message);
    } else {
        console.log('Connected to SQLite database at ' + dbPath);
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            name TEXT NOT NULL,
            social_provider TEXT,
            social_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Transactions Table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT CHECK(type IN ('income', 'expense')),
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Budgets Table
        db.run(`CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            limit_amount REAL NOT NULL,
            period TEXT DEFAULT 'monthly',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Goals Table
        db.run(`CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            deadline TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Settings Table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            user_id INTEGER PRIMARY KEY,
            theme TEXT DEFAULT 'light',
            currency TEXT DEFAULT 'USD',
            language TEXT DEFAULT 'en',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        console.log('Database schema synced.');
    });
}

module.exports = db;
