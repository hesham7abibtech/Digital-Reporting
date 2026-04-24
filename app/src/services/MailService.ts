import nodemailer from 'nodemailer';
import { templates } from '@/lib/mailTemplates';

/**
 * Premium SMTP Mail Service
 * 
 * Powered by Zoho Mail.
 * Handles the secure handshake and dispatch of enterprise notifications.
 */

// Centralized SMTP Configuration
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.zoho.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Sender Identities
export const MAIL_SENDERS = {
  VERIFICATION: '"REH Digital Verification" <verification@rehdigital.com>',
  INFO: '"REH Digital Info" <info@rehdigital.com>',
  SYSTEM: '"REH Digital System" <system@rehdigital.com>',
};

class MailService {
  private verificationTransporter: nodemailer.Transporter;
  private infoTransporter: nodemailer.Transporter;

  constructor() {
    // Transporter for Auth/Verification
    this.verificationTransporter = nodemailer.createTransport({
      ...SMTP_CONFIG,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Transporter for General Communications
    this.infoTransporter = nodemailer.createTransport({
      ...SMTP_CONFIG,
      auth: {
        user: process.env.SMTP_INFO_USER,
        pass: process.env.SMTP_INFO_PASS,
      },
    });
  }

  /**
   * Internal generic send method
   */
  private async sendMail(options: { 
    type: 'VERIFICATION' | 'INFO';
    to: string; 
    subject: string; 
    html: string 
  }) {
    const transporter = options.type === 'VERIFICATION' ? this.verificationTransporter : this.infoTransporter;
    const from = options.type === 'VERIFICATION' ? MAIL_SENDERS.VERIFICATION : MAIL_SENDERS.INFO;

    try {
      const info = await transporter.sendMail({
        from,
        to: options.to,
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

  /**
   * Notify User: Registration Received (Pending)
   */
  async sendRegistrationPending(to: string, name: string) {
    return this.sendMail({
      type: 'VERIFICATION',
      to,
      subject: 'REH Command Center — Registration Received',
      html: templates.REGISTRATION_PENDING(name),
    });
  }

  /**
   * Notify Admins: New User Request
   */
  async sendAdminRegistrationAlert(to: string, userData: { name: string; email: string; department: string }) {
    return this.sendMail({
      type: 'VERIFICATION',
      to,
      subject: `[ADMIN] New Access Request: ${userData.name}`,
      html: templates.ADMIN_NOTIFICATION(userData),
    });
  }

  /**
   * Notify User: Account Approved
   */
  async sendAccountApproved(to: string, name: string) {
    return this.sendMail({
      type: 'VERIFICATION',
      to,
      subject: 'REH Command Center — Clearance Granted',
      html: templates.ACCOUNT_APPROVED(name),
    });
  }

  /**
   * Send Custom Notification / Announcement
   */
  async sendCustomNotification(to: string, data: { title: string, body: string, category?: string }) {
    return this.sendMail({
      type: 'INFO',
      to,
      subject: `REH Command Center — ${data.title}`,
      html: templates.CUSTOM_NOTIFICATION(data),
    });
  }
}

// Export a singleton instance
export const mailService = new MailService();
