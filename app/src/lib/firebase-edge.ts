/**
 * Edge-Compatible Firebase Auth
 * Uses Google Identity ToolKit REST API instead of the Node.js Admin SDK.
 * This is 100% compatible with Cloudflare Edge Runtime.
 */

export class FirebaseAuthEdge {
  private apiKey: string;
  private projectId: string;

  constructor() {
    // We use the public API key from environment
    this.apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
    this.projectId = "keodigitalreporting";
  }

  /**
   * Generates a Password Reset Link via REST
   */
  async getPasswordResetLink(email: string): Promise<string> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
        continueUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rehdigital.com'}/login`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate reset link');
    }

    // Note: The REST API usually sends the email directly. 
    // If you need the raw link, you would use a Service Account OAuth token.
    return 'EMAIL_SENT_DIRECTLY';
  }
}

export const authEdge = new FirebaseAuthEdge();
