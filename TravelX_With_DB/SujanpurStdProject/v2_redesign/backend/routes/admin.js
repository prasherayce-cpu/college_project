const express = require('express');
const {
  getAllDestinations,
  createDestination,
  updateDestination,
  updateDestinationStatus,
} = require('../controllers/adminController');
const { getAllBookings, cancelBooking } = require('../controllers/bookingController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/cancel', cancelBooking);
router.post('/destinations', createDestination);
router.get('/destinations', getAllDestinations);
router.patch('/destinations/:id', updateDestination);
router.patch('/destinations/:id/status', updateDestinationStatus);

module.exports = router;
