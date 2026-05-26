require('dotenv').config(); // Load environment variables first
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const session = require('express-session'); // Require session middleware
const flash = require('connect-flash');    // Require flash middleware
const app = express();
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const projectGuideRoutes = require('./routes/projectGuideRoutes');
const allRoutes = require('./routes/allRoutes');
const projectRoutes = require('./routes/projectRoutes');
const projectRefineryRoutes = require('./routes/projectRefineryRoutes');
const projectHubRoutes = require('./routes/projectHubRoutes');

// --- Database Connection ---
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// --- View Engine Setup ---
app.set('views', path.join(__dirname, 'views')); // Assuming views are in a 'views' folder
app.set('view engine', 'ejs'); // Assuming you use EJS

// --- Middleware ---
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true})); // For parsing application/x-www-form-urlencoded
app.use(cookieParser()); // For parsing cookies

// --- Static Files ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// --- Session Configuration ---
// IMPORTANT: Place session config BEFORE flash and routes
app.use(session({
    secret: process.env.SESSION_SECRET || 'a_very_secret_key_replace_in_production', // Use an environment variable for the secret!
    resave: false,
    saveUninitialized: false, // Set to false for login sessions
    // Consider adding a store like connect-mongo for production
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (requires HTTPS)
        maxAge: 1000 * 60 * 60 // Example: Cookie expires in 1 hour
    }
}));

// --- Flash Middleware ---
// IMPORTANT: Place flash AFTER session middleware
app.use(flash());

// --- Global Variables for Flash Messages (Optional but Recommended) ---
// This makes flash messages available in all templates via res.locals
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    // You might add other flash types if needed (e.g., from passport)
    // res.locals.error = req.flash('error');
    next();
});

app.get("/welcome", (req, res) => {
res.render("index");
});

// --- Routes ---
// Mount routes AFTER session and flash middleware
app.use('/student', studentRoutes);
app.use('/guide', projectGuideRoutes);
app.use('/api', allRoutes);
app.use('/admin', adminRoutes);
app.use('/project', projectRoutes);
app.use('/projectref', projectRefineryRoutes);
app.use('/projecthub', projectHubRoutes);


// --- Start Server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Optional: Export app if needed for testing