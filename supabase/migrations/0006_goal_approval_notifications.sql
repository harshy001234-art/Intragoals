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

  if goal_owner_id <> actor_id and not private.is_admin() and not private.is_manager_of(goal_owner_id) then
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

revoke execute on function public.create_goal_approval_notifications(uuid, text, text, text, text) from public, anon;
grant execute on function public.create_goal_approval_notifications(uuid, text, text, text, text) to authenticated;
