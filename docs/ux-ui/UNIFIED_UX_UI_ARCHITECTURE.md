# M212 Unified UX/UI Architecture

## Approved direction

The owner-provided homepage screenshot is the canonical public storefront reference. Preserve the M212 logo and the screenshot's rounded white navigation, blue/lavender/white atmosphere, navy typography, red headline accent, teal primary action and domain-first hero.

Apply one common design language across public, customer, reseller, Admin and Super Admin experiences. Do not force identical content density or page layouts: reuse components and navigation patterns while adapting workspace content to the role.

## Common navigation

Primary menu: Domaines, Hébergement, Serveurs, Sécurité & Email, Tarifs, Support. Shared account controls: language, appearance, notifications, account/workspace and sign-in/sign-out. Workspace-specific operational navigation is supplied through role-aware configuration.

Menu visibility is not an authorization boundary. Existing authentication, backend authorization and Supabase RLS remain authoritative.

## Appearance modes

- Light: default visual direction based on the approved homepage and existing M212 brand tokens.
- Dark: accessible dark navy surfaces using the existing CSS variable system.
- System: follows operating-system preference and reacts to preference changes.
- Explicit user choice persists locally. Account-level synchronization can be added only through a verified profile preference field/migration.

## Shared component contract

Use shared components for header, navigation, account menu, language/theme selectors, buttons, inputs, search, cards, tables, tabs, badges, dialogs, drawers, notifications, empty states and loading/error states. Prefer extending existing `source/src/components/ui.tsx` and layout modules before extracting new component files.

## Workspace responsibilities

- Public: acquisition, SEO, domain search, catalogue, cart and checkout.
- Customer: own domains, DNS, hosting, servers, orders, billing, renewals and support.
- Reseller: own customers, portfolio, pricing, orders, commissions, reports and API access.
- Admin: operational customer, reseller, catalogue, commerce, CMS, support and reporting workflows.
- Super Admin: global provider configuration, infrastructure, API health, application monitoring, Supabase/Edge Function monitoring, security, audit and deployment visibility.

## Super Admin monitoring contract

Monitoring is read-only by default and must display actual telemetry with source, freshness timestamp, loading/error/no-data state. A source that is not configured must be labelled NOT CONFIGURED or NOT CONNECTED. Never invent CPU, RAM, uptime, API latency, payment or provider metrics. Operational controls are separate, permission-gated, confirmed and audited. Provider credentials remain server-side and sandbox mode remains the default.

## Accessibility and responsive behavior

Target WCAG 2.2 AA. Support keyboard navigation, visible focus, semantic landmarks, reduced motion and labels. Validate mobile widths down to 360px without horizontal page overflow. Theme changes must cover charts, tables, dialogs, dropdowns and notifications.

## Non-regression

Preserve current TanStack Router paths, domain/cart/checkout flows, locale/currency behavior, demo-mode disclosures, Supabase functions, provider sandbox safeguards and Cloudflare Pages build root. Do not claim production authentication or real provider provisioning where the current app explicitly remains a frontend demo.


## Architecture alignment

The complete repository target and implementation gates are defined in [M212 Complete Repository Architecture](../architecture/M212_COMPLETE_REPOSITORY_ARCHITECTURE.md). This UX/UI document governs visual and interaction behavior; it does not authorize route changes, backend rewrites or placeholder dashboards.
