const GiftOffer = require('../models/GiftOffer');
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

// Delete gift offer
const deleteGiftOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await GiftOffer.findByIdAndDelete(id);
    res.status(200).json({ message: 'Gift offer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting gift offer', error: err.message });
  }
};

module.exports = {
  createGiftOffer,
  getAllGiftOffers,
  deleteGiftOffer,
};
