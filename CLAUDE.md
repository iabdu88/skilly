# Skilly — Employee Training & Engagement Platform

## Project Overview
Skilly is a PWA SaaS platform for retail employee training and engagement.
Built with Next.js 15 (App Router) + Supabase + Vercel.
Target market: Saudi/Gulf retail companies.

## Tech Stack
- Frontend: Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- Backend: Supabase (Postgres, Auth, Storage, Realtime)
- Deployment: Vercel
- PWA: next-pwa with full offline support
- Image compression: Browser-side WebP conversion before upload (same as Vismo)

## User Roles

### Super Admin
- Full platform access
- Manage companies/tenants
- View all data across all companies

### Trainer (per company)
- Create and manage training courses + lessons
- Monitor who opened, completed, or stopped a lesson (with notifications)
- Issue completion certificates with LinkedIn share links
- Choose Best Outfit of the Week winner
- Choose Star of the Week and Star of the Month
- Leave personal notes/feedback per trainee
- Has own trainer-specific courses assigned by Super Admin
- Access to all platform sections

### Manager (per company)
- Can comment and give guidance to employees
- Cannot access training courses section
- Has own manager-specific courses (assigned by Trainer)
- Can view sales and outfit sections

### Employee (per company)
- Complete lessons and quizzes
- Play gamified learning games
- Share certificate links to LinkedIn
- Submit Best Outfit of the Week entry (photo)
- Submit daily sales numbers
- Give platform suggestions
- Participate in Star of the Week/Month competition

## Core Sections
1. **Training Hub** — courses, lessons, quizzes, progress tracking
2. **Best Outfit** — weekly competition with photo submissions
3. **Daily Sales** — employees log daily numbers, visible to trainer/manager
4. **Stars Board** — Star of the Week + Star of the Month display
5. **Chat** — company-wide chat between all employees + trainer
6. **Certificates** — auto-generated on course completion, LinkedIn shareable link
7. **Leaderboard** — gamification points and rankings

## Key Technical Requirements
- Multi-tenant: each company is fully isolated
- PWA: installable, works offline for lesson viewing
- Image uploads: compress to WebP before upload (max 800px, quality 0.85)
- Realtime: chat + notifications use Supabase Realtime
- Notifications: in-app alerts to trainer when employee opens/completes a lesson
- Certificates: generated as styled HTML → shareable URL (no PDF for now)
- RLS: Supabase Row Level Security enforced on all tables

## Database Schema (high level)
Tables: companies, users, courses, lessons, lesson_progress,
quizzes, quiz_attempts, certificates, outfit_submissions,
sales_entries, stars, chat_messages, notifications, suggestions

## Design Guidelines
- Mobile-first, PWA-optimized
- Professional and clean UI
- Arabic RTL support where needed
- Dark mode as default
- Primary: #5B21B6 (Deep Violet)
- Accent: #F59E0B (Amber Gold)
- Background: #0F0A1E (Dark Violet Black)
- Surface: #1E1535 (Card background)
- Text: #F8F7FF (Off White)
- Font: Plus Jakarta Sans

## Development Rules
- Always use TypeScript
- Always use server components where possible
- Use Supabase SSR client for server components
- Never expose service role key to client
- Use environment variables for all secrets
- Comment code clearly in English

## File Map

### Entry Points & Config
| File | Purpose |
|------|---------|
| `src/proxy.ts` | Next.js middleware (exported as `proxy`/`config`). Handles auth redirects: unauthenticated → `/login`, logged-in on auth pages → `/`. Named `proxy.ts` not `middleware.ts` — matched by next.config via next-intl plugin. |
| `src/i18n/request.ts` | next-intl locale detection: reads `locale` cookie, defaults to `"en"`. |
| `src/app/layout.tsx` | Root layout: loads Plus Jakarta Sans, sets `lang`/`dir` for RTL, wraps in `NextIntlClientProvider` + `Providers`. |
| `src/app/page.tsx` | Root `/` page: redirects to role-based dashboard using `dashboardPath()`. |
| `src/app/globals.css` | Tailwind base + shadcn CSS variables for light/dark themes (oklch). |
| `messages/en.json` | English translations for all UI strings. |
| `messages/ar.json` | Arabic translations. Nav "outfit" key = "أفضل تنسيق". |
| `next.config.ts` | Next.js config: Turbopack, next-pwa, next-intl, Sentry, `devIndicators: false`. |

