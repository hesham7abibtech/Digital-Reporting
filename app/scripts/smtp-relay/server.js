const express = require('express');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(express.json());



// 🛡️ RATE LIMITING
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests' }
});

// ----------------------------------------------------------------------------
// ZOHO SMTP FLEET
// ----------------------------------------------------------------------------
const createTransporter = (user, pass) => nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: { user, pass },
  pool: true,
  maxConnections: 10
});

const transporters = {
  VERIFICATION: createTransporter(process.env.SMTP_USER, process.env.SMTP_PASS),
  INFO: createTransporter(process.env.SMTP_INFO_USER, process.env.SMTP_INFO_PASS),
  RESET: createTransporter(process.env.SMTP_RESET_USER, process.env.SMTP_RESET_PASS),
};

// ----------------------------------------------------------------------------
// FIREBASE AUTHORITY ENGINE
// ----------------------------------------------------------------------------
// 🛡️ SECURITY TOKEN CACHE (Optimizes latency by ~1.2s)
let cachedToken = null;
let tokenExpiry = 0;

const getAccessToken = async (sa) => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry - 60000) return cachedToken;

  console.log('[FIREBASE_AUTH] Refreshing Authority Token...');
  const jwtClient = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });

  const tokens = await jwtClient.authorize();
  cachedToken = tokens.access_token;
  tokenExpiry = tokens.expiry_date;
  return cachedToken;
};

// 🛡️ IDENTITY HANDSHAKE ENGINE
async function generateResetLink(email) {
  try {
    const fs = require('fs');
    const path = require('path');
    const sa = JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase-key.json'), 'utf8'));
    const accessToken = await getAccessToken(sa);

    // 1. Identity Verification (Deep Lookup)
    const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ email })
    });

    const lookupData = await lookupRes.json();
    if (!lookupData.users || lookupData.users.length === 0) {
      const err = new Error('USER_NOT_FOUND');
      err.status = 404;
      throw err;
    }

    // 2. Protocol Initiation (Link Generation)
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:sendOobCode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        returnOobLink: true,
        continueUrl: 'https://rehdigital.com/auth/reset'
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Link Generation Failed');
    return data.oobLink;
  } catch (error) {
    console.error('[FIREBASE_AUTHORITY_ERROR]', error);
    throw error;
  }
}

// ----------------------------------------------------------------------------
// INDUSTRIAL BRANDING ASSETS (Base64)
// ----------------------------------------------------------------------------
const MODON_B64 = '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\n-----END PRIVATE KEY-----\n"';
const INSITE_B64 = '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';

