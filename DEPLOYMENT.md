Render/Railway deployment notes

Overview
- Backend is packaged as a single Docker image that builds the frontend and backend and serves the built frontend from `backend/public`.
- Database: Supabase (use `DATABASE_URL` for runtime; `DIRECT_URL` for migrations).

Render
1. In Render, create a new Web Service and connect your repo.
2. Use `backend/Dockerfile` as the Dockerfile path.
3. Add environment variables (set in Render dashboard):
   - `DATABASE_URL` (pooled, e.g. `postgresql://...:6543/... ?pgbouncer=true`)
   - `DIRECT_URL` (direct connection for migrations)
   - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, etc.
4. Deploy. Render will build the image and run `node dist/src/server.js`.

Railway
- Similar setup: add a service with a Dockerfile build and set environment variables in Railway project settings.

Local build & test
1. From repo root, build production artifacts and copy client to backend:

```bash
npm run build:prod
```

2. Build Docker image locally:

```bash
npm run docker:build
```

3. Run image with env vars:

```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  intragoals-backend
```

Notes
- Do not commit secrets. Use Render/Railway secret management.
- For applying Prisma migrations on production, run `npx prisma migrate deploy` against `DIRECT_URL`.