### Auth
| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | `getUser()` — fetches full user row from DB (not JWT, to catch role changes). `requireRole(roles[])` — redirects if wrong role. `requireAuth()` — redirects if not logged in. `dashboardPath(role)` — returns role-specific path. |
| `src/lib/actions/auth.ts` | Server actions: `loginAction`, `logoutAction`, `signupAction`. Called from auth page forms. |
| `src/app/auth/callback/route.ts` | Supabase OAuth/email-link callback handler — exchanges code for session. |
| `src/app/(auth)/` | Auth pages: `login`, `signup`, `forgot-password`, `reset-password`. All client components. |

### Supabase Clients
| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | SSR client (uses cookies) — use in server components and server actions. |
| `src/lib/supabase/client.ts` | Browser client (singleton) — use in client components for realtime/subscriptions. |
| `src/lib/supabase/admin.ts` | Service-role client — bypasses RLS. **Server-only.** Used only in admin actions. |

### Types
| File | Purpose |
|------|---------|
| `src/types/database.ts` | All TypeScript interfaces: `User`, `Company`, `Course`, `Lesson`, `LessonProgress`, `Certificate`, `OutfitSubmission`, `SalesEntry`, `Star`, `ChatMessage`, `Notification`, `InviteCode`, `Badge`, `UserBadge`. Also exports `UserRole` union type. |

### Server Actions (`src/lib/actions/`)
| File | Purpose |
|------|---------|
| `auth.ts` | Login, logout, signup flows. |
| `invite.ts` | `generateInviteCode()` — creates company (super_admin) or invite code (trainer). |
| `profile.ts` | `updateProfile()` — saves full_name, bio, avatar (uploads WebP to Storage). |
| `xp.ts` | `awardXP()` — adds points, updates streak, checks badge thresholds, sends notification. |
| `company.ts` | Company CRUD for super-admin: archive, unarchive, delete, update logo. |
| `admin-users.ts` | User management for super-admin: change role, deactivate, reactivate. |
| `report.ts` | `fetchReportData()` — aggregates employee stats, sales, courses, stars for PDF report. |

### Layout Components
| File | Purpose |
|------|---------|
| `src/components/layout/Sidebar.tsx` | Role-aware nav sidebar with mobile drawer. Uses `useTranslations("nav")`. Nav items defined by `labelKey` + `roles[]` filter. |
| `src/components/layout/Header.tsx` | Sticky top bar: page title + `LanguageSwitcher` + `ThemeToggle` + `NotificationBell`. Server component — fetches unread notification count. |
| `src/components/layout/NotificationBell.tsx` | Client component. Realtime notification panel via Supabase `postgres_changes`. |
| `src/components/ui/language-switcher.tsx` | Globe icon + `"عربي"`/`"EN"` toggle. Sets `locale` cookie and calls `router.refresh()`. |
| `src/components/ui/ThemeToggle.tsx` | Sun/Moon toggle via `next-themes`. Uses `mounted` guard to avoid hydration mismatch. |
| `src/components/providers.tsx` | Wraps app in `ThemeProvider` (dark default, no system preference). |

