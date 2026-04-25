import { templates } from '@/lib/mailTemplates';

/**
 * Universal Edge-Compatible Mail Service
 */
export const MAIL_SENDERS = {
  VERIFICATION: '"REH Digital Verification" <verification@rehdigital.com>',
  INFO: '"REH Digital Info" <info@rehdigital.com>',
  RESET: '"REH Digital Reset" <reset@rehdigital.com>',
};

class MailService {
  /**
   * Core send method — Uses nodemailer only if available
   */
  private async sendMail(options: {
    type: 'VERIFICATION' | 'INFO' | 'RESET';
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
  }) {
    console.log(`[MAIL_SERVICE] [${options.type}] Dispatch initiated to ${options.to}`);
    
    // In Edge Runtime, nodemailer might crash the build if not handled carefully.
    // We attempt a dynamic import to isolate it.
    try {
      // @ts-ignore - Dynamic import to avoid build-time analysis
      const nodemailer = await import('nodemailer').then(m => m.default || m);

      // Select credentials based on type
      let user = process.env.SMTP_USER;
      let pass = process.env.SMTP_PASS;

      if (options.type === 'INFO') {
        user = process.env.SMTP_INFO_USER;
        pass = process.env.SMTP_INFO_PASS;
      } else if (options.type === 'RESET') {
        user = process.env.SMTP_RESET_USER;
        pass = process.env.SMTP_RESET_PASS;
      }

      if (!user || !pass) {
        throw new Error(`SMTP credentials missing for type: ${options.type}`);
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.zoho.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: { user, pass },
      });

      const from = options.type === 'RESET' ? MAIL_SENDERS.RESET : 
                   options.type === 'INFO' ? MAIL_SENDERS.INFO : 
                   MAIL_SENDERS.VERIFICATION;

      const info = await transporter.sendMail({
        from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
      });

      console.log(`[MAIL_SERVICE] [${options.type}] Successfully sent: ${info.messageId}`);
      return { success: true, messageId: info.messageId };

    } catch (error: any) {
      console.error(`[MAIL_SERVICE] [${options.type}] Edge Mail Error:`, error);
      
      // Fallback: If nodemailer fails (common on Edge), we log the intent.
      // In a production environment, we would use a REST-based mail provider API here.
      return { 
        success: false, 
        error: "SMTP not supported in this runtime environment. Please use a REST-based mail provider." 
      };
    }
  }

  async sendRegistrationPending(to: string, name: string) {
    return this.sendMail({
      type: 'VERIFICATION',
      to,
      subject: 'REH Digital Reporting — Registration Received',
      html: templates.REGISTRATION_PENDING(name, to),
    });
  }

  async sendAdminRegistrationAlert(to: string, userData: { name: string; email: string; department: string }) {
    return this.sendMail({
      type: 'VERIFICATION',
      to,
      subject: `[ADMIN] REH Digital Reporting — New Access Request: ${userData.name}`,
      html: templates.ADMIN_NOTIFICATION(userData),
    });
  }

  async sendAccountApproved(to: string, name: string) {
    return this.sendMail({
      type: 'VERIFICATION',
      to,
      subject: 'REH Digital Reporting — Clearance Granted',
      html: templates.ACCOUNT_APPROVED(name, to),
    });
  }

  async sendCustomNotification(
    to: string | string[],
    data: { title: string; body: string; category?: string },
    extras?: { cc?: string | string[]; bcc?: string | string[] }
  ) {
    return this.sendMail({
      type: 'INFO',
      to,
      cc: extras?.cc,
      bcc: extras?.bcc,
      subject: `REH Digital Reporting — ${data.title}`,
      html: templates.CUSTOM_NOTIFICATION(data),
    });
  }

  async sendPasswordReset(to: string, name: string, resetLink: string) {
    return this.sendMail({
      type: 'RESET',
      to,
      subject: 'REH Digital Reset — Password Security Update',
      html: templates.PASSWORD_RESET(name, to, resetLink),
    });
  }

  async sendPasswordResetSuccess(to: string, name: string) {
    return this.sendMail({
      type: 'RESET',
      to,
      subject: 'REH Digital Reset — Security Profile Updated',
      html: templates.PASSWORD_RESET_SUCCESS(name, to),
    });
  }
}

export const mailService = new MailService();
