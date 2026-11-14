# M212 data model and schema conventions

This document defines logical ownership and conventions. It is not a substitute for executable SQL migrations. The currently committed CMS migration remains the only implemented production-schema slice; the wider commerce model below is a target and must be delivered through reviewed migrations.

## Schema ownership

| Schema / area | Owns |
|---|---|
| identity | user profiles, organizations, memberships, roles and sessions |
| catalog | products, plans, TLDs, prices, currencies and tax configuration |
| domains | domain registrations, contacts, nameservers, DNS zones, transfers and renewals |
| commerce | carts, orders, order lines, invoices, credit notes and refunds |
| payments | payment intents, provider transactions, webhook inbox and reconciliation |
| hosting | hosting accounts, plans, subscriptions, service credentials references and usage |
| provisioning | jobs, attempts, state transitions, idempotency keys and dead-letter records |
| resellers | reseller accounts, customer relationships, price lists, commissions and settlements |
| support | tickets, messages, attachments and SLA events |
| cms | pages, posts, categories, menus, media metadata, revisions and audit events |
| platform | feature flags, provider configuration references, audit logs and outbox events |

## Core relational rules

- Use UUID primary keys for externally addressable business entities.
- Store timestamps as `timestamptz` in UTC; format for the user's locale in the UI.
- Use `numeric(precision, scale)` for money, never floating point.
- Store currency as ISO 4217 code alongside every monetary amount.
- Use explicit foreign keys and unique constraints for business invariants.
- Use soft deletion only where retention/audit requirements demand it; otherwise prefer explicit terminal states.
- Every tenant-owned row must carry `organization_id` and have tenant-scoped RLS policies.
- Provider credentials are stored only in a secret manager; database rows hold secret references, never plaintext secrets.
- Persist provider request IDs, normalized status, error class and safe diagnostic metadata.
- Use immutable ledger/event records for financial and provisioning history.

## Order and provisioning lifecycle

```text
DRAFT -> PENDING_PAYMENT -> PAID -> PROVISIONING -> ACTIVE
                                      |                 |
                                      v                 v
                              PROVISIONING_FAILED   SUSPENDED
                                      |
                                      v
                             RETRY_PENDING / MANUAL_REVIEW
```

Transitions must be enforced server-side, audited and idempotent. A webhook may be delivered more than once; processing the same provider event must not create duplicate payments, orders or services.

## Security and authorization

- Enable RLS on every exposed table.
- Deny by default; grant least privilege by role and tenant.
- Never trust client-supplied `organization_id`, role, price, payment status or provisioning status.
- CMS editorial permissions and commerce permissions are separate capability sets.
- Service-role access is server-only and must not be used by browser clients.
- Add negative tests proving cross-tenant reads/writes fail.

## Naming and migration conventions

- Tables and columns: `snake_case`, plural table names.
- Primary key: `id`; foreign key: `<entity>_id`.
- Boolean columns: `is_*` or `has_*`.
- Status columns use constrained values or enums with an explicit migration strategy.
- Migration filename: `YYYYMMDDHHMMSS_short_description.sql`.
- Never edit an applied migration; add a forward-only corrective migration.
- Include indexes for foreign keys, tenant filters, queue polling and common lookup keys.
- Include rollback notes for operationally reversible changes; data migrations require explicit recovery plans.

## Required schema tests

1. Fresh database migration applies without errors.
2. RLS matrix: anon, authenticated customer, reseller, staff and service role.
3. Cross-tenant isolation for every tenant-owned entity.
4. CMS publication and scheduled publication visibility.
5. Unique constraints and state transition rejection.
6. Payment webhook replay and idempotency.
7. Provisioning retry and dead-letter behavior.
8. Referential integrity and deletion/retention rules.
