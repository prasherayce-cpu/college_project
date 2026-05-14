const express = require('express');
const { createBooking, getUserBookings, cancelBooking } = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', verifyToken, createBooking);
router.get('/my', verifyToken, getUserBookings);
router.patch('/:id/cancel', verifyToken, cancelBooking);

module.exports = router;
