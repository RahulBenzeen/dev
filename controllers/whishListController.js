const Wishlist = require('../models/whislist');
const Product = require('../models/Product');

// Add product to wishlist
// Add product to wishlist
const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [{ product: productId }] });
    } else {
      const productExists = wishlist.products.some(
        (item) => item.product.toString() === productId
      );

      if (productExists) {
        return res.status(400).json({ message: 'Product already in wishlist' });
      }

      wishlist.products.push({ product: productId });
    }

    await wishlist.save();
    const populatedWishlist = await Wishlist.findById(wishlist._id).populate('products.product');
    return res.status(200).json({
      message: 'Product added to wishlist',
      wishlist: populatedWishlist,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const userId = req.user.id;

  try {
    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    const productIndex = wishlist.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(400).json({ message: 'Product not found in wishlist' });
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    const populatedWishlist = await Wishlist.findById(wishlist._id).populate('products.product');
    return res.status(200).json({
      message: 'Product removed from wishlist',
      wishlist: populatedWishlist,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get the user's wishlist
const getWishlist = async (req, res) => {
  const userId = req.user.id;

  try {
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products.product');
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    return res.status(200).json({
      message: 'Wishlist retrieved successfully',
      wishlist,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};



module.exports = {
    addToWishlist,
    removeFromWishlist,
     getWishlist
}