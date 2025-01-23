const Review = require('../models/Review');
const Product = require('../models/Product');
const { CustomError } = require('../middlewares/errorHandler');

// @desc    Get reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
const getReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('userId', 'name');

    const total = await Review.countDocuments({ productId });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a review
// @route   POST /api/reviews
// @access  Private
const addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;
    const userName  = req.user.name;

    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    // Check if the user has already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      throw new CustomError('You have already reviewed this product', 400);
    }

    const review = await Review.create({
      productId,
      userId,
      rating,
      comment,
    });

    // Update product rating
    const reviews = await Review.find({ productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { rating: avgRating });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      throw new CustomError('Review not found', 404);
    }

    // Check if the user is the owner of the review
    if (review.userId.toString() !== req.user.id) {
      throw new CustomError('Not authorized to update this review', 403);
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    await review.save();

    // Update product rating
    const reviews = await Review.find({ productId: review.productId });
    const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
    await Product.findByIdAndUpdate(review.productId, { rating: avgRating });

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      throw new CustomError('Review not found', 404);
    }

    // Check if the user is the owner of the review
    if (review.userId.toString() !== req.user.id) {
      throw new CustomError('Not authorized to delete this review', 403);
    }

    await review.remove();

    // Update product rating
    const reviews = await Review.find({ productId: review.productId });
    const avgRating = reviews.length > 0
      ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
      : 0;
    await Product.findByIdAndUpdate(review.productId, { rating: avgRating });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  addReview,
  updateReview,
  deleteReview
};
