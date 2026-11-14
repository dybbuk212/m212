# M212.MA — Domains, Hosting & Cloud (Frontend release v2.0)

M212.MA is a complete, independently buildable **frontend platform** for a Moroccan domain registration and
web hosting provider: public storefront, domain search, product catalogue, cart and checkout, customer portal,
reseller portal, administrator back-office and CMS.

> **DEMO MODE.** This release has no backend. Domain availability is simulated, no payment is processed,
> nothing is provisioned, and the role selector is **not** authentication. All data lives in the visitor's
> browser (localStorage + IndexedDB). See "Remaining backend integrations" below.

## Requirements

- Node.js 20 or newer (tested with Node 22) and npm 10+
- No accounts, API keys, Git repository or hosting platform are required to build.

## Quick start

```bash
npm ci            # install exact versions from package-lock.json
npm run dev       # http://localhost:5173
npm run typecheck # tsc --noEmit (strict)
npm test          # vitest — unit + workflow tests
npm run build     # type-check + production build into dist/
npm run preview   # serve dist/ locally on http://localhost:4173
```

The production output is the static folder **`dist/`**. Deploy it to Cloudflare Pages with Direct Upload —
see [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md).

## Stack

React 19 · TypeScript (strict) · Vite 7 · TanStack Router (code-based routes, client-side SPA) · Tailwind CSS v4 ·
lucide-react icons · sonner toasts · self-hosted fonts (@fontsource). No Bootstrap, no external theme, no runtime CDN.

## Project structure

```
src/
  main.tsx                 app entry
  router.tsx               every route (public, /client, /reseller, /admin); portals are code-split
  styles.css               design tokens (oklch), typography, utilities
  types/models.ts          typed models: Customer, Product, Domain, HostingService, VPSService, DedicatedServer,
                           Order, Invoice, Payment, Ticket, Reseller, CMSPage, BlogPost, Coupon, Notification, ActivityLog…
  data/catalog.ts          products, categories, 16-TLD catalogue
  data/seed.ts             clearly-labelled demo records
  lib/store.ts             centralised local data layer (CRUD, subscribe, reset, JSON export/import)
  lib/media-db.ts          IndexedDB store for CMS media
  lib/pricing.ts           billing cycles, coupons, tax, reseller wholesale/margin
  lib/domain.ts            domain normalisation/validation, simulated availability
  lib/orders.ts            demo order + invoice creation (DEMO_PENDING / NOT_CONNECTED)
  lib/i18n.ts              EN/FR dictionary, MAD/EUR/USD formatting
  lib/auth.ts              DEMO session only (no passwords stored)
  lib/seo.ts               per-page title/description/OG/Twitter/canonical/robots
  services/                adapter contracts: RegistrarProvider, PaymentProvider, AuthService, ProvisioningService
  components/              UI primitives (ui.tsx), layouts (site + portal)
  features/storefront      public pages, domain search, product pages, cart, checkout, auth screens
  features/client          customer portal (domains/DNS, hosting, VPS, invoices, tickets…)
  features/reseller        reseller portal (customers, pricing & margins, commissions, branding…)
  features/admin           back-office (CRUD for customers, products, categories, TLDs, orders, invoices…)
  features/cms             CMS pages/blocks, blog, menus, media library, block renderer
  test/                    vitest suites
public/                    favicon, og-image, robots.txt, sitemap.xml, site.webmanifest, _headers
```

## Demo accounts

Open **/login**, type any email/password (never stored) and pick a role: *customer*, *reseller* or *admin*.
Portal pages also offer "Continue as demo …". Reset all data from **Admin › Settings › Reset demo data**.

Demo coupons: `WELCOME10`, `STARTUP20`, `MAD100` (`EXPIRED5` is inactive).

## Environment variables

None are required. `.env.example` documents the optional public `VITE_SITE_URL` (canonical URL base, defaults
to `https://m212.ma`). Never place secrets in `VITE_*` variables — they are embedded in the browser bundle.

## What works locally vs. what needs a backend

| Area | Works in this release | Requires backend / provider |
|---|---|---|
| Storefront, pricing, comparison, FAQ, EN/FR, MAD/EUR/USD | Yes | Live exchange rates |
| Domain search | Validation, normalisation, pricing, **simulated** availability | Registrar API (availability, register, renew, transfer, DNS, contacts) |
| Cart & checkout | Full 7-step flow, coupons, tax assumption, demo order + invoice | Payment provider APIs, real tax rules |
| Customer portal | DNS/NS/contacts/lock editing, hosting & VPS panels, invoices, tickets — saved locally, labelled simulated | Registrar, hosting control panel, hypervisor, email |
| Reseller portal | Customers CRUD, product assignment, retail pricing, margins, commissions, branding | Billing engine, white-label DNS/SSL |
| Admin & CMS | CRUD for all entities, CMS pages/blocks/blog/menus/media with draft/publish | Database, file storage, audit trail |
| Authentication | Demo role session, form validation | Server-side auth, MFA, sessions, authorization |

**Do not describe M212.MA as an operational hosting provider until registrar integration, payments, customer
authentication, billing, provisioning and backend security are implemented and tested.**
