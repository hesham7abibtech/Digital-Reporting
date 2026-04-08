# Ras El Hekma — Digital Reporting Command Center

> **Project:** 24-7895-REH-PROJECT-MODON/INSITE  
> **Company:** Insite (part of KEO)  
> **Role:** Digital Reporting Consultant  
> **Purpose:** Premium Teams-embeddable project command center dashboard

---

## Executive Summary

Build an enterprise-grade, ultra-premium dark-mode dashboard web application that serves as the smart entry point for the Ras El Hekma project's Microsoft Teams channel. The dashboard will provide instant project visibility — KPIs, tasks, team activity, health metrics, charts, notifications, and full admin capabilities — wrapped in a futuristic, glassmorphic, animated UI.

---

## Phased Delivery Approach

> [!IMPORTANT]
> This is a very large project. I propose building it in **3 phases** to deliver a working, impressive product quickly and iterate from there.

### Phase 1 — Core Dashboard (This Session)
- Project scaffolding (Next.js 14 + TypeScript + Tailwind + shadcn/ui)
- Design system (colors, typography, glassmorphism, animations)
- Animated particle background + premium header
- KPI cards with animated counters and mini-charts
- Active tasks table with filters/search/sort
- Charts & reporting section (Recharts)
- Project health section
- Recently completed timeline
- Team activity feed
- Notification panel
- Collapsible sidebar navigation
- Responsive layout (desktop + mobile)
- Full dummy data layer
- Dark mode only

### Phase 2 — Admin Portal & Backend (Cloudflare + Firebase)
- Firebase Firestore database (collections/subcollections)
- Cloudflare Workers API endpoints (server-side logic)
- Firebase Auth with Microsoft Azure AD provider
- Firebase Storage for file attachments
- Firestore real-time listeners for live dashboard updates
- Admin portal UI (task/user/department management)
- Role-based access control (Firebase Security Rules + Worker validation)
- Export to Excel/PDF
- Global search
- Dashboard personalization & saved filters

### Phase 3 — Teams & Microsoft Integration
- TeamsJS SDK integration
- Microsoft Graph API (calendar, files, messages)
- SharePoint document sync
- Outlook calendar sync
- Firebase Cloud Messaging (push notifications)
- Multi-language (EN/AR) + RTL
- PWA support
- Auto-refresh via Firestore real-time listeners

---

## User Review Required

> [!WARNING]
> **Azure AD App Registration:** Phase 2/3 requires an Azure AD app registered in Microsoft Entra ID to enable Microsoft 365 login via Firebase Auth. Do you already have one, or should I plan for a development mock?

> [!IMPORTANT]
> **Phase 1 Priority:** I recommend we build Phase 1 first with rich dummy data so you can immediately see and demo the premium dashboard experience. Backend + Microsoft integrations can follow. **Do you approve this approach?**

---

## Proposed Changes — Phase 1

### Technology Stack

| Category | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui (New York style) |
| Icons | Lucide React |
| Charts | Recharts |
| Animations | Framer Motion |
| Particles | tsparticles |
| Font | Inter (Google Fonts) |
| Package Manager | npm |

---

### Folder Structure

