const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
  },
  subcategory: {
    type: String,
    required: [true, 'Product subcategory is required'],
  },
  brand: {
    type: String,
    required: [true, 'Product brand is required'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be a positive number'],
  },
  images: {
    type: [String],
    required: [true, 'Product images are required'],
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be between 0 and 5'],
    max: [5, 'Rating must be between 0 and 5'],
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
  },
  sku: {
    type: String,
    required: [true, 'Product SKU is required'],
    unique: true,
    trim: true,
  },
  weight: {
    type: Number,
    required: [true, 'Product weight is required'],
    min: [0, 'Weight must be a positive number'],
  },
  dimensions: {
    type: String,
    required: [true, 'Product dimensions are required'],
    validate: {
      validator: function (v) {
        return /^\d+(\.\d+)?\s*[x*]\s*\d+(\.\d+)?\s*[x*]\s*\d+(\.\d+)?$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid dimension format! Use "L x W x H" or "L * W * H" (e.g., "10 x 5 x 2" or "10 * 5 * 2").`,
    },
  },
  isSpecialOffer: {
    type: Boolean,
    default: false, // Defaults to `false` if not provided
  },
  discountPercentage: {
    type: Number,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100'],
    validate: {
      validator: function (v) {
        // Ensure discountPercentage is only set when isSpecialOffer is true
        return !this.isSpecialOffer || (v >= 0 && v <= 100);
      },
      message: 'Discount percentage must be between 0 and 100 if provided.',
    },
  },
  discountedPrice: {
    type: Number,
    get: function () {
      if (this.isSpecialOffer && this.discountPercentage > 0) {
        return this.price - (this.price * this.discountPercentage) / 100;
      }
      return this.price;
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);
