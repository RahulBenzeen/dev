const Wishlist = require('../models/whislist');
const Product = require('../models/Product');

// Add product to wishlist
const addToWishlist = async (req, res) => {
  console.log('added')
  const { productId } = req.body;
  const userId = req.user.id; // Assuming user ID is available from middleware

  try {
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the wishlist already exists for the user
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Create a new wishlist if it doesn't exist
      wishlist = new Wishlist({
        user: userId,
        products: [{ product: productId }],
      });
    } else {
      // Check if the product is already in the wishlist
      const productExists = wishlist.products.some(
        (item) => item.product.toString() === productId
      );

      if (productExists) {
        return res.status(400).json({ message: 'Product already in wishlist' });
      }

      // Add the product to the wishlist
      wishlist.products.push({ product: productId });
    }

    // Save the wishlist to the database
    await wishlist.save();
    return res.status(200).json({ message: 'Product added to wishlist', wishlist });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  const { productId } = req.body;
  const userId = req.user.id;

  try {
    // Find the wishlist for the user
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    // Find the product in the wishlist and remove it
    const productIndex = wishlist.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(400).json({ message: 'Product not found in wishlist' });
    }

    // Remove the product from the wishlist
    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    return res.status(200).json({ message: 'Product removed from wishlist', wishlist });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get the user's wishlist
const getWishlist = async (req, res) => {
  const userId = req.user.id;

  try {
    // Find the user's wishlist and populate the products
    const wishlist = await Wishlist.findOne({ user: userId }).populate('products.product');

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }

    return res.status(200).json(wishlist);
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