const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    maxlength: 50,
  },
  address: {
    type: String,
    required: true,
    maxlength: 100,
  },
  city: {
    type: String,
    required: true,
    maxlength: 50,
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    maxlength: 50,
  },
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
