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
    required: true,
  },
  country: {
    type: String,
    required: true,
    maxlength: 50,
  },
  phoneNumber: {
    type: String,
    required: true,
    maxlength: 20, // Adjust as needed for formatting with dashes/spaces
    match: [/^\+?[0-9\s\-()]{7,20}$/, "Please enter a valid phone number"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
