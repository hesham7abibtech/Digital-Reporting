/**
 * Ultra-Elite Premium Mail Templates
 *
 * Unified Industrial Identity for REH Digital Reporting.
 * Zero-attachment architecture: all logos and icons are inline SVG / base64.
 */



const GOLD_ACCENT = '#d0ab82';
const TEAL_PRIMARY = '#003f49';
const SURFACE_BG = '#fcfbf5';

const SHARED_STYLES = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #334155;
  background-color: ${SURFACE_BG};
`;

// Mobile-responsive CSS injected into every template <head>
const MOBILE_CSS = `
<style type="text/css">
  @media only screen and (max-width: 620px) {
    .email-wrapper { padding: 0 !important; }
    .email-card { width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
    .email-header { padding: 20px 0 16px !important; }
    .email-header img { height: 24px !important; }
    .email-logo-divider { padding: 0 12px !important; }
    .email-logo-divider div { height: 20px !important; }
    .email-brand-text { font-size: 8px !important; letter-spacing: 0.2em !important; margin-top: 12px !important; }
    .email-body { padding: 24px 20px !important; }
    .email-body h2 { font-size: 18px !important; line-height: 1.3 !important; }
    .email-body p { font-size: 14px !important; }
    .email-icon-stamp td { width: 56px !important; height: 56px !important; border-radius: 16px !important; }
    .email-icon-stamp img { width: 30px !important; height: 30px !important; }
    .email-cta a { padding: 14px 28px !important; font-size: 12px !important; width: 100% !important; box-sizing: border-box !important; }
    .email-footer { padding: 20px 16px !important; font-size: 8px !important; }
  }
</style>
`;


// ---------------------------------------------------------------------------
// Inline logo loader (reads from public/logos at build-time / runtime on server)
// ---------------------------------------------------------------------------
function getLogoDataUri(filename: string): string {
  // Guard against browser execution
  if (typeof window !== 'undefined') return '';

  try {
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(process.cwd(), 'public', 'logos', filename);
    const data = fs.readFileSync(logoPath);
    const ext = path.extname(filename).replace('.', '').toLowerCase();
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    return `data:${mime};base64,${data.toString('base64')}`;
  } catch (err) {
    console.warn(`[MAIL_TEMPLATES] Failed to load logo: ${filename}`, err);
    return '';
  }
}

// ---------------------------------------------------------------------------
// Inline SVG icons — category-specific, white line-art for dark containers
// ---------------------------------------------------------------------------
const SVG_ICONS = {
  // Megaphone – Announcements
  ANNOUNCE: `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`
  ).toString('base64')}`,
  // Newspaper – News
  NEWS: `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`
  ).toString('base64')}`,
  // Shield – Security
  SECURITY: `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  ).toString('base64')}`,
  // Check – Approvals
  CHECK: `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
  ).toString('base64')}`,
};

// ---------------------------------------------------------------------------
// Header — loads logos lazily so it works at module-load time on server
// ---------------------------------------------------------------------------
const getHeader = () => {
  const modonUri = getLogoDataUri('modon_logo.png');
  const insiteUri = getLogoDataUri('insite_logo.png');

  const modonImg = modonUri
    ? `<img src="${modonUri}" alt="MODON" height="36" style="display:block;height:36px;width:auto;">`
    : `<span style="color:#ffffff;font-weight:900;font-size:14px;letter-spacing:0.1em;">MODON</span>`;

  const insiteImg = insiteUri
    ? `<img src="${insiteUri}" alt="INSITE" height="32" style="display:block;height:32px;width:auto;">`
    : `<span style="color:#ffffff;font-weight:900;font-size:13px;letter-spacing:0.1em;">INSITE</span>`;

  return `
  <div class="email-header" style="text-align:center;background-color:${TEAL_PRIMARY};border-bottom:3px solid ${GOLD_ACCENT};padding:28px 0 22px;">
    <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto; width: auto !important;">
      <tr>
        <td valign="middle" style="padding:0 12px;">
          <table border="0" cellpadding="0" cellspacing="0" style="width: auto !important;">
            <tr>
              <td valign="middle">${modonImg}</td>
              <td class="email-logo-divider" valign="middle" style="padding:0 28px;"><div style="width:1px;height:30px;background:rgba(208,171,130,0.5);"></div></td>
              <td valign="middle">${insiteImg}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div class="email-brand-text" style="margin-top:16px;color:${GOLD_ACCENT};font-family:Georgia,serif;letter-spacing:0.45em;font-size:10px;text-transform:uppercase;font-weight:800;">REH Digital Reporting</div>
  </div>
