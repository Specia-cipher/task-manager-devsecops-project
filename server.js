const express = require('express');
const mongoose = require('mongoose');
const taskRoutes = require('./routes/taskRoutes'); // import routes

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // 👈 NEW: Listen on all interfaces

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskmanager', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(express.json());

// Serve static frontend files
app.use(express.static('public'));

// API Routes
app.use('/api/tasks', taskRoutes);

// Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // 👈 Serve frontend
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
});

