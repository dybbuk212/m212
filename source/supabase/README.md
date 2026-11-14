# M212 Supabase backend foundation

This directory contains the **canonical Supabase project configuration and migrations** for M212. Run Supabase CLI commands from `source/` so the CLI uses `source/supabase/config.toml`.

## Applied remote database migrations

The M212 Supabase project currently has six recorded migrations:

1. `20261114080955_m212_lock_down_rls_auto_enable.sql` — revokes public/client execution of the pre-existing RLS event-trigger helper.
2. `20261114081049_m212_unified_cms_platform_foundation.sql` — creates the unified CMS, organization/membership, provider registry, Vault RPCs, sandbox provider queue, provisioning queue, event/audit tables, storage bucket, editorial workflow, and baseline RLS.
3. `20261114081252_m212_security_performance_hardening.sql` — moves the CMS role lookup into the private schema, locks trigger-only RPCs, splits overlapping policies, explicitly denies browser access to the provider worker queue, and adds foreign-key indexes.
4. `20261114081313_m212_auth_role_policy_cleanup.sql` — removes deprecated `auth.role()` use from the CMS trigger and finalizes published-content RLS.
5. `20261114081536_m212_vault_rpc_auth_claim_cleanup.sql` — uses the signed JWT role claim for service-role-only Vault RPC authorization.
6. `20261114081708_m212_public_content_rls_role_split.sql` — separates anonymous published-content reads from authenticated CMS reads so public clients do not need private helper privileges.

The migration files mirror the SQL recorded by the remote Supabase migration history. Do not restore the retired pre-consolidation migrations: they contained incompatible duplicate definitions for `provider_connections` and `provisioning_jobs`, and the original CMS migration had malformed PL/pgSQL dollar delimiters.

## Database areas

- **CMS:** pages, posts, categories, menus, media metadata, editorial memberships, revisions, audit logs and scheduled publishing fields.
- **Organizations:** tenant organizations and user memberships with owner/admin/operator/billing/support/customer roles.
- **Providers:** a unified provider registry with category, sandbox/production metadata, capabilities and Vault secret references. Secret values are never stored in public tables.
- **Operations:** an idempotent provisioning queue for domains, DNS, hosting, VMs and SSL; a separate read/test-only provider queue constrained to sandbox.
- **Events/audit:** integration event intake and organization-scoped audit events.
- **Storage:** public-read CMS media bucket; upload/update/delete require CMS media roles.

All application tables in the exposed `public` schema have RLS enabled. Security and health advisors were clean immediately after deployment. The performance advisor currently reports unused indexes because this new database has no workload yet.

## Apply and verify

From `source/`:

```bash
supabase migration list
supabase db push
```

Use a linked project matching the M212 project ref. Do not use `supabase db reset` against production. Review remote migration history before any drift repair.

## Current deployment boundary

The database foundation is deployed, but the React application still uses its clearly labelled demo/local persistence for business workflows. A typed Supabase repository/auth integration and end-to-end authorization tests remain required before switching the UI to production persistence.

The remote project currently has no Auth users, no CMS memberships, no organizations, and no provider connections. Create the first trusted Auth user and bootstrap the first `super_admin` through a privileged operator process; do not expose self-service role assignment.

Edge Functions are not deployed yet. Before deployment, configure the required server-side secrets securely:
- `PROVIDER_WORKER_SECRET` for the provider worker.
- `CMS_SCHEDULER_SECRET` for the CMS publish scheduler.
- Supabase's project URL and service role key are supplied by the Edge Functions runtime; never place service-role values in `VITE_*` variables.

The provider admin function also needs its allowed production dashboard origins set deliberately. No live payment, registrar, hosting, VM or SSL provisioning is enabled by this database migration.
