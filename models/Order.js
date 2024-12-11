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
        name: { type: String, required: true }, // Include product name for easier reference
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
      // street: { type: String, required: true },
      // city: { type: String, required: true },
      // state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String, required: true },
      // phone: { type: String, required: true },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'cancelled'],
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
