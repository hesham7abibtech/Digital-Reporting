/**
 * Industrial Consolidated Mail Service
 * Directly communicates with AWS Consolidated Authority for all Auth and Mail tasks.
 * Bypasses Cloudflare API routes to eliminate 500 errors.
 */
class MailService {
  private RELAY_URL = process.env.NEXT_PUBLIC_SMTP_RELAY_URL || 'https://api.rehdigital.com';
  private RELAY_SECRET = process.env.NEXT_PUBLIC_SMTP_RELAY_SECRET;

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Relay communication failed');
      }

      return await response.json();
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
    type: 'ANNOUNCEMENT' | 'NEWS' | 'SYSTEM_ALERT' | 'PASSWORD_CHANGED' | 'ACCOUNT_APPROVED';
    payload: any;
  }) {
    return this.call('/v1/mail/dispatch', params);
  }
}

export const mailService = new MailService();
