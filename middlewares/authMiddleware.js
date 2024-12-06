const jwt = require('jsonwebtoken');
const { CustomError } = require('./errorHandler');

// Middleware to protect routes
const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new CustomError('Not authorized, no token', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next(new CustomError('Not authorized', 401));
  }
};

// Middleware to restrict access to admin only
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new CustomError('Access denied, admin only', 403));
  }
  next();
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer
  if (!token) return next(new CustomError('No token provided', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token with secret
    req.user = decoded; // Attach user data to request
    next();
  } catch (err) {
    return next(new CustomError('Invalid or expired token', 401));
  }
};

module.exports = { protect, adminOnly, verifyToken};
