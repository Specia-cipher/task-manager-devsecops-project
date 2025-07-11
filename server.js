const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();

// 1. Core Express Middleware
app.use(express.json({ limit: '10kb' })); // Parses JSON request bodies, limits payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parses URL-encoded bodies

// 2. Security Middleware (TEMPORARILY LOOSENED FOR DEBUGGING HTTPS/CSP ISSUES)
// We are explicitly disabling HSTS and making CSP more permissive to diagnose browser issues.
// REMEMBER TO REVERT/TIGHTEN THESE FOR PRODUCTION!
app.use(helmet({
    strictTransportSecurity: false, // Temporarily disable HSTS (HTTP Strict Transport Security)
    contentSecurityPolicy: { // Temporarily loosen Content Security Policy
        directives: {
            defaultSrc: ["'self'"], // Only allow resources from the same origin by default
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow scripts from self and inline scripts
            styleSrc: ["'self'", "https:", "'unsafe-inline'"], // Allow styles from self, HTTPS for fonts, and inline styles
            formAction: ["'self'", "http://*"], // Allow forms to submit to self or any HTTP URL
            // Other Helmet protections like frameguard, nocache, xssFilter, etc., are still active by default
        },
    },
    // You can explicitly disable other Helmet modules if they cause issues, e.g.:
    // hsts: false, // Alias for strictTransportSecurity
    // crossOriginOpenerPolicy: false,
    // crossOriginResourcePolicy: false,
    // originAgentCluster: false,
}));


// 3. CORS Configuration
// For initial development/testing, we'll allow all origins.
// In production, you should restrict this to your specific frontend domain(s).
app.use(cors());

// 4. Serve Static Frontend Files
// This is crucial! It tells Express to look for files (like index.html, main.js, CSS)
// in the 'public' directory when a browser requests them.
// When you access http://localhost:3000/ (or your WSL2 IP), it will now serve public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// 5. Rate Limiting Middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again later.' }
});
// Apply rate limit to all /api/ routes
app.use('/api/', limiter);

// 6. Import and Use API Routes
// Ensure these files exist in your 'routes/' directory
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// 7. Fallback Root Route (for direct API testing, or if public/index.html is not found)
// This route will only be hit if express.static doesn't find index.html for '/'
app.get('/', (req, res) => {
    console.log('Received GET request on / - Frontend index.html might not be found, serving API message.');
    res.status(200).send('Welcome to the Task Manager API! Frontend not served via this route. Access API routes at /api/auth or /api/tasks.');
});

// 8. Generic 404 (Not Found) Handler
// This middleware will be hit if no other route (including static files) has handled the request.
// It MUST be placed AFTER all your defined routes and static file serving.
app.use((req, res, next) => {
    console.log(`404 Not Found for URL: ${req.originalUrl}`);
    res.status(404).send('Not Found');
});

// 9. Global Error Handling Middleware
// This middleware will catch any errors that occur in your routes or other middleware.
// It MUST be placed AFTER all your routes and other middleware.
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack); // Log the full error stack to your console
    res.status(err.statusCode || 500).json({
        message: err.message || 'Something went wrong on the server.',
        // Only show stack trace in development mode for security reasons
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

// 10. MongoDB Connection
// Ensure your .env file has MONGO_URI and optionally MONGO_DB_NAME
mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || 'taskmanager'
})
.then(() => {
    console.log('✅ Connected to MongoDB');
})
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    // It's often good practice to exit if the database connection fails on startup
    // process.exit(1);
});

// 11. Start Server
const PORT = process.env.PORT || 3000; // Use port from .env or default to 3000
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`Access your app from Windows via: http://YOUR_WSL2_IP:${PORT}`);
    console.log(`(Replace YOUR_WSL2_IP with the IP from 'wsl hostname -I' in PowerShell)`);
});