```
Digital_Reporting/
├── app/
│   ├── layout.tsx              # Root layout (fonts, theme, providers)
│   ├── page.tsx                # Main dashboard page
│   ├── globals.css             # Global styles + design tokens
│   ├── admin/
│   │   └── page.tsx            # Admin portal (Phase 2)
│   └── login/
│       └── page.tsx            # Auth login page (Phase 2)
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/
│   │   ├── Sidebar.tsx         # Collapsible sidebar navigation
│   │   ├── Header.tsx          # Top header bar
│   │   └── ParticleBackground.tsx  # Animated particle background
│   ├── dashboard/
│   │   ├── ProjectHeader.tsx   # Hero section with project info
│   │   ├── KPICards.tsx        # Animated KPI card grid
│   │   ├── KPICard.tsx         # Individual KPI card component
│   │   ├── ActiveTasks.tsx     # Tasks table with filters
│   │   ├── TaskCard.tsx        # Individual task card/row
│   │   ├── RecentActivity.tsx  # Recently completed timeline
│   │   ├── TeamFeed.tsx        # Team activity feed
│   │   ├── ChartsSection.tsx   # Charts & reporting area
│   │   ├── ProjectHealth.tsx   # Project health section
│   │   └── NotificationPanel.tsx # Smart notifications
│   └── shared/
│       ├── AnimatedCounter.tsx # Counting animation component
│       ├── GlassCard.tsx       # Reusable glassmorphism card
│       ├── StatusBadge.tsx     # Color-coded status badges
│       ├── PriorityBadge.tsx   # Priority indicators
│       ├── ProgressRing.tsx    # Circular progress component
│       └── MiniChart.tsx       # Small sparkline charts
├── lib/
│   ├── data.ts                # Dummy data for Phase 1
│   ├── utils.ts               # Utility functions (shadcn)
│   ├── types.ts               # TypeScript type definitions
│   ├── firebase/              # Firebase service layer (Phase 2)
│   │   ├── config.ts          # Firebase app initialization
│   │   ├── auth.ts            # Firebase Auth + Azure AD provider
│   │   ├── firestore.ts       # Firestore client helpers
│   │   ├── storage.ts         # Firebase Storage helpers
│   │   └── messaging.ts       # FCM push notification helpers
│   ├── services/              # Modular service architecture (Phase 2)
│   │   ├── tasks.service.ts   # Task CRUD + real-time listeners
│   │   ├── users.service.ts   # User management
│   │   ├── activity.service.ts # Activity feed service
│   │   ├── notifications.service.ts # Notifications service
│   │   ├── health.service.ts  # Project health calculations
│   │   ├── kpi.service.ts     # KPI aggregation
│   │   └── graph.service.ts   # Microsoft Graph API service (Phase 3)
│   └── hooks/                 # React hooks (Phase 2)
│       ├── useFirestoreCollection.ts  # Real-time collection listener
│       ├── useFirestoreDoc.ts  # Real-time document listener
│       ├── useAuth.ts         # Auth state hook
│       └── useRole.ts         # Role-based permission hook
├── workers/                   # Cloudflare Workers (Phase 2)
│   ├── api/
│   │   ├── tasks.ts           # Task endpoints with role validation
│   │   ├── users.ts           # User management endpoints
│   │   ├── reports.ts         # Export/report generation
│   │   ├── graph-proxy.ts     # MS Graph API proxy (Phase 3)
│   │   └── middleware/
│   │       ├── auth.ts        # Firebase token verification
│   │       └── rbac.ts        # Server-side role validation
│   └── wrangler.toml          # Cloudflare Worker configuration
├── firestore.rules            # Firebase Security Rules (Phase 2)
├── firebase.json              # Firebase project config (Phase 2)
├── hooks/
│   └── useAnimatedCounter.ts  # Counter animation hook
├── public/
│   └── ...                    # Static assets
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── components.json             # shadcn/ui config
```

---

### Design System

#### Color Palette (CSS Variables)

```
--background:       #0a0a0f    (Deep black)
--card:             #12121a    (Charcoal)
--card-hover:       #1a1a2e    (Lighter charcoal)
--border:           #ffffff08  (Subtle white border)
--border-glow:      #3b82f620  (Blue glow border)

--primary:          #3b82f6    (Soft blue)
--primary-glow:     #3b82f640  (Blue glow)
--accent-cyan:      #06b6d4    (Cyan highlight)
--accent-purple:    #8b5cf6    (Purple gradient)
--accent-emerald:   #10b981    (Success green)
--accent-amber:     #f59e0b    (Warning amber)
--accent-red:       #ef4444    (Critical red)

--text-primary:     #f8fafc    (White text)
--text-secondary:   #94a3b8    (Silver text)
--text-muted:       #64748b    (Muted text)
```

#### Typography
- **Font:** Inter (400, 500, 600, 700)
- **Headings:** Semi-bold to Bold, tracking-tight
- **Body:** Regular weight, relaxed line-height
- **Mono:** JetBrains Mono for data/numbers

