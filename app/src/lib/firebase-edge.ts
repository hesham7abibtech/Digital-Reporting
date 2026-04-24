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
    
    if (!this.apiKey) {
      console.error('[FIREBASE_EDGE] CRITICAL: NEXT_PUBLIC_FIREBASE_API_KEY is missing from environment.');
    }
  }

  /**
   * Generates a Password Reset Link via REST
   */
  async getPasswordResetLink(email: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Infrastructure configuration incomplete (Missing API Key).');
    }

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.apiKey}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.rehdigital.com';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email,
          continueUrl: `${baseUrl}/login`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[FIREBASE_EDGE_REST_ERROR]', error);
        throw new Error(error.error?.message || 'Failed to generate reset link');
      }

      return 'EMAIL_SENT_DIRECTLY';
    } catch (err: any) {
      console.error('[FIREBASE_EDGE_FETCH_CRASH]', err);
      throw err;
    }
  }
}

export const authEdge = new FirebaseAuthEdge();
