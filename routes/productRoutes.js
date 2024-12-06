const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecentlyViewedProducts
} = require('../controllers/productController');

const { protect, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/all', getProducts);
router.get('/:id', getProductById);

// Admin routes
router.post('/add', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.get('/recently-viewed', protect, getRecentlyViewedProducts); // Add this route
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