`;
};

const getFooter = () => `
  <div class="email-footer" style="text-align:center;padding:24px 20px;color:#94a3b8;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;background-color:#f8fafc;border-top:1px solid #f1f5f9;">
    <p style="margin:0;">&copy; 2026 REH Digital Reporting Hub — Ras El Hekma Division</p>
    <p style="margin:4px 0 0;">Infrastructure Managed by Insite International</p>
    <div style="margin-top:16px;display:inline-block;width:32px;height:1px;background-color:${GOLD_ACCENT};opacity:0.5;"></div>
  </div>
`;

const getButton = (text: string, url: string) => `
  <div class="email-cta" style="text-align:center;margin-top:32px;">
    <a href="${url}" style="display:inline-block;padding:16px 44px;background-color:${TEAL_PRIMARY};color:#ffffff;text-decoration:none;border-radius:12px;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.15em;border-bottom:4px solid ${GOLD_ACCENT};box-shadow:0 10px 25px rgba(0,63,73,0.2);">
      ${text}
    </a>
  </div>
`;

const iconStamp = (svgDataUri: string, bg: string, size = 40) => `
  <table class="email-icon-stamp" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
    <tr>
      <td align="center" valign="middle" style="width:72px;height:72px;background-color:${bg};border-radius:20px;box-shadow:0 8px 24px rgba(0,0,0,0.2);">
        <img src="${svgDataUri}" alt="Icon" width="${size}" height="${size}" style="display:block;">
      </td>
    </tr>
  </table>