// ----------------------------------------------------------------------------
// UNIVERSAL COMPATIBILITY TEMPLATES (TEXT-BASED BRANDING)
// ----------------------------------------------------------------------------
const getTemplate = (type, payload) => {
  const brandColor = '#003f49';
  const accentColor = '#d0ab82';
  const textColor = '#0F172A';

  // High-Contrast Text-Based Branding (No Images = 100% Visibility)
  const logoGroup = `
    <table border="0" cellpadding="0" cellspacing="0" style="background-color:#002d35; border:1px solid #d0ab82; border-radius:14px; display:inline-block;">
      <tr>
        <td style="padding: 12px 24px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 0.15em; text-transform: uppercase;">
          MODON
        </td>
        <td style="width:1px; background-color:rgba(208, 171, 130, 0.4); padding:0; height:24px;">&nbsp;</td>
        <td style="padding: 12px 24px; font-family: Arial, Helvetica, sans-serif; font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: 0.1em; text-transform: uppercase;">
          InSite
        </td>
      </tr>
    </table>
  `;

  const baseContainer = (content, icon) => `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>REH Digital Security</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <!--[if mso]>
      <style type="text/css">
        body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
      </style>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC;">
        <tr>
          <td align="center" style="padding: 60px 20px;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 20px 50px rgba(0,63,73,0.12);">
              <!-- Header Section -->
              <tr>
                <td align="center" style="background-color: #002d35; padding: 28px 30px; border-bottom: 4px solid ${accentColor};">
                  ${logoGroup}
                </td>
              </tr>
              <!-- Body Section -->
              <tr>
                <td align="center" style="padding: 40px 50px 60px; color: ${textColor}; text-align: center;">
                  ${icon ? `<div style="text-align: center; margin-bottom: 30px; font-size: 48px;">${icon}</div>` : ''}
                  <div style="display: inline-block; width: 100%; text-align: center;">
                    ${content}
                  </div>
                </td>
              </tr>
              <!-- Footer Section -->
              <tr>
                <td align="center" style="padding: 30px; background-color: #F1F5F9; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 13px;">
                  <div style="font-weight: 800; color: #003f49; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;">REH Digital Reporting</div>
                  <div style="font-weight: 600;">Industrial Authority Security Network</div>
                  <div style="margin-top: 12px; font-size: 11px; opacity: 0.7;">This is an automated security transmission. Confidentiality protocols active.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const button = (label, link) => `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate !important;">
            <tr>
              <td align="center" bgcolor="${brandColor}" style="border: 2px solid ${accentColor}; border-radius: 12px; color: #ffffff; display: block;">
                <a href="${link}" style="color: #ffffff; text-decoration: none; padding: 18px 40px; font-size: 15px; font-weight: 800; font-family: Arial, sans-serif; display: inline-block; letter-spacing: 0.08em; text-transform: uppercase;">
                  ${label}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  if (type === 'PASSWORD_RESET') {
    return baseContainer(`
      <h2 style="margin: 0 0 20px 0; color: ${brandColor}; font-size: 28px; text-align: center; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">Vault Security Recovery</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">Hello ${payload.name || 'Operative'},</p>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">A secure recovery protocol has been initiated for your account. Click the button below to re-establish your credentials:</p>
      ${button('Initialize Recovery', payload.link)}
      <p style="margin: 20px 0 0 0; font-size: 13px; color: #94A3B8; text-align: center; line-height: 1.6;">Link Expiration: 1 Hour. If you did not request this, please notify Security immediately.</p>
    `, '🛡️');
  }

  if (type === 'PASSWORD_CHANGED') {
    return baseContainer(`
      <h2 style="margin: 0 0 20px 0; color: #10B981; font-size: 28px; text-align: center; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">Security Updated</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">Hello ${payload.name || 'Operative'},</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">Your vault credentials have been successfully updated. Your security profile is now synchronized with the latest encryption standards.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; text-align: center;">
            <span style="color: #166534; font-weight: 700; font-size: 15px;">Status: Secure & Active</span>
          </td>
        </tr>
      </table>
      <p style="margin: 24px 0 0 0; font-size: 14px; text-align: center; color: #64748B;">If you did not perform this change, your account may be compromised. Lock your profile immediately.</p>
    `, '✅');
  }

  if (type === 'USER_VERIFICATION') {
    return baseContainer(`
      <h2 style="margin: 0 0 20px 0; color: ${brandColor}; font-size: 28px; text-align: center; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">Identify Verification</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">Hello ${payload.name || 'Operative'},</p>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">To activate your security clearance for the REH Digital Reporting platform, please verify your identity:</p>
      ${button('Verify Identity', payload.link)}
      <p style="margin: 20px 0 0 0; font-size: 14px; text-align: center; color: #64748B; font-weight: 600;">Manual Approval Stage to follow email verification.</p>
    `, '🔑');
  }

  if (type === 'ADMIN_NOTIFICATION') {
    return baseContainer(`
      <h2 style="margin: 0 0 20px 0; color: ${brandColor}; font-size: 28px; text-align: center; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">Action Required: New User</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">A new operative is awaiting administrative clearance.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F1F5F9; border-top: 6px solid ${accentColor}; border-radius: 16px;">
        <tr>
          <td align="center" style="padding: 30px; font-size: 15px; text-align: center;">
            <strong style="color: ${brandColor};">Operative:</strong> ${payload.userName}<br>
            <strong style="color: ${brandColor};">Email:</strong> ${payload.userEmail}<br>
            <strong style="color: ${brandColor}; font-size: 11px;">TIMESTAMP:</strong> ${new Date().toLocaleString()}
          </td>
        </tr>
      </table>
      ${button('Open Control Center', payload.adminLink)}
    `, '🚨');
  }

  if (type === 'ACCOUNT_APPROVED') {
    return baseContainer(`
      <h2 style="margin: 0 0 20px 0; color: #10B981; font-size: 28px; text-align: center; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">Clearance Granted</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">Hello ${payload.name || 'Operative'},</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">Your security clearance for the REH Digital Reporting platform has been officially authorized. Your account is now fully <strong>Active & Secure</strong>.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 16px; text-align: center;">
            <div style="color: #166534; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Access Level: Authorized</div>
            <div style="color: #15803D; font-size: 13px;">You now have full access to your assigned project modules and reporting registries.</div>
          </td>
        </tr>
      </table>
      ${button('Enter Command Center', 'https://rehdigital.com/login')}
      <p style="margin: 10px 0 0 0; font-size: 14px; text-align: center; color: #64748B;">Welcome to the next generation of industrial intelligence.</p>
    `, '🛡️');
  }

  if (type === 'REGISTRATION_PENDING') {
    return baseContainer(`
      <h2 style="margin: 0 0 20px 0; color: ${brandColor}; font-size: 28px; text-align: center; font-weight: 900; letter-spacing: -0.02em; line-height: 1.2;">Account Initialization</h2>
      <p style="margin: 0 0 15px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">Hello ${payload.name || 'Operative'},</p>
      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; text-align: center; color: #475569;">Your security profile has been successfully created. Your account is currently in the <strong>Manual Approval Stage</strong>.</p>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 24px; background-color: #FFFBEB; border: 1px solid #FEF3C7; border-radius: 16px; text-align: center;">
            <div style="color: #92400E; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Pending Administrative Clearance</div>
            <div style="color: #B45309; font-size: 13px;">Our security team is reviewing your access request. You will receive an automated transmission once clearance is granted.</div>
          </td>
        </tr>
      </table>
      <p style="margin: 24px 0 0 0; font-size: 14px; text-align: center; color: #64748B;">Thank you for your patience during this high-security protocol.</p>
    `, '⏳');
  }

  if (type === 'SYSTEM_ALERT' || type === 'URGENT' || type === 'SECURITY') {
    return baseContainer(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background-color: #DC2626; color: white; padding: 10px 18px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; display: inline-block;">Priority System Alert</div>
      </div>
      <h2 style="margin: 0 0 16px 0; color: #991B1B; font-size: 24px; font-weight: 900; text-align: center;">${payload.title || 'Security Advisory'}</h2>
      <div style="color: #475569; line-height: 1.7; font-size: 15px; border-top: 4px solid #DC2626; padding-top: 20px; margin-bottom: 24px; text-align: center;">
        ${payload.content || payload.body || ''}
      </div>
      ${payload.link ? button(payload.buttonLabel || 'Acknowledge Alert', payload.link) : ''}
    `, '🚨');
  }

  if (type === 'ANNOUNCEMENT' || type === 'CUSTOM') {
    return baseContainer(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background-color: ${brandColor}; color: white; padding: 12px 20px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block;">Official Communication</div>
      </div>
      <h2 style="margin: 0 0 16px 0; color: ${brandColor}; font-size: 24px; font-weight: 900; text-align: center;">${payload.title || 'Administrative Update'}</h2>
      <div style="color: #475569; line-height: 1.7; font-size: 15px; text-align: center; margin-bottom: 24px;">
        ${payload.content || payload.body || ''}
      </div>
      ${payload.link ? button(payload.buttonLabel || 'Open Transmission', payload.link) : ''}
    `, '📢');
  }

  if (type === 'NEWS') {
    return baseContainer(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="background-color: ${accentColor}; color: white; padding: 12px 20px; border-radius: 8px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; display: inline-block;">Project Insight</div>
      </div>
      <h2 style="margin: 0 0 16px 0; color: ${brandColor}; font-size: 24px; font-weight: 900; text-align: center;">${payload.title || 'Platform News'}</h2>
      <div style="color: #475569; line-height: 1.7; font-size: 15px; text-align: center; margin-bottom: 24px;">
        ${payload.content || payload.body || ''}
      </div>
      ${payload.link ? button('Read Comprehensive Brief', payload.link) : ''}
    `, '📰');
  }

  return baseContainer(`
    <h2 style="color: ${brandColor}; font-size: 22px; font-weight: 900;">REH Digital Transmission</h2>
    <p style="color: #475569; line-height: 1.6; font-size: 15px;">${payload.message || payload.body || payload.content || 'Secure notification received.'}</p>
  `, '🔔');
};

// ----------------------------------------------------------------------------
// CONSOLIDATED AUTH ENDPOINTS
// ----------------------------------------------------------------------------

// Verification Link Endpoint (New User Identity Gate)
app.post('/v1/auth/verify-link', limiter, async (req, res) => {
  const { email, name, secret } = req.body;
  if (secret !== process.env.RELAY_SECRET) return res.status(403).json({ error: 'Unauthorized' });

  try {
    const oobLink = await generateResetLink(email);
    // High-Speed Background Dispatch
    transporters.VERIFICATION.sendMail({
      from: `"REH Verification" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'REH Command Center — Verify Your Identity',
      html: getTemplate('USER_VERIFICATION', { name, link: oobLink })
    }).catch(e => console.error('[MAIL_ERROR] Async Verification Failed:', e));

    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/v1/auth/reset-link', limiter, async (req, res) => {
  const { email, name, secret } = req.body;
  if (secret !== process.env.RELAY_SECRET) return res.status(403).json({ error: 'Unauthorized' });

  try {
    const oobLink = await generateResetLink(email);
    // High-Speed Background Dispatch
    transporters.RESET.sendMail({
      from: `"REH Digital Reset" <${process.env.SMTP_RESET_USER}>`,
      to: email,
      subject: 'REH Digital Reset — Password Security Update',
      html: getTemplate('PASSWORD_RESET', { name, link: oobLink })
    }).catch(e => console.error('[MAIL_ERROR] Async Reset Failed:', e));

    res.json({ success: true });
  } catch (err) {
    console.error('[AUTH_ERROR]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Admin Notification (Manual Approval Alert)
app.post('/v1/auth/admin-notify', limiter, async (req, res) => {
  const { userName, userEmail, adminEmail, secret } = req.body;
  if (secret !== process.env.RELAY_SECRET) return res.status(403).json({ error: 'Unauthorized' });

  try {
    // High-Speed Background Dispatch
    transporters.INFO.sendMail({
      from: `"REH System Alert" <${process.env.SMTP_INFO_USER}>`,
      to: adminEmail,
      subject: '🚨 ACTION REQUIRED: New User Waiting for Approval',
      html: getTemplate('ADMIN_NOTIFICATION', {
        userName,
        userEmail,
        adminLink: 'https://rehdigital.com/admin/users'
      })
    }).catch(e => console.error('[MAIL_ERROR] Async Admin Notify Failed:', e));

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------------------
// UNIVERSAL DISPATCH ENGINE (Announcement / News / Bulk)
// ----------------------------------------------------------------------------
app.post('/v1/mail/dispatch', limiter, async (req, res) => {
  const { to, cc, bcc, subject, type, payload, secret } = req.body;
  if (secret !== process.env.RELAY_SECRET) return res.status(403).json({ error: 'Unauthorized' });

  try {
    // 🛡️ IDENTITY ROUTING PROTOCOL
    // INFO: Admin/System Dispatches (info@rehdigital.com)
    // RESET: Security Recovery (reset@rehdigital.com)
    // VERIFICATION: Auth/Identity (verification@rehdigital.com)
    
    const isAdminType = ['ANNOUNCEMENT', 'NEWS', 'CUSTOM', 'SYSTEM_ALERT', 'ACCOUNT_APPROVED'].includes(type);
    const isResetType = type?.includes('RESET');
    
    const mailCategory = isResetType ? 'RESET' : (isAdminType ? 'INFO' : 'VERIFICATION');
    const transporter = transporters[mailCategory] || transporters.VERIFICATION;
    
    // Dynamically resolve the authenticated from address
    const fromUser = process.env[`SMTP_${mailCategory === 'VERIFICATION' ? '' : mailCategory + '_'}USER`] || process.env.SMTP_USER;
    const fromLabel = isAdminType ? 'REH Digital' : (isResetType ? 'REH Security' : 'REH Verification');

    // High-Speed Background Dispatch
    transporter.sendMail({
      from: `"${fromLabel}" <${fromUser}>`,
      to, cc, bcc,
      subject: subject || 'REH Digital Transmission',
      html: getTemplate(type || 'ANNOUNCEMENT', payload)
    }).catch(e => console.error('[MAIL_ERROR] Async Universal Dispatch Failed:', e));

    res.json({ success: true, status: 'Transmission protocol initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Consolidated AWS Authority active on port ${PORT}`));
