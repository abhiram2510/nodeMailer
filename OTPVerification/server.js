const twilio = require('twilio');

const accountSid = 'ACc2b4d01b31bc78fcf349d0156994eff2';
const authToken = 'your_auth_token';
const client = twilio(accountSid, authToken);

const recipientNumber = '+1234567890'; // Replace with the recipient's actual phone number

client.verify.services.create({ friendlyName: 'MyVerifyService' })
    .then(service => {
        return client.verify.services(service.sid)
            .verifications
            .create({ to: recipientNumber, channel: 'sms' });
    })
    .then(verification => console.log(verification.status))
    .catch(error => console.error(error));