`;

export const templates = {
  /**
   * Sent to user after registration
   */
  REGISTRATION_PENDING: (name: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Created</title>
      ${MOBILE_CSS}
    </head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table class="email-wrapper" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${SURFACE_BG};">
        <tr>
          <td align="center" style="padding:20px 0;">
            <table class="email-card" width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
              <tr>
                <td>
                  ${getHeader()}
                  <div class="email-body" style="padding:32px 30px;text-align:center;">
                    ${iconStamp(SVG_ICONS.SECURITY, TEAL_PRIMARY)}
                    <h2 style="font-family:'Marcellus',Georgia,serif;color:${TEAL_PRIMARY};font-size:22px;margin-bottom:12px;letter-spacing:0.05em;text-transform:uppercase;">Account Created</h2>
                    <p style="font-size:15px;color:#475569;margin:0 0 24px;">Hello <strong>${name}</strong>, your registration for <strong>REH Digital Reporting</strong> is now being reviewed by our administrators.</p>
                    <div style="background-color:#f8fafc;border-radius:16px;padding:24px;border:1px solid #f1f5f9;text-align:center;">
                      <h4 style="margin:0 0 8px;color:${TEAL_PRIMARY};font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">What's Next?</h4>
                      <p style="margin:0;font-size:13px;color:#64748b;">We will notify you via email as soon as your access is approved. This usually takes less than 24 hours.</p>
                    </div>
                  </div>
                  ${getFooter()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  /**
   * Sent to admins after registration
   */
  ADMIN_NOTIFICATION: (userData: { name: string, email: string, department: string }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Access Request</title>
      ${MOBILE_CSS}
    </head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table class="email-wrapper" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${SURFACE_BG};">
        <tr>
          <td align="center" style="padding:20px 0;">
            <table class="email-card" width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
              <tr>
                <td>
                  ${getHeader()}
                  <div class="email-body" style="padding:32px 30px;">
                    <h2 style="font-family:'Marcellus',Georgia,serif;color:${TEAL_PRIMARY};font-size:20px;margin-bottom:24px;text-align:center;">New Access Request</h2>
                    <div style="background-color:#f8fafc;border-radius:16px;padding:24px;border:1px solid #f1f5f9;margin-bottom:8px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:14px;border-bottom:1px solid #f1f5f9;">
                            <span style="display:block;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:2px;">Name</span>
                            <span style="font-size:15px;font-weight:700;color:${TEAL_PRIMARY};">${userData.name}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
                            <span style="display:block;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:2px;">Email</span>
                            <span style="font-size:15px;font-weight:600;color:#475569;">${userData.email}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top:14px;">
                            <span style="display:block;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;margin-bottom:2px;">Department</span>
                            <span style="font-size:15px;font-weight:600;color:#475569;">${userData.department}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    ${getButton('Review Request', 'https://rehdigital.com/admin')}
                  </div>
                  ${getFooter()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  /**
   * Sent to user after approval
   */
  ACCOUNT_APPROVED: (name: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Approved</title>
      ${MOBILE_CSS}
    </head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table class="email-wrapper" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${SURFACE_BG};">
        <tr>
          <td align="center" style="padding:20px 0;">
            <table class="email-card" width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
              <tr>
                <td>
                  ${getHeader()}
                  <div class="email-body" style="padding:32px 30px;text-align:center;">
                    ${iconStamp(SVG_ICONS.CHECK, '#4a7c59', 44)}
                    <h2 style="font-family:'Marcellus',Georgia,serif;color:#4a7c59;font-size:24px;margin-bottom:8px;letter-spacing:0.05em;text-transform:uppercase;">Account Approved</h2>
                    <p style="font-size:15px;color:#475569;margin:0 0 24px;">Welcome <strong>${name}</strong>, your account is now active and ready for use.</p>
                    ${getButton('Log In Now', 'https://rehdigital.com/login')}
                  </div>
                  ${getFooter()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  /**
   * Generic Custom Notification
   */
  CUSTOM_NOTIFICATION: (data: { title: string, body: string, category?: string }) => {
    const cat = data.category?.toUpperCase() ?? '';
    const isNews = cat === 'NEWS';
    const isAnnouncement = cat === 'ANNOUNCEMENT' || cat === 'BROADCAST';
    const isApproval = cat === 'APPROVAL' || cat === 'APPROVED';
    const svgIcon = isNews ? SVG_ICONS.NEWS
      : isAnnouncement ? SVG_ICONS.ANNOUNCE
      : isApproval ? SVG_ICONS.CHECK
      : SVG_ICONS.SECURITY;
    const iconBg = isNews ? TEAL_PRIMARY
      : isAnnouncement ? '#7a5a1e'
      : isApproval ? '#4a7c59'
      : TEAL_PRIMARY;

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>${data.title}</title></head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${SURFACE_BG};">
        <tr>
          <td align="center" style="padding:20px 0;">
            <table width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
              <tr>
                <td>
                  ${getHeader()}
                  <div class="email-body" style="padding:32px 30px;text-align:center;">
                    ${iconStamp(svgIcon, iconBg)}
                    ${data.category ? `<span style="display:block;color:${GOLD_ACCENT};font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:8px;">${data.category} Update</span>` : ''}
                    <h2 style="font-family:'Marcellus',Georgia,serif;color:${TEAL_PRIMARY};font-size:24px;margin:0 0 20px;line-height:1.2;letter-spacing:0.02em;text-transform:uppercase;">${data.title}</h2>
                    <div style="font-size:15px;color:#475569;line-height:1.7;white-space:pre-wrap;margin-bottom:24px;padding:24px;background:#f8fafc;border-radius:16px;border:1px solid #f1f5f9;text-align:left;">${data.body}</div>
                    ${getButton('View Update', 'https://rehdigital.com')}
                  </div>
                  ${getFooter()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  },

  /**
   * Password Reset Template
   */
  PASSWORD_RESET: (name: string, resetLink: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      ${MOBILE_CSS}
    </head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table class="email-wrapper" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:${SURFACE_BG};">
        <tr>
          <td align="center" style="padding:20px 0;">
            <table class="email-card" width="600" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
              <tr>
                <td>
                  ${getHeader()}
                  <div class="email-body" style="padding:32px 30px;text-align:center;">
                    ${(() => {
                      const resetIconUri = getLogoDataUri('reset.png');
                      return resetIconUri 
                        ? iconStamp(resetIconUri, '#7a2b2b', 44)
                        : iconStamp(SVG_ICONS.SECURITY, '#7a2b2b', 44);
                    })()}
                    <h2 style="font-family:'Marcellus',Georgia,serif;color:${TEAL_PRIMARY};font-size:24px;margin-bottom:12px;letter-spacing:0.05em;text-transform:uppercase;">Password Reset Request</h2>
                    <p style="font-size:15px;color:#475569;margin:0 0 24px;">Hello <strong>${name}</strong>, a password reset has been requested for your security profile on <strong>REH Digital Reporting</strong>.</p>
                    
                    <div style="background-color:#fef2f2;border-radius:16px;padding:24px;border:1px solid #fee2e2;text-align:left;margin-bottom:24px;">
                      <h4 style="margin:0 0 8px;color:#991b1b;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;">Security Notice</h4>
                      <p style="margin:0;font-size:13px;color:#b91c1c;">If you did not initiate this request, please ignore this email or contact the system administrator immediately. This link will expire shortly for your protection.</p>
                    </div>

                    ${getButton('Reset Security Credentials', resetLink)}
                    
                    <p style="margin-top:32px;font-size:12px;color:#94a3b8;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${resetLink}" style="color:${GOLD_ACCENT};text-decoration:none;">${resetLink}</a>
                    </p>
                  </div>
                  ${getFooter()}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
};
