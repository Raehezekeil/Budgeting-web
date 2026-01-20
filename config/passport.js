const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../database');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        try {
            // 1. Check if user exists
            const rs = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
            const user = rs.rows[0];

            if (user) {
                // User exists, log them in
                if (!user.social_id) {
                    await db.execute({
                        sql: 'UPDATE users SET social_provider = ?, social_id = ? WHERE id = ?',
                        args: ['google', googleId, user.id]
                    });
                }
                return done(null, user);
            } else {
                // Create new user
                const sql = 'INSERT INTO users (name, email, social_provider, social_id) VALUES (?, ?, ?, ?)';
                const rsInsert = await db.execute({ sql, args: [name, email, 'google', googleId] });
                const newUser = { id: Number(rsInsert.lastInsertRowid), name: name, email: email };
                done(null, newUser);
            }
        } catch (err) {
            return done(err);
        }
    }));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser(async (id, done) => {
    try {
        const rs = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [id] });
        done(null, rs.rows[0]);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
