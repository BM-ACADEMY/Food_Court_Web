const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    secure: true,
    port: 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Pegasus2026" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
};

module.exports = sendEmail;
