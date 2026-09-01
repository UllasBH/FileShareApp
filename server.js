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

// Cloud Run provides PORT=8080
const PORT = process.env.PORT || 8080;

// --------------------------------------------------
// Body parsers
// --------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------------------------------
// Session setup with MongoDB
// --------------------------------------------------
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'fileshareapp_secret',
        resave: false,
        saveUninitialized: false,

        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI,
            collectionName: 'sessions',
            ttl: 14 * 24 * 60 * 60
        }),

        cookie: {
            maxAge: 14 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: false
        }
    })
);

// --------------------------------------------------
// Static files
// --------------------------------------------------
app.use(
    '/css',
    express.static(path.join(__dirname, 'public', 'css'))
);

app.use(
    '/js',
    express.static(path.join(__dirname, 'public', 'js'))
);

// --------------------------------------------------
// API routes
// --------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// --------------------------------------------------
// Home page
// --------------------------------------------------
app.get('/', (req, res) => {
    if (req.session && req.session.workspaceId) {
        return res.redirect('/dashboard');
    }

    res.sendFile(
        path.join(__dirname, 'public', 'login.html')
    );
});

// --------------------------------------------------
// Dashboard
// --------------------------------------------------
app.get('/dashboard', requireAuthPage, (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'dashboard.html')
    );
});

// --------------------------------------------------
// Settings
// --------------------------------------------------
app.get('/settings', requireAuthPage, (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'settings.html')
    );
});

// --------------------------------------------------
// Public download/share page
// --------------------------------------------------
app.get('/download/:shareId', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'download.html')
    );
});

// --------------------------------------------------
// 404 handler
// --------------------------------------------------
app.use((req, res) => {
    res.status(404).send('Page not found.');
});

// --------------------------------------------------
// Global error handler
// --------------------------------------------------
app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    res.status(500).json({
        success: false,
        message: 'Something went wrong on the server.'
    });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
const startServer = async () => {
    try {
        console.log('Starting FileShareApp...');

        // Connect to MongoDB first
        await connectDB();

        // Start Express server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(
                `FileShareApp server running on port ${PORT}`
            );
        });

    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
};

startServer();