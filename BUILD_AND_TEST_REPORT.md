# M212.MA v2.0 — Build, Test & Acceptance Report

Release: **M212-MA-CLOUDFLARE-READY-v2.0** (frontend demonstration release)
Generated: 2026-11-14 (UTC) · Toolchain used for verification: Node v22.23.5, npm 10.9.9, Linux x64.

All results below come from commands that were actually executed. Nothing is marked PASS from code inspection alone
where execution was possible.

## 1. Verification commands (clean copy, no node_modules, no Git)

Executed in a fresh directory containing only the delivered source files:

| Command | Result |
|---|---|
| `npm ci` | exit 0 — 188 packages installed from `package-lock.json` (all resolved from registry.npmjs.org) |
| `npm run typecheck` (`tsc --noEmit`, `strict`, `noUnusedLocals`, `noUnusedParameters`) | exit 0 — 0 errors |
| `npm test` (`vitest run`) | exit 0 — **2 files, 39 tests passed, 0 failed, 0 skipped** |
| `npm run build` (`tsc --noEmit && vite build`) | exit 0 — static output in `dist/` (~1 MB; main chunk 555 kB / 173 kB gzip; portals code-split) |

The same four commands were re-run after extracting the candidate ZIP into an empty directory (see §6).

## 2. Automated tests (39)

`src/test/logic.test.ts` (27): domain normalisation & validation (URL/www/case, hyphens, invalid chars, unknown TLD,
63-char limit, all 16 required TLDs), simulated availability for reserved names, multi-year promo/renewal pricing,
billing-cycle discounts, WELCOME10 percent coupon + 20 % tax on discounted amount, fixed coupon capped at subtotal,
inactive/unknown/expired coupons, currency conversion, reseller wholesale & margin, localStorage CRUD persistence,
JSON export → reset → import round-trip, rejection of foreign import files, demo order creation
(DEMO_PENDING / NOT_CONNECTED + pending invoice + demo-pending domain + new customer), order number format,
reseller commission excluding cancelled orders, DNS record validation, CMS slug rules, block reordering,
media type/size validation, password policy.

`src/test/app.test.tsx` (12, rendered through the real router): home page, domain search → add to cart,
invalid domain error, cart coupon application, EN → FR language switch, 404 page, signed-out portal gate,
customer support-ticket creation, admin coupon create via CRUD dialog, admin product delete with confirmation,
CMS publish/unpublish persistence, reseller margin page.

## 3. Browser verification (Playwright, Chromium, production build)

- All **86 routes** (31 public incl. 404, 16 customer, 10 reseller, 29 admin + editors) opened: correct title and
  `<h1>` on every page, **0 console errors, 0 page errors** — on `vite preview` and again on Cloudflare's local
  Pages runtime (`wrangler pages dev dist`, §5).
- End-to-end flow: home search "Atlas-Digital-Lab.ma" → add domain → add Business hosting → cart → coupon
  WELCOME10 → quantity +1 → totals (subtotal 1,607 / discount 161 / VAT 289 / total 1,735 MAD) → 7-step checkout
  with validation errors shown → demo order `M212-DEMO-YYYYMM-NNNNN` (DEMO / PENDING, NOT CONNECTED) → visible in
  customer orders, domain listed, invoice listed, persisted after page reload.
- Admin: demo sign-in → create CMS page → add FAQ block → Publish → public `/p/agency-partners` renders the block;
  hiding a product in Admin › Products removes it from the storefront.
- Language FR and currency EUR switch verified (e.g. `.ma 18,31 €`).
- Mobile 390 px: no horizontal overflow (scrollWidth = 390), full-screen mobile menu, portal layout usable.

Defects found and fixed during this verification: dialog focus jumped back to the first field on every keystroke;
mobile menu was clipped inside the sticky header; dashboard bar chart rendered zero-height bars; last table column
lost its row border; lazily-loaded detail/editor routes never resolved; several pages lacked an `<h1>`.

## 4. Lovable / GitHub / dependency clean-up

Removed from the v1.0 project: `@lovable.dev/vite-tanstack-config`, Lovable error reporting
(`lovable-error-reporting.ts`, `error-capture.ts`, `error-page.ts`), Lovable asset pointer for the logo
(`/__l5e/assets-v1/...` URL — replaced by an inline SVG mark), Lovable metadata/author/twitter handle,
`AGENTS.md`, `bunfig.toml`, `bun.lock`, `.lovable/`, the Worker/SSR entry (`server.ts`, `start.ts`, `nitro`,
`@tanstack/react-start`, `@tanstack/router-plugin`), the 1,900-line single component (`m212-app.tsx`) and catch-all route.

Unused dependencies removed: 27 `@radix-ui/*` packages, `@tanstack/react-query`, `@hookform/resolvers`,
`react-hook-form`, `zod`, `recharts`, `cmdk`, `date-fns`, `embla-carousel-react`, `input-otp`, `react-day-picker`,
`react-resizable-panels`, `vaul`, `class-variance-authority`, `tw-animate-css`, `vite-tsconfig-paths`, ESLint/Prettier
toolchain. Google-hosted fonts replaced by bundled `@fontsource-variable/*`.

Case-insensitive search of `src/`, `public/`, `index.html`, `package.json`, `vite.config.ts`, `tsconfig.json`,
`.env.example` and `.gitignore` for `lovable`, `github` and `bootstrap`: **no matches** (only these documentation
files mention the words, to describe their removal). In `package-lock.json` the word "github" appears only in upstream packages' `funding` metadata URLs;
every package is resolved from `https://registry.npmjs.org`. No Git dependencies, no submodules, no GitHub Actions.

## 5. Cloudflare Pages compatibility

