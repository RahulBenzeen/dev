const Product = require('../models/Product');
const { CustomError } = require('../middlewares/errorHandler');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Product.countDocuments();

    const products = await Product.find()
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      totalItems: products.length,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
// const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) throw new CustomError('Product not found', 404);

    // Session logic remains unchanged
    if (!req.session.recentlyViewed) {
      req.session.recentlyViewed = [];
    }

    req.session.recentlyViewed = [
      product._id.toString(),
      ...req.session.recentlyViewed.filter((pid) => pid !== product._id.toString()),
    ].slice(0, 5);

    console.log(req.session)

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};


// @desc    Create a new product
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product by ID
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new CustomError('Product not found', 404);

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product by ID
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new CustomError('Product not found', 404);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const ObjectId = require('mongoose').Types.ObjectId;

const getRecentlyViewedProducts = async (req, res, next) => {
  console.log("hello world!")
  try {
    // Log raw session data for debugging
    console.log('Raw session data:', req.session.recentlyViewed);

    // Ensure that session contains only valid ObjectIds
    const validIds = req.session.recentlyViewed.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
    console.log('Valid IDs:', validIds); // Check the validIds array

    // If there are no valid IDs, return an empty array
    if (validIds.length === 0) {
      console.log('No valid product IDs in session');
      return res.status(200).json({ success: true, data: [] });
    }

    // Find products using the valid ObjectIds
    const products = await Product.find({ _id: { $in: validIds } });

    console.log('Found products:', products); // Check the products fetched from DB

    // Sort the products based on the order in the session
    const sortedProducts = validIds.map(id =>
      products.find(product => product._id.toString() === id)
    );

    res.status(200).json({ success: true, data: sortedProducts });
  } catch (error) {
    console.error('Error fetching recently viewed products:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getRecentlyViewedProducts};
