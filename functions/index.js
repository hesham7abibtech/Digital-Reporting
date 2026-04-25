const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

/**
 * Send Password Reset Link
 */
exports.resetLink = onRequest({ cors: true }, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send({ error: "Email required" });

  try {
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: "https://keodigitalreporting.web.app/login"
    });

    const transporter = nodemailer.createTransport({
      ...SMTP_CONFIG,
      auth: {
        user: process.env.SMTP_RESET_USER || process.env.SMTP_USER,
        pass: process.env.SMTP_RESET_PASS || process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: '"REH Digital Reset" <reset@rehdigital.com>',
      to: email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click the link below to continue:</p><a href="${link}">${link}</a>`
    });

    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Reset Link Error:", error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Generic Mail Gateway
 */
exports.mail = onRequest({ cors: true }, async (req, res) => {
  const { type, to, payload } = req.body;
  
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    await transporter.sendMail({
      from: '"REH Digital" <info@rehdigital.com>',
      to,
      subject: `Notification: ${type}`,
      html: `<p>System Notification: ${type}</p><pre>${JSON.stringify(payload, null, 2)}</pre>`
    });
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Mail Error:", error);
    res.status(500).send({ error: error.message });
  }
});
