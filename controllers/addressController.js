const Address = require('../models/Address');

// Add a new address
const addNewAddress = async (req, res, next) => {
  const addressData = req.body;

  try {
    // Validate the address using the Mongoose schema
    const address = new Address(addressData);
    const validationError = address.validateSync();
    // await Address.deleteMany({})

    // If there are validation errors, return them with status 400 (Bad Request)
    if (validationError) {
      return res.status(400).json({ success: false, errors: validationError.errors });
    }

    // Save the address to the database
    const savedAddress = await address.save();

    // Return the saved address with status 200 (Success)
    return res.status(200).json({ success: true, address: savedAddress });
  } catch (error) {
    // Handle unexpected errors and return them with status 500 (Internal Server Error)
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Fetch all addresses
const getAllAddresses = async (req, res, next) => {
    try {
      // Fetch only the top 5 addresses
      const addresses = await Address.find().limit(5);
  
      // Return the list of addresses
      return res.status(200).json({ success: true, addresses });
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ success: false, error: error.message });
    }
  };
  
// Update an address by ID
const updateAddress = async (req, res, next) => {
  const { id } = req.params; // Get address ID from the route parameter
  const updatedData = req.body; // Get updated data from the request body

  try {
    // Find the address by ID and update it
    const updatedAddress = await Address.findByIdAndUpdate(id, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Ensure the updated data is validated against the schema
    });

    // If the address is not found, return a 404 (Not Found) response
    if (!updatedAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Return the updated address
    return res.status(200).json({ success: true, address: updatedAddress });
  } catch (error) {
    // Handle unexpected errors
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Delete an address by ID
const deleteAddress = async (req, res, next) => {
  const { id } = req.params; // Get address ID from the route parameter

  try {
    // Find the address by ID and delete it
    const deletedAddress = await Address.findByIdAndDelete(id);

    // If the address is not found, return a 404 (Not Found) response
    if (!deletedAddress) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Return success message
    return res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    // Handle unexpected errors
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  addNewAddress,
  getAllAddresses,
  updateAddress,
  deleteAddress,
};
