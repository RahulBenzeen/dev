const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { CustomError } = require('../middlewares/errorHandler');
const mongoose = require('mongoose');
const User = require('../models/User')
const Cart = require('../models/Cart');
const sendEmail = require('../utils/emailServices/emailSender')

// Initialize Razorpay with your secret key
const razorpay = new Razorpay({
  key_id:process.env.RAZORPAY_KEY_ID, // Your Razorpay Key ID
  key_secret:process.env.RAZORPAY_SECRET_KEY, // Your Razorpay Secret Key
});


// @desc    Create a payment order (Razorpay)
// @route   POST /api/payment/create
// @access  Private
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Fetch the order and validate
    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== userId.toString()) {
      throw new CustomError('Order not found or does not belong to the user', 404);
    }

    // Ensure the order is eligible for payment
    if (order.paymentStatus === 'completed' || order.orderStatus === 'cancelled') {
      throw new CustomError('Order cannot be paid as it is either already completed or cancelled', 400);
    }

    // Calculate the total amount in paise
    const amountInPaise = order.totalPrice * 100;

    // Create a payment order with Razorpay
    const paymentOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_rcptid_${orderId}`,
      notes: {
        userId: userId,
        orderId: orderId,
      },
    });
    order.razorpayOrderId = paymentOrder.id;
    await order.save();

    // Save payment info in the database
    const payment = await Payment.create({
      user: userId,
      orderId: orderId,
      paymentMethod: paymentMethod || 'razorpay',
      amount: order.totalPrice, // Store amount in INR
      paymentStatus: 'pending',
      transactionId: paymentOrder.id,
      paymentResponse: paymentOrder,
    });

    // Respond with payment details
    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      orderId: paymentOrder.id, // Return Razorpay order ID for frontend
      paymentId: payment.id, // Save payment details to track it
      amount: order.totalPrice, // Return amount for display
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    next(error); // Pass the error to the next middleware
  }
};


const confirmPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;
    const userId = req.user.id;

    // Fetch payment details using payment ID
    const payment = await razorpay.payments.fetch(razorpay_payment_id);


    if (payment.status === 'captured') {
      // Update payment status in the database
      const updatedPayment = await Payment.findOneAndUpdate(
        { transactionId: payment.order_id },
        { paymentStatus: 'completed', paymentId:razorpay_payment_id},
        { new: true, session }
      );
    

      // Fetch the order associated with this payment
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id, user: userId, paymentStatus: 'pending' },
        { paymentStatus: 'completed' },
        { new: true, session }
      );

      if (!order) {
        throw new Error('Order not found or already updated');
      }

      // Fetch the user's cart to get the products
      const userCart = await Cart.findOne({ user: userId }).populate('items.product').session(session);
      if (!userCart || userCart.items.length === 0) {
        throw new Error('Cart is empty or invalid');
      }

      // Remove the purchased products from the cart and update stock
      for (let cartItem of userCart.items) {
        const { product, quantity } = cartItem;

        // Check and update stock
        if (product.stock < quantity) {
          throw new Error(`Not enough stock for product: ${product.name}`);
        }
        product.stock -= quantity;
        await product.save({ session });
      }

      // Remove all products from the user's cart after the purchase is confirmed
      await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } }, { session });

      // Fetch the user's email and name from the database
      const user = await User.findById(userId).select('email name');
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Send confirmation email to the user
      const emailData = {
        recipient: user.email,
        subject: 'Payment Confirmation - Order Placed Successfully',
        message: `
          Hello ${user.name || 'Valued Customer'}, 
          
          We are excited to inform you that your payment for Order ID: ${order._id} has been successfully captured. 
          
          **Order Details:**
          ${userCart.items
            .map(
              (item) =>
                `- ${item.product.name} (Quantity: ${item.quantity}) - ₹${item.product.price * item.quantity}`
            )
            .join('\n')}
          
          **Total Amount Paid:** ₹${payment.amount / 100} (including taxes and fees)
          
          **Estimated Delivery Date:** ${new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          
          Thank you for your purchase! If you have any questions or concerns, please don't hesitate to contact our support team at support@example.com.
          
          Best regards,  
          Nothing
        `,
      };

      try {
        await sendEmail(emailData);
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment completed successfully',
        payment: updatedPayment,
        order,
      });
    } else {
      throw new Error(`Payment status is not 'captured': ${payment.status}`);
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in confirmPayment:', error.message);
    return next(error);
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

const initiateRefund = async (req, res, next) => {


  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Fetch order and payment details
    const order = await Order.findById(orderId).session(session);


    if (!order || order.user.toString() !== userId.toString()) {
      throw new CustomError('Order not found or does not belong to the user', 404);
    }

    const payment = await Payment.findOne({ orderId }).session(session);

    if (!payment || payment.paymentStatus !== 'completed') {
      throw new CustomError('Payment not found or is not completed for this order', 400);
    }

    // Check if a refund already exists
    if (payment.paymentStatus === 'refunded') {
      throw new  CustomError('Refund already processed for this payment', 400);
    }

    // Ensure the order is eligible for refund
    if (order.orderStatus === 'delivered') {
      throw new CustomError('Delivered orders cannot be refunded', 400);
    }

    // Initiate refund via Razorpay
    const refund = await razorpay.payments.refund(payment.paymentId, {
      amount: payment.amount * 100, // Amount in paise
    });

    // Update payment status in the database
    payment.paymentStatus = 'refunded';
    payment.refundResponse = refund;
    await payment.save({ session });

    // Update order status
    order.orderStatus = 'cancelled'; // Update to 'cancelled' after refund
    await order.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Fetch the user's email and name
    const user = await User.findById(userId).select('email name');
    if (!user || !user.email) {
      throw new Error('User email not found');
    }

    // Send refund email to the user
    const emailData = {
      recipient: user.email,
      subject: 'Order Cancellation and Refund Initiated',
      message: `
        Hello ${user.name || 'Valued Customer'},

        We have successfully initiated the refund for your order with Order ID: ${orderId}.
        
        **Refund Details:**
        Amount Refunded: ₹${payment.amount}
        Refund Status: ${refund.status}

        Please allow 5-7 business days for the refund to reflect in your account.

        If you have any questions or concerns, please contact our support team at support@example.com.

        Best regards,
        Your E-commerce Team
      `,
    };

    try {
      await sendEmail(emailData);
      console.log('mail sending successfully refund')
    } catch (emailError) {
      console.error('Error sending refund email:', emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refund,
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();
    console.error('Error in refund initiation:', error);
    return next(error);
  }
};

module.exports = {
  createPaymentOrder,
  confirmPayment,
  handlePaymentFailure,
  initiateRefund
};
