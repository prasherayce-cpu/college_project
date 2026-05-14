const pool = require('../config/db');

const getActiveDestinations = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const [destinations] = await connection.query(
      `
        SELECT
          id,
          destination_key AS destinationKey,
          name,
          location,
          price,
          image_url AS imageUrl,
          rating,
          description,
          is_active AS isActive
        FROM destinations
        WHERE is_active = TRUE
        ORDER BY id ASC
      `
    );

    return res.json({ success: true, destinations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load destinations' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getActiveDestinations,
};
