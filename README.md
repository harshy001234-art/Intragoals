# Intragoals

Intragoals is an in-house goal setting and tracking portal built with React, TypeScript, Vite, TanStack Router, and Supabase. The repository is organized to read like a production-ready hackathon submission: clear app boundaries, focused domain modules, and lightweight infrastructure code.

## Stack

- React 19
- TypeScript
- Vite
- TanStack Start / TanStack Router
- Supabase
- Tailwind CSS
- Zustand

## Project structure

```text
src/
  app/
    layouts/
    providers/
    routes/
  intragoals/
    auth/
    workspace/
  components/
    shared/
    ui/
  lib/
    constants/
    supabase/
    utils/
  styles/
  types/

supabase/
  functions/
  migrations/
  seed/

docs/
  architecture.md
  setup.md
  demo-credentials.md
  submission.md
```

## Key flows

- Public marketing and auth routes live in `src/app/routes`.
- Workspace state, seeded demo data, and Supabase data mapping live in `src/intragoals/workspace`.
- Authentication logic lives in `src/intragoals/auth`.
- Shared brand and goal UI primitives live in `src/components/shared`.

## Local development

```bash
npm install
npm run dev
```

Useful scripts:

- `npm run dev` starts the local app.
- `npm run build` creates the production build.
- `npm run lint` runs ESLint.
- `npm run format` runs Prettier.

## Environment

Create `.env.local` from `.env.example`.

For Supabase-enabled auth and persistence, set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_ENABLE_MICROSOFT_AUTH`

`VITE_API_URL` remains optional for legacy backend fallback behavior.

## Documentation

- [Setup guide](docs/setup.md)
- [Architecture notes](docs/architecture.md)
- [Demo credentials and judging flow](docs/demo-credentials.md)
- [Submission checklist](docs/submission.md)
