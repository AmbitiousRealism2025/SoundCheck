# Repository Guidelines

## Project Structure & Modules
- `client/`: Vite + React UI (entry: `client/src/main.tsx`, routes in `client/src/pages/`).
- `server/`: Express server (entry: `server/index.ts`), routes in `server/routes.ts`, Vite middleware in `server/vite.ts`.
- `shared/`: Cross-cutting TypeScript utilities and types.
- `tests/`: Playwright E2E tests grouped by feature (e.g., `tests/gigs/`).
- `supabase/`: Auth/DB configuration and migration artifacts.
- `attached_assets/`: Static assets referenced by the client.
- Config: `tsconfig.json`, `vite.config.ts`, `drizzle.config.ts`, `.env.example`.

## Build, Test, and Development
- `npm run dev`: Start Express with TS (`tsx`); in dev it mounts Vite for the client at `/:` and serves API at `/api/*`.
- `npm run build`: Build client with Vite into `dist/public` and bundle server to `dist/index.js`.
- `npm start`: Run production server from `dist`.
- `npm run check`: Type-check the project with `tsc`.
- `npm run db:push`: Apply Drizzle schema to the database.
- `npm test` / `test:*`: Run Playwright tests (`test:ui`, `test:headed`, `test:debug`, `test:mobile`, `test:report`).

## Coding Style & Naming
- TypeScript strict mode; prefer explicit types at public boundaries.
- Indentation: 2 spaces; quotes: double ("…"); semicolons required.
- React: Components in PascalCase; hooks `use-*.tsx`; files in kebab-case (e.g., `rehearsal-form-modal.tsx`).
- Paths: use aliases `@/*` and `@shared/*` (see `tsconfig.json` & `vite.config.ts`).
- Styling: Tailwind CSS; co-locate component styles with the component.

## Testing Guidelines
- Framework: Playwright (`tests/` mirrors features: `landing/`, `home/`, `gigs/`, `rehearsals/`, `calendar/`, `earnings/`, `responsiveness/`).
- Naming: `*.test.ts` inside the feature folder; use `data-testid` selectors.
- Auth: tests mock authentication via `tests/setup/`; avoid real network calls.
- Run: `npm test -- tests/landing/landing.test.ts` or `npm test -- --grep "landing"`.

## Commit & Pull Requests
- Commits: concise, imperative subject (e.g., "Add Supabase auth callback"); include scope when helpful.
- PRs: clear summary, linked issues, test plan (commands + results), screenshots for UI, and checklist (lint/type-check/tests pass).
- CI expectation: `npm run check` and `npm test` must pass; include any DB changes with `npm run db:push` notes.

## Security & Config
- Copy `.env.example` to `.env`; never commit secrets. Required: `PORT`, Supabase keys, and DB URL.
- Prefer `@shared` for shared types to reduce drift between client/server.

## Supabase Auth Fix — 2025‑09‑13
- Context: An external agent was brought in to fix a login loop after migrating to Supabase.
- Changes: client now sets the Supabase session and adds `Authorization: Bearer <token>` on API calls; `/auth/callback` handled client-side.
- Setup: Use port `5000` locally, set Supabase Site URL `http://localhost:5000` and Redirect `http://localhost:5000/auth/callback`.
