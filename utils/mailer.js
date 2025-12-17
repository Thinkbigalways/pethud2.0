const nodemailer = require("nodemailer");

// Gmail configuration - use environment variables with fallbacks
const GMAIL_USER = process.env.GMAIL_USER || "Petwego747@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "ydss yjxf ztta rcay";

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

// Function to send emails
async function sendMail(to, subject, text, html = null) {
  try {
    const mailOptions = {
      from: `"PetHub 🐾" <${GMAIL_USER}>`,
      to,
      subject,
      text,
      html
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw err;
  }
}

module.exports = { sendMail };
