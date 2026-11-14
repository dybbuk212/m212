# Route Inventory

**Source:** src/app/router/index.tsx

## Public
- / → HomePage (SiteLayout)
- /domains, /domains/search, /domains/pricing → Domain* pages
- /hosting/*, /vps/*, /dedicated, /ssl, /email → ProductPages
- /about, /contact, /blog, /support, /legal, /kb → ContentPages
- /login, /register → AuthPages
- /cart, /checkout → CartCheckout

## Customer (PortalLayout, auth required)
- /client, /client/domains, /client/hosting, /client/vps, /client/orders, /client/invoices, /client/payments, /client/support, /client/profile, /client/security, /client/notifications
- Detail routes for domain/hosting/vps/ticket

## Reseller (PortalLayout)
- /reseller, /reseller/customers, /reseller/products, /reseller/orders, /reseller/pricing, /reseller/invoices, /reseller/commissions, /reseller/branding, /reseller/settings, /reseller/support

## Admin (PortalLayout)
- /admin, /admin/customers, /admin/resellers, /admin/orders, /admin/products, /admin/invoices, /admin/payments, /admin/subscriptions, /admin/tickets, /admin/analytics, /admin/coupons + catalog/infra/system/integration modules

## Super Admin
MISSING

## Status
IMPLEMENTED AND VERIFIED for listed routes.
Guards: basic redirect present; full RoleGuard/PermissionGuard missing.
