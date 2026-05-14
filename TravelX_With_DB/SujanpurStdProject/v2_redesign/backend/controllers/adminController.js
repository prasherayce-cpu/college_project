const pool = require('../config/db');

const slugifyDestinationKey = (name) =>
  String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

const createDestination = async (req, res) => {
  let connection;

  try {
    const {
      destinationKey,
      name,
      location,
      price,
      imageUrl,
      rating,
      description,
      isActive,
    } = req.body;

    if (!name || !location || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, location and price are required' });
    }

    const resolvedKey = String(destinationKey || slugifyDestinationKey(name));
    const priceNumber = Number(price);
    const ratingNumber = rating === undefined || rating === '' ? 0 : Number(rating);

    if (!resolvedKey || Number.isNaN(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Valid destination key and price are required' });
    }

    if (Number.isNaN(ratingNumber) || ratingNumber < 0 || ratingNumber > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
    }

    connection = await pool.getConnection();
    const [result] = await connection.query(
      `
        INSERT INTO destinations
          (destination_key, name, location, price, image_url, rating, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        resolvedKey,
        name.trim(),
        location.trim(),
        priceNumber,
        imageUrl || null,
        ratingNumber,
        description || null,
        typeof isActive === 'boolean' ? isActive : true,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      destinationId: result.insertId,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Destination key already exists' });
    }

    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to create destination' });
  } finally {
    if (connection) connection.release();
  }
};

const updateDestination = async (req, res) => {
  let connection;

  try {
    const destinationId = Number(req.params.id);
    const {
      destinationKey,
      name,
      location,
      price,
      imageUrl,
      rating,
      description,
      isActive,
    } = req.body;

    if (!Number.isInteger(destinationId) || destinationId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid destination id' });
    }

    if (!name || !location || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, location and price are required' });
    }

    const resolvedKey = String(destinationKey || slugifyDestinationKey(name));
    const priceNumber = Number(price);
    const ratingNumber = rating === undefined || rating === '' ? 0 : Number(rating);

    if (!resolvedKey || Number.isNaN(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Valid destination key and price are required' });
    }

    if (Number.isNaN(ratingNumber) || ratingNumber < 0 || ratingNumber > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
    }

    connection = await pool.getConnection();
    const [result] = await connection.query(
      `
        UPDATE destinations
        SET destination_key = ?, name = ?, location = ?, price = ?, image_url = ?, rating = ?, description = ?, is_active = ?
        WHERE id = ?
      `,
      [
        resolvedKey,
        name.trim(),
        location.trim(),
        priceNumber,
        imageUrl || null,
        ratingNumber,
        description || null,
        typeof isActive === 'boolean' ? isActive : true,
        destinationId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    return res.json({ success: true, message: 'Destination updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Destination key already exists' });
    }

    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update destination' });
  } finally {
    if (connection) connection.release();
  }
};

const cancelBooking = async (req, res) => {
  let connection;

  try {
    const bookingId = Number(req.params.id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking id' });
    }

    connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE bookings SET status = ? WHERE id = ? AND status <> ?',
      ['cancelled', bookingId, 'cancelled']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found or already cancelled' });
    }

    return res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  getAllDestinations,
  createDestination,
  updateDestination,
  updateDestinationStatus,
};
