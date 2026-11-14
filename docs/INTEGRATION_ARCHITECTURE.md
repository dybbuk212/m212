# M212.MA integration architecture

## Status and scope

This repository currently contains a browser-based demo. This change adds provider-neutral contracts, a security utility, a Supabase data foundation and implementation guidance. It does **not** connect a live registrar, Plesk server, DNS provider or payment processor. No credentials are included.

## Target topology

- Cloudflare Pages: public React storefront and customer/reseller/admin UI.
- `api.m212.ma`: separately deployed Node.js API; never embed provider credentials in Vite variables.
- Supabase: PostgreSQL, Auth and RLS-protected tenant data.
- Worker runtime: asynchronous provisioning, webhook processing, retries and reconciliation.
- Provider adapters: registrar, control panel, DNS, SSL and payments. Each adapter must declare capabilities and sandbox/production mode.

## Provider adapter requirements

Implement adapters behind `backend/src/providers/contracts.ts`. Keep provider-specific payloads inside adapters and normalize them into platform DTOs. Support multiple providers through explicit routing policies and health checks. A provider is not production-enabled until sandbox contract tests pass and an operator explicitly enables it.

Required operation controls:
- idempotency key for every mutating call;
- durable job record and state transition;
- bounded exponential retry with jitter and dead-letter/manual-review state;
- provider request/reference IDs and redacted structured logs;
- request timeout, circuit breaker and per-provider concurrency limits;
- reconciliation for uncertain timeouts before retrying financial or domain-registration operations.

## Security boundary

- Provider credentials belong in a managed secret store, referenced by `credential_secret_ref`; never put secrets in the database JSON, browser bundle, repository or logs.
- Supabase service-role key is backend-only. Never expose it to a browser or prefix it with `VITE_`.
- Verify webhook HMAC against the exact raw body, reject replayed event IDs and persist deduplication keys.
- Authenticate every API request, authorize on the server, derive tenant membership from the verified identity and scope every query by organization.
- Do not trust prices, roles, tenant IDs, payment states or provisioning states submitted by clients.
- Use TLS, restrictive CORS allowlists, request-size limits, rate limits backed by a shared store, secret rotation and immutable audit records.
- The included in-memory concepts are not a substitute for distributed production controls.

## Supabase

Apply migrations through a reviewed deployment pipeline. RLS is defense in depth, not a substitute for API authorization. Use a dedicated backend identity for service-role operations; the service role bypasses RLS and must never be used for normal end-user requests.

## Order/provisioning state machine

`draft -> pending_payment -> paid -> queued -> provisioning -> active`

Failure paths: `retryable_failed`, `permanent_failed`, `manual_review`, `cancelled`. Only a verified payment webhook can transition an order to paid. Provisioning is asynchronous and must not be performed in the browser request lifecycle.

## Provider selection

Use configuration records with explicit provider key, kind and environment. Support multiple registrar/control-panel instances and capability-based routing. Do not assume all providers support every TLD, operation or hosting feature.

## Release gates

1. Sandbox credentials supplied through deployment secret manager.
2. Provider contract tests for success, decline, timeout, duplicate request and malformed response.
3. Webhook signature, replay, deduplication and ordering tests.
4. Tenant isolation and authorization tests.
5. Reconciliation and manual-review runbook.
6. Production credentials approved separately; production mode disabled by default.
