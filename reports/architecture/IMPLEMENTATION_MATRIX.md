# M212 Architecture Implementation Matrix

**Baseline:** live `main` repository inventory reviewed against the owner-provided complete architecture specification.  
**Rule:** status describes evidence in the repository, not intended future capability.

| Domain | Current evidence | Status | Next concrete action |
|---|---|---|---|
| App shell / router | `source/src/main.tsx`, `router.tsx` | Implemented baseline | Extract route inventory and route-level authorization tests |
| Shared theme | `source/src/design-system/theme`, `styles.css` | Foundation | Add component coverage and theme visual/a11y tests |
| Navigation | `SiteLayout`, `PortalLayout`, navigation config | Partial | Role-aware menu definitions and shared nav rendering |
| Public storefront | `features/storefront` | Existing demo app | Match approved visual reference; preserve domain-first flow |
| Domains | Domain pages/lib/registrar services | Partial/demo | Connect only sandbox provider search/register with contract tests |
| Hosting/servers/security/email | Product pages + admin catalog/infra | UI baseline | Define service lifecycle and provider-backed provisioning |
| Cart/checkout | CartCheckout + payment service | Demo | Implement server-side order/payment lifecycle; sandbox first |
| Customer portal | `features/client` | Existing UI | Validate route coverage, tenant isolation and data repositories |
| Reseller portal | `features/reseller` | Existing UI | Validate customer scoping, pricing/commissions and API scopes |
| Admin/CMS | `features/admin`, `features/cms` | Existing UI + CMS backend foundation | Replace demo persistence with typed Supabase repositories |
| Super Admin | Integration/infra/system admin modules | Partial | Complete global control plane with real status sources |
| Provider contracts | `backend/src/providers/contracts.ts` | Implemented contracts | Align Edge adapters and backend types |
| Provider adapters | `source/supabase/functions/_shared/provider-adapters` | Sandbox foundation | Add per-provider contract tests and error/retry/idempotency behavior |
| Payments | CMI/Stripe selections; current UI service | Not production-proven | Server-only adapters, signature verification, replay protection |
| Email | Resend selected | Not production-proven | Server-only adapter, template tests and delivery event handling |
| Supabase schema | Root and nested migration directories | Ownership unresolved | Compare applied migration history; establish one canonical stream |
| Edge Functions | CMS scheduler, provider admin, provider worker | Partial | Inventory callers, auth, env vars and deployed function names |
| RBAC/RLS | SQL policies, provider admin auth and backend security | Partial | Cross-role and cross-tenant negative tests |
| Monitoring | Target spec; current admin system/CI | Not fully connected | Implement source registry and NOT CONFIGURED/STALE states |
| Observability | Target spec | Not verified | Instrument logs/metrics/traces with correlation IDs |
| CI/CD | Existing security, CodeQL, platform and provider workflows | Baseline | Add tests only after stable scripts and avoid duplicate workflows |
| Tests | Current Vitest tests | Partial | Unit/integration/RLS/a11y/visual/E2E matrix |
| Cloudflare | Pages deploy workflow/comment evidence | Existing | Keep source root until a dedicated migration succeeds |
| Docs/reports | Architecture, integration and UX docs | Partial | Keep this matrix updated with commit/run evidence |

## Release blockers before production

1. Confirm one canonical Supabase migration stream and applied remote history.
2. Replace demo auth/data/domain availability/payment flows where production behavior is required.
3. Verify backend authorization and tenant isolation with negative tests.
4. Prove provider/payment/email sandbox contract tests.
5. Prove observability sources and freshness; no synthetic health claims.
6. Pass CI, E2E, accessibility, visual and production build gates.
7. Verify Cloudflare deployment, secrets, route fallback and rollback.

## Change control

Every architecture PR must state: target paths, existing paths reused, files moved (if any), route impact, DB migration impact, provider/security impact, test evidence, deployment impact and rollback plan.
