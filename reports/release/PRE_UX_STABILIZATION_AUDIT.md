# M212 Pre-UX Stabilization Audit

Date: 2026-11-14
Source archive inspected: `m212-main (1).zip`
Repository: `dybbuk212/m212`
Branch: `stabilize/m212-pre-ux-foundation`

## Executive verdict

**PASS WITH BLOCKERS — UI/UX entry is NOT AUTHORIZED yet.**

The archive contains the React/Vite application source, but the current GitHub branch being repaired does not contain the complete `source/src/` application tree. The archive describes itself as a frontend demonstration release. It is not evidence of production-connected registrar, hosting, billing, payment or infrastructure provisioning.

## Verified findings

1. The ZIP contains `source/src/main.tsx`, router, storefront, customer, reseller, admin and CMS modules.
2. The ZIP has six Supabase migration files. Two shared the version prefix `20261114000400`:
   - `20261114000400_provider_sandbox_jobs.sql`
   - `20261114000400_provisioning_jobs.sql`
3. The provisioning migration has been moved to the unique version `20261114000410_provisioning_jobs.sql` on this branch. The duplicate-version file was removed.
4. The source package requires Node `>=22.22.2`. This branch pins `source/.nvmrc` to `22.22.2`.
5. The local verification environment only has Node `22.16.0`. `npm ci` was attempted but timed out; it emitted engine warnings for the project and dependencies. No build or test result is claimed.
6. The archive's own acceptance report explicitly describes a frontend demo release and lists real authentication, database/API and registrar APIs as unfinished. Local browser data is not a substitute for production persistence.
7. The repository's current `source/index.html` references `/src/main.tsx`, but the complete `source/src/` application tree is not present in the current GitHub main snapshot inspected during this task. The archive must be restored to a dedicated branch before a real application build can be verified.

## Work completed on this branch

- Added `source/.nvmrc` with Node `22.22.2`.
- Added `source/supabase/migrations/20261114000410_provisioning_jobs.sql`.
- Removed the duplicate-version provisioning migration `20261114000400_provisioning_jobs.sql`.

## Remaining release blockers

### P0 — Source recovery and build
- Restore the complete, owner-approved `source/src/` tree from the inspected archive.
- Verify that the restored tree matches the archive and that the Cloudflare root remains `source`.
- Run `npm ci`, `npm run typecheck`, `npm test`, and `npm run build` with Node 22.22.2 or newer.
- Verify the actual Cloudflare Pages preview deployment.

### P0 — Database safety
- Reconcile all migrations against the live Supabase migration history before applying anything.
- Run migrations against a disposable clean database and a staging database.
- Verify Vault extension availability, RPC grants, RLS policies and service-role-only access.
- Do not apply these changes to production until the owner approves and a backup is verified.

### P1 — Authentication and tenant security
- Replace demo role selection with Supabase Auth sessions.
- Verify server-side authorization and RLS for every role.
- Add negative cross-tenant tests for customers, resellers, invoices, tickets and services.
- Verify session expiry, password recovery, MFA policy and audit trails.

### P1 — Commercial workflows
- Replace local demo persistence for orders, customers, invoices, CMS and services with server-side persistence.
- Verify domain availability/pricing/registration/renewal/transfer through real registrar sandbox contracts.
- Verify cart price calculation, tax rules, coupons, order transitions and invoice consistency server-side.
- Verify CMI/Stripe sandbox webhooks, signature validation, replay protection and event deduplication.
- Verify hosting/VPS/SSL/email provisioning through provider sandbox adapters with idempotency, retries, timeout handling and manual-review states.

### P1 — Operations and observability
- Use only real provider/database/Cloudflare telemetry; represent missing telemetry as UNKNOWN or NOT CONFIGURED.
- Add structured logs, correlation IDs, alerting, backup verification and rollback runbooks.
- Keep all real payments and provisioning disabled until separately authorized.

## UI/UX entry criteria

UI/UX implementation may begin only after:
- the full application source is restored to GitHub;
- clean install, typecheck, tests and production build pass;
- migrations are uniquely versioned and verified on staging;
- authentication, authorization and tenant isolation tests pass;
- the key storefront and portal workflows have regression coverage;
- Cloudflare preview is verified.

## Safety boundary

This branch does not enable production provider credentials, real payment capture, live domain registration, live hosting provisioning or production database migrations. No production deployment was performed.
