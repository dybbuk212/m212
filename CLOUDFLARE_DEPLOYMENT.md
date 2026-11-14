# Deploying M212.MA to Cloudflare Pages — Git integration

This repository contains the M212 frontend in `source/`. The static frontend is deployed to Cloudflare Pages. The registrar/Plesk backend is a separate service and must not run inside the static Pages build.

## Cloudflare Pages settings

- Repository: `dybbuk212/m212`
- Production branch: `main` (after merging the reviewed security PR)
- Root directory: `source`
- Framework preset: Vite
- Build command: `npm ci --no-audit --no-fund && npm run build`
- Build output directory: `dist`
- Node.js: 22.22.2 or newer 22.x

The security branch temporarily removes the old vulnerable lockfile. Its GitHub Actions workflow regenerates a clean npm lockfile using a connected GitHub-hosted runner, verifies patched dependency floors, runs `npm audit`, typecheck, tests and production build, then commits the generated lockfile back to the branch. Once that generated lockfile is present and the PR is merged, use the `npm ci` build command above.

## Frontend environment variables

Only public, non-secret configuration belongs in Cloudflare Pages. Example:

```text
VITE_API_BASE_URL=https://api.m212.ma
```

Never put Openprovider credentials, Plesk credentials, database passwords, JWT secrets, SMTP credentials, payment API secrets or private keys in `VITE_*` variables.

## Custom domain

In Cloudflare Pages → project → Custom domains, add `m212.ma` and optionally `www.m212.ma`. Check existing DNS records and mail-related MX/TXT records before making nameserver changes.

## Release boundary

The existing frontend V2.0 is a frontend demo. Domain search, payment, orders and provisioning must not be considered live until the secure backend integrations, provider contracts, authentication, payment confirmation, provisioning reconciliation and production tests are complete.

## Supabase and CMI environment setup

### Cloudflare Pages (frontend only)

Set these in Cloudflare Dashboard → Workers & Pages → m212 → Settings → Environment variables for Production and Preview as appropriate:

- VITE_SUPABASE_URL: the Supabase project URL.
- VITE_SUPABASE_ANON_KEY: the rotated publishable key (or legacy anon key).
- VITE_SITE_URL: the public site origin.
- VITE_API_BASE_URL: the HTTPS origin of the separately deployed API, if configured.

These VITE_* values are public and are embedded in browser assets. Only the Supabase publishable/anon key is suitable for this client context; authorization must be enforced by RLS. Never put sb_secret, service_role, database passwords, CMI Store Key, merchant credentials, or private keys in Pages variables.

### Supabase Edge Function secrets (server-side)

From a trusted terminal linked to the correct Supabase project, set server-only values using newly rotated credentials:

```bash
supabase secrets set \
  SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co" \
  SUPABASE_ANON_KEY="YOUR_NEW_PUBLISHABLE_OR_ANON_KEY" \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_NEW_SECRET_KEY" \
  ADMIN_DASHBOARD_ORIGINS="https://m212.ma,https://www.m212.ma" \
  PROVIDER_WORKER_SECRET="$(openssl rand -hex 32)" \
  CMS_SCHEDULER_SECRET="$(openssl rand -hex 32)"
```

The service-role/secret key is server-only and bypasses RLS. Restrict its use to trusted Edge Functions, validate the caller JWT and role before privileged operations, and never return it to clients.

### CMI credentials

CMI credentials are not Cloudflare Pages environment variables. They must be stored only in a trusted server-side runtime (a dedicated Node.js API or an appropriately implemented server-side Worker/Edge Function). Keep the following names as the integration contract until the merchant contract and callback/signature specification are verified:

- CMI_ENVIRONMENT=sandbox
- CMI_CLIENT_ID
- CMI_STORE_KEY
- CMI_SHOP_URL
- CMI_OK_URL
- CMI_FAIL_URL
- CMI_CALLBACK_URL

The community cmi-payment-nodejs README demonstrates a Node.js redirect-form flow using storekey, clientid, oid, shopurl, okUrl, failUrl, callbackURL, and customer/order details. It is not, by itself, evidence that M212's merchant profile, callback signature verification, or settlement behavior is configured. Do not enable real payments until CMI confirms the merchant integration guide and sandbox credentials and the server implementation verifies callback authenticity, amount, currency, order reference, replay/idempotency and final payment status.

### Deployment boundary

The current repository frontend is explicitly a demo release: source/src/lib/auth.ts uses a local demo session, and source/src/services/payment.ts returns DEMO_PENDING. Setting environment variables alone does not activate Supabase Auth, persistent user data, or CMI. Those require code adapters, database migrations, Edge/API endpoints, RLS integration tests and sandbox verification. Keep the UI's demo mode clearly disclosed until those changes are completed.
