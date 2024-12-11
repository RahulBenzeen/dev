const express = require('express');
// const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const session = require('express-session');
const { errorHandler } = require('./middlewares/errorHandler');

// dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(
  cors({
    origin: 'http://127.0.0.1:5173', // The frontend URL
    credentials: true, // Allow cookies to be sent
  })
);
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallbackSecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 30 * 60 * 1000, // 30 minutes
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true, // Prevent JS access
    },
  })
);

// Debugging middleware (remove in production)
app.use((req, res, next) => {
  console.log("Session Data:", req.session);
  next();
});

app.get('/api/test-session', (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ sessionUser: req.session.user });
  }
  res.status(400).json({ message: 'No session user found' });
});

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  skip: (req) => {
    if (req.path === '/api/users/login' && req.method === 'POST') return true;

    const user = req.session?.user;
    if (user && user.role === 'admin') return true;

    return false;
  },
});

// Apply rate limiter
app.use(limiter);

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/address', addressRoutes);

// Error Handler
app.use(errorHandler);

module.exports = app;
