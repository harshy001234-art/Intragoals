# Intragoals Supabase Setup

## 1. Create Project

Create a Supabase project and copy:

- Project URL
- Public anon key

Add them to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Keep `VITE_API_URL` only if you still want the old backend fallback.

## 2. Run Schema

Run `supabase/migrations/0001_intragoals_core.sql` in the Supabase SQL editor, or use:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## 3. Auth Providers

Start with email/password in Supabase Auth.

For Microsoft Entra ID:

- Basic Microsoft sign-in: enable the Azure provider in Supabase Auth.
- Enterprise SSO: configure SAML SSO and use `authApi.signInWithSsoDomain(domain)`.

## 4. Bonus Modules

The schema already includes tables for:

- Entra hierarchy and group sync: `profiles.entra_object_id`, `profiles.entra_group_ids`
- Email and Teams events: `notifications`, `integration_connections`
- Rule-based escalations: `escalation_rules`, `escalation_events`
- Analytics: `analytics_goal_distribution`, `analytics_manager_effectiveness`

The next implementation pass should wire the app's goal/check-in/approval mutations to these tables.
