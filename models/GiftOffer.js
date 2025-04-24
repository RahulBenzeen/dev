// models/GiftOffer.js
const mongoose = require('mongoose');

const giftOfferSchema = new mongoose.Schema({
  minCartValue: { type: Number, required: true },
  giftCount: { type: Number, required: true },
  giftProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],
  name:String
});

const GiftOffer = mongoose.model('GiftOffer', giftOfferSchema);

module.exports = GiftOffer;
