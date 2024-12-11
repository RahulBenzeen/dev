// // backend/emailService/emailSender.js

// const nodemailer = require('nodemailer');

// // Create an SMTP transporter
// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: false,  // Use TLS
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS
//     }
// });

// // Send email using SMTP
// const sendEmail = async (emailData) => {
//     const mailOptions = {
//         from: smtp.user, // Sender address
//         to: emailData.recipient, // List of recipients
//         subject: emailData.subject, // Subject line
//         text: emailData.body // Email body
//     };

//     return transporter.sendMail(mailOptions)
//         .then((info) => {
//             console.log('Email sent: ' + info.response);
//         })
//         .catch((error) => {
//             console.error('Error sending email:', error);
//         });
// };

// module.exports = sendEmail;
