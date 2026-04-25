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

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Consolidated Dispatch Failed');
      
      return { success: true };
    } catch (error: any) {
      console.error(`[MAIL_SERVICE] [${endpoint}] Error:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * CONSOLIDATED RESET: Generates link AND sends email in one AWS call.
   */
  async sendPasswordReset(to: string, name: string) {
    return this.call('/v1/auth/reset-link', { email: to, name });
  }

  async sendRegistrationPending(to: string, name: string) {
    return this.call('/v1/mail/dispatch', {
      type: 'REGISTRATION_PENDING',
      to,
      subject: 'REH Digital Reporting — Registration Received',
      payload: { name }
    });
  }

  async sendAccountApproved(to: string, name: string) {
    return this.call('/v1/mail/dispatch', {
      type: 'ACCOUNT_APPROVED',
      to,
      subject: 'REH Digital Reporting — Clearance Granted',
      payload: { name }
    });
  }

  async sendAdminRegistrationAlert(to: string, userData: any) {
    return this.call('/v1/mail/dispatch', {
      type: 'ADMIN_NOTIFICATION',
      to,
      subject: `[ADMIN] New Access Request: ${userData.name}`,
      payload: userData
    });
  }

  async sendCustomNotification(to: string, data: any) {
    return this.call('/v1/mail/dispatch', {
      type: 'CUSTOM_NOTIFICATION',
      to,
      subject: data.subject || 'REH Digital Notification',
      payload: data
    });
  }
}

export const mailService = new MailService();
