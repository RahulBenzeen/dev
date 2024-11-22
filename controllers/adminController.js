const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Payment = require('../models/Payment');
const { CustomError } = require('../middlewares/errorHandler');

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private, Admin
const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.status(200).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/admin/products
// @access  Private, Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, stock, image } = req.body;

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      stock,
      image,
    });

    const product = await newProduct.save();
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private, Admin
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock, image } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      { name, description, price, category, stock, image },
      { new: true }
    );

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private, Admin
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private, Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private, Admin
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate('user', 'name email');
    res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private, Admin
const getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().populate('user', 'name email');
    res.status(200).json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/admin/categories
// @access  Private, Admin
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getUsers,
  getOrders,
  getPayments,
  getCategories,
};
