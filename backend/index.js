const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
require('dotenv').config();

// Models
const User = require('./models/User');
const DailyCalorieTotal = require('./models/DailyCalorieTotal');
const Transaction = require('./models/Transaction');
const RecurringTransaction = require('./models/RecurringTransaction');

// Routes
const calorieRoutes = require('./routes/calorieRoutes');
const todoRoutes = require('./routes/todoRoutes');
const diaryRoutes = require('./routes/diaryRoutes');
const financeRoutes = require('./routes/financeRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const eventRoutes = require('./routes/eventRoutes'); // Add event routes

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
    domain: 'localhost',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Passport Setup
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        googleId: profile.id,
        email: profile.emails && profile.emails[0] ? profile.emails[0].value : null,
        name: profile.displayName || null,
        username: profile.emails && profile.emails[0] ? profile.emails[0].value : profile.id,
        balance: 0, // Initialize financial fields
        totalSavings: 0,
        totalInvestments: 0,
      });
      await user.save();
      console.log('New user created:', user);
    } else {
      console.log('Existing user logged in:', user);
    }
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3001/login' }),
  (req, res) => {
    console.log('OAuth callback success, user:', req.user);
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    res.redirect('http://localhost:3001/dashboard');
  }
);

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed', error: err.message });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Session destroy failed', error: err.message });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

app.get('/api/check-session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ message: 'User is logged in', user: req.user });
  } else {
    res.json({ message: 'User is not logged in' });
  }
});

app.use('/api/calories', calorieRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/events', eventRoutes); // Add event routes

app.get('/', (req, res) => {
  res.json({ message: 'AYNA backend is running' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});