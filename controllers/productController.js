const Product = require('../models/Product');
const { CustomError } = require('../middlewares/errorHandler');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const page = Number(req.query.page) > 0 ? parseInt(req.query.page, 10) : 1;
    const limit = Number(req.query.limit) > 0 ? parseInt(req.query.limit, 10) : 10;
    const startIndex = (page - 1) * limit;

    // Get the optional filters from query parameters
    const { category, subcategory, brand, minPrice, maxPrice, rating, search, sortBy } = req.query;

    // Build the query object dynamically
    const query = {};
    
    if (category) {g
      query.category = { $reex: new RegExp(category, 'i') };  // Case-insensitive regex for category
    }

    if (subcategory) {
      query.subcategory = { $regex: new RegExp(subcategory, 'i') };  // Case-insensitive regex for subcategory
    }

    if (brand) query.brand = brand;

    // Add price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Add rating filter
    if (rating && rating !== '0') {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Add free text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
      ];
    }

    // Count documents matching the query
    const total = await Product.countDocuments(query);

    // Prepare the sort object
    let sort = {};
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sort = { price: 1 };
          break;
        case 'price_desc':
          sort = { price: -1 };
          break;
        case 'rating_desc':
          sort = { rating: -1 };
          break;
        case 'newest':
          sort = { createdAt: -1 };
          break;
        default:
          sort = { _id: 1 }; // Default sort
      }
    }

    // Fetch products matching the query with pagination and sorting
    const products = await Product.find(query)
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      totalItems: total,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
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
