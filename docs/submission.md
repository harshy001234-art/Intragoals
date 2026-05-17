# Submission Notes

## What this repo demonstrates

- File-based routing with a clean app shell
- Domain-focused goal tracking flows
- Role-aware employee, manager, and admin experiences
- Supabase-backed auth and data persistence
- Demo-friendly fallback state for presentations and judging

## Reviewer checklist

- Home, pricing, features, contact, privacy, and auth routes render correctly
- `/app` flows preserve routing and role-based navigation
- Supabase-backed login/register still work when environment variables are configured
- Goal creation, approvals, check-ins, notifications, and settings remain functional
- Lint and production build pass from the repo root

## Repository polish choices

- Reduced unused shadcn-style UI scaffolding
- Moved routing, layouts, auth, and workspace code into clearer folders
- Added docs and environment templates for quick onboarding
- Kept existing product UI direction and behavior intact while simplifying structure
