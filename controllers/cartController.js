const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { CustomError } = require('../middlewares/errorHandler');

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addItemToCart = async (req, res, next) => {
  try {
    const { _id, quantity } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(_id);
    if (!product) throw new CustomError('Product not found', 404);

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ product: _id, quantity, price: product.price }],
      });
    } else {
      // Check if product is already in the cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === _id.toString()
      );
      if (existingItemIndex >= 0) {
        // Update quantity if product already in cart
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: _id, quantity, price: product.price });
      }
    }

    // Save the cart and calculate total price
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the current cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    console.log({ user: req.user.id })
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'No cart found',
      });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) throw new CustomError('Cart not found', 404);

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) throw new CustomError('Item not found in cart', 404);

    cart.items[itemIndex].quantity = quantity;

    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeItemFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) throw new CustomError('Cart not found', 404);

    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) throw new CustomError('Item not found in cart', 404);

    cart.items.splice(itemIndex, 1);

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear the cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) throw new CustomError('Cart not found', 404);

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addItemToCart,
  getCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
};
