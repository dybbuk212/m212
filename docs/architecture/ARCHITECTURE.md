# M212 — Complete Repository Architecture

**Product:** M212.MA — Unified Domain Registrar, Hosting, Reseller and Infrastructure Platform  
**Architecture:** Modular monolith with feature-based React frontend and server-side integration boundary  
**Frontend:** React 19 · TypeScript · Vite · Tailwind CSS v4  
**Backend:** Supabase · PostgreSQL · Edge Functions; Node backend contracts/services where already present  
**Deployment:** Cloudflare Pages for the current storefront  
**Providers:** Openprovider · Namecheap · OVH · Proxmox · Plesk  
**Payments:** CMI · Stripe  
**Email:** Resend

> This document is the target architecture specification. It distinguishes existing implementation from planned target modules. A directory name, interface or design document is not proof that a production integration exists.

## 1. Architecture principles

1. Preserve the current working storefront and its routes while migrating incrementally.
2. Use feature-based modules and shared design-system primitives; do not create parallel implementations of existing pages.
3. Keep domain logic and provider contracts framework-neutral.
4. Keep all registrar, Proxmox, Plesk, CMI, Stripe and Resend secrets on trusted server-side execution paths.
5. Use Supabase RLS and server-side authorization as security boundaries. Client route guards and menu visibility are UX only.
6. Make provisioning, payment callbacks and webhooks idempotent, auditable and retry-safe.
7. Show monitoring data only when an actual source is configured; otherwise show NOT CONFIGURED / NO DATA.
8. Preserve sandbox-first provider behavior. Production actions require explicit configuration and release approval.
9. Maintain one authoritative migration history and one generated database type source.
10. Every migration is incremental, reversible where possible, tested, and accompanied by an operational rollback plan.

## 2. Repository topology and deployment boundary

The current repository already contains `.github/`, `apps/`, `backend/`, `cloudflare-pages/`, `docs/`, `infra/`, `packages/`, `source/`, and `supabase/`. The current customer-facing Vite application remains under `source/`.

Current Cloudflare Pages contract:
- Root / working directory: `source/`
- Install: `npm ci --no-audit --no-fund`
- Build: `npm run build`
- Output: `dist/`

Do not change the Pages root to `apps/storefront/` until a dedicated migration PR proves preview build, route fallback, environment variables, asset paths and rollback.

### Target root

```text
m212/
├── .github/                 # CI, security, accessibility, visual and release workflows
├── apps/
│   ├── storefront/          # future home of source/ after Cloudflare migration gate
│   ├── api/                 # authenticated application API / orchestration
│   └── worker/              # async provisioning, webhooks, retries and schedules
├── backend/                 # existing provider contracts/security foundation; migrate deliberately
├── packages/
│   ├── contracts/           # transport-neutral schemas, DTOs and events
│   ├── domain/              # domain entities, policies and value objects
│   ├── database/            # generated Supabase DB types and query helpers
│   ├── integrations/        # provider ports and server adapters
│   ├── config/              # shared TS/lint/test configuration
│   └── observability/       # logs, metrics and tracing contracts
├── source/                  # current deployable Vite app (temporary compatibility location)
├── supabase/                # canonical future Supabase root after migration reconciliation
├── infra/                   # Cloudflare, Docker, monitoring and environment templates
├── docs/                    # architecture, UX, modules, integrations, security and runbooks
├── reports/                 # audit, quality, security and release evidence
├── tests/                   # unit, integration, security, a11y, performance and visual
├── e2e/                     # Playwright journeys by workspace
└── scripts/                 # validation, generation, migration and release scripts
```

## 3. Frontend application architecture

The target frontend is organized by application shell, design system, route guards, workspace layouts, feature modules, shared services and styles.

### App composition

`src/app/`: app entry, configuration, providers, router, route types and error boundaries. Providers include Auth, Theme, Locale, Query, Notifications and ErrorBoundary.

`src/app/guards/`: AuthGuard, GuestGuard, RoleGuard, PermissionGuard, TenantGuard and FeatureGuard. These improve UX but never replace backend authorization.

`src/config/`: navigation, roles, permissions, features, providers, localization and environment configuration.

