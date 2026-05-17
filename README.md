# Intragoals — Align. Track. Achieve.

Enterprise Goal Setting & Tracking Portal. Frontend built with React + Vite + TanStack Router + Tailwind v4 + shadcn/ui + Recharts + Zustand + Framer Motion.

## Demo accounts (no login required)

Use the **Demo role switcher** in the topbar, or pick a role from the login page:

- **Employee** — Aarav Mehta · Senior Software Engineer
- **Manager** — Priya Iyer · Engineering Manager
- **Admin / HR** — Rohan Kapoor · Head of HR Operations

State is persisted in `localStorage` under `intragoals-state`. Clear it to reset seed data.

## Pages

Public: `/`, `/features`, `/pricing`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`, `/forgot-password`.

App: `/app/dashboard`, `/app/goals`, `/app/goals/new`, `/app/goals/:id`, `/app/checkins`, `/app/team`, `/app/approvals`, `/app/shared`, `/app/reports`, `/app/notifications`, `/app/audit`, `/app/settings`.

Admin: `/app/admin`, `/app/admin/users`, `/app/admin/departments`, `/app/admin/cycles`, `/app/admin/shared-kpis`, `/app/admin/escalations`.

## Backend

Production backend code now lives in `backend/`. See `backend/README.md` for setup, seed accounts, API routes, and Railway/Render deployment instructions.

## Backend (original frontend notes)

The frontend ships with a typed in-memory store (`src/lib/store.ts`) including the score engine. The production backend should mirror the same shapes and expose REST endpoints under these resources:

- `auth` — JWT with refresh-token rotation, secure HTTP-only cookies, bcrypt hashing
- `users`, `roles`, `departments`
- `goals`, `goal_sheets`, `shared_goals`, `goal_assignments`
- `quarterly_updates`, `approvals`, `checkin_comments`
- `notifications`, `escalations`, `audit_logs`, `cycles`, `reports`, `sessions`, `settings`
- `webhooks/n8n` — escalations + email + MS Teams placeholder

Recommended stack:
- **API**: Node.js + Express + Prisma + PostgreSQL (Supabase)
- **Auth**: Passport JWT, refresh-token rotation, RBAC middleware
- **Automation**: n8n Cloud webhooks for escalations, email, and MS Teams
- **Deployment**: Frontend → Vercel · API → Render or Railway · DB → Supabase

## Score engine (frontend)

```ts
// Numeric / Percentage
score = direction === "Max" ? achievement / target : target / achievement;

// Timeline
score = achievement_pct; // 0-100

// Zero-based
score = achievement === 0 ? 100 : 0;

// Overall: weightage-weighted average of goal scores
```

## Validation rules (enforced in `src/routes/app.goals.new.tsx`)

- Max 8 goals per employee
- Total weightage = 100% required to submit
- Min 10% per goal weightage
- No empty titles, no duplicate titles
- Approved goals are locked; only Admin can unlock

## Branding

Logo: `src/assets/intragoals-logo.png`. Brand tokens defined in `src/styles.css` (`--brand-blue`, `--brand-electric`, `--brand-cyan`, `--brand-purple`, `--brand-magenta`, `--brand-orange`, `--brand-yellow`, `--brand-green`).

## Scripts

- `bun dev` — start dev server
- `bun run build` — production build
