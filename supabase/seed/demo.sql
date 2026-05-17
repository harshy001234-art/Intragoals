-- Minimal local/demo seed for Supabase resets.
-- Safe intent: this file only manages the Intragoals demo workspace and
-- @intragoals.com demo accounts. Do not run it against production.

create extension if not exists pgcrypto;

do $$
declare
  org_id uuid := '10000000-0000-4000-8000-000000000001';
  rohan_id uuid := '10000000-0000-4000-8000-000000000011';
  priya_id uuid := '10000000-0000-4000-8000-000000000012';
  neha_id uuid := '10000000-0000-4000-8000-000000000013';
  karthik_id uuid := '10000000-0000-4000-8000-000000000014';
begin
  delete from public.quarterly_checkins
  where goal_id in (
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000102',
    '10000000-0000-4000-8000-000000000103',
    '10000000-0000-4000-8000-000000000104',
    '10000000-0000-4000-8000-000000000105',
    '10000000-0000-4000-8000-000000000106'
  );

  delete from public.notifications
  where user_id in (rohan_id, priya_id, neha_id, karthik_id);

  delete from public.audit_logs
  where actor_id in (rohan_id, priya_id, neha_id, karthik_id);

  delete from public.goals
  where id in (
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000102',
    '10000000-0000-4000-8000-000000000103',
    '10000000-0000-4000-8000-000000000104',
    '10000000-0000-4000-8000-000000000105',
    '10000000-0000-4000-8000-000000000106',
    '10000000-0000-4000-8000-000000000107',
    '10000000-0000-4000-8000-000000000108'
  );

  delete from public.profiles
  where id in (rohan_id, priya_id, neha_id, karthik_id);

  delete from auth.identities
  where user_id in (rohan_id, priya_id, neha_id, karthik_id)
     or email in (
       'rohan.kapoor@intragoals.com',
       'priya.iyer@intragoals.com',
       'neha.sharma@intragoals.com',
       'karthik.rao@intragoals.com'
     );

  delete from auth.users
  where id in (rohan_id, priya_id, neha_id, karthik_id)
     or email in (
       'rohan.kapoor@intragoals.com',
       'priya.iyer@intragoals.com',
       'neha.sharma@intragoals.com',
       'karthik.rao@intragoals.com'
     );

  delete from public.organizations
  where id = org_id;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    email_change_confirm_status,
    recovery_token,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      rohan_id,
      'authenticated',
      'authenticated',
      'rohan.kapoor@intragoals.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', rohan_id::text,
        'email', 'rohan.kapoor@intragoals.com',
        'full_name', 'Rohan Kapoor',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      0,
      '',
      '',
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      priya_id,
      'authenticated',
      'authenticated',
      'priya.iyer@intragoals.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', priya_id::text,
        'email', 'priya.iyer@intragoals.com',
        'full_name', 'Priya Iyer',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      0,
      '',
      '',
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      neha_id,
      'authenticated',
      'authenticated',
      'neha.sharma@intragoals.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', neha_id::text,
        'email', 'neha.sharma@intragoals.com',
        'full_name', 'Neha Sharma',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      0,
      '',
      '',
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      karthik_id,
      'authenticated',
      'authenticated',
      'karthik.rao@intragoals.com',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', karthik_id::text,
        'email', 'karthik.rao@intragoals.com',
        'full_name', 'Karthik Rao',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      0,
      '',
      '',
      false,
      false
    );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      gen_random_uuid(),
      rohan_id,
      jsonb_build_object(
        'sub', rohan_id::text,
        'email', 'rohan.kapoor@intragoals.com',
        'full_name', 'Rohan Kapoor',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      rohan_id::text,
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      priya_id,
      jsonb_build_object(
        'sub', priya_id::text,
        'email', 'priya.iyer@intragoals.com',
        'full_name', 'Priya Iyer',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      priya_id::text,
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      neha_id,
      jsonb_build_object(
        'sub', neha_id::text,
        'email', 'neha.sharma@intragoals.com',
        'full_name', 'Neha Sharma',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      neha_id::text,
      now(),
      now(),
      now()
    ),
    (
      gen_random_uuid(),
      karthik_id,
      jsonb_build_object(
        'sub', karthik_id::text,
        'email', 'karthik.rao@intragoals.com',
        'full_name', 'Karthik Rao',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      karthik_id::text,
      now(),
      now(),
      now()
    );

  insert into public.organizations (id, name, domain, created_at)
  values (org_id, 'Intragoals', 'intragoals.com', now());

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
      org_id,
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
      org_id,
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
      org_id,
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
      org_id,
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
    created_at,
    updated_at
  )
  values
    (
      '10000000-0000-4000-8000-000000000101',
      org_id,
      neha_id,
      'Raise release success rate to 98%',
      'Stabilize deployment checks and release handoff so weekly releases complete without rollback.',
      'Product Excellence',
      'Percentage',
      'Max',
      98,
      40,
      'Approved',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000102',
      org_id,
      neha_id,
      'Reduce onboarding setup time by 25%',
      'Document setup blockers and automate the slowest local environment steps for new joiners.',
      'Operational Efficiency',
      'Percentage',
      'Max',
      25,
      30,
      'Pending Approval',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000103',
      org_id,
      neha_id,
      'Ship approval audit trail exports',
      'Add export-ready approval history for people reviews and compliance requests.',
      'Compliance & Risk',
      'Timeline',
      'Min',
      100,
      30,
      'Pending Approval',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000104',
      org_id,
      karthik_id,
      'Increase regression automation coverage to 70%',
      'Convert the highest-risk regression paths into stable automated checks.',
      'Product Excellence',
      'Percentage',
      'Max',
      70,
      55,
      'Approved',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000105',
      org_id,
      karthik_id,
      'Cut flaky test reruns by 40%',
      'Stabilize the noisiest suites and reduce manual reruns during release weeks.',
      'Operational Efficiency',
      'Percentage',
      'Max',
      40,
      45,
      'Pending Approval',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000106',
      org_id,
      priya_id,
      'Complete Q2 team goal calibration',
      'Finalize clean, balanced goal sheets for the Product Engineering team.',
      'People & Culture',
      'Percentage',
      'Max',
      100,
      100,
      'Approved',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000107',
      org_id,
      neha_id,
      'Improve sprint predictability to 85%',
      'Shared KPI from Product Engineering for delivery planning consistency across the quarter.',
      'Operational Efficiency',
      'Percentage',
      'Max',
      85,
      15,
      'Approved',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000108',
      org_id,
      karthik_id,
      'Bring escaped defect count below 3 per release',
      'Shared quality KPI pushed by the manager to keep release hygiene visible across the team.',
      'Product Excellence',
      'Numeric',
      'Min',
      3,
      10,
      'Approved',
      now(),
      now()
    );

  update public.goals
  set
    is_shared = true,
    shared_from_owner_id = priya_id
  where id in (
    '10000000-0000-4000-8000-000000000107',
    '10000000-0000-4000-8000-000000000108'
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
    ),
    (
      '10000000-0000-4000-8000-000000000107',
      'Q1',
      72,
      'On Track',
      'Velocity planning baseline established.',
      now(),
      now()
    ),
    (
      '10000000-0000-4000-8000-000000000108',
      'Q1',
      4,
      'On Track',
      'Release QA checklist now mandatory.',
      now(),
      now()
    );

  insert into public.audit_logs (
    organization_id,
    actor_id,
    actor_name,
    action,
    entity_type,
    entity_id,
    previous_value,
    new_value,
    created_at
  )
  values
    (
      org_id,
      neha_id,
      'Neha Sharma',
      'Submitted goal for approval',
      'Goal',
      '10000000-0000-4000-8000-000000000102',
      jsonb_build_object('value', 'Draft'),
      jsonb_build_object('value', 'Pending Approval'),
      now()
    ),
    (
      org_id,
      priya_id,
      'Priya Iyer',
      'Approved goal',
      'Goal',
      '10000000-0000-4000-8000-000000000101',
      jsonb_build_object('value', 'Pending Approval'),
      jsonb_build_object('value', 'Approved'),
      now()
    ),
    (
      org_id,
      rohan_id,
      'Rohan Kapoor',
      'Published shared KPI',
      'Goal',
      '10000000-0000-4000-8000-000000000107',
      jsonb_build_object('value', 'Private manager KPI'),
      jsonb_build_object('value', 'Shared with Product Engineering'),
      now()
    );
end $$;
