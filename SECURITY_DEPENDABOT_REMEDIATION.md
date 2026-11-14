# Dependabot security remediation

Applied dependency floors for the user-reported alerts:
- Vitest >= 4.1.12
- @vitest/mocker >= 4.1.12
- tinypool >= 2.1.2

The repository lockfile must be regenerated from the updated manifest using a connected npm environment. Do not close the Dependabot alerts manually before GitHub rescans the resulting package-lock.json.

Advisory references:
- https://github.com/advisories/GHSA-5gmw-xhrv-c9v3 (Tinypool; fixed floor at least 2.1.1)
- https://github.com/advisories/GHSA-85c8-ppgw-ccpr (Tinypool; fixed 2.1.2)
- https://github.com/advisories/GHSA-82fw-gwwq-j7x9 (Vitest; fixed 4.1.11)
- https://github.com/advisories/GHSA-qxg6-89mg-rqv8 (Vitest; fixed 4.1.12)

Release gate: npm ci, npm ls, npm audit, typecheck, tests and production build must all pass.
