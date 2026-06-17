/**
 * Ultra-Elite Premium Mail Templates v2.21
 * 
 * Bulletproof Outlook Architecture: Integrated VML wrappers for all structural elements.
 * Forced color-locking using mso-hacks and tiled background logic.
 * Zero-attachment: Logos are hardcoded as Base64 to ensure 100% visibility.
 */

import { DOMAIN_CONFIG } from './apiConfig';

const GOLD_ACCENT = '#d0ab82';
const TEAL_PRIMARY = '#003f49';
const SURFACE_BG = '#F1F5F9';
const CARD_BG = '#FFFFFF';
const TEXT_PRIMARY = '#0F172A';
const TEXT_MUTED = '#475569';

// Hardcoded Logos (Base64)
const MODON_B64 = '__MODON_B64__';
const INSITE_B64 = '__INSITE_B64__';

const SHARED_STYLES = `
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: ${TEXT_PRIMARY};
  background-color: ${SURFACE_BG};
  -webkit-font-smoothing: antialiased;
`;

const MOBILE_CSS = `
<style type="text/css">
  @import url('https://fonts.googleapis.com/css2?family=Marcellus&display=swap');
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; padding: 0 !important; }
    .email-card { border-radius: 0 !important; margin-top: 0 !important; }
    .mobile-padding { padding: 24px 20px !important; }
    .hero-title { font-size: 24px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .force-teal { background-color: ${TEAL_PRIMARY} !important; color: #ffffff !important; }
    .force-white { color: #ffffff !important; }
    .force-gold { color: ${GOLD_ACCENT} !important; }
    .force-card { background-color: ${CARD_BG} !important; color: ${TEXT_PRIMARY} !important; }
  }
  [data-ogsc] .force-teal { background-color: ${TEAL_PRIMARY} !important; color: #ffffff !important; }
  [data-ogsc] .force-white { color: #ffffff !important; }
  [data-ogsc] .force-card { background-color: ${CARD_BG} !important; color: ${TEXT_PRIMARY} !important; }
</style>
`;

