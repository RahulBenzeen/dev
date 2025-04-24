// models/BundleOffer.js
const mongoose = require('mongoose');

const bundleOfferSchema = new mongoose.Schema({
  minQty: { type: Number, required: true },
  discountType: { type: String, enum: ['percent', 'price'], required: true },
  discountValue: { type: Number, required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],
});

const BundleOffer = mongoose.model('BundleOffer', bundleOfferSchema);

module.exports = BundleOffer;
