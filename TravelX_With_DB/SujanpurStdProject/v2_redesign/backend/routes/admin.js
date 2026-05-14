const express = require('express');
const {
  getAllBookings,
  getAllDestinations,
  updateDestinationStatus,
} = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/bookings', getAllBookings);
router.get('/destinations', getAllDestinations);
router.patch('/destinations/:id/status', updateDestinationStatus);

module.exports = router;
