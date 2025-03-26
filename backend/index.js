const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3001', // Frontend URL
  credentials: true,              // Allow cookies for sessions
}));

// Session setup with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
  }),
  cookie: {
    secure: false, // False for local dev (HTTP)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax', // Allow cross-origin with redirects
    path: '/',
  },
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String },
  email: { type: String, unique: true },
});
const User = mongoose.model('User', UserSchema);

// Mini-App Schemas
const FinanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['expense', 'income'], required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
});
const Finance = mongoose.model('Finance', FinanceSchema);

const CalorieSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  food: { type: String, required: true },
  calories: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});
const Calorie = mongoose.model('Calorie', CalorieSchema);

const TodoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task: { type: String, required: true },
  completed: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});
const Todo = mongoose.model('Todo', TodoSchema);

const DiarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
});
const Diary = mongoose.model('Diary', DiarySchema);

// Passport Google OAuth Strategy
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
        name: profile.displayName,
        email: profile.emails[0].value,
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

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: 'Unauthorized' });
};

// Routes
// Google OAuth
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:3001/login' }),
  (req, res) => {
    console.log('OAuth callback success, user:', req.user);
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    res.redirect('http://localhost:3001/dashboard');
  }
);

// Logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout error', error: err });
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('http://localhost:3001/');
    });
  });
});

// Check session
app.get('/api/check-session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ message: 'User is logged in', user: req.user });
  } else {
    res.json({ message: 'User is not logged in' });
  }
});

// REST Endpoints for Mini-Apps
// Finance
app.post('/api/finance', isAuthenticated, async (req, res) => {
  try {
    const { type, amount, description } = req.body;
    const finance = new Finance({
      userId: req.user._id,
      type,
      amount,
      description,
    });
    await finance.save();
    res.status(201).json(finance);
  } catch (error) {
    res.status(500).json({ message: 'Error saving finance entry', error });
  }
});

app.get('/api/finance', isAuthenticated, async (req, res) => {
  try {
    const finances = await Finance.find({ userId: req.user._id });
    res.json(finances);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching finance data', error });
  }
});

// Calorie
app.post('/api/calories', isAuthenticated, async (req, res) => {
  try {
    const { food, calories } = req.body;
    const calorie = new Calorie({
      userId: req.user._id,
      food,
      calories,
    });
    await calorie.save();
    res.status(201).json(calorie);
  } catch (error) {
    res.status(500).json({ message: 'Error saving calorie entry', error });
  }
});

app.get('/api/calories', isAuthenticated, async (req, res) => {
  try {
    const calories = await Calorie.find({ userId: req.user._id });
    res.json(calories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching calorie data', error });
  }
});

// To-Do
app.post('/api/todos', isAuthenticated, async (req, res) => {
  try {
    const { task } = req.body;
    const todo = new Todo({
      userId: req.user._id,
      task,
    });
    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: 'Error saving todo', error });
  }
});

app.get('/api/todos', isAuthenticated, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user._id });
    res.json(todos); // Fixed: Removed extra "res"
  } catch (error) {
    res.status(500).json({ message: 'Error fetching todos', error });
  }
});

// Diary
app.post('/api/diary', isAuthenticated, async (req, res) => {
  try {
    const { content } = req.body;
    const diary = new Diary({
      userId: req.user._id,
      content,
    });
    await diary.save();
    res.status(201).json(diary);
  } catch (error) {
    res.status(500).json({ message: 'Error saving diary entry', error });
  }
});

app.get('/api/diary', isAuthenticated, async (req, res) => {
  try {
    const diaries = await Diary.find({ userId: req.user._id });
    res.json(diaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching diary entries', error });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'AYNA backend is running' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});