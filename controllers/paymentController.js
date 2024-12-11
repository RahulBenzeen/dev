const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { CustomError } = require('../middlewares/errorHandler');
const mongoose = require('mongoose');
const Product = require('../models/Product')
const Cart = require('../models/Cart')
// const sendEmailRequest = require('../utils/emailServices/emailProducer')
require('dotenv').config(); 
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

    try {
      // Check if order exists and belongs to the user
      const order = await Order.findById(orderId);
      if (!order || order.user.toString() !== userId.toString()) {
        throw new CustomError('Order not found or does not belong to the user', 404);
      }
      // Calculate the total amount from the order

      const amount = order.totalPrice * 100; // Razorpay requires amount in paise (1 INR = 100 paise)

      try {
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


        try {
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
        } catch (paymentError) {
          console.error("Error saving payment info:", paymentError);
          next(paymentError); // Pass the error to the next middleware
        }
      } catch (razorpayError) {
        console.error("Error creating Razorpay order:", razorpayError);
        next(razorpayError); // Pass the error to the next middleware
      }
    } catch (orderError) {
      console.error("Error fetching order:", orderError);
      next(orderError); // Pass the error to the next middleware
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    next(error); // Pass any unexpected error to the next middleware
  }
};


// @desc    Confirm the payment and update payment status (Razorpay)
// @route   POST /api/payment/confirm
// @access  Private
// const confirmPayment = async (req, res, next) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     console.log('Payment Details:', { razorpay_order_id, razorpay_payment_id, razorpay_signature });

//     // Fetch payment details using payment ID
//     const payment = await razorpay.payments.fetch(razorpay_payment_id);
//     console.log('Fetched Payment:', payment);

//     if (payment.status === 'captured') {
//       // Verify the payment signature
//       // const isSignatureValid = razorpay.utils.verifyPaymentSignature({
//       //   order_id: razorpay_order_id,
//       //   payment_id: razorpay_payment_id,
//       //   signature: razorpay_signature,
//       // });


//       // if (!isSignatureValid) {
//       //   throw new Error('Payment signature verification failed');
//       // }


//       // Update payment status in the database
//       const updatedPayment = await Payment.findOneAndUpdate(
//         { transactionId: razorpay_payment_id },
//         { paymentStatus: 'completed' },
//         { new: true }
//       );

//       const emailData = {
//         recipient:'rahulbhardwaj@benzeenautoparts.net', // Customer's email
//         subject: 'Payment Confirmation - Order Placed Successfully',
//         body: `Hello, your payment for Order ID: ${razorpay_order_id} has been successfully captured. Thank you for your purchase!`
//       };

//       // sendEmailRequest(emailData); // Send the email request to Kafka
//       return res.status(200).json({
//         success: true,
//         message: 'Payment completed successfully',
//         payment: updatedPayment,
//       });
//     } else {
//       throw new Error(`Payment status is not 'captured': ${payment.status}`);
//     }
//   } catch (error) {
//     console.error('Error in confirmPayment:', error.message);
//     return next(error);
//   }
// };

const confirmPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log('Payment Details:', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
     const userId = req.user.id
    // Fetch payment details using payment ID
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    console.log('Fetched Payment:', payment);

    if (payment.status === 'captured') {
      // Update payment status in the database
      const updatedPayment = await Payment.findOneAndUpdate(
        { transactionId: razorpay_payment_id },
        { paymentStatus: 'completed' },
        { new: true, session }
      );

      // Fetch the user's cart to get the products
      const userCart = await Cart.findOne({ user: userId }).populate('items.product').session(session);
      if (!userCart || userCart.products.length === 0) {
        throw new Error('Cart is empty or invalid');
      }

      // Remove the purchased products from the cart and update stock
      for (let cartItem of userCart.products) {
        const { productId, quantity } = cartItem;
        
        // Find the product and update its stock
        const product = await Product.findById(productId).session(session);
        if (product) {
          // Decrease the stock
          if (product.stock < quantity) {
            throw new Error(`Not enough stock for product: ${product.name}`);
          }
          product.stock -= quantity;
          await product.save({ session });
        }
      }

      // Remove all products from the user's cart after the purchase is confirmed
      await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }, { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      // Send confirmation email (asynchronous operation, not blocking)
      const emailData = {
        recipient: 'rahulbhardwaj@benzeenautoparts.net', // Example email, replace with the customer's email
        subject: 'Payment Confirmation - Order Placed Successfully',
        body: `Hello, your payment for Order ID: ${razorpay_order_id} has been successfully captured. Thank you for your purchase!`
      };

      // sendEmailRequest(emailData); // Send the email request to Kafka or another service

      return res.status(200).json({
        success: true,
        message: 'Payment completed successfully',
        payment: updatedPayment,
      });
    } else {
      throw new Error(`Payment status is not 'captured': ${payment.status}`);
    }
  } catch (error) {
    // Rollback the transaction if an error occurs
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

module.exports = {
  createPaymentOrder,
  confirmPayment,
  handlePaymentFailure,
};
