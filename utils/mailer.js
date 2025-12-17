const nodemailer = require("nodemailer");

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "Petwego747@gmail.com",
    pass: "ydss yjxf ztta rcay" // App password from Google Account
  }
});

// Function to send emails
async function sendMail(to, subject, text, html = null) {
  try {
    const mailOptions = {
      from: `"PetHub 🐾" <Petwego747@gmail.com>`,
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
