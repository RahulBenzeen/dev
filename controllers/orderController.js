const Order = require('../models/Order');
const { CustomError } = require('../middlewares/errorHandler');

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private, Admin
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email').populate('products.product', 'name price');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};


const createOrder = async (req, res, next) => {
  try {
    const { products, shippingAddress } = req.body;
    const userId = req.user.id; // Get the logged-in user's ID

    // Calculate the total price (could be done on the frontend as well)
    let totalPrice = 0;
    products.forEach(product => {
      totalPrice += product.quantity * product.price;
    });

    // Create the new order
    const order = await Order.create({
      user: userId,
      products: products,
      totalPrice: totalPrice,
      shippingAddress: shippingAddress,
    });

    res.status(201).json({
      success: true,
      orderId: order._id, // Return the created order ID
      order: order, // Optionally return the entire order object
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single order by ID
// @route   GET /api/admin/orders/:id
// @access  Private, Admin
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('products.product', 'name price');
    if (!order) {
      throw new CustomError('Order not found', 404);
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id
// @access  Private, Admin
const updateOrderStatus = async (req, res, next) => {
  const { orderStatus, paymentStatus } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus, paymentStatus },
      { new: true }
    );
    if (!order) {
      throw new CustomError('Order not found', 404);
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an order
// @route   DELETE /api/admin/orders/:id
// @access  Private, Admin
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      throw new CustomError('Order not found', 404);
    }
    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  createOrder
};
