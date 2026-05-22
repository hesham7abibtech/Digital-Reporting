import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load .env.local
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Match either single or double quoted values
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT=(['"])(.+?)\1(?=\r?\n|$)/s);
if (!match) {
  console.error("FIREBASE_SERVICE_ACCOUNT not found in .env.local");
  process.exit(1);
}

const quoteType = match[1];
let saVar = match[2];

// If it was double-quoted, it might have escaped quotes inside it
if (quoteType === '"') {
  saVar = saVar.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

const sa = JSON.parse(saVar);
console.log("Project ID:", sa.project_id);
console.log("Client Email:", sa.client_email);

function base64url(strOrBuffer) {
  const buf = typeof strOrBuffer === 'string' ? Buffer.from(strOrBuffer) : strOrBuffer;
  return buf.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const unsignedToken = `${header}.${payload}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(sa.private_key.replace(/\\n/g, '\n'));
  const signedToken = `${unsignedToken}.${base64url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedToken}`
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function main() {
  try {
    console.log("Fetching access token...");
    const token = await getAccessToken();
    console.log("Access token retrieved successfully.");
    
    // Let's try to query users collection in firestore
    const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/users?pageSize=5`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      throw new Error(`Firestore query failed: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    console.log("Firestore Response (users list):", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

main();
