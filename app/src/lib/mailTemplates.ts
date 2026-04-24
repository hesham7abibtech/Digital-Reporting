/**
 * Ultra-Elite Premium Mail Templates
 * 
 * Designed for the REH Digital Reporting platform.
 * Includes Industrial Gold accents, glassmorphic card layouts, 
 * and professional branding for Modon and Insite.
 */

const LOGO_BASE_URL = 'https://rehdigital.com/logos'; // Update with final production URL if different

const SHARED_STYLES = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #003f49;
  background-color: #fcfbf5;
`;

const GOLD_ACCENT = '#d0ab82';
const TEAL_PRIMARY = '#003f49';

const getHeader = () => `
  <div style="text-align: center; padding: 40px 0; background-color: ${TEAL_PRIMARY}; border-bottom: 4px solid ${GOLD_ACCENT};">
    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
      <tr>
        <td style="padding: 12px 24px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(208, 171, 130, 0.3);">
          <table border="0" cellpadding="0" cellspacing="0">
            <tr>
              <td><img src="${LOGO_BASE_URL}/modon_logo_white.png" alt="MODON" height="28" style="display: block;"></td>
              <td style="padding: 0 20px;"><div style="width: 1px; height: 24px; background: rgba(255,255,255,0.2);"></div></td>
              <td><img src="${LOGO_BASE_URL}/insite_logo_white.png" alt="INSITE" height="24" style="display: block;"></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <h1 style="margin-top: 24px; color: #ffffff; font-family: 'Marcellus', Georgia, serif; letter-spacing: 0.15em; font-size: 20px; text-transform: uppercase; font-weight: 400;">REH Digital Reporting</h1>
  </div>
