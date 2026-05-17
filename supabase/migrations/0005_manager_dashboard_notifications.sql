create schema if not exists private;

create or replace function private.is_manager_of_current_user(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.manager_id = target_profile_id
  )
$$;

drop policy if exists "org members create notifications" on public.notifications;

create policy "workspace users create notifications for valid recipients"
on public.notifications
for insert
with check (
  organization_id = private.current_org_id()
  and (
    user_id = (select auth.uid())
    or private.is_admin()
    or private.is_manager_of(user_id)
    or private.is_manager_of_current_user(user_id)
  )
);
