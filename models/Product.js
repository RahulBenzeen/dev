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
    // ref: 'Category',  // Reference to Category model (if needed)
    required: [true, 'Product category is required'],


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
    // validate: {
    //   validator: function (v) {
    //     return v.every(url => /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(url));
    //   },
    //   message: 'Invalid URL format for images',
    // },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);
