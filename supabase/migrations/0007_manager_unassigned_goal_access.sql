create or replace function private.can_review_profile(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles target_profile
    join public.profiles actor_profile on actor_profile.id = auth.uid()
    where target_profile.id = target_profile_id
      and target_profile.organization_id = actor_profile.organization_id
      and (
        actor_profile.role = 'admin'
        or target_profile.manager_id = actor_profile.id
        or (
          actor_profile.role = 'manager'
          and target_profile.role = 'employee'
          and target_profile.manager_id is null
        )
      )
  )
$$;

drop policy if exists "goals visible to owner manager admin" on public.goals;
create policy "goals visible to owner manager admin" on public.goals
for select using (
  organization_id = private.current_org_id()
  and (
    owner_id = (select auth.uid())
    or private.can_review_profile(owner_id)
  )
);

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
    owner_id = (select auth.uid())
    or private.can_review_profile(owner_id)
  )
);

drop policy if exists "checkins follow goal access" on public.quarterly_checkins;
create policy "checkins follow goal access" on public.quarterly_checkins
for all using (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.organization_id = private.current_org_id()
      and (
        g.owner_id = (select auth.uid())
        or private.can_review_profile(g.owner_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.organization_id = private.current_org_id()
      and (
        g.owner_id = (select auth.uid())
        or private.can_review_profile(g.owner_id)
      )
  )
);

drop policy if exists "approvals visible to managers admins owners" on public.approvals;
create policy "approvals visible to managers admins owners" on public.approvals
for all using (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.organization_id = private.current_org_id()
      and (
        g.owner_id = (select auth.uid())
        or private.can_review_profile(g.owner_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.goals g
    where g.id = goal_id
      and g.organization_id = private.current_org_id()
      and private.can_review_profile(g.owner_id)
  )
);

create or replace function public.create_goal_approval_notifications(
  goal_id_input uuid,
  notification_title text,
  notification_body text,
  notification_type text default 'warning',
  notification_deep_link text default '/app/approvals'
)
returns integer
language plpgsql
security definer
set search_path = public, private
as $$
declare
  actor_id uuid := auth.uid();
  actor_org_id uuid;
  goal_owner_id uuid;
  assigned_manager_id uuid;
  inserted_count integer := 0;
begin
  if actor_id is null then
    raise exception 'Not authenticated';
  end if;

  select p.organization_id
    into actor_org_id
  from public.profiles p
  where p.id = actor_id;

  if actor_org_id is null then
    raise exception 'Current user is not attached to a workspace';
  end if;

  select g.owner_id, p.manager_id
    into goal_owner_id, assigned_manager_id
  from public.goals g
  join public.profiles p on p.id = g.owner_id
  where g.id = goal_id_input
    and g.organization_id = actor_org_id;

  if goal_owner_id is null then
    raise exception 'Goal not found in your workspace';
  end if;

  if goal_owner_id <> actor_id and not private.can_review_profile(goal_owner_id) then
    raise exception 'You cannot create approval notifications for this goal';
  end if;

  if assigned_manager_id is not null then
    insert into public.notifications (
      organization_id,
      user_id,
      title,
      body,
      type,
      deep_link,
      read,
      sent_at
    )
    values (
      actor_org_id,
      assigned_manager_id,
      notification_title,
      notification_body,
      notification_type,
      notification_deep_link,
      false,
      now()
    );

    get diagnostics inserted_count = row_count;
    return inserted_count;
  end if;

  insert into public.notifications (
    organization_id,
    user_id,
    title,
    body,
    type,
    deep_link,
    read,
    sent_at
  )
  select
    actor_org_id,
    p.id,
    notification_title,
    notification_body,
    notification_type,
    notification_deep_link,
    false,
    now()
  from public.profiles p
  where p.organization_id = actor_org_id
    and p.role = 'manager'
    and p.id <> actor_id;

  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    raise exception 'No manager found to receive this approval request';
  end if;

  return inserted_count;
end;
$$;
