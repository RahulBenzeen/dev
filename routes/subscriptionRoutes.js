const express = require('express');
const router = express.Router();
const subscribeController = require('../controllers/subscriptionController');

router.post('/subscribe', subscribeController.subscribe);
router.post('/unsubscribe', subscribeController.unsubscribe);

module.exports = router;
