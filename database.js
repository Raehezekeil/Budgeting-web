const { createClient } = require('@libsql/client');
const bcrypt = require('bcrypt');
const path = require('path');

// Use env var for DB URL (e.g. 'libsql://my-db.turso.io')
// Or file path for local dev (e.g. 'file:./budget-app.db')
const url = process.env.TURSO_DATABASE_URL || 'file:./budget-app.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
    url,
    authToken
});

async function initDb() {
    console.log(`Connected to Database at ${url}`);

    // SQLite/LibSQL allows batch execution
    const schema = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            name TEXT NOT NULL,
            social_provider TEXT,
            social_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type TEXT CHECK(type IN ('income', 'expense')),
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            notes TEXT,
            is_recurring INTEGER DEFAULT 0,
            frequency TEXT,
            next_due TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT NOT NULL,
            limit_amount REAL NOT NULL,
            period TEXT DEFAULT 'monthly',
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL DEFAULT 0,
            deadline TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS settings (
            user_id INTEGER PRIMARY KEY,
            theme TEXT DEFAULT 'light',
            currency TEXT DEFAULT 'USD',
            language TEXT DEFAULT 'en',
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `;

    try {
        await client.executeMultiple(schema);
        console.log("Database schema initialized.");
    } catch (err) {
        console.error("Schema init error:", err);
    }
}

initDb();

module.exports = client;
