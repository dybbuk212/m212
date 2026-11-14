-- M212 provider connection registry. Secret material is stored in Supabase Vault,
-- never in the application tables or browser storage.
create extension if not exists supabase_vault with schema vault;

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null,
  display_name text not null check (length(trim(display_name)) between 2 and 120),
  category text not null check (category in ('registrar','plesk','hypervisor','dns','payment','email','storage')),
  environment text not null default 'sandbox' check (environment in ('sandbox','production')),
  endpoint_url text,
  account_reference text,
  username text,
  secret_id uuid,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'not_verified' check (status in ('not_verified','configured','verified','error','disabled')),
  last_tested_at timestamptz,
  last_error_code text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_key, display_name)
);

create index if not exists provider_connections_category_idx
  on public.provider_connections(category, status);

alter table public.provider_connections enable row level security;

create policy provider_connections_admin_read
  on public.provider_connections for select to authenticated
  using (public.cms_has_role(array['super_admin','admin']));

create policy provider_connections_admin_write
  on public.provider_connections for all to authenticated
  using (public.cms_has_role(array['super_admin','admin']))
  with check (public.cms_has_role(array['super_admin','admin']));

revoke all on public.provider_connections from anon, authenticated;
grant select, insert, update, delete on public.provider_connections to authenticated;
grant all on public.provider_connections to service_role;

-- This RPC is deliberately service-role only. The Edge Function authenticates the
-- caller and checks CMS admin membership before calling it.
create or replace function public.provider_store_secret(
  p_secret text,
  p_name text,
  p_description text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;
  if p_secret is null or length(p_secret) < 8 or length(p_secret) > 20000 then
    raise exception 'invalid secret length' using errcode = '22023';
  end if;
  select vault.create_secret(p_secret, p_name, p_description) into v_id;
  return v_id;
end;
$$;

revoke all on function public.provider_store_secret(text,text,text) from public, anon, authenticated;
grant execute on function public.provider_store_secret(text,text,text) to service_role;

-- Secret values are never exposed through a table view or API select.
comment on table public.provider_connections is
  'Provider metadata only. Credentials live in Supabase Vault and are accessed only by server-side adapters.';
