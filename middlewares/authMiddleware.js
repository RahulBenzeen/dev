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

module.exports = { protect, adminOnly };
