//Settings for email application
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Mailgun',
  auth: {
    user: process.env.mg_username, 
    pass: process.env.mg_password 
  }
});

module.exports = transporter;