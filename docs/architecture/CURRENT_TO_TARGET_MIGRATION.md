# M212 current-to-target repository migration map

## Verified current repository shape

The repository currently uses a multi-area layout with the deployed Vite application under `source/`, backend contracts under `backend/`, shared package placeholders under `packages/`, deployment output under `cloudflare-pages/`, and Supabase migrations/functions under `source/supabase/`. The Cloudflare Pages build contract remains rooted at `source/` and outputs `dist/`.

Existing frontend areas include:

- `source/src/features/storefront/`
- `source/src/features/client/`
- `source/src/features/reseller/`
- `source/src/features/admin/`
- `source/src/features/cms/`
- `source/src/components/layout/`
- `source/src/components/ui.tsx`
- `source/src/router.tsx`

Existing provider sandbox functions and adapters are under `source/supabase/functions/`; migrations already exist and must remain the canonical history until an explicitly reviewed migration plan says otherwise.

## Target-to-current mapping

| Target capability | Current location / action |
|---|---|
| Public storefront | Retain `source/src/features/storefront/` |
| Customer portal | Retain `source/src/features/client/`; do not rename routes in the foundation change |
| Reseller portal | Retain `source/src/features/reseller/` |
| Admin | Retain `source/src/features/admin/` and `source/src/features/cms/` |
| Super Admin | Extend existing `AdminIntegrationDashboard.tsx`, `AdminInfra.tsx`, `AdminSystem.tsx` and their current routes after route audit |
| Shared components | Extend `source/src/components/ui.tsx`; extract components incrementally when justified |
| Shared navigation | Current public header is in `components/layout/SiteLayout.tsx`; role navigation is in `components/layout/PortalLayout.tsx`; consolidate in a later bounded change |
| Themes | Current design tokens and dark CSS variables are in `source/src/styles.css`; this change adds user-selectable Light/Dark/System preference |
| Provider adapters | Retain `source/supabase/functions/_shared/provider-adapters/` and server-side functions |
| Database | Preserve existing `source/supabase/migrations/`; add only new timestamped migrations after schema review |
| Deployment | Preserve `source/` Cloudflare Pages root and `dist/` output |

## Migration principles

1. No bulk directory moves in the foundation PR.
2. No route renames or removal of existing routes.
3. No duplicate Supabase schema or second migration history.
4. No fake provider telemetry or invented live monitoring.
5. No provider credentials in browser code.
6. Role-based menu visibility is not authorization; server-side checks and RLS remain authoritative.
7. Migrate one feature area at a time with tests and screenshots.

## Planned sequence

1. Foundation: shared tokens, Light/Dark/System preference, navigation contract and architecture documentation.
2. Public storefront: match the approved homepage reference and preserve domain search/checkout behavior.
3. Customer and reseller: migrate existing portal shells and pages to shared components.
4. Admin: consolidate commerce, catalogue, CMS, support and infrastructure navigation.
5. Super Admin: provider, API, server, Supabase, Edge Function and application monitoring using real configured telemetry sources only.
6. Verification: route coverage, role authorization, themes, accessibility, responsive behavior, tests and Cloudflare preview.
