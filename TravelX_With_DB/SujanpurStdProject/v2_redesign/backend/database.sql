-- Create database
CREATE DATABASE IF NOT EXISTS travelx_db;
USE travelx_db;

-- Create users table
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
);

-- Create bookings table
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
);

-- Create destinations table
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
);

-- Create index for faster queries
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_booking_user ON bookings(user_id);
CREATE INDEX idx_destination_active ON destinations(is_active);
