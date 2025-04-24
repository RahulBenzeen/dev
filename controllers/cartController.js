const Cart = require('../models/Cart');
const Product = require('../models/Product');
const BundleRule = require('../models/BundleOffer');
const GiftRule = require('../models/GiftOffer');
const { CustomError } = require('../middlewares/errorHandler');


const applyBundleDiscounts = async (cart) => {
  // Populate product if not already
  if (!cart.items[0]?.product?.bundle && cart.items.length > 0) {
    await cart.populate('items.product');
  }

  const bundleRules = await BundleRule.find({}).sort({ minQty: -1 });
  let totalDiscount = 0;
  const appliedOffers = [];
  const discountMap = {};

  const bundleItems = cart.items.filter(item =>
    item.product && typeof item.product === 'object' && item.product.bundle
  );

  let bundleQty = bundleItems.reduce((sum, item) => sum + item.quantity, 0);

  const matchingRule = bundleRules.find(rule => bundleQty >= rule.minQty);

  if (matchingRule) {
    let discountPerRule = 0;

    if (matchingRule.discountType === 'percent') {
      for (const item of bundleItems) {
        const product = item.product;
        const originalPrice = product.price;
        const finalPrice = parseFloat((originalPrice * (1 - matchingRule.discountValue / 100)).toFixed(2));
        const itemDiscount = (originalPrice - finalPrice) * item.quantity;

        discountPerRule += itemDiscount;

        discountMap[item._id.toString()] = {
          originalPrice,
          discountedPrice: finalPrice,
          quantity: item.quantity,
          discountAmount: itemDiscount,
          rule: matchingRule
        };
      }

    } else if (matchingRule.discountType === 'price') {
      // Flat price discount applied ONCE when minimum quantity is met
      discountPerRule = matchingRule.discountValue;

      // Distribute the discount evenly across bundle items
      const totalItems = bundleItems.reduce((sum, item) => sum + item.quantity, 0);
      for (const item of bundleItems) {
        const product = item.product;
        const originalPrice = product.price;
        const itemShare = (item.quantity / totalItems) * matchingRule.discountValue;
        const itemDiscount = itemShare;
        const finalPrice = originalPrice; // Price remains same, discount is not per unit

        discountMap[item._id.toString()] = {
          originalPrice,
          discountedPrice: originalPrice, // No price change per unit
          quantity: item.quantity,
          discountAmount: itemDiscount,
          rule: matchingRule
        };
      }
    }

    if (discountPerRule > 0) {
      appliedOffers.push({
        ruleId: matchingRule._id,
        minQty: matchingRule.minQty,
        discountType: matchingRule.discountType,
        discountValue: matchingRule.discountValue,
        discountAmount: discountPerRule.toFixed(2),
      });

      totalDiscount = discountPerRule;
    }
  } else {
    console.log("No matching bundle rule found");
  }

  return {
    totalDiscount,
    appliedOffers,
    discountMap,
  };
};

// Calculate cart totals and return gifts
const calculateCartTotals = async (cart, discountMap = {}) => {
  let originalTotal = 0;
  let discountedTotal = 0;
  let totalDiscount = 0;

  cart.items.forEach((item) => {
    const product = item.product;
    const itemId = item._id.toString();

    const originalPrice = product?.price || item.price;
    const itemOriginalTotal = item.quantity * originalPrice;
    originalTotal += itemOriginalTotal;

    if (discountMap[itemId]) {
      const discountInfo = discountMap[itemId];
      const finalPrice = discountInfo.discountedPrice;
      const itemDiscount = discountInfo.discountAmount;

      discountedTotal += item.quantity * finalPrice;
      totalDiscount += itemDiscount;
    } else {
      discountedTotal += itemOriginalTotal;
    }
  });

  const giftRules = await GiftRule.find({});
  const gifts = [];

  // Track added gift product IDs to avoid duplicates
  const addedGiftProductIds = new Set();

  for (const rule of giftRules) {
    if (discountedTotal >= rule.minCartValue) {
      const giftProducts = await Product.find({ _id: { $in: rule.giftProducts } });

      for (const product of giftProducts) {
        const productId = product._id.toString();

        if (!addedGiftProductIds.has(productId)) {
          addedGiftProductIds.add(productId);

          gifts.push({
            ...product.toObject(),
            price: 0,
            discountedPrice: 0,
            isGift: true,
          });
        }
      }
    }
  }

  return {
    originalTotal: originalTotal.toFixed(2),
    totalPrice: discountedTotal.toFixed(2),
    totalDiscount: totalDiscount.toFixed(2),
    gifts,
  };
};


