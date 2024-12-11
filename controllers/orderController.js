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
    const { products, shippingAddress, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!products || products.length === 0) {
      throw new CustomError("No products provided for the order", 400);
    }
    if (!shippingAddress) {
      throw new CustomError("Shipping address is required", 400);
    }
    if (!paymentMethod) {
      throw new CustomError("Payment method is required", 400);
    }

    // Validate product structure
    products.forEach((product, index) => {
      if (!product.product) {
        throw new CustomError(`Product at index ${index} is missing a reference to the product schema`, 400);
      }
      if (!product.quantity || product.quantity <= 0) {
        throw new CustomError(`Product at index ${index} has an invalid quantity`, 400);
      }
      if (!product.price || product.price <= 0) {
        throw new CustomError(`Product at index ${index} has an invalid price`, 400);
      }
    });

    // Calculate total price
    const totalPrice = products.reduce((sum, product) => sum + product.quantity * product.price, 0);

    // Normalize shipping address
    const normalizedAddress = {
      name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      city: shippingAddress.city,
      country: shippingAddress.country,
      postalCode: shippingAddress.zipCode,
    };

    // Save the order
    const order = await Order.create({
      user: userId,
      products,
      totalPrice,
      shippingAddress: normalizedAddress,
      paymentMethod,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: order._id,
      order,
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


// @desc    Get all orders for a specific user
// @route   GET /api/orders/user/:userId
// @access  Private
const getOrdersByUser = async (req, res, next) => {
  console.log('request  user is here ===> ', req.user.id)
  try {

    // Find orders for the specified user
    const orders = await Order.find({ user: req.user.id })
      .populate('products.product', 'name price')
      .populate('user', 'name email');

    // Check if orders exist for the user
    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: 'No orders found for this user' });
    }

    res.status(200).json({ success: true, orders });
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
  createOrder,
  getOrdersByUser
};
