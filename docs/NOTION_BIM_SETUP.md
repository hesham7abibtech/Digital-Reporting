# BIM Reviews Report — Notion Integration Setup

This integration fetches the **BIM Reviews Report** from a Notion database and exposes it,
together with optional manually-entered records, through a secured internal API. The data
source strategy (Notion-only / Manual-only / Hybrid) is controlled from the Admin panel.

Scope is strictly the *BIM Reviews Report* — nothing else.

---

## 1. Architecture

```
Notion DB ──┐                           ┌── GET /api/bim-reviews-report  (authed: BIM access)
            │   src/lib/notion.ts       │       └─ getUnifiedBimReviews(config)
            ├─▶ src/lib/bimSource.ts ───┤
Firestore ──┘   (map · merge · cache)   ├── GET|PUT /api/admin/bim-source   (admin)
 bimReviews                             └── GET|POST /api/admin/bim-reviews  (admin)
 settings/bimReviewsSource

Admin UI: src/components/admin/BimDataSourcePanel.tsx  (mounted on the "BIM Reviews" tab)
Auth:     src/lib/adminAuth.ts  (Firebase ID-token RS256 verification + role checks)
```

**Modes** (stored in `settings/bimReviewsSource`):
- `notion` — strictly Notion API.
- `manual` — Notion ignored; serve the Firestore `bimReviews` store.
- `hybrid` — Notion (primary) merged with manual; dedupe by `ID`, `mergeStrategy` decides the winner on collision.

`notionSyncEnabled=false` halts all Notion reads in real time (notion mode → empty; hybrid → manual-only).
Notion responses are cached in-isolate for 60s.

---

## 2. Environment variables

### Local (`app/.env.local` — gitignored)
```dotenv
# Notion Internal Integration Token (Settings → Connections → develop integrations)
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# The BIM Reviews Report database id (the 32-char id in the database URL)
NOTION_BIM_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional
NOTION_VERSION=2022-06-28
# Optional: override Notion column names if they differ from the defaults below.
# JSON: { "<BIMReview field>": "<Notion property name>" }
NOTION_BIM_PROPERTY_MAP={"Project":"Project Name","InSite Review Status":"Status"}
```

> Existing Firebase credentials (`FIREBASE_SERVICE_ACCOUNT`, `NEXT_PUBLIC_FIREBASE_API_KEY`, …)
> must already be present in `.env.local` for Firestore access to work.

### Production (Cloudflare Pages — secrets, never committed)
```bash
npx wrangler pages secret put NOTION_TOKEN --project-name rehdigital
npx wrangler pages secret put NOTION_BIM_DATABASE_ID --project-name rehdigital
# Optional:
npx wrangler pages secret put NOTION_BIM_PROPERTY_MAP --project-name rehdigital
```
`NOTION_VERSION` is a non-secret var and lives in `wrangler.toml`.

---

## 3. Notion database → BIMReview mapping

Share the integration with the database (open the DB → ••• → **Connections** → add your integration),
then name the Notion columns to match the defaults, **or** remap them via `NOTION_BIM_PROPERTY_MAP`.

| BIMReview field                | Default Notion property        | Notion type(s) read                          | Spec field         |
|--------------------------------|--------------------------------|----------------------------------------------|--------------------|
| `ID`                           | `ID`                           | rich_text / unique_id / title (→ page id)    | review_id          |
| `Project`                      | `Project`                      | title / rich_text                            | project_name       |
| `Submission Category`          | `Submission Category`          | multi_select                                 | discipline         |
| `General Comments`             | `General Comments`             | rich_text                                    | issue_description  |
| `InSite Review Status`         | `InSite Review Status`         | status / select                              | status             |
| `Design Stage`                 | `Design Stage`                 | select                                       | priority           |
| `InSite Reviewer`              | `InSite Reviewer`              | people / multi_select                        | reviewer           |
| `Precinct`                     | `Precinct`                     | multi_select                                 | —                  |
| `Stakeholder`                  | `Stakeholder`                  | select / rich_text                           | —                  |
| `Submitter`                    | `Submitter`                    | people / rich_text                           | —                  |
| `Milestone Submissions`        | `Milestone Submissions`        | multi_select / rich_text                     | —                  |
| `ACC Review ID`                | `ACC Review ID`                | rich_text                                    | —                  |
| `InSite Review Due Date`       | `InSite Review Due Date`       | date                                         | —                  |
| `InSite Review Output ACC URL` | `InSite Review Output ACC URL` | url                                          | —                  |
| `createdAt` / `updatedAt`      | (page metadata)                | `created_time` / `last_edited_time`          | created_at/updated_at |

Only these properties are read — no other Notion data is pulled (no data leakage).

---

## 4. API

| Method & path                     | Auth                | Purpose                                              |
|-----------------------------------|---------------------|------------------------------------------------------|
| `GET /api/bim-reviews-report`     | BIM access / admin  | Unified dataset for the active mode (`BIMReview[]`)  |
| `GET /api/admin/bim-source`       | admin               | Current config + live Notion connection status       |
| `PUT /api/admin/bim-source`       | admin               | Update `mode` / `notionSyncEnabled` / `mergeStrategy`|
| `GET /api/admin/bim-reviews`      | admin               | List manual entries                                  |
| `POST /api/admin/bim-reviews`     | admin               | Create or override (by `ID`) a manual entry          |

All requests require `Authorization: Bearer <Firebase ID token>`. The token is verified
cryptographically (RS256 against Google's JWKs, with `iss`/`aud`/`exp` checks) before any role check.

### Examples
```bash
# Unified report
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/bim-reviews-report

# Switch to hybrid mode
curl -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"mode":"hybrid","mergeStrategy":"manual_override"}' \
  http://localhost:3000/api/admin/bim-source

# Add a manual entry
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"Project":"Tower A","InSite Review Status":"Open","InSite Reviewer":["J. Doe"]}' \
  http://localhost:3000/api/admin/bim-reviews
```

---

## 5. Verification checklist
1. Put real `NOTION_TOKEN` + `NOTION_BIM_DATABASE_ID` in `app/.env.local`; share the integration with the DB.
2. `npm run dev`; log in as an admin; copy the Firebase ID token.
3. `GET /api/bim-reviews-report` → records in `BIMReview` shape.
4. Flip modes via `PUT /api/admin/bim-source`; confirm output changes; set `notionSyncEnabled:false` and confirm Notion reads stop.
5. `POST` a manual entry whose `ID` matches a Notion `ID`; in hybrid confirm it overrides (no duplicate `ID`).
6. Admin → **BIM Reviews** tab → use the Data Source Control panel; confirm changes persist.
