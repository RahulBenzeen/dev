const express = require('express');
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleLogin,  // Import the Google Login controller
  verifyEmail
} = require('../controllers/userController');
const { protect, verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/google-login', googleLogin); // Add Google Login route

// Private routes
router.get('/profile', protect, getProfile);
router.get('/verify', verifyToken, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
