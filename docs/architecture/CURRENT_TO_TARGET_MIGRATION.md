# M212 — Current repository inventory and target mapping

This document is based on the live repository tree and the owner-provided complete architecture specification.

## 1. Verified current layout

| Current path | Observed purpose | Target destination |
|---|---|---|
| `.github/workflows/` | CodeQL, dependency security, platform foundation, provider sandbox workflows | Retain and expand existing workflows |
| `source/` | Deployable React 19 + TypeScript + Vite storefront and portals | `apps/storefront/` only after Cloudflare migration gate |
| `source/src/features/storefront/` | Public pages, products, domain search, content, cart/checkout | `apps/storefront/src/features/{storefront,domains,hosting,servers,security-email,cart,checkout}/` |
| `source/src/features/client/` | Customer portal | `apps/storefront/src/features/customer/` |
| `source/src/features/reseller/` | Reseller portal | `apps/storefront/src/features/reseller/` |
| `source/src/features/admin/` + `cms/` | Admin, catalog, integrations, infra, CMS | `apps/storefront/src/features/admin/` and CMS submodule |
| `source/src/components/ui.tsx` | Current shared UI primitives | Extend/extract into `design-system/components/` |
| `source/src/components/layout/` | Public and portal layout shells | Shared design-system layouts + workspace layouts |
| `source/src/design-system/` | Theme provider/switcher and navigation contract | Target design system |
| `source/src/lib/`, `services/`, `types/` | Current data, auth, pricing, domain, order, SEO, service and model logic | Shared services, API, contracts and domain packages after dependency review |
| `backend/src/providers/contracts.ts` | Provider-neutral registrar/control-panel contracts | `packages/integrations/contracts/` |
| `backend/src/security/` | Server-side webhook/security foundation | API/worker security layer |
| `source/supabase/functions/_shared/provider-adapters/` | Existing provider adapter contracts and sandbox implementations | Canonical Supabase Edge Function shared integration layer |
| `source/supabase/functions/` | CMS scheduler, provider admin and worker Edge Functions | Root `supabase/functions/` after migration reconciliation |
| `source/supabase/migrations/` | CMS, provider, provisioning and audit migrations | Canonical root migration stream only after history reconciliation |
| `supabase/migrations/` | Platform foundation migration | Same canonical stream after verified reconciliation |
| `apps/`, `packages/`, `infra/` | Existing monorepo/infra starting points and README placeholders | Expand according to target boundaries |
| `cloudflare-pages/` | Existing deployment-related assets | Preserve until Pages config ownership is verified |
| `docs/` | Existing integration, migration, UX and operational docs | Complete architecture documentation |
| `reports/` | Target evidence and audit outputs | Add generated, evidence-backed reports |

## 2. Important current-state findings

- The storefront package is explicitly described as a frontend demo release. Its current auth/data/domain/payment behavior must not be represented as production-ready.
- Existing app root is `source/`; changing Cloudflare root is a separate deployment migration.
- Provider contracts exist in `backend/src/providers/contracts.ts`; sandbox adapters and Edge Functions exist under `source/supabase/functions/`.
- Two distinct migration directories currently exist: `supabase/migrations/` and `source/supabase/migrations/`. This is a critical migration ownership question. Do not blindly merge, copy, reorder, or apply either set.
- Current route definitions are centralized in `source/src/router.tsx`; keep route compatibility and derive an inventory from this file before reorganizing pages.
- Existing CI workflows already cover security, CodeQL, platform foundation and provider sandbox. Extend these; avoid redundant workflows.

## 3. Target workspace mapping

| Target area | Current implementation | Status |
|---|---|---|
| Public storefront | `source/src/features/storefront` | Existing; incremental UX migration |
| Domain search and registration | `storefront/DomainPages`, `lib/domain.ts`, registrar services/adapters | Partial/demo; provider sandbox path exists |
| Hosting/VPS/dedicated/SSL/email | `storefront/ProductPages`, admin catalog/infra | Existing UI; provisioning needs provider verification |
| Cart/checkout/payments | `storefront/CartCheckout`, `services/payment.ts` | Demo UI; live payment not asserted |
| Customer portal | `features/client` | Existing; map each route and service |
| Reseller portal | `features/reseller` | Existing; map each route and service |
| Admin/CMS | `features/admin`, `features/cms` | Existing; reconcile CMS Supabase integration |
| Super Admin | Existing Admin Integration/Infra/System areas | Partial; expand after permissions and telemetry inventory |
| Shared design system | `components/ui.tsx`, `design-system`, `styles.css` | Foundation exists |
| Provider layer | `backend/src/providers`, Edge shared adapters | Partial; sandbox only until verified |
| Monitoring | Existing admin system and platform workflows | Target architecture; telemetry source inventory required |
| Security/RBAC/RLS | backend security, provider-admin, Supabase policies/migrations | Partial; must be audited end-to-end |
| CI/testing | current Vitest tests and GitHub workflows | Existing base; target matrix incomplete |
| Infrastructure/deployment | Cloudflare Pages, `infra/`, `cloudflare-pages/` | Existing; preserve build boundary |

## 4. Non-negotiable migration controls

1. Never bulk-move `source/` before a tested Cloudflare preview and rollback.
2. Never create a second copy of an existing page or business service to satisfy a target filename.
3. Never invent metrics or label unconfigured integrations as healthy.
4. Never expose provider/payment/email credentials to browser code or Git.
5. Never treat role-based UI visibility as authorization.
6. Never create duplicate database tables or migration histories.
7. Keep sandbox as the default environment and production actions disabled until owner-approved release.
8. Keep route aliases/redirects and existing user flows working throughout migration.

## 5. Execution order and acceptance

- **A0 Inventory:** route, file, schema, migration, Edge Function, provider, env var and workflow inventory. Acceptance: machine-readable inventory plus owner-reviewed architecture decisions.
- **A1 Foundation:** shared theme, tokens, navigation, app provider contracts and tests.
- **A2 Storefront:** reference-matched home/domain search/catalog/cart/checkout without breaking SEO or route behavior.
- **A3 Customer + Reseller:** workspace-specific shells, permissions, service integrations and E2E journeys.
- **A4 Admin + Super Admin:** modules and navigation; real APIs and data source labels; audit trail for privileged actions.
- **A5 Data + backend:** canonical Supabase migration stream, generated types, RLS tests, Edge Function tests and idempotency.
- **A6 Integrations:** Openprovider, Namecheap, OVH, Proxmox, Plesk, CMI, Stripe and Resend sandbox contract tests.
- **A7 Observability/security:** real collectors, source freshness, RBAC/tenant isolation, audit and secret scanning.
- **A8 Release:** full CI, accessibility, responsive, visual, E2E, Cloudflare preview and rollback.

No phase is complete solely because directories or placeholder files exist.
