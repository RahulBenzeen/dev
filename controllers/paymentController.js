const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { CustomError } = require('../middlewares/errorHandler');

// Initialize Razorpay with your secret key
const razorpay = new Razorpay({
  key_id: 'rzp_test_F9X4DCfkVZS2pG	', // Your Razorpay Key ID
  key_secret: process.env.RAZORPAY_SECRET_KEY, // Your Razorpay Secret Key
});

// @desc    Create a payment order (Razorpay)
// @route   POST /api/payment/create
// @access  Private
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, paymentMethod }=  req.body;
    const userId = req.user.id;

    // Check if order exists and belongs to the user
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== userId.toString()) {
      throw new CustomError('Order not found or does not belong to the user', 404);
    }

    // Calculate the total amount from the order
    const amount = order.totalAmount * 100; // Razorpay requires amount in paise (1 INR = 100 paise)

    // Create a payment order with Razorpay
    const paymentOrder = await razorpay.orders.create({
      amount: amount, // Amount in paise
      currency: 'INR',
      receipt: `order_rcptid_${orderId}`,
      notes: {
        userId: userId,
        orderId: orderId,
      },
    });

    // Save payment info in database
    const payment = await Payment.create({
      user: userId,
      orderId: orderId,
      paymentMethod: paymentMethod || 'razorpay',
      amount: amount / 100, // Store amount in INR (not paise)
      paymentStatus: 'pending',
      transactionId: paymentOrder.id,
      paymentResponse: paymentOrder,
    });

    res.status(200).json({
      success: true,
      orderId: paymentOrder.id, // Return Razorpay order ID for frontend
      paymentId: payment.id, // Save payment details to track it
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm the payment and update payment status (Razorpay)
// @route   POST /api/payment/confirm
// @access  Private
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, paymentSignature } = req.body;

    // Retrieve the payment order from Razorpay
    const order = await razorpay.orders.fetch(paymentId);

    if (order.status === 'paid') {
      // Verify the payment signature
      const generatedSignature = razorpay.utils.verifyPaymentSignature({
        order_id: paymentId,
        payment_id: paymentId,
        signature: paymentSignature,
      });

      if (!generatedSignature) {
        throw new CustomError('Payment signature verification failed', 400);
      }

      // Update payment status in the database
      const payment = await Payment.findOneAndUpdate(
        { transactionId: paymentId },
        { paymentStatus: 'completed' },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Payment completed successfully',
        payment,
      });
    } else {
      throw new CustomError('Payment failed', 400);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Handle payment failures (Razorpay)
// @route   POST /api/payment/fail
// @access  Private
const handlePaymentFailure = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    // Update payment status in the database
    const payment = await Payment.findOneAndUpdate(
      { transactionId: paymentId },
      { paymentStatus: 'failed' },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payment failed',
      payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentOrder,
  confirmPayment,
  handlePaymentFailure,
};
