const express = require('express');
const {
  createPaymentOrder,
  confirmPayment,
  handlePaymentFailure,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Create a payment intent (Stripe)
router.post('/create', protect, createPaymentOrder);

// Confirm the payment (called after client-side confirmation)
router.post('/confirm', protect, confirmPayment);

// Handle payment failure
router.post('/fail', protect, handlePaymentFailure);

module.exports = router;
