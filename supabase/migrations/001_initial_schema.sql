-- Companies (tenants)
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz default now()
);

-- Users (extends auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  email text not null,
  full_name text not null,
  avatar_url text,
  role text not null check (role in ('super_admin','trainer','manager','employee')),
  points int not null default 0,
  created_at timestamptz default now()
);

-- Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  created_by uuid references public.users(id),
  assigned_role text not null default 'employee',
  is_published boolean not null default false,
  created_at timestamptz default now()
);

-- Lessons
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  content text not null default '',
  video_url text,
  order_index int not null default 1,
  created_at timestamptz default now()
);

-- Lesson progress
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  status text not null default 'opened' check (status in ('opened','in_progress','completed')),
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

-- Quizzes
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  title text not null,
  questions jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Quiz attempts
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  score int not null default 0,
  total int not null default 0,
  completed_at timestamptz default now()
);

-- Certificates
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  issued_at timestamptz default now(),
  share_token uuid unique default gen_random_uuid(),
  unique(user_id, course_id)
);

-- Outfit submissions
create table public.outfit_submissions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  image_url text not null,
  week_number int not null,
  year int not null,
  is_winner boolean not null default false,
  created_at timestamptz default now()
);

-- Sales entries
create table public.sales_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  amount numeric(12,2) not null,
  date date not null default current_date,
  notes text,
  created_at timestamptz default now()
);

-- Stars
create table public.stars (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  type text not null check (type in ('week','month')),
  period text not null,
  chosen_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- Chat messages
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Suggestions
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Trainer notes
create table public.trainer_notes (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid references public.users(id) on delete cascade,
  employee_id uuid references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Helper function to increment points
create or replace function increment_points(uid uuid, amt int)
returns void language sql as $$
  update public.users set points = points + amt where id = uid;
$$;

-- ============ ROW LEVEL SECURITY ============

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.outfit_submissions enable row level security;
alter table public.sales_entries enable row level security;
alter table public.stars enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.suggestions enable row level security;
alter table public.trainer_notes enable row level security;

-- Helper function: get current user's role
create or replace function auth_role()
returns text language sql stable as $$
  select role from public.users where id = auth.uid();
$$;

-- Helper function: get current user's company_id
create or replace function auth_company()
returns uuid language sql stable as $$
  select company_id from public.users where id = auth.uid();
$$;

-- Companies: super_admin sees all; others see their own company
create policy "companies_select" on public.companies for select
  using (auth_role() = 'super_admin' or id = auth_company());

create policy "companies_insert" on public.companies for insert
  with check (auth_role() = 'super_admin');

-- Users: super_admin sees all; others see same company
create policy "users_select" on public.users for select
  using (auth_role() = 'super_admin' or company_id = auth_company() or id = auth.uid());

create policy "users_insert" on public.users for insert
  with check (auth_role() = 'super_admin');

create policy "users_update" on public.users for update
  using (id = auth.uid() or auth_role() = 'super_admin');

-- Courses: company-scoped
create policy "courses_select" on public.courses for select
  using (company_id = auth_company() or auth_role() = 'super_admin');

create policy "courses_insert" on public.courses for insert
  with check (company_id = auth_company() and auth_role() = 'trainer');

create policy "courses_update" on public.courses for update
  using (company_id = auth_company() and auth_role() = 'trainer');

-- Lessons: via course company
create policy "lessons_select" on public.lessons for select
  using (exists (select 1 from public.courses c where c.id = course_id and c.company_id = auth_company()));

create policy "lessons_insert" on public.lessons for insert
  with check (exists (select 1 from public.courses c where c.id = course_id and c.company_id = auth_company()) and auth_role() = 'trainer');

-- Lesson progress: own rows or trainer of same company
create policy "progress_select" on public.lesson_progress for select
  using (user_id = auth.uid() or auth_role() in ('trainer','super_admin'));

create policy "progress_insert" on public.lesson_progress for insert
  with check (user_id = auth.uid());

create policy "progress_update" on public.lesson_progress for update
  using (user_id = auth.uid());

-- Quiz attempts: own rows
create policy "quiz_attempts_all" on public.quiz_attempts for all
  using (user_id = auth.uid());

-- Certificates: own or trainer of same company
create policy "certs_select" on public.certificates for select
  using (user_id = auth.uid() or auth_role() in ('trainer','super_admin'));

create policy "certs_insert" on public.certificates for insert
  with check (user_id = auth.uid());

-- Outfit submissions: company-scoped
create policy "outfit_select" on public.outfit_submissions for select
  using (company_id = auth_company());

create policy "outfit_insert" on public.outfit_submissions for insert
  with check (company_id = auth_company() and user_id = auth.uid());

create policy "outfit_update" on public.outfit_submissions for update
  using (company_id = auth_company() and auth_role() = 'trainer');

-- Sales: company-scoped; employee sees own, trainer/manager sees all
create policy "sales_select" on public.sales_entries for select
  using (company_id = auth_company() and (user_id = auth.uid() or auth_role() in ('trainer','manager')));

create policy "sales_insert" on public.sales_entries for insert
  with check (company_id = auth_company() and user_id = auth.uid());

create policy "sales_update" on public.sales_entries for update
  using (company_id = auth_company() and user_id = auth.uid());

-- Stars: company-scoped
create policy "stars_select" on public.stars for select
  using (company_id = auth_company());

create policy "stars_insert" on public.stars for insert
  with check (company_id = auth_company() and auth_role() = 'trainer');

-- Chat: company-scoped
create policy "chat_select" on public.chat_messages for select
  using (company_id = auth_company());

create policy "chat_insert" on public.chat_messages for insert
  with check (company_id = auth_company() and user_id = auth.uid());

-- Notifications: own only
create policy "notif_select" on public.notifications for select
  using (user_id = auth.uid() or auth_role() = 'super_admin');

create policy "notif_insert" on public.notifications for insert
  with check (true); -- server-side inserts allowed

create policy "notif_update" on public.notifications for update
  using (user_id = auth.uid());

-- Suggestions: company-scoped
create policy "suggestions_select" on public.suggestions for select
  using (company_id = auth_company() and auth_role() in ('trainer','super_admin'));

create policy "suggestions_insert" on public.suggestions for insert
  with check (company_id = auth_company() and user_id = auth.uid());

-- Trainer notes
create policy "notes_select" on public.trainer_notes for select
  using (trainer_id = auth.uid() or employee_id = auth.uid());

create policy "notes_insert" on public.trainer_notes for insert
  with check (auth_role() = 'trainer');

-- Enable realtime for chat and notifications
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.notifications;
