const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database');
const { verifyEntraToken, authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Traditional Login (keeping for backward compatibility)
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.prepare(`
      SELECT u.*, e.first_name, e.last_name, e.department, e.position 
      FROM users u 
      LEFT JOIN employees e ON u.id = e.user_id 
      WHERE u.email = ?
    `).get(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Store user info in session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      department: user.department,
      position: user.position
    };

    res.json({
      message: 'Login successful',
      user: req.session.user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Entra ID Token Validation and User Creation/Update
router.post('/entra/validate', verifyEntraToken, async (req, res) => {
  try {
    const { email, name, given_name, family_name } = req.user;
    
    if (!email) {
      return res.status(400).json({ error: 'Email not found in token' });
    }

    // Check if user exists in database
    let dbUser = db.prepare(`
      SELECT u.*, e.first_name, e.last_name, e.department, e.position 
      FROM users u 
      LEFT JOIN employees e ON u.id = e.user_id 
      WHERE u.email = ?
    `).get(email);

    if (!dbUser) {
      // Create new user if doesn't exist
      const insertUser = db.prepare('INSERT INTO users (email, role, auth_provider) VALUES (?, ?, ?)');
      const result = insertUser.run(email, 'employee', 'entra_id');
      
      // Create employee record if we have name information
      if (given_name || family_name || name) {
        const firstName = given_name || name?.split(' ')[0] || '';
        const lastName = family_name || name?.split(' ').slice(1).join(' ') || '';
        
        const insertEmployee = db.prepare(`
          INSERT INTO employees (user_id, first_name, last_name, email, hire_date) 
          VALUES (?, ?, ?, ?, ?)
        `);
        insertEmployee.run(result.lastInsertRowid, firstName, lastName, email, new Date().toISOString().split('T')[0]);
      }

      // Fetch the newly created user
      dbUser = db.prepare(`
        SELECT u.*, e.first_name, e.last_name, e.department, e.position 
        FROM users u 
        LEFT JOIN employees e ON u.id = e.user_id 
        WHERE u.id = ?
      `).get(result.lastInsertRowid);
    }

    // Update session with user info
    req.session.user = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      first_name: dbUser.first_name || given_name,
      last_name: dbUser.last_name || family_name,
      department: dbUser.department,
      position: dbUser.position,
      auth_provider: 'entra_id'
    };

    res.json({
      message: 'Authentication successful',
      user: req.session.user
    });
  } catch (error) {
    console.error('Entra ID validation error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get current user (supports both auth methods)
router.get('/me', authenticate, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

// Register new user (admin only)
router.post('/register', authenticate, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { email, password, role = 'employee' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare('INSERT INTO users (email, password, role, auth_provider) VALUES (?, ?, ?, ?)');
    const result = insertUser.run(email, hashedPassword, role, 'local');

    res.status(201).json({
      message: 'User created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;