const getHeader = () => {
  const modonUri = `data:image/png;base64,${MODON_B64}`;
  const insiteUri = `data:image/png;base64,${INSITE_B64}`;
  
  const partnerLogos = [
    { uri: modonUri, alt: 'MODON' },
    { uri: insiteUri, alt: 'INSITE' }
  ];

  const logoGroup = partnerLogos.map((l, i) => {
    const divider = i > 0 ? `<div style="width:1px;height:12px;background-color:rgba(255,255,255,0.2);margin:0 12px;display:inline-block;vertical-align:middle;"></div>` : '';
    return divider + `<img src="${l.uri}" alt="${l.alt}" height="10" style="display:inline-block;height:10px;width:auto;border:0;vertical-align:middle;filter:brightness(0) invert(1);">`;
  }).join('');

  return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:60px;v-text-anchor:middle;width:600px;" arcsize="34%" stroke="f" fillcolor="${TEAL_PRIMARY}">
      <w:anchorlock/><center>
    <![endif]-->
    <table width="100%" border="0" cellpadding="0" cellspacing="0" class="force-teal" style="background-color:${TEAL_PRIMARY}; border-radius:20px 20px 0 0;">
      <tr>
        <td align="center" style="padding:20px 40px 16px;">
          <div style="display:inline-block;padding:6px 16px;background-color:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;">
            ${logoGroup}
          </div>
        </td>
      </tr>
    </table>
    <!--[if mso]></center></v:roundrect><![endif]-->
  `;
};

const getHero = (title: string, subtitle: string) => `
  <table width="100%" border="0" cellpadding="0" cellspacing="0" class="force-teal" style="background-color:${TEAL_PRIMARY};">
    <tr>
      <td align="center" style="padding:0 40px 40px;">
        <div class="force-white" style="color:rgba(255,255,255,0.5);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.4em;margin-bottom:10px;">Official Transmission</div>
        <h1 class="hero-title force-white" style="color:#FFFFFF !important; font-family:'Marcellus', 'Georgia', serif;font-size:26px;font-weight:400;line-height:1.2;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px; mso-color-alt:none;">${title}</h1>
        <div style="width:28px;height:2px;background-color:${GOLD_ACCENT};margin:0 auto 14px;"></div>
        <p class="force-white" style="color:rgba(255,255,255,0.7) !important; font-size:13px;line-height:1.5;max-width:380px;margin:0 auto; mso-color-alt:none;">${subtitle}</p>
      </td>
    </tr>
  </table>
`;

const getFooter = () => `
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr><td height="32" style="height:32px; font-size:1px; line-height:1px;">&nbsp;</td></tr>
    <tr>
      <td align="center">
        <div style="display:block; padding:0 40px 24px;">
          <span style="color:${TEXT_MUTED};font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;opacity:0.9;display:block;margin-bottom:6px;">
            &copy; 2026 REH DIGITAL REPORTING HUB
          </span>
          <span style="font-size:8px;color:${TEXT_MUTED};display:block;line-height:1;">
            <a href="${DOMAIN_CONFIG.BASE_URL}/privacy" target="_blank" style="color:${TEAL_PRIMARY};text-decoration:none;font-weight:600;">Privacy Policy</a> &nbsp;&bull;&nbsp; 
            <a href="${DOMAIN_CONFIG.BASE_URL}/security" target="_blank" style="color:${TEAL_PRIMARY};text-decoration:none;font-weight:600;">Security Standards</a>
          </span>
        </div>
      </td>
    </tr>
  </table>
`;

const getButton = (text: string, url: string) => `
  <table width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="24%" stroke="f" fillcolor="${TEAL_PRIMARY}">
          <w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">${text}</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${url}" target="_blank" class="force-teal" style="display:inline-block;background-color:${TEAL_PRIMARY}; color:#FFFFFF !important; font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;text-decoration:none;padding:14px 36px;border-radius:10px;box-shadow:0 4px 12px rgba(0,63,73,0.1); mso-color-alt:none;">
          ${text}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>
`;

const getIdentityBlock = (name: string, email: string) => `
  <table width="100%" border="0" cellpadding="0" cellspacing="0" class="force-card" style="margin-bottom:20px;background-color:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;">
    <tr>
      <td style="padding:14px 18px;">
        <div class="force-gold" style="font-size:8px;font-weight:900;text-transform:uppercase;color:${GOLD_ACCENT};letter-spacing:0.15em;margin-bottom:4px;">Verified Identity</div>
        <div class="force-teal" style="color:${TEAL_PRIMARY};font-size:13px;font-weight:800;margin-bottom:2px;">${name}</div>
        <div style="color:${TEXT_MUTED};font-size:11px;font-weight:600;font-family:'Courier New', Courier, monospace;text-decoration:none !important;color:${TEXT_MUTED} !important;">${email}</div>
      </td>
    </tr>
  </table>
`;

export const templates = {
  REGISTRATION_PENDING: (name: string, email: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Registration Received</title>${MOBILE_CSS}</head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${SURFACE_BG}">
        <tr>
          <td align="center" style="padding:32px 0 0;">
            <table width="600" border="0" cellpadding="0" cellspacing="0" class="container">
              <tr><td>${getHeader()}${getHero('Account <span class="force-gold" style="color:' + GOLD_ACCENT + '">Created</span>', 'Personnel entry undergoing clearance.')}</td></tr>
              <tr>
                <td align="center" style="padding:0 24px;">
                  <table class="email-card force-card" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.05);margin-top:-24px;">
                    <tr><td class="mobile-padding" style="padding:28px 36px;">${getIdentityBlock(name, email)}<h2 style="color:${TEAL_PRIMARY};font-size:15px;font-weight:800;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Security Protocol</h2><p style="color:${TEXT_MUTED};font-size:13px;line-height:1.6;margin:0;">Your administrative profile is being validated. Access authorization will be dispatched shortly.</p></td></tr>
                  </table>
                </td>
              </tr>
              <tr><td>${getFooter()}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
  PASSWORD_RESET: (name: string, email: string, resetLink: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Security Reset</title>${MOBILE_CSS}</head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${SURFACE_BG}">
        <tr>
          <td align="center" style="padding:32px 0 0;">
            <table width="600" border="0" cellpadding="0" cellspacing="0" class="container">
              <tr><td>${getHeader()}${getHero('Security <span class="force-gold" style="color:' + GOLD_ACCENT + '">Reset</span>', 'Credential update required.')}</td></tr>
              <tr>
                <td align="center" style="padding:0 24px;">
                  <table class="email-card force-card" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.05);margin-top:-24px;">
                    <tr>
                      <td class="mobile-padding" style="padding:28px 36px;">
                        ${getIdentityBlock(name, email)}
                        <h2 style="color:${TEAL_PRIMARY};font-size:15px;font-weight:800;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Credential Sync</h2>
                        <p style="color:${TEXT_MUTED};font-size:13px;line-height:1.6;margin:0 0 20px;">A secure reset link has been generated. If you did not request this cycle, you may safely neglect this transmission.</p>
                        <div style="background-color:#FEF2F2;border-radius:8px;padding:10px 14px;border:1px solid #FEE2E2;margin-bottom:20px;"><p style="margin:0;font-size:11px;color:#B91C1C;font-weight:600;">Advisory: Terminate this request if unauthorized.</p></div>
                        ${getButton('Reset Password', resetLink)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td>${getFooter()}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
  PASSWORD_RESET_SUCCESS: (name: string, email: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset Successful</title>${MOBILE_CSS}</head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${SURFACE_BG}">
        <tr>
          <td align="center" style="padding:32px 0 0;">
            <table width="600" border="0" cellpadding="0" cellspacing="0" class="container">
              <tr><td>${getHeader()}${getHero('Security <span class="force-gold" style="color:' + GOLD_ACCENT + '">Updated</span>', 'Handshake complete.')}</td></tr>
              <tr>
                <td align="center" style="padding:0 24px;">
                  <table class="email-card force-card" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.05);margin-top:-24px;">
                    <tr>
                      <td class="mobile-padding" style="padding:28px 36px;text-align:center;">
                        ${getIdentityBlock(name, email)}
                        <h2 style="color:${TEAL_PRIMARY};font-size:15px;font-weight:800;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Profile Synchronized</h2>
                        <p style="color:${TEXT_MUTED};font-size:14px;line-height:1.6;margin:0 0 24px;">Your security credentials have been successfully updated. Access to the portal has been restored.</p>
                        ${getButton('Access Portal', `${DOMAIN_CONFIG.BASE_URL}/login`)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td>${getFooter()}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
  ACCOUNT_APPROVED: (name: string, email: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Access Granted</title>${MOBILE_CSS}</head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${SURFACE_BG}">
        <tr>
          <td align="center" style="padding:32px 0 0;">
            <table width="600" border="0" cellpadding="0" cellspacing="0" class="container">
              <tr><td>${getHeader()}${getHero('Access <span class="force-gold" style="color:' + GOLD_ACCENT + '">Granted</span>', 'Credential sync complete.')}</td></tr>
              <tr>
                <td align="center" style="padding:0 24px;">
                  <table class="email-card force-card" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.05);margin-top:-24px;">
                    <tr>
                      <td class="mobile-padding" style="padding:28px 36px;text-align:center;">
                        ${getIdentityBlock(name, email)}
                        <p style="color:${TEXT_MUTED};font-size:14px;line-height:1.6;margin:0 0 20px;">Your profile is active. You may now access all reporting modules.</p>
                        ${getButton('Enter Hub', `${DOMAIN_CONFIG.BASE_URL}/login`)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td>${getFooter()}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
  ADMIN_NOTIFICATION: (userData: { name: string, email: string, department: string }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Access Request</title>${MOBILE_CSS}</head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${SURFACE_BG}">
        <tr>
          <td align="center" style="padding:32px 0 0;">
            <table width="600" border="0" cellpadding="0" cellspacing="0" class="container">
              <tr><td>${getHeader()}${getHero('Access <span class="force-gold" style="color:' + GOLD_ACCENT + '">Request</span>', 'New personnel entry detected.')}</td></tr>
              <tr>
                <td align="center" style="padding:0 24px;">
                  <table class="email-card force-card" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.05);margin-top:-24px;">
                    <tr>
                      <td class="mobile-padding" style="padding:28px 36px;">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                          <tr><td style="padding-bottom:10px;border-bottom:1px solid #F1F5F9;"><div style="font-size:8px;text-transform:uppercase;color:${TEXT_MUTED};letter-spacing:0.1em;margin-bottom:2px;">Identity</div><div style="color:${TEAL_PRIMARY};font-size:14px;font-weight:700;">${userData.name}</div><div style="color:${TEXT_MUTED};font-size:11px;font-weight:600;">${userData.email}</div></td></tr>
                          <tr><td style="padding:10px 0;border-bottom:1px solid #F1F5F9;"><div style="font-size:8px;text-transform:uppercase;color:${TEXT_MUTED};letter-spacing:0.1em;margin-bottom:2px;">Department</div><div class="force-gold" style="color:${GOLD_ACCENT};font-size:12px;font-weight:800;text-transform:uppercase;">${userData.department}</div></td></tr>
                        </table>
                        ${getButton('Authorize', `${DOMAIN_CONFIG.BASE_URL}/admin`)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td>${getFooter()}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
  CUSTOM_NOTIFICATION: (data: { title: string, body: string, category?: string }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${data.title}</title>${MOBILE_CSS}</head>
    <body style="${SHARED_STYLES} margin:0;padding:0;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${SURFACE_BG}">
        <tr>
          <td align="center" style="padding:32px 0 0;">
            <table width="600" border="0" cellpadding="0" cellspacing="0" class="container">
              <tr><td>${getHeader()}${getHero(data.title, 'Project Update')}</td></tr>
              <tr>
                <td align="center" style="padding:0 24px;">
                  <table class="email-card force-card" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="${CARD_BG}" style="background-color:${CARD_BG};border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.05);margin-top:-24px;">
                    <tr>
                      <td class="mobile-padding" style="padding:28px 36px;">
                        ${data.category ? `<div class="force-gold" style="color:${GOLD_ACCENT};font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;margin-bottom:10px;">${data.category}</div>` : ''}
                        <div style="color:${TEXT_PRIMARY};font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.body}</div>
                        <div style="margin-top:24px;">${getButton('Open Portal', DOMAIN_CONFIG.BASE_URL)}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td>${getFooter()}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
};
