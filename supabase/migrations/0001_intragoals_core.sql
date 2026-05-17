-- Intragoals core schema for Supabase Postgres.
-- Run this in the Supabase SQL editor or via `supabase db push`.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('employee', 'manager', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.escalation_level as enum ('employee', 'manager', 'skip_level', 'hr_admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  entra_tenant_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  manager_id uuid references public.profiles(id) on delete set null,
  email text not null,
  full_name text not null,
  role public.app_role not null default 'employee',
  department text,
  title text,
  avatar_color text,
  entra_object_id text,
  entra_group_ids text[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  year int not null,
  status text not null default 'draft',
  opens_at timestamptz,
  closes_at timestamptz,
  checkin_windows jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_id uuid references public.goal_cycles(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  thrust_area text not null,
  uom text not null,
  direction text not null,
  target numeric not null default 0,
  weightage numeric not null default 10 check (weightage >= 0 and weightage <= 100),
  status text not null default 'Draft',
  is_shared boolean not null default false,
  shared_from_owner_id uuid references public.profiles(id) on delete set null,
  manager_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quarterly_checkins (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  quarter text not null,
  achievement numeric,
  status text not null default 'Not Started',
  comment text not null default '',
  manager_comment text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  unique(goal_id, quarter)
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  approver_id uuid references public.profiles(id) on delete set null,
  action text not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  channel text not null default 'in_app',
  title text not null,
  body text not null,
  type text not null default 'info',
  deep_link text,
  teams_payload jsonb,
  read boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.escalation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  trigger_type text not null,
  threshold_days int not null default 3,
  chain public.escalation_level[] not null default array['employee','manager','hr_admin']::public.escalation_level[],
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.escalation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  rule_id uuid references public.escalation_rules(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete set null,
  reason text not null,
  level public.escalation_level not null default 'employee',
  resolved boolean not null default false,
  resolved_at timestamptz,
  triggered_at timestamptz not null default now()
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  status text not null default 'pending',
  config jsonb not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique(organization_id, provider)
);

create or replace function public.bootstrap_workspace(
  workspace_name text default null,
  workspace_domain text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  user_meta jsonb;
  resolved_domain text;
  resolved_name text;
  org_id uuid;
  org_created boolean := false;
  assigned_role public.app_role := 'employee';
  profile public.profiles;
begin
  select email, raw_user_meta_data
    into user_email, user_meta
  from auth.users
  where id = auth.uid();

  if user_email is null then
    raise exception 'Not authenticated';
  end if;

  resolved_domain := lower(coalesce(nullif(workspace_domain, ''), split_part(user_email, '@', 2), 'intragoals.local'));
  resolved_name := coalesce(nullif(workspace_name, ''), initcap(split_part(resolved_domain, '.', 1)) || ' Workspace');

  select id into org_id
  from public.organizations
  where domain = resolved_domain
  limit 1;

  if org_id is null then
    insert into public.organizations (name, domain)
    values (resolved_name, resolved_domain)
    returning id into org_id;
    org_created := true;
  end if;

  if org_created then
    assigned_role := 'admin';
  elsif user_meta->>'role' in ('employee', 'manager', 'admin') then
    assigned_role := (user_meta->>'role')::public.app_role;
  end if;

  insert into public.profiles (
    id,
    organization_id,
    email,
    full_name,
    role,
    department,
    title,
    avatar_color
  )
  values (
    auth.uid(),
    org_id,
    user_email,
    coalesce(nullif(user_meta->>'full_name', ''), nullif(user_meta->>'name', ''), split_part(user_email, '@', 1)),
    assigned_role,
    coalesce(nullif(user_meta->>'department', ''), 'Intragoals'),
    coalesce(nullif(user_meta->>'title', ''), case when assigned_role = 'admin' then 'Admin / HR' else 'Employee' end),
    coalesce(nullif(user_meta->>'avatar_color', ''), case assigned_role when 'admin' then '#ff7a18' when 'manager' then '#8438ff' else '#00d8ff' end)
  )
  on conflict (id) do update set
    organization_id = coalesce(public.profiles.organization_id, excluded.organization_id),
    email = excluded.email,
    full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
    department = coalesce(public.profiles.department, excluded.department),
    title = coalesce(public.profiles.title, excluded.title),
    avatar_color = coalesce(public.profiles.avatar_color, excluded.avatar_color),
    updated_at = now()
  returning * into profile;

  if org_created and profile.role <> 'admin' then
    update public.profiles
    set role = 'admin',
        title = coalesce(title, 'Admin / HR'),
        updated_at = now()
    where id = auth.uid()
    returning * into profile;
  end if;

  return profile;
end;
$$;

grant execute on function public.bootstrap_workspace(text, text) to authenticated;

create or replace function public.current_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

create or replace function public.is_manager_of(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = target_profile_id
      and p.manager_id = auth.uid()
  )
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.goal_cycles enable row level security;
alter table public.goals enable row level security;
alter table public.quarterly_checkins enable row level security;
alter table public.approvals enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.escalation_rules enable row level security;
alter table public.escalation_events enable row level security;
alter table public.integration_connections enable row level security;

create policy "profiles visible to org members" on public.profiles
for select using (
  id = auth.uid()
  or public.is_admin()
  or public.is_manager_of(id)
  or organization_id = public.current_org_id()
);

create policy "users create own profile" on public.profiles
for insert with check (id = auth.uid());

create policy "users update own profile or admins update org" on public.profiles
for update using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "orgs visible to members" on public.organizations
for select using (id = public.current_org_id());

create policy "cycles visible to org" on public.goal_cycles
for select using (organization_id = public.current_org_id());

create policy "admins manage cycles" on public.goal_cycles
for all using (public.is_admin()) with check (public.is_admin());

create policy "goals visible to owner manager admin" on public.goals
for select using (
  organization_id = public.current_org_id()
  and (owner_id = auth.uid() or public.is_manager_of(owner_id) or public.is_admin())
);

create policy "owners create goals" on public.goals
for insert with check (
  owner_id = auth.uid()
  and organization_id = public.current_org_id()
);

create policy "owners managers admins update goals" on public.goals
for update using (
  organization_id = public.current_org_id()
  and (owner_id = auth.uid() or public.is_manager_of(owner_id) or public.is_admin())
)
with check (
  organization_id = public.current_org_id()
  and (owner_id = auth.uid() or public.is_manager_of(owner_id) or public.is_admin())
);

create policy "checkins follow goal access" on public.quarterly_checkins
for all using (
  exists (
    select 1 from public.goals g
    where g.id = goal_id
      and g.organization_id = public.current_org_id()
      and (g.owner_id = auth.uid() or public.is_manager_of(g.owner_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.goals g
    where g.id = goal_id
      and g.organization_id = public.current_org_id()
      and (g.owner_id = auth.uid() or public.is_manager_of(g.owner_id) or public.is_admin())
  )
);

create policy "approvals visible to managers admins owners" on public.approvals
for all using (
  exists (
    select 1 from public.goals g
    where g.id = goal_id
      and g.organization_id = public.current_org_id()
      and (g.owner_id = auth.uid() or public.is_manager_of(g.owner_id) or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.goals g
    where g.id = goal_id
      and g.organization_id = public.current_org_id()
      and (public.is_manager_of(g.owner_id) or public.is_admin())
  )
);

create policy "audit visible to admins" on public.audit_logs
for select using (organization_id = public.current_org_id() and public.is_admin());

create policy "org members create audit" on public.audit_logs
for insert with check (organization_id = public.current_org_id());

create policy "users see own notifications" on public.notifications
for select using (user_id = auth.uid() or public.is_admin());

create policy "org members create notifications" on public.notifications
for insert with check (organization_id = public.current_org_id());

create policy "users update own notifications" on public.notifications
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admins manage escalation rules" on public.escalation_rules
for all using (organization_id = public.current_org_id() and public.is_admin())
with check (organization_id = public.current_org_id() and public.is_admin());

create policy "escalations visible to involved users" on public.escalation_events
for select using (
  organization_id = public.current_org_id()
  and (owner_id = auth.uid() or public.is_manager_of(owner_id) or public.is_admin())
);

create policy "admins manage integrations" on public.integration_connections
for all using (organization_id = public.current_org_id() and public.is_admin())
with check (organization_id = public.current_org_id() and public.is_admin());

create or replace view public.analytics_goal_distribution as
select
  organization_id,
  thrust_area,
  uom,
  status,
  count(*) as goal_count,
  avg(weightage) as avg_weightage
from public.goals
group by organization_id, thrust_area, uom, status;

create or replace view public.analytics_manager_effectiveness as
select
  manager.id as manager_id,
  manager.organization_id,
  manager.full_name as manager_name,
  count(distinct g.id) as team_goals,
  count(q.id) filter (where q.submitted_at is not null) as submitted_checkins,
  count(q.id) as total_checkins,
  case when count(q.id) = 0 then 0
       else round((count(q.id) filter (where q.submitted_at is not null)::numeric / count(q.id)) * 100, 2)
  end as checkin_completion_rate
from public.profiles manager
join public.profiles employee on employee.manager_id = manager.id
left join public.goals g on g.owner_id = employee.id
left join public.quarterly_checkins q on q.goal_id = g.id
group by manager.id, manager.organization_id, manager.full_name;

create index if not exists idx_profiles_org on public.profiles(organization_id);
create index if not exists idx_profiles_manager on public.profiles(manager_id);
create index if not exists idx_goals_org_owner on public.goals(organization_id, owner_id);
create index if not exists idx_checkins_goal on public.quarterly_checkins(goal_id);
create index if not exists idx_notifications_user on public.notifications(user_id, read);
create index if not exists idx_escalations_org_owner on public.escalation_events(organization_id, owner_id, resolved);
