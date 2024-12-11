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
      validator: function(v) {
        return /^\d+(\.\d+)?\s*[x*]\s*\d+(\.\d+)?\s*[x*]\s*\d+(\.\d+)?$/.test(v);
      },
      message: props => `${props.value} is not a valid dimension format! Use "L x W x H" or "L * W * H" (e.g., "10 x 5 x 2" or "10 * 5 * 2").`
    }
  },  
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);