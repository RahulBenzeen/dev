const mongoose = require('mongoose');
const  sendEmail  = require('../utils/emailServices/emailSender'); // Assuming you have a utility for sending emails
const Subscriber = require('../models/Subscriber'); // Assuming a `Subscriber` model for subscriptions

/**
 * Subscribe Controller - Handles adding subscribers and sending emails
 */
const subscribeController = {
  /**
   * Subscribe a new user
   * @param {Object} req - The HTTP request object
   * @param {Object} res - The HTTP response object
   * @param {Function} next - The next middleware function
   */
  subscribe: async (req, res, next) => {
    const { email } = req.body;

    try {
      // Validate email
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Invalid email address');
      }

      // Check if the email is already subscribed
      const existingSubscriber = await Subscriber.findOne({ email });
      if (existingSubscriber) {
        return res.status(400).json({
          success: false,
          message: 'This email is already subscribed.',
        });
      }

      // Add the subscriber to the database
      const newSubscriber = new Subscriber({ email });
      await newSubscriber.save();

      // Send a welcome email
      const emailData = {
        recipient: email,
        subject: 'Welcome to Our Subscription Service!',
        message: `
          Hello,

          Thank you for subscribing to our newsletter! We're excited to have you on board.

          Stay tuned for updates, special offers, and more.

          If you have any questions, feel free to contact us at support@example.com.

          Best regards,  
          The Nothing Team
        `,
      };

      try {
        await sendEmail(emailData); // Ensure proper error handling for email sending
      } catch (emailError) {
        console.error('Error sending subscription email:', emailError.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Subscription successful! A confirmation email has been sent.',
      });
    } catch (error) {
      console.error('Error in subscribe controller:', error.message);
      return next(error);
    }
  },

  /**
   * Unsubscribe a user
   * @param {Object} req - The HTTP request object
   * @param {Object} res - The HTTP response object
   * @param {Function} next - The next middleware function
   */
  unsubscribe: async (req, res, next) => {
    const { email } = req.body;

    try {
      // Validate email
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Invalid email address');
      }

      // Check if the email is subscribed
      const subscriber = await Subscriber.findOne({ email });
      if (!subscriber) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in the subscription list.',
        });
      }

      // Remove the subscriber from the database
      await Subscriber.deleteOne({ email });

      return res.status(200).json({
        success: true,
        message: 'You have successfully unsubscribed.',
      });
    } catch (error) {
      console.error('Error in unsubscribe controller:', error.message);
      return next(error);
    }
  },
};

module.exports = subscribeController;
