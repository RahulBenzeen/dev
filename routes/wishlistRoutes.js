const express = require('express');
const router = express.Router();
const { addToWishlist, removeFromWishlist, getWishlist } = require('../controllers/whishListController');

// Middleware to protect routes (ensure user is authenticated)
const { protect } = require('../middlewares/authMiddleware');

// @route   GET /api/wishlist/:userId
// @desc    Get the user's wishlist
// @access  Private (authenticated users only)
router.get('/:userId', protect, getWishlist);

// @route   POST /api/wishlist
// @desc    Add product to the user's wishlist
// @access  Private (authenticated users only)
router.post('/add', protect, addToWishlist);

// @route   DELETE /api/wishlist
// @desc    Remove product from the user's wishlist
// @access  Private (authenticated users only)
router.delete('/remove/:productId', protect, removeFromWishlist);

module.exports = router;
