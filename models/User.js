const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow users with only Google login
    },
    profilePicture: {
      type: String,
      default: null, // No default value or use a placeholder URL if desired
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    verificationToken: {
      type: String,
      default: null, // Store verification token
    },
    verificationTokenExpiry: {
      type: Date,
      default: null, // Store token expiration date
    },
    isVerified: {
      type: Boolean,
      default: false, // Field to track if the user has verified their email
    },
  },
  { timestamps: true }
);

// Encrypt password before saving the user
// UserSchema.pre('save', async function (next) {
//   // If the user has a Google ID, skip the password check
//   if (this.googleId) return next();

//   // If the password field is being modified, hash it
//   if (this.isModified('password') && this.password) {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   }

//   // If no password is provided, and it's not a Google user, throw an error
//   if (!this.password && !this.googleId) {
//     return next(new Error('Password is required for non-Google users'));
//   }

//   next();
// });

// Encrypt password before saving the user
UserSchema.pre('save', async function (next) {
  // If the user has a Google ID, skip the password check
  if (this.googleId) return next();

  // If the password field is being modified, hash it
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // If the password is not modified and the user doesn't have a Google ID, we allow the name and email updates
  if (!this.isModified('password') && !this.password) {
    return next();
  }

  // If no password is provided, and it's not a Google user, throw an error
  if (!this.password && !this.googleId) {
    return next(new Error('Password is required for non-Google users'));
  }

  next();
});


// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
