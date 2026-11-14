-- Provider configuration security hardening and audit support.
alter table public.provider_connections
  add column if not exists secret_updated_at timestamptz;

create index if not exists cms_audit_provider_idx
  on public.cms_audit_logs(created_at desc)
  where entity_type = 'provider_connection';

-- Only non-secret activity metadata is returned by the privileged Edge Function.
comment on column public.provider_connections.secret_id is
  'Reference to Supabase Vault secret. Never return the secret value from an API.';
