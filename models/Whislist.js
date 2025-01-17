const mongoose = require('mongoose');

// Define the schema for the Wishlist
const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Create the Wishlist model from the schema
const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