### Design system

`src/design-system/` owns tokens, light/dark/system theme behavior, reusable controls, navigation, public/dashboard shells and responsive hooks. Components include buttons, inputs, selects, dropdowns, cards, data tables, tabs, modals, drawers, badges, feedback states and charts.

The current implementation begins at `source/src/design-system/`, `source/src/styles.css`, `source/src/components/ui.tsx`, and `source/src/components/layout/`. Extend these; do not create a second component library.

### Workspace layouts

- Public: acquisition and commerce.
- Customer: own domains, DNS, hosting, servers, orders, billing, renewals and support.
- Reseller: customer portfolio, products, pricing, orders, invoices, commissions, reports and API.
- Admin: operational customers, resellers, catalogue, orders, subscriptions, billing, support, CMS, staff and reports.
- Super Admin: global identity, provider connections, credentials metadata, infrastructure, Proxmox, Plesk, API management, monitoring, observability, security, automation and deployments.

The target layout files are PublicLayout, CustomerLayout, ResellerLayout, AdminLayout and SuperAdminLayout. Current shared portal routing/layout must be mapped and migrated incrementally.

### Feature modules

`features/` contains:
- storefront
- domains
- hosting
- servers
- security-email
- cart
- checkout
- customer
- reseller
- admin
- super-admin
- auth
- settings

Each feature owns pages, components, hooks, services and types where applicable. Existing `source/src/features/storefront`, `client`, `reseller`, `admin` and `cms` are the starting implementation. Avoid duplicate page implementations during migration.

### Shared frontend services

`shared/api`, `shared/supabase`, `shared/hooks`, `shared/utils`, `shared/types` and `shared/constants` contain typed clients, generated database types, formatting, validation and reusable contracts. Do not duplicate types already generated from the database or declared in backend contracts.

## 4. Supabase and data architecture

Target Supabase root:
- `supabase/config.toml`
- `supabase/migrations/`
- `supabase/functions/_shared/`
- `supabase/functions/` for domain search/register/transfer, orders, CMI/Stripe, webhooks, provider health/dispatch, server monitor, Plesk/Proxmox, email, notifications, metrics, audit and scheduled renewals
- `supabase/seed/`
- `supabase/tests/rls`, `functions`, `migrations`

### Existing migration state — reconciliation required

The repository currently has migration files in both:
- `supabase/migrations/` (platform foundation)
- `source/supabase/migrations/` (CMS, provider connections, provisioning and audit hardening)

This is a migration ownership risk. Do not apply, copy, rename or delete either history blindly. Before any schema deployment:
1. Inspect Supabase project migration history and `supabase_migrations.schema_migrations`.
2. Compare both local directories by timestamp, object definitions and dependency order.
3. Determine which directory is configured/deployed in each environment.
4. Produce a reviewed, collision-free canonical migration sequence.
5. Validate on a disposable Supabase project and run RLS/function tests.
6. Only then move configuration/functions/migrations and update CI/deploy workflows.

Never recreate existing tables or silently renumber deployed migrations.

## 5. Provider integration architecture

Provider ports live in neutral contracts. Concrete clients and adapters are server-only.

Target providers:
- Registrars: Openprovider, Namecheap, OVH
- Hypervisor: Proxmox
- Hosting control panel: Plesk
- Payments: CMI, Stripe
- Email: Resend

Target integration layout:
`integrations/contracts/`, `registrars/{openprovider,namecheap,ovh}/`, `infrastructure/proxmox/`, `hosting/plesk/`, `payments/{cmi,stripe}/`, `email/resend/`, `registry/`.

Existing provider contracts: `backend/src/providers/contracts.ts`. Existing sandbox adapters/functions: `source/supabase/functions/_shared/provider-adapters/`, `provider-admin/`, `provider-worker/`. Preserve them and reconcile interfaces before adding implementations.

Every adapter must expose typed capabilities, health state, sandbox/production environment, timeouts, retry policy, idempotency and sanitized errors. No secret values in browser bundles, database metadata or logs.

## 6. Monitoring and observability

