const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const connection = await pool.getConnection();

    // Check if user already exists
    const [existingUser] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );

    connection.release();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const connection = await pool.getConnection();

    // Find user
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user' },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
};

// Get current user
const getUser = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, login, logout, getUser };
