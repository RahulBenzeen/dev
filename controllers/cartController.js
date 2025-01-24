const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { CustomError } = require('../middlewares/errorHandler');

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
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

    // Check if there is enough stock for the requested quantity
    if (product.stock < quantity) {
      throw new CustomError('Not enough stock available', 400); // You can customize the error message
    }

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      // If no cart exists, create a new cart
      cart = new Cart({
        user: userId,
        items: [{ product: _id, quantity, price: product.discountedPrice || product.price }],
      });
    } else {
      // Check if product is already in the cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === _id.toString()
      );
      if (existingItemIndex >= 0) {
        // Check if the updated quantity exceeds available stock
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        if (product.stock < newQuantity) {
          throw new CustomError('Not enough stock available', 400); // You can customize the error message
        }
        // Update quantity if product already in cart
        cart.items[existingItemIndex].quantity = newQuantity;
        // Keep the price updated to ensure discounted price if available
        cart.items[existingItemIndex].price = product.discountedPrice || product.price;
      } else {
        // Add the new item to the cart
        cart.items.push({ product: _id, quantity, price: product.discountedPrice || product.price });
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
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'No cart found',
      });
    }

    // Calculate total price by considering discounted price if available
    let totalPrice = 0;
    cart.items.forEach(item => {
      totalPrice += item.quantity * item.price; // Use the stored price (discounted or regular)
    });

    res.status(200).json({
      success: true,
      data: cart,
      totalPrice: totalPrice.toFixed(2),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of cart item
// @route   PUT /api/cart/:itemId
// @access  Private
// @desc    Update quantity of cart item
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Find the user's cart
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) throw new CustomError('Cart not found', 404);

    // Find the item in the cart
    const itemIndex = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (itemIndex === -1) throw new CustomError('Item not found in cart', 404);

    // Get the product associated with the cart item
    const product = await Product.findById(cart.items[itemIndex].product);
    if (!product) throw new CustomError('Product not found', 404);

    // Check if there is enough stock for the requested quantity
    if (product.stock < quantity) {
      throw new CustomError('Not enough stock available', 400);
    }

    // Update the item's quantity and price
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.discountedPrice || product.price;

    // Save the updated cart
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
