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

revoke insert (role) on table public.profiles from public, anon, authenticated;
revoke update (role) on table public.profiles from public, anon, authenticated;

drop policy if exists "users create own profile" on public.profiles;
create policy "users create own profile" on public.profiles
for insert
with check (
  id = (select auth.uid())
  and role = 'employee'
);

drop policy if exists "users update own profile or admins update org" on public.profiles;
create policy "users update own profile or admins update org" on public.profiles
for update
using (
  id = (select auth.uid())
  or private.is_admin()
)
with check (
  (id = (select auth.uid()) or private.is_admin())
  and role = (
    select existing.role
    from public.profiles as existing
    where existing.id = public.profiles.id
  )
);

create or replace function public.update_profile_role(
  target_profile_id uuid,
  new_role public.app_role
)
returns public.profiles
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_org_id uuid;
  target_profile public.profiles;
  admin_count bigint;
  resolved_title text;
begin
  if actor_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if new_role is null then
    raise exception 'A role is required';
  end if;

  if not private.is_admin() then
    raise exception 'Only admins can change roles';
  end if;

  actor_org_id := private.current_org_id();

  if actor_org_id is null then
    raise exception 'Admin profile is missing an organization';
  end if;

  if target_profile_id = actor_user_id then
    raise exception 'You cannot change your own role';
  end if;

  select *
    into target_profile
  from public.profiles
  where id = target_profile_id
    and organization_id = actor_org_id
  for update;

  if not found then
    raise exception 'User not found in your workspace';
  end if;

  if target_profile.role = 'admin' and new_role <> 'admin' then
    select count(*)
      into admin_count
    from public.profiles
    where organization_id = actor_org_id
      and role = 'admin';

    if admin_count <= 1 then
      raise exception 'You cannot remove the last admin from this workspace';
    end if;
  end if;

  resolved_title := case
    when target_profile.title is null then
      case new_role
        when 'admin' then 'Admin / HR'
        when 'manager' then 'Manager'
        else 'Employee'
      end
    when target_profile.title in ('Employee', 'Manager', 'Admin / HR') then
      case new_role
        when 'admin' then 'Admin / HR'
        when 'manager' then 'Manager'
        else 'Employee'
      end
    else target_profile.title
  end;

  update public.profiles
  set role = new_role,
      title = resolved_title,
      updated_at = now()
  where id = target_profile.id
  returning * into target_profile;

  return target_profile;
end;
$$;

revoke execute on function public.update_profile_role(uuid, public.app_role) from public, anon;
grant execute on function public.update_profile_role(uuid, public.app_role) to authenticated;
