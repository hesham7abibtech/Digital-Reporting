import nodemailer from 'nodemailer';
import { templates } from '@/lib/mailTemplates';

/**
 * Premium SMTP Mail Service
 *
 * Zero-attachment architecture: all images are embedded inline.
 * Powered by Zoho Mail.
 */

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export const MAIL_SENDERS = {
  VERIFICATION: '"REH Digital Verification" <verification@rehdigital.com>',
  INFO: '"REH Digital Info" <info@rehdigital.com>',
  RESET: '"REH Digital Reset" <reset@rehdigital.com>',
};

class MailService {
  private verificationTransporter: nodemailer.Transporter;
  private infoTransporter: nodemailer.Transporter;
  private resetTransporter: nodemailer.Transporter;

  constructor() {
    this.verificationTransporter = nodemailer.createTransport({
      ...SMTP_CONFIG,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    this.infoTransporter = nodemailer.createTransport({
      ...SMTP_CONFIG,
      auth: { user: process.env.SMTP_INFO_USER, pass: process.env.SMTP_INFO_PASS },
    });

    this.resetTransporter = nodemailer.createTransport({
      ...SMTP_CONFIG,
      auth: { 
        user: process.env.SMTP_RESET_USER || 'reset@rehdigital.com', 
        pass: process.env.SMTP_RESET_PASS || 'mNb7UU4gmcJn' 
      },
    });
  }

  /**
   * Core send method — no attachments, all assets are inline.
   */
  private async sendMail(options: {
    type: 'VERIFICATION' | 'INFO' | 'RESET';
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    html: string;
  }) {
    const transporter = options.type === 'RESET' ? this.resetTransporter 
      : options.type === 'VERIFICATION' ? this.verificationTransporter 
      : this.infoTransporter;
    const from = options.type === 'RESET' ? MAIL_SENDERS.RESET
      : options.type === 'VERIFICATION' ? MAIL_SENDERS.VERIFICATION 
      : MAIL_SENDERS.INFO;

    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[MAIL_SERVICE] [${options.type}] Dispatch successful: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[MAIL_SERVICE] [${options.type}] Dispatch failure:`, error);
      throw error;
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
