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

## 4. App Data Sync

The frontend now uses Supabase for real account sessions and keeps local sample data for the collapsed "Explore sample workspace" flow.

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present:

- Login/register/logout/password reset use Supabase Auth.
- The first user for an email domain is bootstrapped into an organization as `admin`.
- Later users on the same email domain are attached to the same organization.
- App shell hydration loads `profiles`, `goals`, `quarterly_checkins`, `audit_logs`, `notifications`, and `escalation_events`.
- Goal creation, approval decisions, editable approval fields, quarterly check-ins, audit events, and notification read state are written back to Supabase.

Sample mode still stays fully local so demos work before Supabase is configured.

## 5. Bonus Modules

The schema already includes tables for:

- Entra hierarchy and group sync: `profiles.entra_object_id`, `profiles.entra_group_ids`
- Email and Teams events: `notifications`, `integration_connections`
- Rule-based escalations: `escalation_rules`, `escalation_events`
- Analytics: `analytics_goal_distribution`, `analytics_manager_effectiveness`

Recommended next integrations:

- Add an Edge Function or scheduled job for escalation rule evaluation.
- Add a service-role sync job for Microsoft Entra org hierarchy and group membership.
- Add Teams/email delivery workers that create rows in `notifications` and send external messages.
