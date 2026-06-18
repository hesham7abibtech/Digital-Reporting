import { mailService } from '@/services/MailService';
import { readEnv } from './serverEnv';

/**
 * Server-only accessor for the mail relay.
 *
 * Injects the relay URL + secret (resolved from the Cloudflare request context
 * via readEnv — secrets are NOT on process.env in next-on-pages) into the shared
 * `mailService`, then returns it. Server code (API routes, otp lib) MUST send mail
 * through this — importing `mailService` directly leaves the relay secret undefined
 * on Cloudflare, so the relay rejects with 403 and no email is delivered.
 *
 * SERVER-ONLY: never import into a client component (pulls in next-on-pages).
 */
export function serverMail() {
  mailService.configure({
    url: readEnv('SMTP_RELAY_URL') || readEnv('NEXT_PUBLIC_SMTP_RELAY_URL'),
    secret: readEnv('SMTP_RELAY_SECRET'),
  });
  return mailService;
}
