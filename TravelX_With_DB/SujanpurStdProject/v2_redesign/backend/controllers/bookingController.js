const pool = require('../config/db');

const bookingSelectFields = `
  b.id,
  b.user_id AS userId,
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
`;

const createBooking = async (req, res) => {
  let connection;

  try {
    const {
      destination,
      fullName,
      email,
      phone,
      guests,
      checkIn,
      checkOut,
      roomType,
      pricePerNight,
      totalPrice,
    } = req.body;

    const userId = req.user?.id;

    // ✅ Validation
    if (
      !userId ||
      !destination ||
      !fullName ||
      !email ||
      !phone ||
      !guests ||
      !checkIn ||
      !checkOut ||
      !roomType ||
      !pricePerNight ||
      !totalPrice
    ) {
      return res.status(400).json({
        success: false,
        message: 'All booking fields are required',
      });
    }

    // ✅ Date validation
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate <= startDate
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid check-in/check-out dates',
      });
    }

    // ✅ Numeric conversions
    const guestsNumber = parseInt(guests, 10);
    const nights = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );

    const pricePerNightNumber = Number(pricePerNight);
    const totalPriceNumber = Number(totalPrice);

    if (
      Number.isNaN(guestsNumber) ||
      guestsNumber < 1 ||
      Number.isNaN(pricePerNightNumber) ||
      pricePerNightNumber <= 0 ||
      Number.isNaN(totalPriceNumber) ||
      totalPriceNumber <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid numeric booking values',
      });
    }

    // ✅ DB Connection
    connection = await pool.getConnection();

    const sql = `
      INSERT INTO bookings (
        user_id,
        destination,
        full_name,
        email,
        phone,
        room_type,
        price_per_night,
        start_date,
        end_date,
        nights,
        number_of_people,
        total_price,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      destination,
      fullName,
      email,
      phone,
      roomType,
      pricePerNightNumber,
      checkIn,
      checkOut,
      nights,
      guestsNumber,
      totalPriceNumber,
      'confirmed',
    ];

    const [result] = await connection.query(sql, values);

    return res.status(201).json({
      success: true,
      message: 'Booking saved successfully',
      bookingId: result.insertId,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving booking',
    });
  } finally {
    if (connection) connection.release(); // ✅ important
  }
};

const getAllBookings = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    const [bookings] = await connection.query(
      `
        SELECT
          ${bookingSelectFields},
          u.name AS userName,
          u.email AS userEmail
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

const getUserBookings = async (req, res) => {
  let connection;

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    connection = await pool.getConnection();
    const [bookings] = await connection.query(
      `
        SELECT
          id,
          destination,
          full_name,
          email,
          phone,
          room_type,
          price_per_night,
          start_date,
          end_date,
          nights,
          number_of_people,
          total_price,
          status,
          created_at
        FROM bookings
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings',
    });
  } finally {
    if (connection) connection.release();
  }
};

const cancelBooking = async (req, res) => {
  let connection;

  try {
    const bookingId = Number(req.params.id);
    const userId = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    connection = await pool.getConnection();

    const [result] = await connection.query(
      isAdmin
        ? 'UPDATE bookings SET status = ? WHERE id = ? AND status <> ?'
        : 'UPDATE bookings SET status = ? WHERE id = ? AND user_id = ? AND status <> ?',
      isAdmin
        ? ['cancelled', bookingId, 'cancelled']
        : ['cancelled', bookingId, userId, 'cancelled']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: isAdmin
          ? 'Booking not found or already cancelled'
          : 'Booking not found, not owned by you, or already cancelled',
      });
    }

    return res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { createBooking, getAllBookings, getUserBookings, cancelBooking };