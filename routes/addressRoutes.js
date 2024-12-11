const express = require('express');
const {addNewAddress, getAllAddresses, updateAddress, deleteAddress  }  =require('../controllers/addressController')
const {  verifyToken} = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/add',verifyToken ,  addNewAddress);
router.get('/all', verifyToken ,  getAllAddresses);
router.put('/:id',verifyToken ,  updateAddress);
router.delete('/:id', verifyToken , deleteAddress);

module.exports = router;
