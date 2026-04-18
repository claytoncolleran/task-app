# Task App

Minimal, offline-first task manager. PWA now, React Native later.

## Architecture

- **web/** — React + Vite + TS + Tailwind. Offline-first via IndexedDB (Dexie). Deployed as a Render static site.
- **api/** — Fastify + Drizzle + Postgres. Magic-link auth via Resend. Deployed as a Render web service.
- **shared/** — TypeScript types shared between web and api.

## Local Development

```bash
# First time
npm install
cp api/.env.example api/.env    # fill in DATABASE_URL, RESEND_API_KEY, JWT_SECRET, APP_URL
npm run build:shared
npm run db:migrate

# Run both
npm run dev:api     # terminal 1
npm run dev:web     # terminal 2
```

Web: http://localhost:5173 · API: http://localhost:3000

## Deployment

Push to `main`. `render.yaml` provisions the static site, web service, and Postgres.

Set these env vars on the Render API service:
- `RESEND_API_KEY`
- `JWT_SECRET` (any strong random string)
- `APP_URL` (the static site URL, e.g. `https://task-app.onrender.com`)

## Data Model

See [shared/src/index.ts](shared/src/index.ts).
