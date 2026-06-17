const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_RESET_USER,
    pass: process.env.SMTP_RESET_PASS
  }
});

console.log('🚀 Starting Industrial SMTP Diagnostic...');
console.log(`📡 Connecting to Zoho as: ${process.env.SMTP_RESET_USER}`);

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP CONNECTION FAILED:', error);
  } else {
    console.log('✅ SMTP HANDSHAKE SUCCESSFUL! Server is ready.');
    
    transporter.sendMail({
      from: `"Diagnostic" <${process.env.SMTP_RESET_USER}>`,
      to: process.env.SMTP_RESET_USER,
      subject: 'Industrial Diagnostic Test',
      text: 'If you see this, your AWS -> Zoho circuit is 100% operational.'
    }).then(info => {
      console.log('📧 TEST EMAIL DISPATCHED! ID:', info.messageId);
      process.exit(0);
    }).catch(err => {
      console.error('❌ DISPATCH FAILED:', err);
      process.exit(1);
    });
  }
});
