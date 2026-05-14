const express = require('express');
const { signup, login, logout, getUser } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getUser);

module.exports = router;