#### Glassmorphism
```css
.glass-card {
  background: rgba(18, 18, 26, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

#### Animation System
- **Page entrance:** Staggered fade-in with y-offset (Framer Motion)
- **Counters:** Animated counting from 0 to value
- **Cards:** Hover scale + glow border + shadow lift
- **Charts:** Smooth draw-in animations
- **Background:** Floating particles + gradient mesh
- **Transitions:** 300ms ease-out default

---

### Component Breakdown

#### 1. ParticleBackground
- tsparticles canvas behind all content
- Floating dots with connecting lines
- Gradient mesh overlay (blue → purple → transparent)
- Very subtle, not distracting

#### 2. Sidebar
- Collapsible (icon-only ↔ full)
- Navigation items: Dashboard, Tasks, Team, Reports, Health, Notifications, Admin
- Active indicator with glow
- Logo + project code at top
- User avatar at bottom

#### 3. ProjectHeader (Hero)
- Project name: "Ras El Hekma"
- Project code: 24-7895-REH-PROJECT-MODON/INSITE
- Company: Insite (KEO)
- Live date/time clock
- Welcome message
- Animated progress ring (72% overall)
- Health badge (On Track / At Risk / Critical)
- Mini stat pills: Active Members, Open Tasks, Closed Tasks, Delayed, High Priority

#### 4. KPI Cards (10 cards)
- Grid layout (5 per row desktop, 2 per row mobile)
- Each card: icon + label + value + trend arrow + mini sparkline
- Animated counter on scroll
- Hover: scale(1.02) + blue glow border
- Color-coded left accent bar

#### 5. ActiveTasks
- Modern table/grid hybrid
- Filter bar: Department, Priority, Status, Date range
- Search input
- Sort by any column
- Paginated or virtualized
- Each row: task title, assignee avatar, department, priority badge, status badge, due date, progress bar, attachments count

#### 6. RecentActivity Timeline
- Vertical timeline with animated staggered entrance
- Icons per type: ✅ completed, 📁 file upload, ✔️ approval, 🔒 issue closed, 📅 meeting, 💬 comment
- User avatar + name + action + timestamp
- Glass card style

#### 7. TeamFeed
- Social-style activity stream
- Avatar + name + "completed Task X" / "uploaded File Y"
- Relative timestamps
- Subtle separator lines
- Infinite scroll style

#### 8. ChartsSection
- 2×2 or 2×4 chart grid
- Tasks by Department (bar chart)
- Tasks by Status (donut chart)
- Weekly Completion Trend (area chart)
- Team Workload (horizontal bar)
- Delayed Trend (line chart)
- Documents/week (bar)
- Meetings/week (bar)
- All with Recharts + custom premium theme

#### 9. ProjectHealth
- 6 circular progress gauges
- Overall, Schedule, Cost, Resource, Documentation, Communication
- Color-coded: green (>75%), amber (50-75%), red (<50%)
- Traffic light indicator
- Summary text under each

#### 10. NotificationPanel
- Slide-in panel or dedicated section
- Grouped by severity: Critical, Warning, Info
- Filter tabs
- Each notification: icon + title + description + time
- Unread indicator dot
- Mark as read

---

## Hosting Architecture (Phase 2+)

### Cloudflare Pages — Frontend Hosting
- Next.js 14 static export deployed to Cloudflare Pages
- Global CDN edge distribution for ultra-fast loading
- Automatic HTTPS (required for Teams tab embedding)
- Custom domain support (e.g., `reh-dashboard.insite.com`)
- Preview deployments per branch for staging/review
- Build command: `next build` → static output to `out/`

### Cloudflare Workers — Edge API Layer
- Serverless edge functions for server-side logic
- Sub-millisecond cold starts at 300+ global edge locations
- Handles: token verification, role validation, report generation, MS Graph proxying
- Accessed via `api.reh-dashboard.insite.com` or `/api/*` route prefix
- Worker bindings: KV (cache), R2 (optional large file storage), environment secrets

### Deployment Flow
```
Developer pushes to GitHub
       ↓
Cloudflare Pages auto-builds Next.js static export
       ↓
Deployed to global CDN edge (preview or production)
       ↓
Workers deployed via `wrangler deploy`
       ↓
Firebase rules deployed via `firebase deploy --only firestore:rules,storage`
```

---

## Backend Architecture (Phase 2+)

### Service Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Cloudflare Pages                    │
│              (Next.js Static Frontend)               │
├─────────────────────────────────────────────────────┤
│                                                      │
│   ┌──────────────┐    ┌──────────────────────────┐  │
│   │ Firebase SDK  │    │ Cloudflare Workers (API) │  │
│   │ (Client-side) │    │ (Server-side logic)      │  │
│   └──────┬───────┘    └──────────┬───────────────┘  │
│          │                       │                    │
│   ┌──────▼───────┐    ┌─────────▼────────────────┐  │
│   │  Firestore    │    │  Firebase Admin SDK       │  │
│   │  (Real-time)  │    │  (Server-side in Worker)  │  │
│   └──────┬───────┘    └─────────┬────────────────┘  │
│          │                       │                    │
│   ┌──────▼───────────────────────▼───────────────┐  │
│   │           Firebase Firestore (Database)       │  │
│   │           Firebase Storage (Files)            │  │
│   │           Firebase Auth (Identity)            │  │
│   └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Client-Side (Firebase SDK — Direct Access)
- **Real-time reads:** Firestore `onSnapshot` listeners for live dashboard updates
- **Optimistic UI:** Immediate UI updates on write, rollback on failure
- **Auth state:** `onAuthStateChanged` listener for session management
- **File uploads:** Direct to Firebase Storage with progress tracking

### Server-Side (Cloudflare Workers — Secure Operations)
- **Token verification:** Validate Firebase ID tokens on every API request
- **Role enforcement:** Server-side role check before any privileged operation
- **Data aggregation:** KPI calculations, report generation, complex queries
- **MS Graph proxy:** Securely proxy Microsoft Graph API calls (keeps client secrets server-side)
- **Export generation:** Excel/PDF report generation at the edge
- **Audit logging:** Server-side activity logging for compliance

---

## Database Architecture — Firestore (Phase 2+)

### Collections & Subcollections Structure

```
firestore/
├── projects/
│   └── {projectId}/                    # "ras-el-hekma"
│       ├── name: "Ras El Hekma"
│       ├── code: "24-7895-REH-PROJECT-MODON/INSITE"
│       ├── company: "Insite (KEO)"
│       ├── healthScores: { overall, schedule, cost, resource, docs, comms }
│       ├── createdAt, updatedAt
│       │
│       ├── tasks/                      # Subcollection
│       │   └── {taskId}/
│       │       ├── title, description
│       │       ├── assigneeId, assigneeName, assigneeAvatar
│       │       ├── department
│       │       ├── priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
│       │       ├── status: "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "COMPLETED" | "DELAYED" | "BLOCKED"
│       │       ├── dueDate (Timestamp)
│       │       ├── completion: 0-100
│       │       ├── attachments: number
│       │       ├── tags: string[]
│       │       ├── relatedMeeting, relatedDocument
│       │       ├── isFavorite: boolean
│       │       ├── createdAt, updatedAt
│       │       │
│       │       └── comments/           # Sub-subcollection
│       │           └── {commentId}/
│       │               ├── userId, userName
│       │               ├── text
│       │               ├── createdAt
│       │
│       ├── activities/                 # Subcollection
│       │   └── {activityId}/
│       │       ├── userId, userName, userAvatar
│       │       ├── type: "task_completed" | "file_uploaded" | "approval" | "comment" | "status_change" | "meeting"
│       │       ├── title, description
│       │       ├── metadata: { taskId?, fileUrl?, etc. }
│       │       ├── createdAt
│       │
│       ├── notifications/              # Subcollection
│       │   └── {notificationId}/
│       │       ├── title, description
│       │       ├── severity: "CRITICAL" | "WARNING" | "INFO"
│       │       ├── read: boolean
│       │       ├── targetUserId (or null for broadcast)
│       │       ├── link
│       │       ├── createdAt
│       │
│       ├── meetings/                   # Subcollection
│       │   └── {meetingId}/
│       │       ├── title, description
│       │       ├── date, startTime, endTime
│       │       ├── attendees: string[]
│       │       ├── location
│       │       ├── status, notes
│       │       ├── createdAt
│       │
│       ├── documents/                  # Subcollection
│       │   └── {documentId}/
│       │       ├── name, description
│       │       ├── fileUrl (Firebase Storage path)
│       │       ├── uploadedBy, uploadedByName
│       │       ├── department
│       │       ├── version
│       │       ├── size, mimeType
│       │       ├── createdAt
│       │
│       └── kpiSnapshots/               # Subcollection (daily snapshots)
│           └── {date}/                 # e.g., "2026-04-06"
│               ├── activeTasks, completedThisWeek
│               ├── pendingApprovals, criticalIssues
│               ├── rfiCount, ncrCount
│               ├── meetingsThisWeek, documentsUploaded
│               ├── openActions, delayedDeliverables
│               ├── createdAt
│
├── users/
│   └── {userId}/                       # Firebase Auth UID
│       ├── email, name, avatar
│       ├── role: "SUPER_ADMIN" | "ADMIN" | "PROJECT_MANAGER" | "DEPARTMENT_HEAD" | "VIEWER"
│       ├── department
│       ├── projectIds: string[]
│       ├── preferences: { language, savedFilters, favorites }
│       ├── lastActive (Timestamp)
│       ├── createdAt
│
├── departments/
│   └── {departmentId}/
│       ├── name
│       ├── color (for UI)
│       ├── headUserId
│       ├── memberCount
│
└── config/
    └── app/
        ├── features: { rtl, pwa, autoRefreshInterval }
        ├── departments: string[]
        ├── priorities: string[]
        ├── statuses: string[]
```

### Firestore Design Decisions
- **Subcollections under project** — All project data scoped under a single project document for clean security rules and easy multi-project scaling
- **Denormalized user data** — `assigneeName`, `userAvatar` stored on tasks/activities to avoid extra reads (updated via Firestore triggers when user profile changes)
- **KPI snapshots** — Daily aggregated snapshots for fast chart rendering without live aggregation queries
- **Composite indexes** — Created on tasks for: `[department, status]`, `[priority, status]`, `[assigneeId, status]`, `[status, dueDate]`

---

## Authentication Flow (Phase 2+)

```
User visits dashboard
       ↓
Firebase Auth check (onAuthStateChanged)
       ↓
Not authenticated → Redirect to login page
       ↓
Login page: "Sign in with Microsoft 365"
       ↓
Firebase Auth → OAuthProvider("microsoft.com")
  - tenant: configured Azure AD tenant ID
  - scopes: User.Read, Calendars.Read, Files.Read, etc.
       ↓
Azure AD consent + redirect
       ↓
Firebase creates/updates user session
       ↓
Client gets Firebase ID Token + MS access token
       ↓
On first login → Cloudflare Worker creates user doc in /users/{uid}
  with default role VIEWER
       ↓
Dashboard loads → Firestore reads protected by Security Rules
       ↓
For API calls → ID token sent in Authorization header to Worker
       ↓
Worker verifies token → checks role in /users/{uid} → processes request
```

### Azure AD Configuration
- Register app in Microsoft Entra ID (Azure AD)
- Configure redirect URI: `https://<project>.firebaseapp.com/__/auth/handler`
- Enable ID tokens + access tokens
- Add API permissions: `User.Read`, `Calendars.Read`, `Files.Read.All`
- Configure Firebase Auth → Microsoft provider with client ID + secret

---

## Real-Time Synchronization Flow (Phase 2+)

```
┌──────────────────────────────────────────────────────┐
│                  Client Browser                       │
│                                                       │
│  useFirestoreCollection('projects/reh/tasks')  ──────┤──► onSnapshot listener
│  useFirestoreCollection('projects/reh/activities') ──┤──► onSnapshot listener
│  useFirestoreDoc('projects/reh')  ───────────────────┤──► onSnapshot listener
│                                                       │
│  On data change → React state updates instantly       │
│  Optimistic UI → Write to Firestore, update local     │
│  state immediately, rollback on error                 │
└──────────────────────────────────────────────────────┘
         ↕ Firestore real-time stream (WebSocket)
┌──────────────────────────────────────────────────────┐
│               Firebase Firestore                      │
│  - Pushes document changes instantly                  │
│  - Multiple clients see updates simultaneously        │
│  - Offline persistence for mobile/slow connections    │
└──────────────────────────────────────────────────────┘
```

### Real-Time Hooks (Custom)
```typescript
// useFirestoreCollection — subscribes to live collection
const tasks = useFirestoreCollection<Task>('projects/reh/tasks', {
  where: [['status', '!=', 'COMPLETED']],
  orderBy: ['updatedAt', 'desc'],
  limit: 50
});

// useFirestoreDoc — subscribes to live document
const project = useFirestoreDoc<Project>('projects/reh');
```

### Offline Support
- Firestore offline persistence enabled
- Cached data serves immediately on reload
- Sync queue processes when back online
- Ideal for Teams tab (may have intermittent connectivity)

---

## File Upload/Storage Flow (Phase 2+)

```
User selects file in Admin Portal
       ↓
Client-side validation (type, size ≤ 50MB)
       ↓
Firebase Storage upload to:
  gs://project-bucket/projects/reh/documents/{department}/{filename}
       ↓
Upload progress tracked with onUploadProgress
       ↓
On success → get download URL
       ↓
Create Firestore document in /projects/reh/documents/{id}
  with fileUrl, metadata, uploadedBy
       ↓
Activity entry created in /projects/reh/activities/{id}
       ↓
Real-time listeners update all connected dashboards
```

### Storage Structure
```
gs://reh-dashboard.appspot.com/
├── projects/
│   └── ras-el-hekma/
│       ├── documents/
│       │   ├── architecture/
│       │   ├── mep/
│       │   ├── structural/
│       │   └── ...
│       ├── avatars/
│       │   └── {userId}.jpg
│       └── exports/
│           └── {reportId}.xlsx
```

### Firebase Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/firestore/documents/users/$(request.auth.uid)).data.role
           in ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'DEPARTMENT_HEAD'];
    }
  }
}
```

---

## Role-Based Permissions Flow (Phase 2+)

### Two-Layer Security Model

#### Layer 1: Firebase Security Rules (Client-Side Enforcement)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return getUserRole() in ['SUPER_ADMIN', 'ADMIN'];
    }

    function isManager() {
      return getUserRole() in ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'];
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || request.auth.uid == userId;
    }

    // Project data
    match /projects/{projectId} {
      allow read: if isAuthenticated();
      allow write: if isManager();

      // Tasks
      match /tasks/{taskId} {
        allow read: if isAuthenticated();
        allow create: if isManager();
        allow update: if isManager()
          || (isAuthenticated() && resource.data.assigneeId == request.auth.uid);
        allow delete: if isAdmin();
      }

      // Activities (read-only for clients, written by Workers)
      match /activities/{activityId} {
        allow read: if isAuthenticated();
        allow write: if false; // Only via Admin SDK in Workers
      }

      // Notifications
      match /notifications/{notificationId} {
        allow read: if isAuthenticated();
        allow update: if isAuthenticated()
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
        allow create, delete: if isAdmin();
      }
    }
  }
}
```

#### Layer 2: Cloudflare Worker Validation (Server-Side Enforcement)
```typescript
// middleware/rbac.ts
async function validateRole(request: Request, requiredRoles: Role[]): Promise<UserRecord> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const decoded = await firebaseAdmin.auth().verifyIdToken(token);
  const userDoc = await firestore.doc(`users/${decoded.uid}`).get();
  const userRole = userDoc.data()?.role;

  if (!requiredRoles.includes(userRole)) {
    throw new ForbiddenError('Insufficient permissions');
  }

  return { uid: decoded.uid, role: userRole, ...userDoc.data() };
}
```

### Permission Matrix

| Action | Super Admin | Admin | Project Manager | Dept Head | Viewer |
|---|---|---|---|---|---|
| View dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create tasks | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit any task | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit own task | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload files | ✅ | ✅ | ✅ | ✅ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| Admin portal | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configure app | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Environment Variables Structure (Phase 2+)

### Cloudflare Pages Environment Variables
```env
# Firebase Client Config (public — embedded in frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=reh-dashboard.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=reh-dashboard
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=reh-dashboard.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Azure AD Config (public — for login flow)
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id
```

### Cloudflare Worker Secrets (wrangler)
```toml
# wrangler.toml
[vars]
FIREBASE_PROJECT_ID = "reh-dashboard"

# Secrets (set via `wrangler secret put`)
# FIREBASE_SERVICE_ACCOUNT_KEY — JSON service account for Admin SDK
# AZURE_AD_CLIENT_SECRET — for Graph API server-side calls
# GRAPH_API_TENANT_ID — Microsoft Graph tenant
```

### Firebase Config Variables
```
# Set via Firebase Console or CLI
# Firebase Auth → Microsoft provider → Client ID + Secret
# Firestore rules + indexes deployed via firebase.json
# Storage rules deployed via firebase.json
```

---

## API/Service Architecture (Phase 2+)

### Client-Side Services (Firebase SDK Direct)

| Service | Operations | Method |
|---|---|---|
| `tasks.service.ts` | List, get, create, update, delete tasks | Firestore SDK (real-time) |
| `activity.service.ts` | Subscribe to activity feed | Firestore `onSnapshot` |
| `notifications.service.ts` | Subscribe + mark as read | Firestore SDK |
| `kpi.service.ts` | Subscribe to KPI snapshots | Firestore `onSnapshot` |
| `health.service.ts` | Subscribe to health scores | Firestore `onSnapshot` |
| `auth.service.ts` | Login, logout, session | Firebase Auth SDK |
| `storage.service.ts` | Upload, download, delete files | Firebase Storage SDK |

### Cloudflare Worker Endpoints (Server-Side)

| Endpoint | Method | Purpose | Required Role |
|---|---|---|---|
| `POST /api/tasks` | POST | Create task with validation + activity log | PROJECT_MANAGER+ |
| `PUT /api/tasks/:id` | PUT | Update task with audit trail | Assignee or MANAGER+ |
| `DELETE /api/tasks/:id` | DELETE | Soft-delete task | ADMIN+ |
| `POST /api/users` | POST | Create/invite user | ADMIN+ |
| `PUT /api/users/:id/role` | PUT | Change user role | SUPER_ADMIN |
| `GET /api/reports/export` | GET | Generate Excel/PDF | DEPT_HEAD+ |
| `GET /api/kpi/refresh` | GET | Force KPI snapshot recalculation | ADMIN+ |
| `GET /api/graph/calendar` | GET | Proxy MS Graph calendar | Authenticated |
| `GET /api/graph/files` | GET | Proxy MS Graph SharePoint files | Authenticated |
| `GET /api/graph/messages` | GET | Proxy MS Graph Teams messages | Authenticated |
| `POST /api/notifications/send` | POST | Send FCM push notification | ADMIN+ |

### Why Both Client SDK + Workers?
- **Client SDK** for **real-time reads** (instant dashboard updates, no API roundtrip)
- **Workers** for **privileged writes** (role validation, audit logging, complex business logic)
- **Workers** for **secrets** (MS Graph client secret, service account — never exposed to browser)
- **Workers** for **compute** (report generation, KPI aggregation, data export)

---

## Security Architecture (Phase 2+)

### Defense in Depth

| Layer | Protection | Technology |
|---|---|---|
| **Edge** | DDoS, rate limiting, WAF | Cloudflare (automatic) |
| **Transport** | HTTPS/TLS | Cloudflare Pages (automatic) |
| **Authentication** | Identity verification | Firebase Auth + Azure AD |
| **Authorization (Client)** | Read/write rules per role | Firestore Security Rules |
| **Authorization (Server)** | Privileged operation validation | Worker middleware (rbac.ts) |
| **Data validation** | Schema enforcement | Worker middleware + Firestore rules |
| **Secrets** | API keys, service accounts | Cloudflare Worker secrets (encrypted) |
| **Audit** | Action logging | Activity collection in Firestore |
| **CORS** | Cross-origin protection | Worker CORS headers |
| **CSP** | Content security | Cloudflare Pages headers |

### Teams Tab Security
- Content served over HTTPS (Cloudflare manages certificates)
- `X-Frame-Options` set to allow Teams iframe embedding
- CSP frame-ancestors includes `*.teams.microsoft.com`
- TeamsJS SDK validates host context

---

## Scalability Recommendations

| Concern | Strategy |
|---|---|
| **Read volume** | Firestore scales automatically; real-time listeners use efficient delta sync |
| **Write volume** | Batch writes for bulk operations; distributed counters for high-frequency counters |
| **KPI queries** | Pre-aggregated snapshots (daily `kpiSnapshots` collection) instead of live aggregation |
| **Large task lists** | Firestore pagination with cursor-based `startAfter`; client-side virtualization (react-window) |
| **File storage** | Firebase Storage with CDN; large files optionally in Cloudflare R2 |
| **Edge caching** | Cloudflare Workers Cache API for infrequently-changing data (departments, config) |
| **Global latency** | Cloudflare edge (300+ PoPs) + Firestore multi-region |
| **Multi-project** | Architecture supports multiple project documents; users scoped via `projectIds` |
| **Offline resilience** | Firestore offline persistence; service worker caching for static assets |

### Firestore Read Optimization
- **Denormalize** frequently-joined data (user name/avatar on tasks)
- **Limit listeners** — only subscribe to visible sections
- **Composite indexes** for filtered queries
- **Snapshot listeners** share cache — re-querying same data is free

---

## Cost Optimization Recommendations

| Area | Strategy | Impact |
|---|---|---|
| **Firestore reads** | Use `onSnapshot` (counts as 1 read per doc on initial load, then only deltas) | 70-80% read reduction vs polling |
| **Firestore writes** | Batch writes for bulk operations | Fewer write operations |
| **KPI aggregation** | Daily snapshots instead of real-time aggregation | Eliminates expensive collection group queries |
| **Cloudflare Pages** | Free tier: unlimited sites, unlimited bandwidth | $0 hosting |
| **Cloudflare Workers** | Free tier: 100k requests/day; paid: $5/month unlimited | Near-zero API cost |
| **Firebase Auth** | Free tier: 50k MAU | $0 for typical project team size |
| **Firebase Storage** | Use Cloudflare CDN in front for cached downloads | Reduce egress |
| **Firestore pricing** | Use `select()` to fetch only needed fields | Reduce document read size |
| **Edge caching** | Cache configuration/department data at edge (5-min TTL) | Eliminate repeated Firestore reads |

### Estimated Monthly Cost (50 active users)
| Service | Estimated Cost |
|---|---|
| Cloudflare Pages | $0 (free tier) |
| Cloudflare Workers | $0–$5 |
| Firebase Auth | $0 (free tier) |
| Firestore | $0–$10 (Spark→Blaze) |
| Firebase Storage | $0–$5 |
| **Total** | **$0–$20/month** |

---

### Dummy Data

Phase 1 includes comprehensive dummy data:

- **15+ team members** with names, roles, departments, avatars
- **25+ tasks** across all statuses and priorities
- **30+ activity entries** for the feed
- **10+ notifications** at various severities
- **KPI values** with realistic trends
- **Chart data** for all 8 chart types
- **Health scores** for all 6 categories

Departments: Design, MEP, Structural, Architecture, Project Management, QA/QC, HSE, IT

---

## Open Questions

> [!IMPORTANT]
> 1. **Phase 1 First?** Should I proceed with building the full Phase 1 frontend (with dummy data) now, and defer backend/database/auth to Phase 2?

> [!IMPORTANT]
> 2. **Company Logo:** Do you have an Insite/KEO logo image to use? If not, I'll create a text-based logo placeholder.

> [!IMPORTANT]
> 3. **Azure AD:** Do you have an existing Azure AD app registration for Teams integration, or should Phase 3 use mock authentication?

---

## Verification Plan

### Phase 1 Verification

#### Automated
- `npm run build` — Clean production build with zero errors
- `npm run dev` — Dev server launches successfully
- TypeScript strict mode — No type errors

#### Visual / Browser Testing
- Dashboard renders with all sections visible
- Particle background animates smoothly
- KPI counters animate on page load
- All charts render with data
- Task filters and search work correctly
- Sidebar collapses/expands
- Notification panel opens/closes
- Hover animations fire correctly
- Mobile responsive at 375px, 768px, 1024px, 1440px
- Performance: Lighthouse score >80

#### Recording
- Browser recording of full dashboard walkthrough
- Recording of mobile responsive behavior
