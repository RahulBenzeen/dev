// backend/emailService/emailSender.js

require('dotenv').config();
const nodemailer = require('nodemailer');
// Create an SMTP transporter

// SMTP_USER=rahul018987@gamil.com
// SMTP_PASS=@@@rahul2000
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,  // Use TLS
    auth: {
        user: 'rahul018987@gamil.com',
        pass: '@@@rahul2000'
    }
});

// Send email using SMTP
const sendEmail = async (emailData) => {
    const mailOptions = {
        from: process.env.SMTP_USER, // Sender address
        to: emailData.recipient, // List of recipients
        subject: emailData.subject, // Subject line
        text: emailData.body // Email body
    };

    return transporter.sendMail(mailOptions)
        .then((info) => {
            console.log('Email sent: ' + info.response);
        })
        .catch((error) => {
            console.error('Error sending email:', error);
        });
};

module.exports = sendEmail;
