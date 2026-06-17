# scripts/

Repo-level tooling — not part of either app's build output.

| Item | Purpose |
|------|---------|
| `patch-openai-agents.mjs` | Root `postinstall` hook. Patches `@openai/agents-core` so its tracing provider doesn't attach a `process.on` handler under the Edge runtime (Cloudflare). |
| `clean-env.ps1` | Local helper to clear build artifacts / caches. |
| `smtp-relay/` | Standalone Express SMTP relay service (nodemailer + nginx) deployed separately; `MailService` posts to it to send branded mail. Has its own `package.json`/`.env`. |

Per-app build helpers live inside each app (e.g. `apps/*/scripts/generate-version.mjs`).
