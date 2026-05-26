-- ── Users profile (extends Supabase auth.users) ──────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- ── Credits ───────────────────────────────────────────────────────────────
create table if not exists public.credits (
  user_id uuid references auth.users(id) on delete cascade primary key,
  balance numeric(10,2) not null default 0,
  updated_at timestamptz default now()
);

-- ── Credit transactions log ───────────────────────────────────────────────
create table if not exists public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  action text not null,
  amount numeric(10,2) not null,
  description text,
  balance_after numeric(10,2) not null,
  created_at timestamptz default now()
);

-- ── Projects ──────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  vercel_project_id text,
  vercel_deployment_url text,
  github_repo text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Deployments ───────────────────────────────────────────────────────────
create table if not exists public.deployments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  vercel_deployment_id text,
  url text,
  status text default 'pending',
  branch text default 'main',
  commit_message text,
  created_at timestamptz default now()
);

-- ── Installed integrations ─────────────────────────────────────────────────
create table if not exists public.user_integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  integration_id text not null,
  slug text not null,
  name text not null,
  provider text not null,
  category text,
  description text,
  installed_at timestamptz default now(),
  status text not null default 'installed',
  metadata jsonb default '{}'::jsonb
);

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.projects enable row level security;
alter table public.deployments enable row level security;
alter table public.user_integrations enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- Credits: users can only see their own
create policy "credits_own" on public.credits
  for all using (auth.uid() = user_id);

-- Transactions: users can only see their own
create policy "transactions_own" on public.credit_transactions
  for all using (auth.uid() = user_id);

-- Projects: users can only see/edit their own
create policy "projects_own" on public.projects
  for all using (auth.uid() = user_id);

-- Deployments: users can only see their own
create policy "deployments_own" on public.deployments
  for all using (auth.uid() = user_id);

-- User integrations: users can only see/manage their own installed integrations
create policy "user_integrations_own" on public.user_integrations
  for select using (auth.uid() = user_id);

create policy "user_integrations_insert" on public.user_integrations
  for insert with check (auth.uid() = user_id);

create policy "user_integrations_update" on public.user_integrations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_integrations_delete" on public.user_integrations
  for delete using (auth.uid() = user_id);

-- ── Auto-create profile + credits on signup ───────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.credits (user_id, balance)
  values (new.id, 10)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, action, amount, description, balance_after)
  values (new.id, 'signup_bonus', 10, 'Welcome bonus — 10 free credits', 10);

  return new;
end;
$$;

-- Trigger on new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