Target `monitoring/` contains contracts, application/server/database/provider/Edge Function/network collectors, metrics/health/incident/alert services, and Cloudflare/Supabase/Proxmox/Plesk/provider adapters.

Super Admin must distinguish:
- HEALTHY / DEGRADED / DOWN only when backed by actual health checks
- NOT CONFIGURED when credentials or data source are absent
- NO DATA when the source is configured but has no measurement
- STALE when last successful observation exceeds its freshness threshold

Each metric includes source, observed_at, unit, scope and status. Never fabricate CPU, RAM, uptime, latency, payment or provider data. Monitoring is read-only by default.

## 7. Security architecture

Target `security/` separates authentication/session, RBAC/permissions, tenant context/isolation, secret references/credential metadata, audit and input/request validation.

Requirements:
- Verify identity and permissions server-side for every privileged operation.
- Enforce tenant boundaries in SQL RLS and backend policy checks.
- Prevent self-assignment of privileged roles.
- Store secret material in a secret manager / Supabase Vault; database stores references and non-sensitive metadata only.
- Verify webhook signatures and enforce replay protection/idempotency.
- Redact credentials, payment data and personal data from logs.
- Audit privileged provider, infrastructure, billing and identity actions.
- Use least-privilege service roles and explicit CORS allowlists.

## 8. Testing architecture

Target:
- `tests/unit/`: design system, navigation, themes, domains, cart, checkout
- `tests/integration/`: Supabase, providers, payments, authentication, authorization
- `tests/security/`: RBAC, tenant isolation, secret exposure, route protection
- `tests/accessibility/`: navigation, themes and dashboards
- `tests/performance/`: storefront and dashboard
- `tests/visual/`: homepage, customer, reseller, admin, super-admin
- `e2e/`: public, customer, reseller, admin, super-admin and shared journeys

Quality gates: format/lint, typecheck, unit, integration, RLS, security, accessibility, visual, E2E and production build. Preserve currently configured workflows and expand them rather than adding duplicate workflows with overlapping responsibilities.

## 9. Infrastructure and deployment

Target `infra/cloudflare/`, `infra/docker/`, `infra/monitoring/`, `infra/scripts/`, `infra/environments/`. Environment files are examples only. Secrets belong in protected GitHub/Cloudflare/Supabase secret stores, never Git.

Keep Cloudflare Pages storefront build stable during migration. Add staging/preview, health check, deployment verification, rollback and backup procedures before changing production topology.

## 10. Documentation and reports

Documentation areas:
- `docs/architecture/`: system, frontend, backend, database, provider and monitoring architecture
- `docs/ux-ui/`: design system, visual reference, navigation, themes, component catalog, responsive and accessibility
- `docs/modules/`: storefront, customer, reseller, admin, super-admin
- `docs/integrations/`: Openprovider, Namecheap, OVH, Proxmox, Plesk, CMI, Stripe, Resend
- `docs/security/`: RBAC, RLS, tenant isolation, secrets and audit
- `docs/operations/`: deployment, rollback, backup, incident response and runbooks
- `docs/testing/`: strategy, E2E, accessibility and performance

Reports must contain evidence and timestamped results, not claims without test output.

## 11. Implementation gates

| Gate | Scope | Exit criteria |
|---|---|---|
| A0 | Inventory and architecture ownership | Route/file/provider/function/migration inventory committed |
| A1 | Frontend foundation | Shared theme, navigation, tokens and tests |
| A2 | Storefront | Reference-aligned homepage, search, catalogue, cart and checkout regression |
| A3 | Customer/reseller | Role-specific shells, routes, permissions and E2E |
| A4 | Admin/Super Admin | Operational workspaces with real data contracts and server authorization |
| A5 | Backend/data | Canonical migrations, RLS, generated types, Edge Functions and idempotency tests |
| A6 | Integrations | Sandbox contract tests for each configured provider |
| A7 | Monitoring/security | Real telemetry, audit, incident and secret-exposure tests |
| A8 | Release | Accessibility, performance, visual, E2E, Cloudflare preview and rollback verification |

No gate is passed by creating placeholder files. A gate passes only with executable tests or verifiable operational evidence.
