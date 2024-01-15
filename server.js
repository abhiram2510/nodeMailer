const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const { generateRandomSixDigitNumber, sendEmail } = require('./functions');
const ejs = require('ejs'); 
const fs =  require('fs');
const otpDatabase = new Map();
const lastResendTimestamps = new Map();
const OTP_DATA_FILE = 'otpData.json';

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'src')));

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user:"abhirampatruni2003@gmail.com",
        pass:"ufmr qtmh ikyk nxqn"
    },
    tls: {
        rejectUnauthorized: false,
    },
})

const writeOtpDataToFile = (otpData) => {
    fs.writeFileSync(OTP_DATA_FILE, JSON.stringify(otpData, null, 2), 'utf-8');
};

const deleteOtpDataAfterTimeout = (email, otpData) => {
    setTimeout(() => {
        delete otpData[email];
        writeOtpDataToFile(otpData);
        console.log(`OTP data for ${email} deleted after 60 minutes.`);
    }, 60 * 60 * 1000);
};

const readOtpDataFromFile = () => {
    try {
        const data = fs.readFileSync(OTP_DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
};


app.post('/submit', (req, res) => {
    const email = req.body.email;
    const otp = generateRandomSixDigitNumber();
    const timestamp = Date.now();
    const otpData = readOtpDataFromFile();
    otpData[email] = { otp, timestamp };
    writeOtpDataToFile(otpData);

    sendEmail(transporter, email, otp);
    console.log(`Received email: ${email}`);

    // Schedule deletion of OTP data after 60 minutes
    deleteOtpDataAfterTimeout(email, otpData);

    res.redirect(`/verification?email=${encodeURIComponent(email)}`);
});



app.get('/verification', (req, res) => {
    const email = req.query.email;
    res.render('verification', { email });
});

app.post('/verification', (req, res) => {
    const email = decodeURIComponent(req.body.email);
    const enteredOTP = req.body.otp;

    const otpData = readOtpDataFromFile();

    if (otpData.hasOwnProperty(email)) {
        const storedData = otpData[email];
        const storedOTP = storedData.otp;
        const timestamp = storedData.timestamp;
        console.log(storedOTP);
        console.log(enteredOTP);

        if (storedOTP == enteredOTP) {
            const timeDifference = (Date.now() - timestamp) / 1000; // Convert milliseconds to seconds
            console.log(timeDifference);

            if (timeDifference <= 600 && timeDifference >= 0) {
                // Verification successful within 10 minutes
                res.send('OTP is correct. Verification successful!');
            } else if (timeDifference < 0) {
                res.send('Invalid OTP. Please use the latest OTP.');
            } else {
                // Entered OTP is correct but outside the 10-minute window
                res.send('OTP has expired. Please request a new OTP.');
            }
        } else {
            // Incorrect OTP
            res.send('Incorrect OTP');
        }
    } else {
        // Email not found or OTP data has been deleted
        res.send('Email not found or OTP data has been deleted. Please request a new OTP.');
    }
});


// app.post('/verification', (req, res) => {
//     const email = decodeURIComponent(req.body.email);
//     const enteredOTP = req.body.otp;

//     const storedData = otpDatabase.get(email);

//     if (storedData) {
//         const storedOTP = storedData.otp;
//         const timestamp = storedData.timestamp;

//         if (storedOTP == enteredOTP){
//             if(Date.now() - timestamp <= 60000){
//                 res.send('OTP is correct. Verification successful!');
//             }
//             else{
//                 res.send("OTP has expired please try signing up again!");
//             }
//         }
//         else {
//             res.send('Incorrect OTP');
//         }}
//     else {
//         res.send('Email not found. Please request a new OTP.');
//     }
// });

// app.post('/resend-otp', (req, res) => {
//     const email = decodeURIComponent(req.body.email);
    

//     if (otpDatabase.has(email)) {
//         const lastResendTimestamp = lastResendTimestamps.get(email) || 0;
//         const cooldownPeriod = 60000;
//         if (Date.now() - lastResendTimestamp >= cooldownPeriod) {
//             const newOtp = generateRandomSixDigitNumber();
//             otpDatabase.set(email, { otp: newOtp, timestamp: Date.now() });
//             sendEmail(transporter,email,newOtp)
//             lastResendTimestamps.set(email, Date.now());

//             console.log(`New OTP sent to ${email}`);
//         } else {
//             const remainingCooldown = cooldownPeriod - (Date.now() - lastResendTimestamp);
//             res.send(`Please wait ${Math.ceil(remainingCooldown / 1000)} seconds before resending.`);
//         }
//     } else {
//             res.send('Email not found. Please request a new OTP.');
//     }
// });

app.post('/resend-otp', (req, res) => {
    const email = decodeURIComponent(req.body.email);

    const otpData = readOtpDataFromFile();

    if (otpData.hasOwnProperty(email)) {
        const lastResendTimestamp = lastResendTimestamps.get(email) || 0;
        const cooldownPeriod = 60000;

        if (Date.now() - lastResendTimestamp >= cooldownPeriod) {
            const newOtp = generateRandomSixDigitNumber();
            otpData[email] = { otp: newOtp, timestamp: Date.now() };
            sendEmail(transporter, email, newOtp);
            lastResendTimestamps.set(email, Date.now());

            // Schedule deletion after 60 minutes
            setTimeout(() => {
                delete otpData[email];
                writeOtpDataToFile(otpData);
                console.log(`OTP data for ${email} deleted after 60 minutes.`);
            }, 60 * 60 * 1000);

            console.log(`New OTP sent to ${email}`);
        } else {
            const remainingCooldown = cooldownPeriod - (Date.now() - lastResendTimestamp);
            res.send(`Please wait ${Math.ceil(remainingCooldown / 1000)} seconds before resending.`);
        }
    } else {
        res.send('Email not found. Please request a new OTP.');
    }
});



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});