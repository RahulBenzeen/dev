const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getRecentlyViewedProducts,
  getSimilarProducts,
  getSpecialOfferProducts,
  getCloudinaryImages,
  uploadProductImage,
  deleteCloudinaryImage
} = require('../controllers/productController');

const { protect, adminOnly } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/all', getProducts);
router.get('/special-offers', getSpecialOfferProducts);  // Moved BEFORE /:id
router.get('/recently-viewed', protect, getRecentlyViewedProducts);
router.post('/add', protect, adminOnly, createProduct);
router.get('/similar-products/:id', getSimilarProducts);
router.get('/cloudinary/images', getCloudinaryImages);
router.post('/cloudinary/add', uploadProductImage);
router.post('/cloudinary/delete/:id', deleteCloudinaryImage);
// Admin routes
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// This should be LAST as it's the most generic route
router.get('/:id', getProductById);

module.exports = router;