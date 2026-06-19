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
