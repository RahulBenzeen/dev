const express = require('express');
const {
  createBundleOffer,
  getAllBundleOffers,
  deleteBundleOffer,
} = require('../controllers/bundleOfferController');

const {
  createGiftOffer,
  getAllGiftOffers,
  deleteGiftOffer,
} = require('../controllers/giftOfferController');

const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// Bundle offer routes
router.post('/bundle/add', verifyToken, createBundleOffer);
router.get('/bundle/all', verifyToken, getAllBundleOffers);
router.delete('/bundle/:id', verifyToken, deleteBundleOffer);

// Gift offer routes
router.post('/gift/add', verifyToken, createGiftOffer);
router.get('/gift/all', verifyToken, getAllGiftOffers);
router.delete('/gift/:id', verifyToken, deleteGiftOffer);

module.exports = router;
