# Skilly

PWA SaaS platform for retail employee training and engagement, targeting Saudi/Gulf retail companies.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database / Auth | Supabase (Postgres, Auth, Storage, Realtime) |
| Styling | Tailwind CSS v4 (CSS-first), shadcn/ui |
| Deployment | Vercel |
| PWA | next-pwa (offline lesson support) |
| Theme | next-themes (dark default) |
| Error monitoring | Sentry |
| Font | Plus Jakarta Sans |

## Prerequisites

- Node.js 20+
- npm 9+
- A Supabase project (cloud or local via Supabase CLI)

## Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd skilly
npm install

# 2. Configure environment
cp .env.local.example .env.local   # or copy the template below
# Fill in your Supabase credentials

# 3. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` at the project root:

```env
# Supabase — required
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-only, never expose to client

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000      # change to your Vercel URL in production

# Sentry — optional, for error monitoring
NEXT_PUBLIC_SENTRY_DSN=                        # get from sentry.io → Project Settings → Client Keys
SENTRY_ORG=                                    # only needed for source-map uploads in CI
SENTRY_PROJECT=                                # only needed for source-map uploads in CI
```

> **Never commit `.env.local`** — it is gitignored.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack, hot reload) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | E2E tests (Playwright, requires dev server) |
| `npm run test:e2e:ui` | Playwright UI mode |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for:
- Role system and permissions
- Auth flow (invite codes, email confirmation)
- Database schema overview
- RLS approach
- Folder structure
