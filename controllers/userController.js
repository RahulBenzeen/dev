const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/emailServices/emailSender'); // Utility to send email
const { CustomError } = require('../middlewares/errorHandler');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};


const sendVerificationEmail = async (user) => {
  // Generate a verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Save the token in the user's record
  user.verificationToken = verificationToken;
  await user.save();

  // Create the verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  // Set up email transporter (using Nodemailer here as an example)

  const mailOptions = {
    recipient: user.email,
    subject: 'Email Verification',
    message: `
      Thank you for registering on our site. Please click the link below to verify your email address:
       ${verificationUrl}
    `
  };
    
  sendEmail(mailOptions);

};


// @desc    Verify email
// @route   GET /api/users/verify-email?token=<verificationToken>
// @access  Public
const verifyEmail = async (req, res, next) => {
  const { token } = req.params; 


  try {
    // Find the user by the verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Mark user as verified and clear the token
    user.isVerified = true;
    user.verificationToken = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id, user.role),
      },
    });
  } catch (error) {
    console.log({error})
    next(error);
  }
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

    // Create the user
    const user = await User.create({ name, email, password });

    // Send verification email
    await sendVerificationEmail(user);

    // Set user session (optional for now)
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    }

    // Respond to client
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
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
      recipient: user.email, // Recipient's email address
      subject: '🔒 Password Reset Request', // Clear and engaging subject
      message: `
        Hi ${user.name || 'there'}, 
    
        You recently requested to reset your password for your account. Please click the link below to reset it:
    
        🔗 Reset Password: ${resetUrl}
    
        If you didn't request this, please ignore this email or contact support if you have questions.
    
        Thanks,
        The Nothing Team
      `.trim(), // Trim unnecessary whitespace
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
    const { token, newPassword } = req.body;

    // Find user by reset token and check if the token has expired
    const user = await User.findOne({
      resetPasswordToken: token,
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

    // Check if new email is already taken (optional)
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        throw new CustomError('Email is already in use', 400);
      }
    }

    // Update user fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.profilePicture = req.body.profilePicture || user.profilePicture;

    // Update password only if provided
    if (req.body.password) {
      user.password = req.body.password; // This will trigger the password hashing logic in the schema
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

// @desc    Google Login
// @route   POST /api/users/google-login
// @access  Public


const googleLogin = async (req, res, next) => {
  const { tokens } = req.body;

  if (!tokens) {
    return res.status(400).json({ success: false, message: "Token is required" });
  }

  try {
    // Use the access token to fetch user info from Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens}` },
    });

    const { email, name, sub: googleId } = userInfoResponse.data;

    // Check if the user exists in your database
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        email,
        name,
        googleId,
      });
      await user.save();
    }

    // Generate a JWT token for the user
    const tokenJWT = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: tokenJWT, // Your application's JWT token
      },
    });
  } catch (error) {
    console.error("Error during Google Login:", error);
    res.status(500).json({ success: false, message: "Google Login Failed" });
  }
};


module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  googleLogin,
  verifyEmail
};
