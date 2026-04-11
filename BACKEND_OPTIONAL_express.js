/**
 * ============================================
 * OPTIONAL: Node.js/Express Backend Example
 * For Production Use with Proper Security
 * ============================================
 * 
 * This file shows how to implement proper server-side
 * authentication with password hashing and database storage.
 * 
 * Install dependencies:
 * npm install express bcryptjs jsonwebtoken dotenv cors
 */

// ============================================
// IMPORTS
// ============================================
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for front-end communication
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5500', // VS Code Live Server
  credentials: true,
}));

// ============================================
// CONFIGURATION
// ============================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const USERS_DB_PATH = path.join(__dirname, 'database', 'users.json');
const PORT = process.env.PORT || 3000;

// ============================================
// DATABASE UTILITIES
// ============================================

/**
 * Read users from JSON file
 */
async function readUsersFromFile() {
  try {
    const data = await fs.readFile(USERS_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

/**
 * Write users to JSON file
 */
async function writeUsersToFile(users) {
  const dir = path.dirname(USERS_DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(USERS_DB_PATH, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing to users.json:', error);
    throw error;
  }
}

/**
 * Find user by username
 */
async function findUserByUsername(username) {
  const users = await readUsersFromFile();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

/**
 * Find user by ID
 */
async function findUserById(id) {
  const users = await readUsersFromFile();
  return users.find(u => u.id === id);
}

/**
 * Create new user
 */
async function createUser(userData) {
  const users = await readUsersFromFile();
  
  // Check if username already exists
  if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
    throw new Error('Username already exists');
  }
  
  // Hash password
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(userData.password, salt);
  
  const newUser = {
    id: generateUserId(),
    fullName: userData.fullName,
    username: userData.username,
    email: userData.email || null,
    password: hashedPassword, // Store hashed password
    createdAt: new Date().toISOString(),
  };
  
  users.push(newUser);
  await writeUsersToFile(users);
  
  return newUser;
}

/**
 * Generate unique user ID
 */
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

const SPECIAL_CHARS = /[!@#$%^&*]/;

/**
 * Validate username against all requirements
 */
function validateUsername(username, fullName) {
  const errors = [];
  
  // Length check
  if (username.length < 6 || username.length > 20) {
    errors.push('Username must be 6–20 characters.');
  }
  
  // No spaces
  if (username.includes(' ')) {
    errors.push('Username cannot contain spaces.');
  }
  
  // Uppercase letter
  if (!/[A-Z]/.test(username)) {
    errors.push('Username must contain at least one uppercase letter.');
  }
  
  // Number
  if (!/[0-9]/.test(username)) {
    errors.push('Username must contain at least one number.');
  }
  
  // Special character
  if (!SPECIAL_CHARS.test(username)) {
    errors.push('Username must contain at least one special character (!@#$%^&*).');
  }
  
  // Name inclusion
  if (!isNameIncluded(username, fullName)) {
    errors.push('Username must include part of your full name.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if username includes part of full name
 */
function isNameIncluded(username, fullName) {
  const nameParts = fullName.toLowerCase().split(' ');
  const usernameLower = username.toLowerCase();
  
  return nameParts.some(part => 
    part.length > 0 && usernameLower.includes(part)
  );
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// API ROUTES: AUTHENTICATION
// ============================================

/**
 * POST /api/auth/register
 * Register a new user
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;
    
    // Validate required fields
    if (!fullName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, username, and password are required.',
      });
    }
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }
    
    // Validate username
    const usernameValidation = validateUsername(username, fullName);
    if (!usernameValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Username validation failed.',
        errors: usernameValidation.errors,
      });
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password validation failed.',
        errors: passwordValidation.errors,
      });
    }
    
    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }
    
    // Create user
    const newUser = await createUser({
      fullName,
      username,
      email,
      password,
    });
    
    // Return user data (without password)
    const userResponse = {
      id: newUser.id,
      fullName: newUser.fullName,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
});

/**
 * POST /api/auth/login
 * Login a user
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }
    
    // Find user
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }
    
    // Compare passwords
    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return user data and token (without password)
    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    };
    
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout a user (optional, mainly for session cleanup)
 */
app.post('/api/auth/logout', (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from localStorage
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
});

/**
 * GET /api/auth/profile
 * Get current user profile (requires valid token)
 */
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }
    
    const userResponse = {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
    
    res.status(200).json({
      success: true,
      user: userResponse,
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.',
    });
  }
});

// ============================================
// MIDDLEWARE: JWT VERIFICATION
// ============================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided.',
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token expired or invalid.',
      });
    }
    
    req.userId = user.id;
    next();
  });
}

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  console.log(`Auth server running at http://localhost:${PORT}`);
  console.log('Make sure CORS origin matches your front-end URL.');
});

// ============================================
// EXAMPLE: How to Use This Backend
// ============================================

/**
 * CLIENT-SIDE: Update auth.js to call backend API
 * 
 * // Registration
 * const response = await fetch('http://localhost:3000/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     fullName: 'John Doe',
 *     username: 'JohnDoe@123',
 *     password: 'mypassword123',
 *     confirmPassword: 'mypassword123',
 *     email: 'john@example.com'
 *   })
 * });
 * const data = await response.json();
 * 
 * // Login
 * const response = await fetch('http://localhost:3000/api/auth/login', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     username: 'JohnDoe@123',
 *     password: 'mypassword123'
 *   })
 * });
 * const data = await response.json();
 * 
 * // Store token
 * if (data.success) {
 *   localStorage.setItem('authToken', data.token);
 *   localStorage.setItem('currentUser', JSON.stringify(data.user));
 * }
 * 
 * // Protected requests
 * const response = await fetch('http://localhost:3000/api/auth/profile', {
 *   headers: {
 *     'Authorization': 'Bearer ' + localStorage.getItem('authToken')
 *   }
 * });
 */

module.exports = app;
