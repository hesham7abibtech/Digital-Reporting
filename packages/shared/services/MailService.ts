/**
 * Industrial Consolidated Mail Service
 * Directly communicates with AWS Consolidated Authority for all Auth and Mail tasks.
 * Bypasses Cloudflare API routes to eliminate 500 errors.
 */
class MailService {
  // Relay creds injected by server code via configure(). On Cloudflare Pages
  // (next-on-pages) secrets live on the request context, NOT process.env, so
  // server callers resolve them with readEnv() and inject here. This module
  // stays client-safe (it never imports next-on-pages). process.env is the
  // local-dev / node fallback.
  private _relayUrl?: string;
  private _relaySecret?: string;

  /** Inject relay URL/secret (server-side: from readEnv → request context). */
  configure(cfg: { url?: string; secret?: string }) {
    if (cfg.url) this._relayUrl = cfg.url;
    if (cfg.secret) this._relaySecret = cfg.secret;
  }

  private get RELAY_URL() {
    return this._relayUrl || process.env.SMTP_RELAY_URL || process.env.NEXT_PUBLIC_SMTP_RELAY_URL || 'https://api.rehdigital.com';
  }
  private get RELAY_SECRET() {
    return this._relaySecret || process.env.SMTP_RELAY_SECRET || process.env.NEXT_PUBLIC_SMTP_RELAY_SECRET;
  }

  private async call(endpoint: string, data: any) {
    const url = `${this.RELAY_URL}${endpoint}`;
    console.log(`[MAIL_SERVICE] Calling Consolidated AWS Endpoint: ${endpoint}...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          secret: this.RELAY_SECRET
        })
      });

      // The relay should always return JSON. If it returns HTML (nginx 502,
      // Cloudflare error page, wrong URL…) surface a clear status instead of a
      // confusing "Unexpected token '<'" JSON parse error.
      const raw = await response.text();
      let parsed: any = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { /* non-JSON */ }

      if (!response.ok) {
        throw new Error(parsed?.error || `Mail relay error ${response.status} ${response.statusText}`.trim());
      }
      if (parsed == null) {
        throw new Error(`Mail relay returned a non-JSON response (status ${response.status}) — check NEXT_PUBLIC_SMTP_RELAY_URL/SMTP_RELAY_URL and that the relay is reachable.`);
      }
      return parsed;
    } catch (error) {
      console.error(`[MAIL_SERVICE] [${endpoint}] Error:`, error);
      throw error;
    }
  }

  /**
   * AUTH: Send Identity Verification Link (New Account)
   */
  async sendVerificationLink(email: string, name: string) {
    return this.call('/v1/auth/verify-link', { email, name });
  }

  /**
   * AUTH: Send Password Reset Link
   */
  async sendPasswordReset(email: string, name: string) {
    return this.call('/v1/auth/reset-link', { email, name });
  }

  /**
   * AUTH: Send Password Changed Confirmation
   */
  async sendPasswordChangedConfirmation(email: string, name: string) {
    return this.call('/v1/mail/dispatch', { 
      to: email, 
      subject: 'REH Command Center — Security Updated',
      type: 'PASSWORD_CHANGED',
      payload: { name }
    });
  }

  /**
   * AUTH: Notify Admin of New User Waiting for Approval
   */
  async notifyAdminOfNewUser(userName: string, userEmail: string, adminEmail: string) {
    return this.call('/v1/auth/admin-notify', { userName, userEmail, adminEmail });
  }

  /**
   * DISPATCH: Send Announcement / News / Custom Mail
   */
  async dispatch(params: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    type: 'ANNOUNCEMENT' | 'NEWS' | 'SYSTEM_ALERT' | 'PASSWORD_CHANGED' | 'ACCOUNT_APPROVED' | 'REVOCATION_APPEAL';
    payload: any;
  }) {
    return this.call('/v1/mail/dispatch', params);
  }
}

export const mailService = new MailService();
