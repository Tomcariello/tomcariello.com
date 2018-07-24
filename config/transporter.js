//Settings for email application
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Mailgun',
    auth: {
        user: process.env.mg_username,
        pass: process.env.mg_password
    }
});

module.exports = transporter;
