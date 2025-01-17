const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    // You can add other fields like 'productId' if you're linking to products
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Image = mongoose.model('Image', ImageSchema);

module.exports = Image;
