function generateRandomSixDigitNumber() {
  return Math.floor(Math.random() * 900000) + 100000;
}

module.exports = generateRandomSixDigitNumber;