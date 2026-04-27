/**
 * Edge-Native Firebase REST Utility
 * Authenticates Service Accounts using the Web Crypto API (RSA-SHA256).
 * Compatible with Cloudflare Edge Runtime.
 */

interface ServiceAccount {
  project_id: string;
  private_key: string;
  client_email: string;
}

export class FirebaseRest {
  private projectId = "keodigitalreporting";
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken && now < this.tokenExpiry) return this.accessToken;

    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!saVar) throw new Error('FIREBASE_SERVICE_ACCOUNT missing');

    const sa: ServiceAccount = JSON.parse(saVar);
    const privateKey = sa.private_key.replace(/\\n/g, '\n');

    // 1. Create JWT Header and Payload
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    })).replace(/=/g, '');

    const unsignedToken = `${header}.${payload}`;

    // 2. Sign JWT using Web Crypto API
    const binaryKey = this.str2ab(atob(privateKey.split('-----BEGIN PRIVATE KEY-----')[1].split('-----END PRIVATE KEY-----')[0].replace(/\s/g, '')));
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(unsignedToken)
    );

    const signedToken = `${unsignedToken}.${this.ab2base64url(signature)}`;

    // 3. Fetch Access Token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedToken}`
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`OAuth failed: ${JSON.stringify(data)}`);

    this.accessToken = data.access_token;
    this.tokenExpiry = now + data.expires_in - 60;
    return this.accessToken!;
  }

  // --- Firestore Helpers ---

  async firestoreGet(path: string) {
    const token = await this.getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${path}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return await res.json();
  }

  async firestoreQuery(collection: string, filters: any[] = []) {
    const token = await this.getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents:runQuery`;
    
    const query = {
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: filters.length > 0 ? {
          compositeFilter: {
            op: 'AND',
            filters: filters.map(f => ({
              fieldFilter: {
                field: { fieldPath: f.field },
                op: f.op,
                value: { stringValue: f.value } // Simplified for string values
              }
            }))
          }
        } : undefined
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });

    if (!res.ok) throw new Error(`Query failed: ${await res.text()}`);
    return await res.json();
  }

  async firestoreAdd(collection: string, data: any) {
    const token = await this.getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${collection}`;
    
    // Map JSON to Firestore REST format
    const fields: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val === null) fields[key] = { nullValue: null };
      else if (typeof val === 'string') fields[key] = { stringValue: val };
      else if (typeof val === 'number') fields[key] = { doubleValue: val };
      else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
      // Note: serverTimestamp is handled differently in REST, usually by leaving it out or using a specific string if the receiver supports it.
      // For simplicity, we'll use ISO string here unless we implement full mapping.
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!res.ok) throw new Error(`Add failed: ${await res.text()}`);
    return await res.json();
  }

  async firestoreDelete(path: string) {
    const token = await this.getAccessToken();
    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${path}`;
    const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Delete failed: ${await res.text()}`);
    return true;
  }

  // --- Auth Helpers ---

  async authUpdateUser(uid: string, data: { disabled?: boolean }) {
    const token = await this.getAccessToken();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: uid, ...data })
    });

    if (!res.ok) throw new Error(`Auth update failed: ${await res.text()}`);
    return await res.json();
  }

  async authDeleteUser(uid: string) {
    const token = await this.getAccessToken();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: uid })
    });

    if (!res.ok) throw new Error(`Auth delete failed: ${await res.text()}`);
    return true;
  }

  // --- Utils ---

  private str2ab(str: string) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }

  private ab2base64url(buf: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export const firebaseRest = new FirebaseRest();
