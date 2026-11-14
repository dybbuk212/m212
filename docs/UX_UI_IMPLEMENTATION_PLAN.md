# M212 UX/UI Implementation Plan

## Direction and constraints
- Visual direction: **D — Hybrid premium**.
- Brand: retain M212.MA, existing logo, navy / Moroccan red / cedar-green identity and EN/FR language support.
- Scope: public storefront, customer portal, reseller portal, administration and Super Admin.
- Preserve TanStack Router paths, current domain/cart/checkout flows, Supabase auth/data access, provider-admin/Vault workflow, audit trail and sandbox-only restrictions.
- No real domain provisioning, VM provisioning, live payment capture/refunds or production provider credentials are enabled by this UX programme.

## Experience principles
1. Dark, high-contrast hero and focused conversion actions; light, calm content surfaces.
2. Clear hierarchy, consistent spacing, typography, radii, borders and status semantics.
3. Responsive layouts designed from mobile upward; no horizontal overflow at 360px.
4. Accessible keyboard navigation, visible focus, labelled controls, reduced-motion support and semantic landmarks.
5. Performance budgets are release gates. The supplied GTmetrix baseline is LCP 763ms, TBT 0ms, CLS 0.01, Performance 99%, Structure 100%. These are targets to re-measure, not assumed outcomes.

## Delivery waves

### Wave 0 — Baseline and inventory
- Record main SHA, route inventory, dependencies, current build/test/typecheck and asset strategy.
- Capture representative public, client, reseller and admin screenshots at desktop and mobile widths.
- Record Lighthouse/GTmetrix measurements before visual changes.

### Wave 1 — Shared design foundation
- Centralize brand tokens and component interaction states.
- Standardize page containers, section spacing, cards, buttons, inputs, badges, tables, dialogs and navigation.
- Keep font assets local; avoid new runtime font/image dependencies.
- Validate contrast, focus states, reduced motion and responsive overflow.

### Wave 2 — Public storefront
- Home, domain search/results/pricing, hosting/VPS/dedicated/SSL/email product pages, pricing, content, auth, cart and checkout.
- Improve information scent, plan comparison, domain-search prominence, trust signals and clear demo/sandbox disclosures.
- Preserve existing search query parameters, pricing calculations, cart state, i18n and SEO metadata.

### Wave 3 — Customer and reseller portals
- Consistent dashboard shell, service summaries, billing, support, notifications and account/security navigation.
- Responsive sidebar/mobile drawer, clear empty/loading/error states and accessible tables.
- Preserve existing data contracts and role-specific route behavior.

### Wave 4 — Admin and Super Admin
- Consistent operational dashboard, catalogue, commerce, infrastructure, CMS and audit experiences.
- Super Admin provider console: provider cards, connection state, sandbox badge, credential-safe forms, test results and audit history.
- Never return secrets to the browser. UI role presentation is not authorization; backend JWT and membership checks remain authoritative.

### Wave 5 — Verification and release
- TypeScript, unit tests, production build, route smoke tests and accessibility checks.
- Compare desktop/mobile screenshots and inspect CLS/LCP regressions.
- Re-run GTmetrix/Lighthouse on the deployed preview; target no regression from supplied baseline (LCP <= 763ms, TBT <= 0ms, CLS <= 0.01, Performance >= 99%, Structure >= 100% where test conditions are comparable).
- Merge only after CI passes. Verify Cloudflare deployment separately; do not equate a successful build with deployment.


## Approved visual reference — canonical homepage
The owner-approved reference image is the target for the **customer-facing homepage**, not merely inspiration for a generic hybrid theme.

### Homepage composition to implement
- A single, slim, rounded white navigation bar with the retained M212 logo; primary menus for Domains, Hosting, Servers, Security & Email, Pricing and Support; language selector, customer account menu and sign-in action.
- A bright sky-blue / soft-white / pale-lavender hero with restrained abstract cloud/server motifs.
- A large, high-contrast headline focused on finding a domain, with the key word/phrase highlighted in the retained brand red.
- A short supporting line beneath the headline.
- A wide, pill-shaped domain search control as the primary conversion action, with a clear search/generate button integrated into the field.
- A right-side visual illustrating the hosting/server ecosystem and a welcoming customer context. Prefer optimized local/vector artwork or CSS illustration; do not introduce heavy third-party image requests.
- Responsive behavior: collapse navigation cleanly on mobile, keep domain search prominent, stack hero content without clipping, and avoid layout shifts.

### Platform-wide design system derived from the homepage
After the homepage is approved, extend its visual language consistently to all public pages, domain results and pricing, product detail pages, authentication, cart/checkout, customer and reseller portals, admin and Super Admin. Reuse the same tokens, typography, spacing, controls, icon treatment, surfaces, status colors and responsive rules; adapt density and navigation to each role rather than copying the marketing hero into dashboards.

### Implementation sequence and acceptance
1. Finish the homepage to match the approved reference and verify the existing domain search path still works.
2. Apply shared components/tokens to public catalogue, domain results, pricing and checkout.
3. Apply role-appropriate shells and shared components to customer/reseller portals.
4. Apply the same system to admin and Super Admin, preserving security boundaries and sandbox-only provider controls.
5. Run route, role, accessibility, responsive, functional and performance regression checks.

Do not treat the homepage as approved until its rendered preview has been reviewed against the reference at desktop and mobile sizes. Do not declare platform-wide UX complete until all route groups above have been audited.

## Current increment
This PR establishes the implementation contract and applies a small, isolated hybrid-surface refinement to the existing storefront product cards. It intentionally does not replace route or business logic. Subsequent waves should be separate reviewable PRs with screenshots and measured performance evidence.