// Add item to cart
const addItemToCart = async (req, res, next) => {
  try {
    const { _id, quantity } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(_id);
    if (!product) throw new CustomError('Product not found', 404);
    if (product.stock < quantity) throw new CustomError('Not enough stock available', 400);

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [{ 
          product: _id, 
          quantity, 
          price: product.price // Store original price, not discounted price
        }],
      });
    } else {
      const index = cart.items.findIndex((item) => item.product.toString() === _id);
      if (index >= 0) {
        const newQty = cart.items[index].quantity + quantity;
        if (product.stock < newQty) throw new CustomError('Not enough stock', 400);
        cart.items[index].quantity = newQty;
        // Don't update the price here, keep the original price
      } else {
        cart.items.push({
          product: _id,
          quantity,
          price: product.price // Store original price, not discounted price
        });
      }
    }

    await cart.populate('items.product');
    const { totalDiscount, appliedOffers, discountMap } = await applyBundleDiscounts(cart);

    await cart.save();
    
    const cartTotals = await calculateCartTotals(cart, discountMap);
    

    res.status(200).json({
      success: true,
      data: cart,
      totalPrice: cartTotals.totalPrice,
      totalDiscount: cartTotals.totalDiscount,
      originalTotal: cartTotals.originalTotal,
      appliedOffers,
      gifts: cartTotals.gifts,
    });
  } catch (error) {
    next(error);
  }
};

// Get current cart
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) return res.status(404).json({ success: false, message: 'No cart found' });

    const { totalDiscount, appliedOffers, discountMap } = await applyBundleDiscounts(cart);

    await cart.save();
    
    const cartTotals = await calculateCartTotals(cart, discountMap);
    

    res.status(200).json({
      success: true,
      data: cart,
      totalPrice: cartTotals.totalPrice,
      totalDiscount: cartTotals.totalDiscount,
      originalTotal: cartTotals.originalTotal,
      appliedOffers,
      gifts: cartTotals.gifts,
    });
  } catch (error) {
    next(error);
  }
};

// Update item quantity
const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) throw new CustomError('Cart not found', 404);

    const index = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (index === -1) throw new CustomError('Item not found', 404);

    const product = await Product.findById(cart.items[index].product);
    if (!product) throw new CustomError('Product not found', 404);
    if (product.stock < quantity) throw new CustomError('Not enough stock', 400);

    // Store the original quantity for logging
    const originalQuantity = cart.items[index].quantity;
    
    // Update quantity
    cart.items[index].quantity = quantity;

    
    // Don't update the price here, keep the original price
    await cart.populate('items.product');

    const { totalDiscount, appliedOffers, discountMap } = await applyBundleDiscounts(cart);

    await cart.save();
    
    const cartTotals = await calculateCartTotals(cart, discountMap);
    

    res.status(200).json({
      success: true,
      data: cart,
      totalPrice: cartTotals.totalPrice,
      totalDiscount: cartTotals.totalDiscount,
      originalTotal: cartTotals.originalTotal,
      appliedOffers,
      gifts: cartTotals.gifts,
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
const removeItemFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) throw new CustomError('Cart not found', 404);

    const index = cart.items.findIndex((item) => item._id.toString() === itemId);
    if (index === -1) throw new CustomError('Item not found', 404);


    cart.items.splice(index, 1);
    
    await cart.populate('items.product');

    const { totalDiscount, appliedOffers, discountMap } = await applyBundleDiscounts(cart);

    await cart.save();
    
    const cartTotals = await calculateCartTotals(cart, discountMap);
    
    res.status(200).json({
      success: true,
      data: cart,
      totalPrice: cartTotals.totalPrice,
      totalDiscount: cartTotals.totalDiscount,
      originalTotal: cartTotals.originalTotal,
      appliedOffers,
      gifts: cartTotals.gifts,
    });
  } catch (error) {
    next(error);
  }
};

// Clear entire cart
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

