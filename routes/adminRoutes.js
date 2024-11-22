const express = require('express');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getUsers,
  getOrders,
  getPayments,
  getCategories,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

// Admin Routes for managing products
router.get('/products', protect, adminOnly, getProducts);
router.post('/products', protect, adminOnly, createProduct);
router.put('/products/:id', protect, adminOnly, updateProduct);
router.delete('/products/:id', protect, adminOnly, deleteProduct);

// Admin Routes for managing users
router.get('/users', protect, adminOnly, getUsers);

// Admin Routes for managing orders
router.get('/orders', protect, adminOnly, getOrders);

// Admin Routes for managing payments
router.get('/payments', protect, adminOnly, getPayments);

// Admin Routes for managing categories
router.get('/categories', protect, adminOnly, getCategories);

module.exports = router;
