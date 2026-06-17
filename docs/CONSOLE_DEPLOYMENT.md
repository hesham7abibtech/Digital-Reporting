# Admin Console — Cloudflare deployment & environment

Target: **`console.rehdigital.com`** (separate Cloudflare Pages project, e.g. `rehdigital-console`).
The console and the user portal **share the same Supabase project** (`rrjpxgjxlpktifeoydrz`), so
edits are Realtime-synced automatically — both apps subscribe to the same Postgres changes.

> Monorepo layout: build the console from `apps/console-portal` (`npm run pages:build:console`
> from the repo root, or `npm run pages:build` inside that app). The user portal is
> `apps/user-portal` → project `rehdigital`. Shared code lives in `packages/shared`.

> ⚠️ No live deployment yet. Test locally first, then confirm. Nothing here is deployed automatically.

## Branded links (rehdigital.com) — REQUIRED Supabase Auth config
All password/recovery/confirmation/redirect links are generated from the canonical
origin (`packages/shared/lib/siteConfig.ts` → `NEXT_PUBLIC_SITE_URL`), never from the raw browser
origin or the supabase.co URL — so every emailed link carries the **rehdigital.com**
identity and can't be redirected elsewhere (open-redirect safe).

In the Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL**: `https://rehdigital.com`
- **Redirect URLs (allow-list)** — add all:
  - `https://rehdigital.com/auth/reset`, `https://rehdigital.com/login`
  - `https://console.rehdigital.com/auth/reset`, `https://console.rehdigital.com/admin/login`
  - `http://localhost:3000/auth/reset`, `http://localhost:3000/login`, `http://localhost:3000/admin/login` (local testing)
- **Authentication → Email**: customize templates (sender name "REH Digital", from `no-reply@rehdigital.com`) and configure SMTP so links send.

Env: `NEXT_PUBLIC_SITE_URL` = `https://rehdigital.com`, `NEXT_PUBLIC_CONSOLE_URL` =
`https://console.rehdigital.com` (prod). Local `.env.local` uses `http://localhost:3000`.

## Non-secret vars (safe in `wrangler.toml [vars]` / Pages “Environment variables”)
```
NODE_VERSION                          = "20"
NEXT_PUBLIC_SUPABASE_URL              = "https://rrjpxgjxlpktifeoydrz.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  = "sb_publishable_CQ1FPl4_AHFfXwSOH_GPFw_xbgMFjuO"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME     = "DigitalReporting"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  = "DigitalReporting"
NOTION_VERSION                        = "2022-06-28"
OPENAI_BASE_URL                       = "https://gateway.ai.cloudflare.com/v1/491ec73c1ab258bd5678c1410e3e7fa1/open-ai/openai"
# NEXT_PUBLIC_SMTP_RELAY_URL          = "https://api.rehdigital.com"   # only if console sends mail
```

## Secrets (set via dashboard or `wrangler pages secret put … --project-name rehdigital-console`)
```
SUPABASE_SERVICE_ROLE_KEY      # server-only; full DB access (reads secrets/bimNotion, admin ops)
OPENAI_API_KEY                 # if console uses AI features
DIFY_API_KEY                   # if console uses the chat agent
NEXT_PUBLIC_SMTP_RELAY_SECRET  # if console sends mail via the relay
```

## No longer needed (Supabase-only console)
- `FIREBASE_SERVICE_ACCOUNT`, `NEXT_PUBLIC_FIREBASE_*` — Firebase is fully replaced.
- `NOTION_TOKEN`, `NOTION_BIM_DATABASE_ID` — now entered in the admin **API Connections** tab and stored in the Supabase `secrets` table (read server-side via the service_role key).

## Security
- The `service_role` key currently in `.env.local` was pasted in chat — **rotate it** (Supabase → Settings → API → roll service_role) and set the fresh value as the secret above.
- Notion + Supabase credentials live only in env/Supabase, never in code.

## Subdomain isolation
- Console app exposes only `/admin/*` + `/api/admin/*`; it has **no** user-portal routes. A non-admin who reaches it is bounced to a 403/login. The user portal has no `/admin` routes at all, so the console is unreachable from it.
