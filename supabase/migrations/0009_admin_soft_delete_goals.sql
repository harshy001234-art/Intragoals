alter table public.goals
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_goals_org_not_deleted
  on public.goals (organization_id, deleted_at);

drop policy if exists "owners managers admins update goals" on public.goals;
create policy "owners managers admins update goals" on public.goals
for update using (
  organization_id = private.current_org_id()
  and (
    owner_id = (select auth.uid())
    or private.can_review_profile(owner_id)
  )
)
with check (
  organization_id = private.current_org_id()
  and (
    private.is_admin()
    or (
      (owner_id = (select auth.uid()) or private.can_review_profile(owner_id))
      and deleted_at is null
      and deleted_by is null
    )
  )
);

create or replace function public.soft_delete_goal(goal_id_input uuid)
returns public.goals
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor_id uuid := auth.uid();
  actor_org_id uuid;
  deleted_goal public.goals;
begin
  if actor_id is null then
    raise exception 'Not authenticated';
  end if;

  if not private.is_admin() then
    raise exception 'Only admins can delete goals';
  end if;

  actor_org_id := private.current_org_id();

  if actor_org_id is null then
    raise exception 'Admin profile is missing an organization';
  end if;

  update public.goals
  set deleted_at = now(),
      deleted_by = actor_id,
      updated_at = now()
  where id = goal_id_input
    and organization_id = actor_org_id
    and deleted_at is null
  returning * into deleted_goal;

  if not found then
    raise exception 'Goal not found in your workspace';
  end if;

  return deleted_goal;
end;
$$;

revoke execute on function public.soft_delete_goal(uuid) from public, anon;
grant execute on function public.soft_delete_goal(uuid) to authenticated;