### Feature Components
| File | Purpose |
|------|---------|
| `src/components/chat/ChatRoom.tsx` | Realtime chat via Supabase channel. Shows message history + live updates. |
| `src/components/outfit/OutfitUploadForm.tsx` | Employee outfit photo submission. Compresses to WebP before upload. |
| `src/components/outfit/OutfitWinnerPicker.tsx` | Trainer UI to pick winning outfit from week's submissions. |
| `src/components/invite/GenerateInviteForm.tsx` | Create invite codes (trainer) or new companies + codes (super_admin). |
| `src/components/leaderboard/LeaderboardRealtime.tsx` | Live-updating XP leaderboard via Supabase realtime. |
| `src/components/sales/SalesEntryForm.tsx` | Employee daily sales entry. Upserts by `(user_id, date)`. |
| `src/components/stars/StarCard.tsx` | Displays a Star of Week/Month award card. |
| `src/components/stars/StarPickerForm.tsx` | Trainer UI to select and award a star. |
| `src/components/training/LessonViewer.tsx` | Renders lesson content + video. Tracks open/complete via `lesson_progress`. |
| `src/components/training/PublishToggle.tsx` | Trainer toggle to publish/unpublish a course. |
| `src/components/profile/ProfileEditForm.tsx` | Avatar upload + name/bio edit form. |
| `src/components/profile/ProfilePageContent.tsx` | Full profile page: edit form + level badge + streaks + badge grid. Server component. |
| `src/components/gamification/LevelBadge.tsx` | Displays XP level (emoji + name + optional progress bar) via `getLevelInfo()`. |
| `src/components/gamification/BadgeGrid.tsx` | Grid of earned badge icons/names. |
| `src/components/admin/UserManagement.tsx` | Super-admin user table: change roles, deactivate/reactivate. |
| `src/components/admin/CompanyManagement.tsx` | Super-admin company table: archive, unarchive, delete, update logo. |
| `src/components/admin/DownloadReportButton.tsx` | Generates and downloads monthly PDF report via jsPDF + jspdf-autotable. |
| `src/components/admin/ExportJsonButton.tsx` | Exports all company data as JSON via `/api/export/[companyId]`. |

### Dashboard Layouts & Pages
| Path | Purpose |
|------|---------|
| `src/app/(dashboard)/employee/layout.tsx` | Wraps employee pages in Sidebar + fetches company info. |
| `src/app/(dashboard)/trainer/layout.tsx` | Same pattern for trainer. |
| `src/app/(dashboard)/manager/layout.tsx` | Same pattern for manager. |
| `src/app/(dashboard)/super-admin/layout.tsx` | Same pattern for super-admin. |
| `src/app/(dashboard)/*/page.tsx` | Role dashboards: stat cards, invite form, report button. |
| `src/app/(dashboard)/trainer/courses/` | Course CRUD: list, new, `[courseId]` detail + lesson `new`. |
| `src/app/(dashboard)/employee/training/` | Course list + `[courseId]` course detail + `[lessonId]` lesson viewer. |
| `src/app/c/[token]/page.tsx` | Public certificate viewer — no auth required. Resolves `share_token` to certificate data. |
| `src/app/api/export/[companyId]/route.ts` | API route: returns full company data as JSON (super-admin only). |

### Lib Utilities
| File | Purpose |
|------|---------|
| `src/lib/gamification.ts` | `getLevelInfo(xp)` — returns level number, name, emoji, color, progress %. Level thresholds defined here. |
| `src/lib/image.ts` | `compressToWebP(file)` — browser-side canvas compression: max 800px, quality 0.85, outputs `File`. |
| `src/lib/audit.ts` | `logAudit(supabase, action, targetId)` — writes to `activity_log` table. Called from admin actions. |
| `src/lib/utils.ts` | `cn(...classes)` — Tailwind class merge utility (clsx + tailwind-merge). |

### Tests
| File | Purpose |
|------|---------|
| `src/__tests__/auth-roles.test.ts` | Role-based access control unit tests. |
| `src/__tests__/invite.test.ts` | Invite code generation/validation tests. |
| `src/__tests__/rls-helpers.test.ts` | RLS policy helper tests. |
| `src/__tests__/xp.test.ts` | XP award + streak + badge threshold tests. |
| `src/__tests__/setup.ts` | Vitest test setup (Supabase client mocks). |
