# REH Digital Reporting — Infrastructure Provisioning Guide
## Domain Migration & SSL Handshake Protocol

This document outlines the professional deployment procedures for transitioning the **Ras El Hekma Command Center** to its permanent digital identity: **rehdigital.com**.

---

### 1. Cloudflare Pages: Custom Domain Binding

To attach the elite domain to your Cloudflare Pages project:

1.  **Dashboard Navigation**: Log in to your Cloudflare Dashboard and select **Workers & Pages**.
2.  **Project Selection**: Click on the `digital-reporting` project.
3.  **Custom Domains**: Navigate to the **Custom Domains** tab.
4.  **Activation**:
    *   Click **Set up a custom domain**.
    *   Enter `rehdigital.com` and follow the CNAME verification process.
    *   Repeat for `www.rehdigital.com`.
5.  **SSL/TLS Handshake**: Cloudflare automatically provisions a **Universal SSL Certificate** (Universal Edge Certificate). Ensure the **SSL/TLS encryption mode** is set to **Full** or **Full (Strict)**.

---

### 2. API Gateway: api.rehdigital.com

For the professional API gateway (`api.rehdigital.com`):

1.  **DNS Records**: In the Cloudflare DNS tab for `rehdigital.com`, create a new record:
    *   **Type**: `CNAME`
    *   **Name**: `api`
    *   **Target**: `digital-reporting.pages.dev` (or your backend endpoint).
    *   **Proxy Status**: Proxied (Orange Cloud).
2.  **Workers Routing** (If applicable): If using Cloudflare Workers for the backend, navigate to **Workers & Pages** > **[Your Worker]** > **Settings** > **Triggers** and add `api.rehdigital.com` as a Custom Domain.

---

### 3. Firebase Security: Authorized Domains

To ensure the login system remains operational on the new domain, you **MUST** authorize it in the Firebase Console:

1.  **Firebase Console**: Go to [Firebase Console](https://console.firebase.google.com/).
2.  **Authentication**: Select **Authentication** > **Settings**.
3.  **Authorized Domains**:
    *   Click **Add domain**.
    *   Add `rehdigital.com`.
    *   Add `api.rehdigital.com`.
4.  **Firestore CORS**: (If applicable) Update your Firestore or Cloud Functions CORS settings to allow requests from the new origin.

---

### 4. Technical Validation Checklist

| Phase | Milestone | Status |
| :--- | :--- | :--- |
| **DNS** | Propagation of A/CNAME records for rehdigital.com | Pending |
| **SSL** | Provisioning of TLS 1.3 Certificate (Cloudflare) | Pending |
| **Auth** | Firebase Handshake Authorization | Pending |
| **CORS** | Cross-Origin resource sharing for api.rehdigital.com | Pending |

---

> [!IMPORTANT]
> **Premium Security Note**: Once the migration is complete, it is recommended to enable **HSTS (HTTP Strict Transport Security)** in Cloudflare to enforce secure connections across all subdomains.

*Document Version: 1.1 — Infrastructure Division*
