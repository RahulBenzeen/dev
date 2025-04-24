const GiftOffer = require('../models/GiftOffer');
const Product = require('../models/Product');
// Create new gift offer
const createGiftOffer = async (req, res) => {
  try {
    const { minCartValue, giftCount, giftProducts } = req.body;

    const newGiftOffer = new GiftOffer({
      minCartValue,
      giftCount,
      giftProducts,
    });

    await newGiftOffer.save();

    // Set gift = true for the associated products
    await Product.updateMany(
      { _id: { $in: giftProducts } },
      { $set: { gift: true } }
    );

    res.status(201).json(newGiftOffer);
  } catch (err) {
    res.status(500).json({ message: 'Error creating gift offer', error: err.message });
  }
};

// Get all gift offers
const getAllGiftOffers = async (req, res) => {
  try {
    const giftOffers = await GiftOffer.find().populate('giftProducts');
    res.status(200).json(giftOffers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching gift offers', error: err.message });
  }
};



const deleteGiftOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const giftOffer = await GiftOffer.findById(id);
    if (!giftOffer) {
      return res.status(404).json({ message: 'Gift offer not found' });
    }

    // Get the product IDs from the offer
    const productIds = giftOffer.giftProducts;

    // Set the gift field to false for each product
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { gift: false } }
    );

    // Delete the gift offer
    await GiftOffer.findByIdAndDelete(id);

    res.status(200).json({ message: 'Gift offer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting gift offer', error: err.message });
  }
};;

module.exports = {
  createGiftOffer,
  getAllGiftOffers,
  deleteGiftOffer,
};
