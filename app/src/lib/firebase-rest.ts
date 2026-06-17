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

// ─── Firestore <-> JSON value mapping ─────────────────────────────
// Handles the full set of types we persist (incl. arrays like BIMReview.Precinct,
// nested objects, and Date/timestamps) which the previous inline mapper did not.

export function toFirestoreValue(val: unknown): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    return { mapValue: { fields: toFirestoreFields(val as Record<string, unknown>) } };
  }
  // Fallback: stringify anything exotic
  return { stringValue: String(val) };
}

export function toFirestoreFields(data: Record<string, unknown>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue; // skip undefined so we never write garbage
    fields[key] = toFirestoreValue(val);
  }
  return fields;
}

export function fromFirestoreValue(val: any): unknown {
  if (val == null) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('timestampValue' in val) return val.timestampValue; // keep ISO string
  if ('referenceValue' in val) return val.referenceValue;
  if ('arrayValue' in val) return (val.arrayValue?.values ?? []).map(fromFirestoreValue);
  if ('mapValue' in val) return fromFirestoreFields(val.mapValue?.fields ?? {});
  return null;
}

export function fromFirestoreFields(fields: Record<string, any> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    out[key] = fromFirestoreValue(val);
  }
  return out;
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
    if (sa.project_id) {
      this.projectId = sa.project_id;
    }
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

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(data) })
    });

    if (!res.ok) throw new Error(`Add failed: ${await res.text()}`);
    return await res.json();
  }

  /**
   * Create or update a document at a fixed path.
   * merge=true (default) only writes the supplied fields (via updateMask), leaving
   * other fields intact. merge=false overwrites the whole document.
   */
  async firestoreSet(path: string, data: Record<string, unknown>, merge = true) {
    const token = await this.getAccessToken();
    let url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${path}`;

    if (merge) {
      // updateMask ensures unspecified fields are preserved (true merge semantics).
      const mask = Object.keys(data)
        .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
        .join('&');
      if (mask) url += `?${mask}`;
    }

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(data) })
    });

    if (!res.ok) throw new Error(`Set failed: ${await res.text()}`);
    return await res.json();
  }

  /**
   * List every document in a collection (paginated), returning parsed `{ id, ...data }`.
   */
  async firestoreList(collection: string): Promise<Array<Record<string, unknown> & { id: string }>> {
    const token = await this.getAccessToken();
    const base = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${collection}`;
    const out: Array<Record<string, unknown> & { id: string }> = [];
    let pageToken: string | undefined;

    do {
      const url = `${base}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`List failed: ${await res.text()}`);
      const data = await res.json();
      for (const doc of data.documents ?? []) {
        const id = String(doc.name || '').split('/').pop() || '';
        out.push({ id, ...fromFirestoreFields(doc.fields ?? {}) });
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return out;
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
    return bufView;
  }

  private ab2base64url(buf: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export const firebaseRest = new FirebaseRest();
