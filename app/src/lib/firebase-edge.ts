/**
 * Edge-Compatible Firebase Auth
 * Uses Google Identity ToolKit REST API instead of the Node.js Admin SDK.
 * This is 100% compatible with Cloudflare Edge Runtime.
 */

export class FirebaseAuthEdge {
  /**
   * Generates a Password Reset Link via REST
   * @param env - The Cloudflare environment bindings
   */
  async getPasswordResetLink(email: string, env: any): Promise<string> {
    const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const baseUrl = env.NEXT_PUBLIC_BASE_URL || 'https://www.rehdigital.com';
    const projectId = "keodigitalreporting";
    
    if (!apiKey) {
      console.error('[FIREBASE_EDGE] CRITICAL: NEXT_PUBLIC_FIREBASE_API_KEY is missing from environment bindings.');
      throw new Error('Infrastructure configuration incomplete (Missing API Key).');
    }

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
    
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
