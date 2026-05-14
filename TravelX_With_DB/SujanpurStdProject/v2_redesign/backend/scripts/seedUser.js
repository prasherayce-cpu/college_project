const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const DEFAULT_USERS = [
  {
    name: process.env.SEED_ADMIN_NAME || 'Admin User',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@travelx.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
  },
  {
    name: process.env.SEED_DEMO_NAME || 'Demo User',
    email: process.env.SEED_DEMO_EMAIL || 'demo@travelx.com',
    password: process.env.SEED_DEMO_PASSWORD || 'Demo@123',
    role: 'user',
  },
];

const ensureUsersTable = async (connection) => {
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
  const hasRoleColumn = columns.some((column) => column.Field === 'role');
  if (!hasRoleColumn) {
    await connection.query("ALTER TABLE users ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user'");
  }
};

const seedUser = async () => {
  let connection;

  try {
    if (typeof pool.initializeDatabase === 'function') {
      await pool.initializeDatabase();
    }

    connection = await pool.getConnection();
    await ensureUsersTable(connection);

    for (const user of DEFAULT_USERS) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      const [existingUser] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [user.email]
      );

      if (existingUser.length > 0) {
        await connection.query(
          'UPDATE users SET name = ?, password = ?, role = ? WHERE email = ?',
          [user.name, hashedPassword, user.role, user.email]
        );
        console.log(`Seed user updated: ${user.email}`);
      } else {
        await connection.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [user.name, user.email, hashedPassword, user.role]
        );
        console.log(`Seed user created: ${user.email}`);
      }
    }

    console.log('Seed credentials:');
    DEFAULT_USERS.forEach((user) => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Failed to seed user:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
};

seedUser();
