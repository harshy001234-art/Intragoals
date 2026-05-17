-- WARNING:
-- This is a destructive one-time cleanup script.
-- Back up your database before running it.
-- It removes all app data and auth users except the 4 Intragoals demo accounts,
-- then rebuilds the minimal Intragoals demo workspace.

begin;

do $$
declare
  demo_org_id uuid := '10000000-0000-4000-8000-000000000001';
  rohan_id uuid;
  priya_id uuid;
  neha_id uuid;
  karthik_id uuid;
begin
  select id into rohan_id from auth.users where email = 'rohan.kapoor@intragoals.com' and deleted_at is null;
  select id into priya_id from auth.users where email = 'priya.iyer@intragoals.com' and deleted_at is null;
  select id into neha_id from auth.users where email = 'neha.sharma@intragoals.com' and deleted_at is null;
  select id into karthik_id from auth.users where email = 'karthik.rao@intragoals.com' and deleted_at is null;

  if rohan_id is null or priya_id is null or neha_id is null or karthik_id is null then
    raise exception
      'Missing one or more demo auth users. Ensure these 4 auth accounts already exist before running cleanup.';
  end if;

  -- Remove app data first.
  delete from public.quarterly_checkins;
  delete from public.approvals;
  delete from public.notifications;
  delete from public.audit_logs;
  delete from public.escalation_events;
  delete from public.escalation_rules;
  delete from public.integration_connections;
  delete from public.goals;
  delete from public.goal_cycles;
  delete from public.profiles;
  delete from public.organizations;

  -- Remove all non-demo auth users.
  delete from auth.identities
  where user_id not in (rohan_id, priya_id, neha_id, karthik_id);

  delete from auth.users
  where id not in (rohan_id, priya_id, neha_id, karthik_id);

  -- Rebuild the single Intragoals demo workspace.
  insert into public.organizations (id, name, domain, created_at)
  values (demo_org_id, 'Intragoals', 'intragoals.com', now());

  insert into public.profiles (
    id,
    organization_id,
    manager_id,
    email,
    full_name,
    role,
    department,
    title,
    avatar_color,
    created_at,
    updated_at
  )
  values
    (
      rohan_id,
      demo_org_id,
      null,
      'rohan.kapoor@intragoals.com',
      'Rohan Kapoor',
      'admin',
      'People & Culture',
      'HR Operations Lead',
      '#ff7a18',
      now(),
      now()
    ),
    (
      priya_id,
      demo_org_id,
      null,
      'priya.iyer@intragoals.com',
      'Priya Iyer',
      'manager',
      'Product Engineering',
      'Engineering Manager',
      '#8438ff',
      now(),
      now()
    ),
    (
      neha_id,
      demo_org_id,
      priya_id,
      'neha.sharma@intragoals.com',
      'Neha Sharma',
      'employee',
      'Product Engineering',
      'Software Engineer II',
      '#00d8ff',
      now(),
      now()
    ),
    (
      karthik_id,
      demo_org_id,
      priya_id,
      'karthik.rao@intragoals.com',
      'Karthik Rao',
      'employee',
      'Product Engineering',
      'Software Engineer III',
      '#19d88f',
      now(),
      now()
    );

  insert into public.goals (
    id,
    organization_id,
    owner_id,
    title,
    description,
    thrust_area,
    uom,
    direction,
    target,
    weightage,
    status,
    is_shared,
    shared_from_owner_id,
    created_at,
    updated_at
  )
  values
    (
      '10000000-0000-4000-8000-000000000101',
      demo_org_id,
      neha_id,
      'Raise release success rate to 98%',
      'Stabilize deployment checks and release handoff so weekly releases complete without rollback.',
      'Product Excellence',
      'Percentage',
      'Max',
      98,
      40,
      'Approved',
      false,
      null,
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000102',
      demo_org_id,
      neha_id,
      'Reduce onboarding setup time by 25%',
      'Document setup blockers and automate the slowest local environment steps for new joiners.',
      'Operational Efficiency',
      'Percentage',
      'Max',
      25,
      30,
      'Pending Approval',
      false,
      null,
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000103',
      demo_org_id,
      neha_id,
      'Ship approval audit trail exports',
      'Add export-ready approval history for people reviews and compliance requests.',
      'Compliance & Risk',
      'Timeline',
      'Min',
      100,
      30,
      'Pending Approval',
      false,
      null,
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000104',
      demo_org_id,
      karthik_id,
      'Increase regression automation coverage to 70%',
      'Convert the highest-risk regression paths into stable automated checks.',
      'Product Excellence',
      'Percentage',
      'Max',
      70,
      55,
      'Approved',
      false,
      null,
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000105',
      demo_org_id,
      karthik_id,
      'Cut flaky test reruns by 40%',
      'Stabilize the noisiest suites and reduce manual reruns during release weeks.',
      'Operational Efficiency',
      'Percentage',
      'Max',
      40,
      45,
      'Pending Approval',
      false,
      null,
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000106',
      demo_org_id,
      priya_id,
      'Complete Q2 team goal calibration',
      'Finalize clean, balanced goal sheets for the Product Engineering team.',
      'People & Culture',
      'Percentage',
      'Max',
      100,
      100,
      'Approved',
      false,
      null,
      now(),
      now()
    );

  insert into public.quarterly_checkins (
    goal_id,
    quarter,
    achievement,
    status,
    comment,
    submitted_at,
    reviewed_at
  )
  values
    (
      '10000000-0000-4000-8000-000000000101',
      'Q1',
      92,
      'On Track',
      'Release checklist adopted across the squad.',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000104',
      'Q1',
      48,
      'On Track',
      'Critical smoke flows are now automated.',
      now(),
      now()
    );
end $$;

commit;

-- Verification queries:
select count(*) as remaining_profiles from public.profiles;

select email, role, department
from public.profiles
order by email;

select
  count(*) filter (where status = 'Pending Approval') as pending_goals,
  count(*) filter (where status = 'Approved') as approved_goals
from public.goals;

select count(*) as quarterly_checkins
from public.quarterly_checkins;
