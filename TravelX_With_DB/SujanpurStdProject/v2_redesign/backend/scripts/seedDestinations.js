const pool = require('../config/db');
const destinationSeed = require('../data/destinationSeed');

const ensureDestinationsTable = async (connection) => {
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
};

const seedDestinations = async () => {
  let connection;

  try {
    if (typeof pool.initializeDatabase === 'function') {
      await pool.initializeDatabase();
    }

    connection = await pool.getConnection();
    await ensureDestinationsTable(connection);

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

    console.log(`Seeded destinations: ${destinationSeed.length}`);
  } catch (error) {
    console.error('Failed to seed destinations:', error.message);
    process.exitCode = 1;
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
};

seedDestinations();
