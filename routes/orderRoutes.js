const express = require('express');
const {
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  createOrder
  
} = require('../controllers/orderController');
const { protect,adminOnly } = require('../middlewares/authMiddleware');


const router = express.Router();

// Admin Routes for managing orders
router.get('/orders', protect, adminOnly, getOrders);                // Get all orders
router.get('/orders/:id', protect, adminOnly, getOrderById);         // Get single order by ID
router.put('/orders/:id', protect, adminOnly, updateOrderStatus);    // Update order status
router.delete('/orders/:id', protect, adminOnly, deleteOrder);       // Delete order
router.post('/create', protect, createOrder);       // create order

module.exports = router;
