const express = require('express');
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  validateAndSaveAddress
  
} = require('../controllers/userController');
const { protect , verifyToken} = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Private routes
router.get('/profile', protect, getProfile);
router.get('/verify', verifyToken, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
