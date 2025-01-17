
const nodemailer = require('nodemailer');

// Configure transporter for your custom SMTP server
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,  // Your SMTP server hostname
    port: process.env.SMTP_PORT,                    // Port for SSL/TLS
    secure: true,                 // Use SSL/TLS
    auth: {
        user: process.env.SMTP_USER,  // Your email address
        pass: process.env.SMTP_PASS,  // Your email password or app password if 2FA is enabled
    },
});

// Send email using SMTP
const sendEmail = async (emailData) => {
    const mailOptions = {
        from: process.env.SMTP_USER,  // Sender address
        to: emailData.recipient,                    // Recipient email
        subject: emailData.subject,                 // Email subject
        text: emailData.message,                       // Email body
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
