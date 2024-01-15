const nodemailer = require('nodemailer');
const fs = require('fs');


function sendEmail(transporter,to, otp) {
    const htmlTemplate = fs.readFileSync('src/emailTemplate.html', 'utf8');

    const formattedHtml = htmlTemplate.replace('{otp}', otp);


    const mailOptions = {
        from: 'abhirampatruni2003@gmail.com',
        to,
        subject: 'Baylink Verification Access',
        html: formattedHtml
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Error sending email: ${error.message}`);
        } else {
            console.log(`Email sent: ${info.response}`);
        }
    });
    const OTP = otp;
}

function generateRandomSixDigitNumber() {
    return Math.floor(Math.random() * 900000) + 100000;
  }
  
module.exports = {
    generateRandomSixDigitNumber,
    sendEmail

};