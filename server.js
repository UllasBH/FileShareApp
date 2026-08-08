require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { requireAuthPage } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup with MongoDB store
app.use(session({
  secret: process.env.SESSION_SECRET || 'fileshareapp_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    httpOnly: true,
    secure: false // set true if serving over HTTPS
  }
}));

// Static assets (css, js, images)
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Page routes
app.get('/', (req, res) => {
  if (req.session && req.session.workspaceId) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/settings', requireAuthPage, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Public share/download page - accessible without login
app.get('/download/:shareId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found.');
});

// Global error handler (e.g. multer file-size errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`FileShareApp server running on http://localhost:${PORT}`);
});
