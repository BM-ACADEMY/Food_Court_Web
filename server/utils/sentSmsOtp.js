const axios = require("axios");

const sendOtpSms = async (mobile, otp) => {
  const message = `PEGASUS 2k25: ${otp} is your OTP for mobile number verification. Valid for 3 mins. PEGASUS 2k25. chennaiepc`;
  const encodedText = encodeURIComponent(message);

  const url = `http://online.chennaisms.com/api/mt/SendSMS?user=bulksms6&password=Bulksms@9&senderid=CHNNAI&channel=Trans&DCS=0&flashsms=0&number=${mobile}&text=${encodedText}&route=6`;

  try {
    const response = await axios.get(url);
    return response.data; // Example: "Message Sent Successfully,Code:000"
  } catch (error) {
    console.error("SMS sending failed:", error.message);
    throw new Error("Failed to send OTP SMS");
  }
};

module.exports = { sendOtpSms };
