# Skilly — Architecture

## Role System

Four roles with strictly separated permissions:

| Role | Scope | Key capabilities |
|---|---|---|
| `super_admin` | Platform-wide | Manage companies/tenants, all users, all data |
| `trainer` | Per company | Create courses & lessons, monitor progress, issue certificates, choose Star of Week/Month, manage Best Outfit |
| `manager` | Per company | Comment on employees, view sales & outfit sections; cannot access Training Hub |
| `employee` | Per company | Complete lessons, submit sales, outfit, suggestions; earn XP and badges |

Roles are stored in the `users` table and enforced at three layers:
1. **Edge (proxy.ts)** — unauthenticated requests to dashboard routes are redirected to `/login` before any page renders
2. **Server component (`requireRole()` in `src/lib/auth.ts`)** — each layout calls `requireRole(["trainer"])` etc. before rendering
3. **Database (RLS)** — every table has policies using `auth_role()` and `auth_company()` Postgres helper functions

## Auth Flow

1. **Super Admin creates company**: fills company name + logo → `generateInviteCode` creates company row and 8-char invite code for a trainer
2. **Trainer signs up**: visits `/signup`, enters invite code → `redeemInviteCode` validates code, creates Supabase Auth user, inserts `users` row with `role=trainer` and `company_id`, marks code used. Supabase sends email confirmation.
3. **Email confirmation**: user clicks link → `/auth/callback` exchanges code for session, redirects to dashboard
4. **Trainer creates more codes**: issues `manager` and `employee` invite codes scoped to their company
5. **Login**: `loginAction` calls `supabase.auth.signInWithPassword`, redirects to role-based dashboard path
6. **Route protection**: `src/proxy.ts` (Next.js 16 proxy) refreshes the session cookie on every request and redirects unauthenticated access

Password resets go through Supabase email → `/auth/callback?type=recovery` → `/reset-password`.

## Database Schema

| Table | Purpose |
|---|---|
| `companies` | Tenant records — name, logo_url |
| `users` | User profiles — extends Supabase Auth; stores role, company_id, points, avatar_url |
| `invite_codes` | One-time codes — role, company_id, expires_at, used_at |
| `courses` | Training courses per company |
| `lessons` | Ordered lessons within a course |
| `lesson_progress` | Per-user lesson state (started, completed, time) |
| `quizzes` | Quiz questions per lesson |
| `quiz_attempts` | Per-user quiz answers and scores |
| `certificates` | Auto-generated on course completion — shareable token |
| `outfit_submissions` | Weekly photo submissions per employee |
| `sales_entries` | Daily sales numbers per employee |
| `stars` | Star of the Week / Star of the Month awards |
| `chat_messages` | Company-scoped chat messages |
| `notifications` | In-app alerts (lesson opened/completed → trainer) |
| `suggestions` | Employee platform suggestions |
| `badges` | Global badge definitions (slug, icon, xp_reward) |
| `user_badges` | Many-to-many: which employee earned which badge |
| `xp_events` | Append-only log of every XP award |
| `audit_logs` | Append-only audit trail (authenticated users only) |

## RLS Approach

All tables have Row Level Security enabled. Policies use two Postgres helper functions:

```sql
-- Returns the role of the currently authenticated user
auth_role() → text

-- Returns the company_id of the currently authenticated user
auth_company() → uuid
```

Example patterns:
- **Company isolation**: `WHERE company_id = auth_company()`
- **Role gate**: `WHERE auth_role() = 'trainer'`
- **Own data only**: `WHERE user_id = auth.uid()`

The **Supabase service role key** is only used server-side in `src/lib/supabase/admin.ts`. It bypasses RLS and is required for privileged operations (creating auth users, awarding badges). It is never sent to the client — Next.js server actions and route handlers are the only callers.

## Folder Structure

```
src/
├── app/
│   ├── (auth)/              # Public auth pages: login, signup, forgot-password, reset-password
│   ├── (dashboard)/
│   │   ├── super-admin/     # Super admin layout + pages
│   │   ├── trainer/         # Trainer layout + pages
│   │   ├── manager/         # Manager layout + pages
│   │   └── employee/        # Employee layout + pages
│   ├── api/                 # Route handlers (export, etc.)
│   ├── auth/callback/       # Supabase auth callback (email confirm + password reset)
│   ├── c/[token]/           # Public shareable certificate viewer
│   └── layout.tsx           # Root layout (ThemeProvider, font, Sentry)
├── components/
│   ├── admin/               # Super admin components
│   ├── chat/                # Chat room (Realtime)
│   ├── gamification/        # Badge grid, level badge
│   ├── invite/              # Generate invite form
│   ├── layout/              # Sidebar, Header, NotificationBell
│   ├── leaderboard/         # Realtime leaderboard
│   ├── outfit/              # Outfit submission + winner picker
│   ├── profile/             # Profile page content + edit form
│   ├── sales/               # Sales entry form
│   ├── stars/               # Star picker + card
│   ├── training/            # Lesson viewer, publish toggle
│   └── ui/                  # Shared primitives (ThemeToggle, buttons, etc.)
├── lib/
│   ├── actions/             # Server actions (auth, invite, xp, profile, company, report)
│   ├── supabase/
│   │   ├── server.ts        # SSR client (uses next/headers cookies)
│   │   ├── client.ts        # Browser client
│   │   └── admin.ts         # Service-role client — server-only
│   ├── auth.ts              # getUser, requireRole, dashboardPath
│   ├── audit.ts             # logAudit helper
│   ├── gamification.ts      # XP rewards, level definitions, getLevelInfo
│   └── image.ts             # WebP compression utility
├── proxy.ts                 # Next.js 16 proxy (route protection, session refresh)
└── types/
    └── database.ts          # TypeScript types for all DB tables
```
