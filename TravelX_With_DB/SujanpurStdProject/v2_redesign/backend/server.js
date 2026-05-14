const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const destinationRoutes = require('./routes/destinations');
const adminRoutes = require('./routes/admin');
const pool = require('./config/db');
const destinationSeed = require('./data/destinationSeed');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://127.0.0.1:5500';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration - Allow multiple local development origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const ensureUserSchema = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(50),
        country VARCHAR(50),
        profile_image VARCHAR(255),
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [columns] = await connection.query('SHOW COLUMNS FROM users');
    const existingColumns = new Set(columns.map((column) => column.Field));
    if (!existingColumns.has('role')) {
      await connection.query("ALTER TABLE users ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user'");
    }
  } finally {
    connection.release();
  }
};

const ensureBookingSchema = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        destination VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        room_type VARCHAR(50) NOT NULL,
        price_per_night DECIMAL(10, 2) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        nights INT NOT NULL,
        number_of_people INT NOT NULL,
        total_price DECIMAL(10, 2),
        status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    const [columns] = await connection.query('SHOW COLUMNS FROM bookings');
    const existingColumns = new Set(columns.map((column) => column.Field));
    const requiredColumns = [
      { name: 'full_name', definition: "VARCHAR(100) NOT NULL DEFAULT ''" },
      { name: 'email', definition: "VARCHAR(100) NOT NULL DEFAULT ''" },
      { name: 'phone', definition: "VARCHAR(20) NOT NULL DEFAULT ''" },
      { name: 'room_type', definition: "VARCHAR(50) NOT NULL DEFAULT 'Standard'" },
      { name: 'price_per_night', definition: 'DECIMAL(10, 2) NOT NULL DEFAULT 0' },
      { name: 'nights', definition: 'INT NOT NULL DEFAULT 1' },
    ];

    for (const column of requiredColumns) {
      if (!existingColumns.has(column.name)) {
        await connection.query(`ALTER TABLE bookings ADD COLUMN ${column.name} ${column.definition}`);
      }
    }
  } finally {
    connection.release();
  }
};

const ensureDestinationSchema = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS destinations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        destination_key VARCHAR(80) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        location VARCHAR(120) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image_url VARCHAR(500),
        rating DECIMAL(2, 1) NOT NULL DEFAULT 0,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    for (const destination of destinationSeed) {
      await connection.query(
        `
          INSERT INTO destinations
            (destination_key, name, location, price, image_url, rating, description, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
          ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            location = VALUES(location),
            price = VALUES(price),
            image_url = VALUES(image_url),
            rating = VALUES(rating),
            description = VALUES(description)
        `,
        [
          destination.destinationKey,
          destination.name,
          destination.location,
          destination.price,
          destination.imageUrl,
          destination.rating,
          destination.description,
        ]
      );
    }
  } finally {
    connection.release();
  }
};

const startServer = async () => {
  try {
    await pool.initializeDatabase();
    await ensureUserSchema();
    await ensureBookingSchema();
    await ensureDestinationSchema();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Home URL: ${FRONTEND_BASE_URL}/home.html`);
      console.log(`Service URL: http://localhost:${PORT}/api/health`);
      console.log(`Admin URL: ${FRONTEND_BASE_URL}/admin.html`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
