# SoundCheck Code Review — Recommendations

This document summarizes a full repository review and provides concrete, prioritized recommendations. It focuses on correctness, security, test reliability, maintainability, and alignment with the Supabase migration.

## Top Priorities (Fix First)

- Logout flow mismatch: The UI calls `GET /api/logout` but only `POST /api/auth/logout` exists under the new Supabase auth. Also, server-side `supabase.auth.signOut()` uses the service role client, which does not sign out an end-user session.
  - Recommendation: Handle logout on the client using `supabase.auth.signOut()` and then redirect. Change the Home header button to:
    - `onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}`
  - Optionally add a server GET shim at `/api/logout` that returns 204 so existing links/tests won’t 404, but prefer the client approach.

- Hard‑coded Supabase URL in OAuth login redirect: `server/supabaseAuth.ts` builds an auth URL with a hard-coded project domain.
  - Recommendation: Replace the hard-coded URL with `process.env.SUPABASE_URL` and use that to construct the authorize URL.

- Tests no longer reflect the Supabase-based login model:
  - `tests/landing/landing.test.ts` expects navigating to `/api/login`, but the app now routes to `/login` (email/password screen).
  - Several tests assume auth state via `GET /api/auth/user` mocks, but gating now relies on the Supabase client session (`useAuth`), not the API.
  - Recommendations:
    - Update the landing test to expect navigation to `/login` (or switch the button back to `window.location.href = "/api/login"` if you want OAuth-first again).
    - Provide a test helper to simulate a Supabase session for the browser (e.g., navigate to `/auth/callback#access_token=fake&refresh_token=fake` and rely on route logic to set the session; then mock API calls as currently done). Because our data fetching mocks responses, the tokens need not be valid.

- Service role client used for user data operations: `server/lib/supabase.ts` creates a Supabase client with the Service Role key while `storage.ts` performs CRUD. This bypasses RLS and relies entirely on code-level `user_id` filters.
  - Recommendation: For per-user operations, create a per-request Supabase client using the ANON key and the end-user JWT so that RLS enforces scoping:
    - `const supabaseForUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: \
      'Bearer ' + userJwt } } });`
    - Pass this client (or the JWT) into storage methods; remove service-role usage from regular CRUD paths. Keep the service role only for admin actions (e.g., email auto-confirm during development).

## Security & Privacy

- PII in logs: `server/supabaseAuth.ts` logs signup payloads (email, names) and errors; `server/index.ts` logs JSON API responses (potentially user data).
  - Recommendation: Remove or redact PII from logs, and only log minimal metadata in production. Avoid logging entire JSON responses.

- OAuth callback and token handling:
  - Current callback hands tokens to the client via URL fragment which the client consumes to set the Supabase session. This is acceptable; ensure HTTPS in production and short-lived access tokens.
  - Ensure `PORT=5000`, Supabase Site URL, and Redirect URL are set as specified.

## Auth & Routing Consistency

- Remove legacy Replit auth or quarantine it: `server/replitAuth.ts`, the `sessions` table in `shared/schema.ts`, and related dependencies are legacy.
  - Recommendation: Delete or clearly separate legacy auth files and unused tables. If keeping short-term, mark them experimental/legacy and ensure they are not imported anywhere.

- Align routes and UI:
  - Decide on the primary entry point for sign-in: OAuth at `/api/login` or email/password at `/login`. Make the landing button and tests reflect that single source of truth.

## API Layer & Storage

- Prevent accidental cross-user writes even with service role:
  - While current queries filter by `user_id`, migrate to the “per-user client” pattern so RLS enforces access as defense-in-depth.

- N+1 query pattern in `getRehearsals`: Fetching tasks for each rehearsal sequentially results in N+1 queries.
  - Recommendation: Either fetch tasks in a single query and group by `rehearsal_id`, or use a Supabase view/RPC to return rehearsals with tasks in a single round-trip.

- Input validation: Great use of Zod. Continue omitting `userId` from update payloads (already done) and perform `date` normalization (already done).

## Build, Config, and Documentation

- README and `.env.example` drift:
  - README still references Replit OIDC sessions and `DATABASE_URL` for tests; `.env.example` comments out `DATABASE_URL` entirely.
  - Recommendations:
    - Update README to reflect Supabase as the sole auth provider and correct login flow.
    - Either remove `db:push` if not used, or include `DATABASE_URL` in `.env.example` and document when it’s needed (e.g., Drizzle local workflows versus Supabase SQL migrations in `supabase/migrations/`).
    - Add `PORT=5000` to `.env.example` for clarity.

- Vite in dev and static in prod: Configuration looks solid. `server/vite.ts` reads and transforms `index.html` in dev; production uses `dist/public`.
  - Minor: Ensure that importing `vite.config.ts` from the server does not risk bundling dev-only dependencies into prod. Current conditional guards are OK.

## Testing

- Update tests to the Supabase session model:
  - Provide a helper that visits `/auth/callback#access_token=fake&refresh_token=fake` to seed a client session, then navigate to the app, and continue mocking `fetch("/api/...")` as done today.
  - Update `tests/landing/landing.test.ts` expectation to `/login` if the email/password page is the primary entry.

- Consider adding unit tests around storage behavior (filtering by `user_id`), especially if the service-role approach remains temporarily. E2E tests won’t catch missing filters until data leaks occur.

## Observability & Ops

- Logging and health:
  - Replace ad-hoc logging with a simple logger that can disable body logging in production.
  - Add a lightweight `/health` endpoint returning build info and uptime.

- Rate limiting:
  - Consider adding per-IP rate limiting for auth endpoints to prevent abuse.

## Minor UX/DevX Improvements

- Client fetch settings:
  - `credentials: "include"` is harmless, but cookies are not used for auth anymore. You can drop it for clarity.

- Consistent naming:
  - Prefer consistent casing for model fields across client, shared types, and DB (already mostly consistent).

- Linting & formatting:
  - Consider adding ESLint with `@typescript-eslint` to catch unused imports and subtle mistakes; Prettier if desired. Keep rules aligned with current style.

## Suggested Patch Outline (follow-ups)

1) Client logout change in `client/src/pages/home.tsx` header button to call `supabase.auth.signOut()` then redirect.
2) Swap hard-coded Supabase auth URL in `server/supabaseAuth.ts` to use `SUPABASE_URL`.
3) Choose sign-in entry (OAuth vs email/password) and make both Landing and tests reflect it.
4) Migrate `storage.ts` to a per-request Supabase client using ANON key + user JWT; reserve service role for admin operations only.
5) Remove or isolate legacy Replit auth code and `sessions` table if not used.
6) Trim logs to metadata only; avoid PII and full JSON bodies in production logs.
7) Update README and `.env.example` to match the Supabase-first architecture.

---

If you want, I can implement the high-priority fixes (logout flow, auth URL env usage, landing/test alignment) in a small PR and propose the storage client refactor as a follow-up.

