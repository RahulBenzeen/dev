const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const session = require('express-session');
const { errorHandler } = require('./middlewares/errorHandler');

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(
    session({
      secret: 'iamrahul', // Replace with a secure secret key
      resave: false,           // Prevents session saving if unmodified
      saveUninitialized: true, // Saves empty sessions
      cookie: { maxAge: 30 * 60 * 1000 }, // Session expires in 30 minutes
    })
  );

// Debugging middleware to log session data
app.use((req, res, next) => {
  console.log("Session Data:", req.session);  // Log session data to verify
  next();
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Error Handler
app.use(errorHandler);

module.exports = app;
