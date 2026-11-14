-- M212 infrastructure provisioning foundation.
-- Secrets remain in Supabase Vault. Only service_role can retrieve them through this RPC.
create or replace function public.provider_get_secret(p_secret_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_secret text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  select ds.decrypted_secret into v_secret
  from vault.decrypted_secrets ds
  where ds.id = p_secret_id;
  return v_secret;
end;
$$;
revoke all on function public.provider_get_secret(uuid) from public, anon, authenticated;
grant execute on function public.provider_get_secret(uuid) to service_role;

create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  job_type text not null check (job_type in ('domain_register','domain_renew','domain_transfer','dns_zone_create','hosting_subscription_create','vm_create','vm_power_action','ssl_issue')),
  provider_connection_id uuid references public.provider_connections(id) on delete restrict,
  customer_reference text,
  resource_reference text,
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued','running','succeeded','retryable_failure','permanent_failure','cancelled','manual_review')),
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  completed_at timestamptz,
  last_error_code text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists provisioning_jobs_ready_idx
  on public.provisioning_jobs(status, available_at, created_at)
  where status in ('queued','retryable_failure');
create index if not exists provisioning_jobs_provider_idx
  on public.provisioning_jobs(provider_connection_id, created_at desc);

alter table public.provisioning_jobs enable row level security;
create policy provisioning_jobs_admin_read
  on public.provisioning_jobs for select to authenticated
  using (public.cms_has_role(array['super_admin','admin']));
revoke all on public.provisioning_jobs from anon, authenticated;
grant select on public.provisioning_jobs to authenticated;
grant all on public.provisioning_jobs to service_role;

comment on table public.provisioning_jobs is
  'Idempotent asynchronous infrastructure operations. Mutations must be executed by trusted server-side provider adapters, never directly by browser clients.';
