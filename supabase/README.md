# Supabase Setup

## Environment

Add these values to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_ENABLE_MICROSOFT_AUTH=true
```

`VITE_API_URL` is optional and only needed for the legacy backend fallback path.

## Schema

Apply the SQL files in `supabase/migrations`.

CLI example:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## Seed

- `supabase/seed/demo.sql` contains optional demo seed data.
- `supabase/one_time_cleanup_demo_workspace.sql` is a manual utility script and should not be treated as a standard migration.

## Current app usage

When Supabase is configured, Intragoals uses it for:

- account sign-in and registration
- workspace bootstrap
- profile hydration
- goals and quarterly check-ins
- approvals, notifications, and audit logs
- workspace-level settings and escalation data
