const express = require('express');
const {
  addItemToCart,
  getCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
} = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Private routes for user
router.post('/', protect, addItemToCart);
router.get('/', protect, getCart);
router.put('/:itemId', protect, updateCartItemQuantity);
router.delete('/:itemId', protect, removeItemFromCart);
router.delete('/', protect, clearCart);

module.exports = router;
