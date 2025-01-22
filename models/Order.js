const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      name: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    razorpayOrderId: { type: String },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: [
        'pending',       // Order placed but not yet processed
        'processing',    // Order is being prepared
        'packed',        // Order is packed and ready for shipment
        'shipped',       // Order has been handed over to the courier
        'in-transit',    // Order is in transit to the destination
        'delivered',     // Order has been delivered to the customer
        'cancelled',     // Order was cancelled
        'returned',      // Order has been returned by the customer
        'refunded',      // Refund processed for the order
      ],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'creditCard', 'paypal'],
      required: true,
    },
    shippingInfo: {
      trackingNumber: { type: String },
      courierService: { type: String },
      shippingDate: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
