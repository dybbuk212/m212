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
