const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/emailServices/emailSender'); // Utility to send email
const { CustomError } = require('../middlewares/errorHandler');




const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};


// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) throw new CustomError('User already exists', 400);

    const user = await User.create({ name, email, password });

    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    }

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      throw new CustomError('Invalid email or password', 401);
    }

    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password (generate reset token)
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) throw new CustomError('No user found with this email', 404);

    // Generate a reset token (random string)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set resetToken and resetPasswordExpires fields on user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration time

    // Save user with reset token and expiration
    await user.save();

    // Generate reset password URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email options
    const emailOptions = {
      recipient: user.email,
      subject: 'Password Reset Request',
      message: `You requested a password reset. Please click the link below to reset your password:\n\n${resetUrl}`,
    };

    // Send email
    await sendEmail(emailOptions);

    res.status(200).json({
      success: true,
      message: 'Password reset token sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Find user by reset token and check if the token has expired
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
    });

    if (!user) throw new CustomError('Invalid or expired token', 400);

    // Set the new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;  // Remove reset token after password is updated
    user.resetPasswordExpires = undefined;  // Remove the expiration time

    // Save the updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    // Fetch the user from the database using the ID from the token
    const user = await User.findById(req.user.id);
    if (!user) throw new CustomError('User not found', 404);

    // Generate a new token for the user
    const token = generateToken(user.id, user.role);

    // Return user data and the new token in the response
    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),  // Spread the user data
        token,  // Add token inside the data object
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new CustomError('User not found', 404);

    // Update user fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.profilePicture = req.body.profilePicture || user.profilePicture;

    // Update password only if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    // Save updated user
    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
        token: generateToken(updatedUser._id, updatedUser.role),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};
