const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Utility: Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET || 'your_super_secret_key', // Change this in production
        { expiresIn: '2h' }
    );
};

// 🚀 Register a new user
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        // Create and save user (no manual hashing here)
        const newUser = new User({ username, email, password });
        await newUser.save();

        // Generate token
        const token = generateToken(newUser);
        res.status(201).json({
            message: 'User registered successfully',
            user: { id: newUser._id, username: newUser.username, email: newUser.email },
            token
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// 🚀 Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            user: { id: user._id, username: user.username, email: user.email },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// 🚀 Get current user profile (protected route)
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ message: 'Server error retrieving profile' });
    }
};

