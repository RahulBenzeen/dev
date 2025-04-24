const BundleOffer = require('../models/BundleOffer');
const Product = require('../models/Product');
// Create new bundle offer
const createBundleOffer = async (req, res) => {
  try {
    const bundleOffersData = req.body;

    if (!Array.isArray(bundleOffersData) || bundleOffersData.length === 0) {
      return res.status(400).json({ message: "No bundle offers provided" });
    }

    const savedOffers = await BundleOffer.insertMany(bundleOffersData);

    // Collect all product IDs from the inserted bundle offers
    const productIds = savedOffers.flatMap(offer => offer.products);
    console.log(productIds);
    // Set bundle to true for those products
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { bundle: true } }
    );

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

    // Find the bundle offer to get associated product IDs
    const bundleOffer = await BundleOffer.findById(id);
    if (!bundleOffer) {
      return res.status(404).json({ message: 'Bundle offer not found' });
    }

    // Extract product IDs from the bundle offer
    const productIds = bundleOffer.products;

    // Update each associated product: set bundle = false
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { bundle: false } }
    );

    // Delete the bundle offer
    await BundleOffer.findByIdAndDelete(id);

    res.status(200).json({ message: 'Bundle offer deleted and associated products updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting bundle offer', error: err.message });
  }
};
module.exports = {
  createBundleOffer,
  getAllBundleOffers,
  deleteBundleOffer,
};
