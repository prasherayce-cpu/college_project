const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'travelx_db';

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.initializeDatabase = async () => {
  const adminPool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 2,
    queueLimit: 0,
  });

  let connection;

  try {
    connection = await adminPool.getConnection();
    await connection.query('CREATE DATABASE IF NOT EXISTS ??', [DB_NAME]);
  } finally {
    if (connection) connection.release();
    await adminPool.end();
  }
};

module.exports = pool;
