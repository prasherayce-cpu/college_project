const express = require('express');
const { createBooking, getUserBookings } = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, createBooking);
router.get('/my', verifyToken, getUserBookings);

module.exports = router;
