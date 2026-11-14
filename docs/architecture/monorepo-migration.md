# Monorepo migration plan

## Current state

The React/Vite application and its npm lockfile live in `source/`. Supabase CMS migrations and Edge Functions currently live under `source/supabase/`. The storefront README explicitly identifies the frontend as demo mode: localStorage/IndexedDB, simulated domain availability, no real payment, and no real provisioning.

## Migration sequence

### M0 — Establish boundaries (this change)
- Document target layout, dependency direction, deployment contracts and schema ownership.
- Add stable package/app ownership descriptions.
- Keep current deployment path unchanged.

### M1 — Toolchain and workspace
- Choose and pin one workspace manager (recommended: pnpm) and one root lockfile.
- Add root scripts for typecheck, lint, tests, build and affected-workspace checks.
- Add shared TypeScript, ESLint and Vitest configuration.
- Preserve a compatibility build for Cloudflare Pages until the storefront move is verified.

### M2 — Canonical database layer
- Promote Supabase migrations to root `supabase/migrations`.
- Keep Edge Functions at root `supabase/functions`.
- Add local Supabase config, seed fixtures and pgTAP authorization tests.
- Generate TypeScript database types from the applied schema.
- Do not copy migration files into multiple locations; move history once and update deployment automation.

### M3 — Shared contracts and domain
- Extract request/response schemas and event contracts into `packages/contracts`.
- Extract domain rules into `packages/domain` with no infrastructure imports.
- Generate API and database types; do not hand-maintain duplicate definitions.

### M4 — API and worker
- Add `apps/api` for authenticated HTTP APIs and orchestration.
- Add `apps/worker` for async provisioning, webhook processing and retry queues.
- Implement idempotency keys, outbox/inbox records, retry policy and dead-letter handling.

### M5 — Storefront move
- Move `source/` to `apps/storefront/` only after Cloudflare Pages can build the new path in a preview deployment.
- Update Pages root directory and build command in the same deployment PR.
- Remove old path only after a successful production deployment and rollback window.

## Acceptance criteria

- One authoritative package manager and lockfile.
- One canonical migration directory and generated database type source.
- All apps build independently and from the monorepo root.
- CI runs affected app tests and a full integration matrix before release.
- Cloudflare deployment and rollback are documented and tested.
- No secret is exposed through Vite environment variables.
