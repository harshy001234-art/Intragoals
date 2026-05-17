# Intragoals Architecture

## Overview

Intragoals is a TanStack Start application with a file-based route layer and a domain-oriented workspace module. The codebase is intentionally split between app infrastructure and product logic.

## Frontend layers

- `src/app` contains route registration, layout shells, providers, and server/start wiring.
- `src/intragoals/auth` contains authentication and account-related API logic.
- `src/intragoals/workspace` contains workspace state, seeded demo data, Supabase mapping, and workspace mutations.
- `src/components/shared` contains reusable brand and goal-specific display primitives.
- `src/components/ui` contains the smaller set of actually used UI building blocks.
- `src/lib` contains small framework-agnostic helpers such as constants, class utilities, and the Supabase client wrapper.

## Routing

- TanStack Router routes are generated from `src/app/routes`.
- `src/app/routes/__root.tsx` defines the HTML shell, metadata, error boundaries, and providers.
- `src/app/routes/app.tsx` is the authenticated application shell.

## Data model

The workspace layer supports two modes:

- Demo mode: seeded local state for judge-friendly walkthroughs and offline demos.
- Supabase mode: real auth, profiles, goals, notifications, approvals, and audit data backed by migrations in `supabase/migrations`.

## Supabase

- Client configuration lives in `src/lib/supabase`.
- SQL migrations live in `supabase/migrations`.
- Seed data lives in `supabase/seed`.
- `supabase/functions` is reserved for future Edge Functions such as escalations, notifications, or Microsoft sync tasks.
