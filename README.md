# REH Digital — Digital Reporting Platform (monorepo)

Two separate Next.js applications that **share one Supabase backend** (project
`rrjpxgjxlpktifeoydrz`) and stay in **realtime sync** (both subscribe to the same
Postgres changes). All shared code lives in one package so there is a single source
of truth for the data layer, auth, services and cross-portal UI.

```
.
├─ apps/
│  ├─ user-portal/      →  rehdigital.com            (public site, login, user dashboard)
│  └─ console-portal/   →  console.rehdigital.com    (admin console — /admin/*, /api/admin/*)
├─ packages/
│  └─ shared/  (@reh/shared)  →  lib/ · services/ · hooks/ · context/ · components/shared/
├─ supabase/migrations/        →  database schema (shared by both apps)
├─ scripts/                    →  patch-openai-agents · smtp-relay · clean-env
└─ docs/                       →  deployment & setup guides
```

### How sharing works (no import rewrites)
Each app's `tsconfig.json` maps the shared folders onto the usual `@/…` alias:

| import in code            | resolves to                         |
|---------------------------|-------------------------------------|
| `@/lib/*`, `@/services/*`, `@/hooks/*`, `@/context/*` | `packages/shared/…` |
| `@/components/shared/*`    | `packages/shared/components/shared/…` |
| `@/*` (everything else)   | the app's own `src/…`               |

So `@/lib/supabaseData` is the same file in both apps, while `@/components/admin/*`
(console-only) and `@/components/dashboard/*` (user-only) stay app-local.

### Portal isolation
The console app contains **only** `/admin/*` and `/api/admin/*` (plus the auth/chat/mail
routes it needs); its root `/` redirects straight to `/admin/login`. The user portal has
**no** `/admin` routes at all, so the console is unreachable from it.

## Local development
```bash
npm install                 # once, at the repo root (npm workspaces)
npm run dev:user            # user portal   → http://localhost:3000
npm run dev:console         # admin console → http://localhost:3001
```
Each app reads its own `apps/<app>/.env.local` (gitignored). Public vars are pre-filled;
paste your secrets (`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `DIFY_API_KEY`) there.

## Build
```bash
npm run build:user
npm run build:console
# Cloudflare Pages output:
npm run pages:build:user      # → apps/user-portal/.vercel/output
npm run pages:build:console   # → apps/console-portal/.vercel/output
```

Deployment & required Supabase Auth URL configuration: see [`docs/CONSOLE_DEPLOYMENT.md`](docs/CONSOLE_DEPLOYMENT.md).