`wrangler pages dev dist` (Cloudflare's local Pages runtime, wrangler 4):
- `/`, `/admin/dashboard`, `/client/domains/dom-1`, `/blog/shared-vs-vps` → **200** `index.html` (SPA fallback).
- `/robots.txt`, `/sitemap.xml` served as files.
- `_headers` applied: CSP, HSTS, X-Frame-Options DENY, Referrer-Policy; `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`.
- A `_redirects` rule `/* /index.html 200` is reported by Cloudflare as an infinite loop and ignored, so it was
  removed; Cloudflare's built-in SPA behaviour (no top-level `404.html`) is used instead.
- No Functions, Workers, KV, environment variables or Git connection required. Actual upload to a Cloudflare account
  was **not** performed (no account access from the build environment).

## 6. ZIP integrity

The candidate ZIP was tested with `unzip -t` (no errors), extracted into an empty directory, the presence of
package files, lockfile, configuration, `src/`, `public/`, docs and `cloudflare-pages/index.html` was checked, and
`npm ci`, `npm run typecheck`, `npm test`, `npm run build` were executed on the extracted `source/` — all exit 0
(39/39 tests). `cloudflare-pages/` is byte-for-byte the `dist/` produced by that verified build of the same source.

## 7. Acceptance gates

| # | Gate | Status | Evidence / reason |
|---|---|---|---|
| 1 | Existing project preserved and improved | PASS | v1.0 brand (navy/red/green tokens, DM Sans + Manrope, demo-mode stance, domain/cart logic) carried forward; monolith split into 44 typed modules |
| 2 | All required public pages | PASS | 28 required routes + blog posts + CMS pages, each with dedicated or differentiated content; browser-verified |
| 3 | Domain search & pricing demo | PASS | 16 TLDs, validation/normalisation, SIMULATED labels, promo/renew/transfer pricing, periods, auto-renew, restrictions, transfer flow; tests + browser |
| 4 | Differentiated storefronts | PASS | Shared/WP/Reseller plan grids, VPS configurator (OS, DC, managed, backups, monitoring, support, IPs), dedicated quote form, SSL validation levels, email package builder |
| 5 | Cart & checkout (demo) | PASS | Quantities, cycles, coupons, tax, persistence, 7 steps, DEMO/PENDING + NOT CONNECTED order; E2E verified |
| 6 | Customer portal | PASS | 16 routes: dashboard widgets, DNS/NS/contacts/lock, hosting FTP/DB/mail/backups/PHP, VPS power/metrics/firewall/snapshots/reinstall/console placeholder, invoices + download, tickets |
| 7 | Reseller portal | PASS | 10 routes: customer CRUD, product assignment, wholesale/retail/margin, orders, invoices, commissions, branding, support, settings |
| 8 | Admin CRUD | PASS | Create/edit/delete-with-confirm, search, filter for customers, products, categories (reorder), TLDs, domains, hosting, VPS, servers, coupons, resellers; order detail/notes; invoice create/edit/mark/download; ticket assign/priority/status/reply/internal notes; tests |
| 9 | CMS pages, blog, menus, media | PASS | 11 block types with ordering, slug/SEO/featured image/publish date, draft/preview/publish/unpublish persisted; blog categories/tags; menus with locations/reorder; IndexedDB media upload/preview/rename/delete with type/size validation |
| 10 | Local persistence | PASS | Central store (localStorage) + IndexedDB media; reset with confirmation; JSON export/import; tests |
| 11 | Lovable dependencies & branding removed | PASS | §4 |
| 12 | No Bootstrap | PASS | Not in package.json or lockfile |
| 13 | No mandatory Git/GitHub | PASS | Built and verified from a plain directory; Direct Upload documented |
| 14 | SEO metadata | PASS | Per-route title/description/OG/Twitter/canonical/robots (EN/FR aware), JSON-LD Organization, sitemap.xml, robots.txt, manifest, favicon, og-image. Limitation: SPA — crawlers that do not execute JS see the default `index.html` metadata |
| 15 | Accessibility & responsive | PASS (manual + automated smoke) | Skip link, landmarks, one `<h1>` per page, labelled controls, focus-visible, aria-current, dialogs with Esc/focus return, reduced-motion; 390 px and 1280 px checked. A formal WCAG audit (axe/screen reader) was not run |
| 16 | npm installation | PASS | `npm ci` exit 0 |
| 17 | Production build | PASS | `npm run build` exit 0 |
| 18 | Tests executed & documented | PASS | 39/39 |
| 19 | Cloudflare Pages configuration | PASS (local runtime) | §5 via `wrangler pages dev`; live upload not performed |
| 20 | Final ZIP extracted & checked | PASS | §6 |

## 8. Known limitations

- Frontend only. Every "action" on domains, hosting, VPS, payments and email is saved locally and labelled simulated.
- The demo role selector is not authentication and not a security boundary.
- Data is per-browser; clearing site data or Reset demo data restores the seed.
- SPA: unknown URLs return HTTP 200 with the in-app 404 page (no server-side 404 status).
- Exchange rates and the 20 % VAT are manual demo assumptions. Legal pages are drafts requiring counsel review.
- Contact details, company legal name and ICE are placeholders.

## 9. Remaining backend integrations

Authentication & authorization (accounts, password hashing, MFA, sessions, roles) · database & API · registrar APIs
(availability, register/renew/transfer, DNS, contacts, EPP codes) · payment providers (card, Moroccan and
international gateways, webhooks, refunds) · invoicing & tax compliance · provisioning (hosting control panel,
hypervisor, SSL CA, mailboxes) · transactional email · file storage for media · monitoring/status page · tamper-proof audit log.

## 10. Score

Self-assessed against the v1.0 audit rubric: **8.8 / 10 for the frontend scope** (up from 6.2). This is not a
production-readiness certification; an independent audit of this exact ZIP is recommended before upload.
