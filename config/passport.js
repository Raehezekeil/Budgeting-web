const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../database');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        // 1. Check if user exists
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
            if (err) return done(err);

            if (user) {
                // User exists, log them in
                // Optional: Update social_id if not present
                if (!user.social_id) {
                    db.run('UPDATE users SET social_provider = ?, social_id = ? WHERE id = ?',
                        ['google', googleId, user.id]);
                }
                return done(null, user);
            } else {
                // Create new user
                const sql = 'INSERT INTO users (name, email, social_provider, social_id) VALUES (?, ?, ?, ?)';
                db.run(sql, [name, email, 'google', googleId], function (err) {
                    if (err) return done(err);
                    const newUser = { id: this.lastID, name: name, email: email };
                    done(null, newUser);
                });
            }
        });
    }));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the sessions
passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        done(err, user);
    });
});

module.exports = passport;
