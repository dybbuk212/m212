# Dependabot security remediation — verified release

## Dependency fixes

The repository manifest and regenerated npm lockfile now contain:
- Vitest: 4.1.12
- @vitest/mocker: 4.1.12
- Tinypool: not present in the resolved dependency tree; an npm override floor of ^2.1.2 is retained if it is introduced by a future dependency.

The previous lockfile resolved Vitest 3.2.7, @vitest/mocker 3.2.7 and Tinypool 1.1.1. Those vulnerable resolutions have been replaced.

## GitHub Actions evidence

Workflow: **M212 dependency security and Cloudflare build**  
Run: https://github.com/dybbuk212/m212/actions/runs/43552235153

Verified successful on the GitHub-hosted runner:
- Fresh package-lock generation.
- npm ci from the generated lockfile.
- Dependency floor verification.
- `npm audit --audit-level=moderate`: **found 0 vulnerabilities**.
- TypeScript typecheck: PASS.
- Vitest: **39 tests passed**.
- Vite production build: PASS.

The generated `source/package-lock.json` is committed to the repository. The workflow artifact `m212-patched-package-lock` is retained as an additional 14-day copy.

## Relevant advisories

- GHSA-5gmw-xhrv-c9v3 — Tinypool worker options RCE; fixed in 2.1.1: https://github.com/advisories/GHSA-5gmw-xhrv-c9v3
- GHSA-85c8-ppgw-ccpr — Tinypool run() options RCE; fixed in 2.1.2: https://github.com/advisories/GHSA-85c8-ppgw-ccpr
- GHSA-82fw-gwwq-j7x9 — Vitest redirect mock path traversal; fixed in 4.1.11: https://github.com/advisories/GHSA-82fw-gwwq-j7x9
- GHSA-qxg6-89mg-rqv8 — Vitest manual mock code injection; fixed in 4.1.12: https://github.com/advisories/GHSA-qxg6-89mg-rqv8

## Dependabot status

The code and lockfile remediation is verified by npm audit and the GitHub Actions run above. Dependabot's alert dashboard may update asynchronously after the lockfile rescan. Do not manually dismiss alerts; verify that GitHub marks them fixed/resolved.

## Cloudflare Pages settings

- Repository: `dybbuk212/m212`
- Root directory: `source`
- Build command: `npm ci --no-audit --no-fund && npm run build`
- Output directory: `dist`
- Node.js: 22.22.2 or newer 22.x

The frontend remains a demo in areas that require live registrar, payment and Plesk backend integration. Security remediation does not activate real commercial provisioning.
