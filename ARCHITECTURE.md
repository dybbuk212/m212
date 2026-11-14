# M212.MA — Repository architecture

## Current deployment boundary

The existing Cloudflare Pages application remains in `source/` until the storefront has been moved with a tested deployment change. Its current build contract is:

- Working directory: `source/`
- Install: `npm ci --no-audit --no-fund`
- Build: `npm run build`
- Output: `dist/`

Do not change the Cloudflare Pages root directory as part of a structural-only change.

## Target monorepo

```text
m212/
├── apps/
│   ├── api/                 # NestJS HTTP API; server-only secrets
│   ├── worker/              # async provisioning, webhooks and scheduled jobs
│   └── storefront/          # future home of source/ after migration gate
├── packages/
│   ├── contracts/           # versioned API DTOs, events and schemas
│   ├── domain/              # domain entities, value objects and policies
│   ├── database/            # generated DB types and query helpers
│   ├── integrations/        # provider ports and adapters
│   ├── config/              # shared TS, lint and test configuration
│   └── observability/       # logging, tracing and metrics contracts
├── infra/
│   ├── cloudflare/          # Pages, DNS, WAF and deployment config
│   ├── docker/              # local development services
│   └── ci/                  # reusable CI scripts
├── supabase/
│   ├── migrations/          # canonical database migrations
│   ├── functions/           # Edge Functions
│   └── tests/               # pgTAP / SQL authorization tests
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── runbooks/
│   └── security/
└── source/                  # current storefront; temporary compatibility location
```

## Dependency direction

- `apps/*` may depend on `packages/*`.
- `packages/domain` must not depend on frameworks, Supabase SDKs or provider SDKs.
- `packages/contracts` contains transport-neutral schemas and event contracts.
- Provider-specific SDKs stay behind interfaces in `packages/integrations`.
- Browser applications must never import service-role keys, payment secrets or registrar credentials.
- Database migrations are the source of truth; generated types are derived from the applied schema.

## Application boundaries

| Component | Responsibility | Runtime |
|---|---|---|
| Storefront | SEO pages, domain search, cart and customer UI | Cloudflare Pages |
| API | AuthZ, checkout orchestration, orders, billing and provisioning commands | Node.js service |
| Worker | Retryable jobs, registrar/Plesk provisioning, webhooks and scheduled tasks | Worker process |
| Supabase | PostgreSQL, Auth, Storage and selected Edge Functions | Managed |
| Integrations | Registrar, DNS, Plesk, payments, email and observability adapters | Server-side only |

## Migration rules

1. Keep `source/` deployable until the new workspace build is green.
2. Move files in bounded PRs; preserve import aliases and Cloudflare build settings.
3. Never maintain two competing copies of a schema or migration history.
4. Every schema change must include migration, generated type update and authorization tests.
5. Do not enable production checkout or provisioning until provider sandbox tests pass.
6. Keep demo data and demo auth unavailable in production builds.

## Quality gates

Every PR must pass formatting/lint, TypeScript, unit tests, database migration tests, dependency audit and production builds for every affected app. Integration tests must cover tenant isolation, role authorization, idempotency, webhook signature verification and provisioning retries.
