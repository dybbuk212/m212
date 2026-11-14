-- M212 platform foundation. Apply in a Supabase project only after reviewing project settings.
-- This migration intentionally stores provider references, never provider API secrets.
create extension if not exists pgcrypto;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  kind text not null default 'customer' check (kind in ('platform','customer','reseller')),
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','operator','billing','support','customer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  provider_key text not null check (provider_key ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  provider_kind text not null check (provider_kind in ('registrar','control_panel','dns','payments')),
  environment text not null check (environment in ('sandbox','production')),
  enabled boolean not null default false,
  credential_secret_ref text, -- reference to an external secret manager; never a credential
  capabilities jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (organization_id, provider_key, environment)
);

create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_type text not null check (job_type in ('domain_register','domain_renew','domain_transfer','hosting_create','hosting_suspend','ssl_issue')),
  provider_key text not null,
  idempotency_key text not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','retryable_failed','permanent_failed','manual_review')),
  request_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table if not exists public.integration_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  provider_key text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider_key, event_id)
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists provisioning_jobs_dispatch_idx on public.provisioning_jobs(status, available_at);
create index if not exists integration_events_unprocessed_idx on public.integration_events(received_at) where processed_at is null;
create index if not exists audit_events_org_created_idx on public.audit_events(organization_id, created_at desc);

create or replace function app_private.is_org_member(target_org uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = target_org and m.user_id = (select auth.uid())
  );
$$;

revoke all on function app_private.is_org_member(uuid) from public;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_org_member(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.provider_connections enable row level security;
alter table public.provisioning_jobs enable row level security;
alter table public.integration_events enable row level security;
alter table public.audit_events enable row level security;

create policy "members can read own organizations" on public.organizations
for select to authenticated using (app_private.is_org_member(id));
create policy "members can read own memberships" on public.organization_members
for select to authenticated using (app_private.is_org_member(organization_id));
create policy "org admins manage provider metadata" on public.provider_connections
for all to authenticated using (
  organization_id is not null and exists (
    select 1 from public.organization_members m where m.organization_id = provider_connections.organization_id
    and m.user_id = (select auth.uid()) and m.role in ('owner','admin')
  )
) with check (
  organization_id is not null and exists (
    select 1 from public.organization_members m where m.organization_id = provider_connections.organization_id
    and m.user_id = (select auth.uid()) and m.role in ('owner','admin')
  )
);
create policy "members can read provisioning jobs" on public.provisioning_jobs
for select to authenticated using (app_private.is_org_member(organization_id));
create policy "members can read integration events" on public.integration_events
for select to authenticated using (organization_id is not null and app_private.is_org_member(organization_id));
create policy "members can read audit events" on public.audit_events
for select to authenticated using (organization_id is not null and app_private.is_org_member(organization_id));

-- No client write policies are granted for jobs/events/audit. Trusted backend service only.
revoke insert, update, delete on public.provisioning_jobs, public.integration_events, public.audit_events from anon, authenticated;
revoke all on public.provider_connections from anon;
