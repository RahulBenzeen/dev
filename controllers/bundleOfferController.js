const BundleOffer = require('../models/BundleOffer');

// Create new bundle offer
const createBundleOffer = async (req, res) => {
  try {
    const bundleOffersData = req.body; // expecting an array of offers

    if (!Array.isArray(bundleOffersData) || bundleOffersData.length === 0) {
      return res.status(400).json({ message: "No bundle offers provided" });
    }

    const savedOffers = await BundleOffer.insertMany(bundleOffersData);
    res.status(201).json(savedOffers);
  } catch (err) {
    res.status(500).json({
      message: 'Error creating bundle offers',
      error: err.message,
    });
  }
};


// Get all bundle offers
const getAllBundleOffers = async (req, res) => {
  try {
    const bundleOffers = await BundleOffer.find().populate('products');
    res.status(200).json(bundleOffers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching bundle offers', error: err.message });
  }
};

// Delete bundle offer
const deleteBundleOffer = async (req, res) => {
  try {
    const { id } = req.params;
    await BundleOffer.findByIdAndDelete(id);
    res.status(200).json({ message: 'Bundle offer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting bundle offer', error: err.message });
  }
};

module.exports = {
  createBundleOffer,
  getAllBundleOffers,
  deleteBundleOffer,
};
