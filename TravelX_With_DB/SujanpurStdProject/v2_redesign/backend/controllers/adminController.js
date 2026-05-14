const pool = require('../config/db');

const getAllBookings = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const [bookings] = await connection.query(
      `
        SELECT
          b.id,
          b.user_id AS userId,
          u.name AS userName,
          u.email AS userEmail,
          b.destination,
          b.full_name AS fullName,
          b.email,
          b.phone,
          b.room_type AS roomType,
          b.price_per_night AS pricePerNight,
          b.start_date AS startDate,
          b.end_date AS endDate,
          b.nights,
          b.number_of_people AS numberOfPeople,
          b.total_price AS totalPrice,
          b.status,
          b.created_at AS createdAt
        FROM bookings b
        LEFT JOIN users u ON u.id = b.user_id
        ORDER BY b.created_at DESC
      `
    );

    return res.json({ success: true, bookings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  } finally {
    if (connection) connection.release();
  }
};

const getAllDestinations = async (req, res) => {
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
          is_active AS isActive,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM destinations
        ORDER BY id ASC
      `
    );

    return res.json({ success: true, destinations });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch destinations' });
  } finally {
    if (connection) connection.release();
  }
};

const updateDestinationStatus = async (req, res) => {
  let connection;

  try {
    const destinationId = Number(req.params.id);
    const { isActive } = req.body;

    if (!Number.isInteger(destinationId) || destinationId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid destination id' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be boolean' });
    }

    connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE destinations SET is_active = ? WHERE id = ?',
      [isActive, destinationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    return res.json({ success: true, message: `Destination marked ${isActive ? 'active' : 'inactive'}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update destination status' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getAllBookings,
  getAllDestinations,
  updateDestinationStatus,
};
