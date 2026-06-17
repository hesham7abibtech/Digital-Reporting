-- ============================================================================
-- Digital Reporting Dashboard — Supabase schema (Firestore → Postgres)
-- Faithful migration: promoted typed columns for RLS/queries + `data jsonb`
-- holding the full original document (preserves field names like "InSite Review Status").
-- Mirrors firestore.rules as RLS. Idempotent.
-- ============================================================================

-- ---- helpers ---------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
-- NOTE: role-check functions (is_admin/is_approved/has_feature) are defined
-- AFTER the tables below, since their bodies reference public.users.

-- ---- users (1:1 with auth.users) ------------------------------------------
create table if not exists public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  firebase_uid      text unique,
  email             text unique not null,
  name              text,
  role              text not null default 'TEAM_MATE',
  is_admin          boolean not null default false,
  is_approved       boolean not null default false,
  is_verified       boolean not null default false,
  status            text not null default 'PENDING',
  policy_id         text,
  access            jsonb not null default '{}'::jsonb,
  blocking_details  jsonb,
  avatar            text,
  department        text,
  password_migrated boolean not null default false,
  data              jsonb not null default '{}'::jsonb,
  last_login_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---- generic doc tables (id = original Firestore doc id) -------------------
create table if not exists public.members (
  id text primary key, name text, email text, role text, department text, status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.registry (
  id text primary key, name text, category text, status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id text primary key, name text, abbreviation text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key, title text, status text, completion numeric, precinct text,
  department jsonb, submitter_id jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.bim_reviews (
  id text primary key, project text, status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.broadcasts (
  id text primary key, title text, type text, severity text, read_by jsonb default '[]'::jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id text primary key, uid text, email text, status text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.group_policies (
  id text primary key, name text, description text, modules jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id text primary key, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.project_metadata (
  id text primary key, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id text primary key, user_id uuid references public.users(id) on delete cascade,
  title text, messages jsonb default '[]'::jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.diagnostics (
  id text primary key, user_id uuid references public.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- server-only secrets (e.g. Notion token); RLS denies all client access.
create table if not exists public.secrets (
  id text primary key, data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---- role-check helpers (defined now that public.users exists) -------------
-- SECURITY DEFINER so role checks don't recurse through users' own RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.users u
    where u.id = auth.uid()
      and (u.is_admin = true or u.role in ('OWNER','ADMIN','SUPER_ADMIN'))
  );
$$;

create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.users u where u.id = auth.uid() and u.is_approved = true);
$$;

create or replace function public.has_feature(feature text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.users u
    where u.id = auth.uid() and coalesce((u.access ->> feature)::boolean, false) = true
  );
$$;

-- ---- indexes ---------------------------------------------------------------
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_chat_sessions_user on public.chat_sessions(user_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_bim_reviews_status on public.bim_reviews(status);

-- ---- updated_at triggers ---------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['users','members','registry','departments','tasks','bim_reviews',
    'broadcasts','tickets','group_policies','settings','project_metadata','chat_sessions',
    'diagnostics','secrets']
  loop
    execute format('drop trigger if exists trg_touch on public.%I;', t);
    execute format('create trigger trg_touch before update on public.%I
      for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ---- RLS -------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['users','members','registry','departments','tasks','bim_reviews',
    'broadcasts','tickets','group_policies','settings','project_metadata','chat_sessions',
    'diagnostics','secrets']
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- users: self/admin/approved read; self-update (no privilege escalation) or admin; admin delete
drop policy if exists users_select on public.users;
create policy users_select on public.users for select
  using (id = auth.uid() or public.is_admin() or public.is_approved());
drop policy if exists users_insert on public.users;
create policy users_insert on public.users for insert with check (id = auth.uid() or public.is_admin());
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin() or (
      id = auth.uid() and is_admin = (select u.is_admin from public.users u where u.id = auth.uid())
      and is_approved = (select u.is_approved from public.users u where u.id = auth.uid())
      and role = (select u.role from public.users u where u.id = auth.uid())
    )
  );
drop policy if exists users_delete on public.users;
create policy users_delete on public.users for delete using (public.is_admin());

-- approved-or-admin read, admin write (members, registry, departments, project_metadata, group_policies)
do $$
declare t text;
begin
  foreach t in array array['members','registry','departments','project_metadata','group_policies']
  loop
    execute format('drop policy if exists %I_read on public.%I;', t, t);
    execute format('create policy %I_read on public.%I for select using (public.is_approved() or public.is_admin());', t, t);
    execute format('drop policy if exists %I_write on public.%I;', t, t);
    execute format('create policy %I_write on public.%I for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end $$;

-- tasks: admin or approved+deliverablesRegistry; admin write
drop policy if exists tasks_read on public.tasks;
create policy tasks_read on public.tasks for select
  using (public.is_admin() or (public.is_approved() and public.has_feature('deliverablesRegistry')));
drop policy if exists tasks_write on public.tasks;
create policy tasks_write on public.tasks for all using (public.is_admin()) with check (public.is_admin());

-- bim_reviews: admin or approved+bimReviews; admin write
drop policy if exists bim_read on public.bim_reviews;
create policy bim_read on public.bim_reviews for select
  using (public.is_admin() or (public.is_approved() and public.has_feature('bimReviews')));
drop policy if exists bim_write on public.bim_reviews;
create policy bim_write on public.bim_reviews for all using (public.is_admin()) with check (public.is_admin());

-- broadcasts: approved/admin read; admin create/delete; approved may update (readBy)
drop policy if exists broadcasts_read on public.broadcasts;
create policy broadcasts_read on public.broadcasts for select using (public.is_approved() or public.is_admin());
drop policy if exists broadcasts_cud on public.broadcasts;
create policy broadcasts_cud on public.broadcasts for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists broadcasts_update_readby on public.broadcasts;
create policy broadcasts_update_readby on public.broadcasts for update
  using (public.is_approved()) with check (public.is_approved());

-- settings: public read for project/homePage; else approved/admin; admin write
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select
  using (id in ('project','homePage') or public.is_approved() or public.is_admin());
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- tickets: owner or admin read; owner create; admin update/delete
drop policy if exists tickets_read on public.tickets;
create policy tickets_read on public.tickets for select using (public.is_admin() or uid = auth.uid()::text);
drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert with check (auth.uid() is not null);
drop policy if exists tickets_admin on public.tickets;
create policy tickets_admin on public.tickets for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists tickets_delete on public.tickets;
create policy tickets_delete on public.tickets for delete using (public.is_admin());

-- chat_sessions & diagnostics: owner-only
drop policy if exists chat_own on public.chat_sessions;
create policy chat_own on public.chat_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists diag_own on public.diagnostics;
create policy diag_own on public.diagnostics for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- secrets: no client access (service_role bypasses RLS). RLS enabled, no policies = deny all.

-- ---- Realtime --------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['users','members','registry','departments','tasks','bim_reviews',
    'broadcasts','tickets','group_policies','settings','project_metadata','chat_sessions','diagnostics']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $$;