`;

const getFooter = () => `
  <div style="text-align: center; padding: 40px 20px; color: #64748b; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 700;">
    <p style="margin: 0;">&copy; 2026 REH Digital Reporting Hub — Ras El Hekma Division</p>
    <p style="margin: 8px 0 0;">Infrastructure & Identity Managed by Insite International</p>
    <div style="margin-top: 24px; display: inline-block; width: 40px; height: 2px; background-color: ${GOLD_ACCENT};"></div>
  </div>
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
      <title>Registration Received</title>
    </head>
    <body style="${SHARED_STYLES} margin: 0; padding: 0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fcfbf5;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellpadding="0" cellspacing="0" style="margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 63, 73, 0.08); border: 1px solid rgba(0,63,73,0.05);">
              <tr>
                <td>
                  ${getHeader()}
                  <div style="padding: 50px 40px; text-align: center;">
                    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 24px;">
                      <tr>
                        <td style="width: 56px; height: 56px; background-color: rgba(0, 63, 73, 0.05); border-radius: 16px; text-align: center; border: 1px solid rgba(0, 63, 73, 0.1);">
                          <img src="${LOGO_BASE_URL}/shield-check.png" alt="Icon" width="28" height="28" style="display: inline-block; margin-top: 4px;">
                        </td>
                      </tr>
                    </table>
                    <h2 style="font-family: 'Marcellus', Georgia, serif; color: ${TEAL_PRIMARY}; font-size: 26px; margin-bottom: 16px; letter-spacing: -0.01em;">Welcome to the Gateway, ${name}</h2>
                    <p style="font-size: 16px; color: #475569; margin-bottom: 32px; line-height: 1.7;">Your registration for the <strong>REH Digital Reporting</strong> has been successfully initialized. To maintain our enterprise security protocols, your account is currently under <strong>Administrative Verification</strong>.</p>
                    
                    <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; text-align: center; margin-bottom: 32px;">
                      <h4 style="margin: 0 0 12px; color: ${TEAL_PRIMARY}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Next Steps in the Handshake</h4>
                      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td align="left" style="font-size: 14px; color: #64748b;">
                            <div style="margin-bottom: 8px;">
                              <span style="color: ${GOLD_ACCENT}; margin-right: 12px; font-weight: bold;">01</span> Identity verification
                            </div>
                            <div style="margin-bottom: 8px;">
                              <span style="color: ${GOLD_ACCENT}; margin-right: 12px; font-weight: bold;">02</span> Access provisioning
                            </div>
                            <div>
                              <span style="color: ${GOLD_ACCENT}; margin-right: 12px; font-weight: bold;">03</span> Secure activation
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="font-size: 14px; color: #64748b; margin: 0;">You will receive an automated dispatch once your clearance has been granted.</p>
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
      <title>New Registration Request</title>
    </head>
    <body style="${SHARED_STYLES} margin: 0; padding: 0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fcfbf5;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellpadding="0" cellspacing="0" style="margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 63, 73, 0.08); border: 1px solid rgba(0,63,73,0.05);">
              <tr>
                <td>
                  ${getHeader()}
                  <div style="padding: 50px 40px;">
                    <h2 style="font-family: 'Marcellus', Georgia, serif; color: ${TEAL_PRIMARY}; font-size: 24px; margin-bottom: 24px; text-align: center;">New Security Clearance Request</h2>
                    
                    <div style="background-color: #f8fafc; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; margin-bottom: 32px; text-align: center;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; text-align: center;">
                            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px;">Candidate Name</span>
                            <span style="font-size: 16px; font-weight: 700; color: ${TEAL_PRIMARY};">${userData.name}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 16px 0; border-bottom: 1px solid #f1f5f9; text-align: center;">
                            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px;">Work Email</span>
                            <span style="font-size: 16px; font-weight: 600; color: #475569;">${userData.email}</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 16px; text-align: center;">
                            <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 4px;">Department / Job Title</span>
                            <span style="font-size: 16px; font-weight: 600; color: #475569;">${userData.department}</span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <div style="text-align: center;">
                      <a href="https://rehdigital.com/admin" style="display: inline-block; padding: 16px 40px; background-color: ${TEAL_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; box-shadow: 0 10px 20px rgba(0, 63, 73, 0.15);">Launch Admin Portal</a>
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
   * Sent to user after approval
   */
  ACCOUNT_APPROVED: (name: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Clearance Granted</title>
    </head>
    <body style="${SHARED_STYLES} margin: 0; padding: 0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fcfbf5;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellpadding="0" cellspacing="0" style="margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 63, 73, 0.08); border: 1px solid rgba(0,63,73,0.05);">
              <tr>
                <td>
                  ${getHeader()}
                  <div style="padding: 50px 40px; text-align: center;">
                    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 32px;">
                      <tr>
                        <td style="width: 72px; height: 72px; background-color: #526136; border-radius: 22px; text-align: center; box-shadow: 0 12px 24px rgba(82, 97, 54, 0.25);">
                          <img src="${LOGO_BASE_URL}/check-circle.png" alt="Success" width="40" height="40" style="display: inline-block; margin-top: 6px;">
                        </td>
                      </tr>
                    </table>
                    <h2 style="font-family: 'Marcellus', Georgia, serif; color: #526136; font-size: 28px; margin-bottom: 16px; letter-spacing: -0.01em;">Clearance Granted</h2>
                    <p style="font-size: 18px; font-weight: 600; color: ${TEAL_PRIMARY}; margin-bottom: 12px;">Welcome to the Frontlines, ${name}</p>
                    <p style="font-size: 16px; color: #475569; margin-bottom: 40px; line-height: 1.7;">Your security profile has been successfully validated. You now have full access to the project reporting modules and real-time command dashboard.</p>
                    
                    <a href="https://rehdigital.com/login" style="display: inline-block; padding: 20px 48px; background-color: ${GOLD_ACCENT}; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 0.15em; box-shadow: 0 12px 30px rgba(208, 171, 130, 0.3);">Initialize Dashboard</a>
                    
                    <p style="font-size: 13px; color: #94a3b8; margin-top: 40px; font-style: italic;">Note: This access is monitored and follows enterprise security protocols.</p>
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
    const isNews = data.category?.toUpperCase() === 'NEWS';
    const isAnnouncement = data.category?.toUpperCase() === 'ANNOUNCEMENT' || data.category?.toUpperCase() === 'BROADCAST';
    const iconUrl = isNews ? `${LOGO_BASE_URL}/news_icon_premium.png` : isAnnouncement ? `${LOGO_BASE_URL}/announcement_icon_premium.png` : `${LOGO_BASE_URL}/shield-check.png`;
    const iconBg = isNews ? '#003f49' : isAnnouncement ? GOLD_ACCENT : '#f1f5f9';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${data.title}</title>
    </head>
    <body style="${SHARED_STYLES} margin: 0; padding: 0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #fcfbf5;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellpadding="0" cellspacing="0" style="margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 63, 73, 0.08); border: 1px solid rgba(0,63,73,0.05);">
              <tr>
                <td align="center">
                  ${getHeader()}
                  <div style="padding: 50px 40px; text-align: center;">
                    <!-- Centered Icon & Category -->
                    <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto 32px;">
                      <tr>
                        <td align="center">
                          <div style="width: 56px; height: 56px; background-color: ${iconBg}; border-radius: 16px; text-align: center; margin-bottom: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.06);">
                            <img src="${iconUrl}" alt="Icon" width="28" height="28" style="display: inline-block; margin-top: 14px;">
                          </div>
                          ${data.category ? `<span style="display: block; color: ${GOLD_ACCENT}; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">${data.category} Protocol</span>` : ''}
                          <h2 style="font-family: 'Marcellus', Georgia, serif; color: ${TEAL_PRIMARY}; font-size: 28px; margin: 0; line-height: 1.3; letter-spacing: -0.01em;">${data.title}</h2>
                        </td>
                      </tr>
                    </table>

                    <div style="font-size: 16px; color: #475569; line-height: 1.8; white-space: pre-wrap; margin-bottom: 40px; padding: 32px; background: #fcfbf5; border-radius: 20px; border: 1px solid #f1f5f9; text-align: center;">${data.body}</div>
                    
                    <div style="text-align: center;">
                       <a href="https://rehdigital.com" style="display: inline-block; padding: 20px 48px; background-color: ${TEAL_PRIMARY}; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 15px; text-transform: uppercase; letter-spacing: 0.15em; box-shadow: 0 12px 30px rgba(0, 63, 73, 0.2);">Access Digital Reporting</a>
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
    `;
  }
};
