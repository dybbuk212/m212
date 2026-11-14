
-- M212 unified CMS + domain/hosting/reseller schema.
-- Additive, fresh-project-safe. No existing business rows are deleted or rewritten.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

-- Tenancy
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
  primary key (organization_id,user_id)
);

create or replace function app_private.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id=target_org and m.user_id=(select auth.uid())
  );
$$;
revoke all on function app_private.is_org_member(uuid) from public,anon;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_org_member(uuid) to authenticated;

-- CMS roles and content
create table if not exists public.cms_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','admin','editor','author','seo_manager','media_manager')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 180),
  locale text not null default 'fr' check (locale in ('fr','en','ar')),
  translation_group uuid,
  seo_title text not null default '' check (length(seo_title)<=70),
  seo_description text not null default '' check (length(seo_description)<=160),
  canonical_url text,
  robots text not null default 'index,follow' check (robots in ('index,follow','noindex,follow','noindex,nofollow')),
  og_image_path text,
  featured_image_path text,
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks)='array'),
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  publish_at timestamptz,
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cms_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.cms_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(trim(title)) between 1 and 180),
  locale text not null default 'fr' check (locale in ('fr','en','ar')),
  translation_group uuid,
  category_id uuid references public.cms_categories(id) on delete set null,
  tags text[] not null default '{}',
  excerpt text not null default '',
  content text not null default '',
  content_format text not null default 'markdown' check (content_format in ('markdown','html')),
  seo_title text not null default '' check (length(seo_title)<=70),
  seo_description text not null default '' check (length(seo_description)<=160),
  canonical_url text,
  robots text not null default 'index,follow' check (robots in ('index,follow','noindex,follow','noindex,nofollow')),
  featured_image_path text,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published','archived')),
  publish_at timestamptz,
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cms_menus (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null check (location in ('header','footer','none')),
  locale text not null default 'fr' check (locale in ('fr','en','ar')),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items)='array'),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.cms_media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/avif','image/gif')),
  byte_size bigint not null check (byte_size>0 and byte_size<=10485760),
  alt_text text not null default '',
  width integer,
  height integer,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.cms_revisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('page','post','menu')),
  entity_id uuid not null,
  revision_number integer not null check (revision_number>0),
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(entity_type,entity_id,revision_number)
);
create table if not exists public.cms_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cms_pages_public_idx on public.cms_pages(status,publish_at) where status='published';
create index if not exists cms_posts_public_idx on public.cms_posts(status,publish_at) where status='published';
create index if not exists cms_posts_category_idx on public.cms_posts(category_id);
create index if not exists cms_revisions_entity_idx on public.cms_revisions(entity_type,entity_id,revision_number desc);
create index if not exists cms_audit_created_idx on public.cms_audit_logs(created_at desc);

create or replace function public.cms_has_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.cms_memberships m
    where m.user_id=(select auth.uid()) and m.role=any(allowed_roles)
  );
$$;
revoke all on function public.cms_has_role(text[]) from public;
grant execute on function public.cms_has_role(text[]) to anon,authenticated;

-- Unified provider registry: one table supports CMS provider administration and tenancy.
create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  provider_key text not null check (provider_key ~ '^[a-z0-9][a-z0-9._-]{1,63}$'),
  display_name text not null check (length(trim(display_name)) between 2 and 120),
  category text not null check (category in ('registrar','plesk','hypervisor','dns','payment','email','storage','control_panel')),
  provider_kind text check (provider_kind is null or provider_kind in ('registrar','control_panel','dns','payments')),
  environment text not null default 'sandbox' check (environment in ('sandbox','production')),
  enabled boolean not null default false,
  endpoint_url text,
  account_reference text,
  username text,
  secret_id uuid,
  credential_secret_ref text,
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config)='object'),
  capabilities jsonb not null default '{}'::jsonb check (jsonb_typeof(capabilities)='object'),
  status text not null default 'not_verified' check (status in ('not_verified','configured','verified','error','disabled')),
  last_tested_at timestamptz,
  last_error_code text,
  secret_updated_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider_key,display_name)
);
create index if not exists provider_connections_category_idx on public.provider_connections(category,status);
create index if not exists provider_connections_org_idx on public.provider_connections(organization_id,category,status);

-- Domain/hosting provisioning orchestration (separate operational queue).
create table if not exists public.provisioning_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  job_type text not null check (job_type in (
    'domain_register','domain_renew','domain_transfer','domain_availability_check',
    'dns_zone_create','hosting_create','hosting_subscription_create','hosting_suspend',
    'vm_create','vm_power_action','ssl_issue'
  )),
  provider_key text,
  provider_connection_id uuid references public.provider_connections(id) on delete restrict,
  idempotency_key text not null unique,
  customer_reference text,
  resource_reference text,
  request_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(request_payload)='object'),
  result_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(result_payload)='object'),
  status text not null default 'queued' check (status in (
    'queued','running','succeeded','retryable_failed','retryable_failure',
    'permanent_failed','permanent_failure','manual_review','cancelled'
  )),
  attempts integer not null default 0 check (attempts>=0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  completed_at timestamptz,
  last_error_code text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists provisioning_jobs_ready_idx on public.provisioning_jobs(status,available_at,created_at)
  where status in ('queued','retryable_failed','retryable_failure');
create index if not exists provisioning_jobs_provider_idx on public.provisioning_jobs(provider_connection_id,created_at desc);

-- Provider read/test jobs are sandbox-only by database constraint.
create table if not exists public.provider_jobs (
  id uuid primary key default gen_random_uuid(),
  provider_connection_id uuid not null references public.provider_connections(id) on delete restrict,
  operation text not null check (operation in ('connection.test','domain.availability_check','account.read')),
  environment text not null default 'sandbox' check (environment='sandbox'),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload)='object'),
  status text not null default 'queued' check (status in ('queued','processing','succeeded','failed','dead_letter')),
  attempts integer not null default 0 check (attempts between 0 and 10),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  result jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists provider_jobs_claim_idx on public.provider_jobs(status,available_at,created_at);

create table if not exists public.integration_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  provider_key text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider_key,event_id)
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
create index if not exists integration_events_unprocessed_idx on public.integration_events(received_at) where processed_at is null;
create index if not exists audit_events_org_created_idx on public.audit_events(organization_id,created_at desc);

-- Vault access is service-role-only; credential bytes are never stored in public tables.
create or replace function public.provider_store_secret(p_secret text,p_name text,p_description text default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_id uuid;
begin
  if coalesce(auth.role(),'')<>'service_role' then
    raise exception 'service role required' using errcode='42501';
  end if;
  if p_secret is null or length(p_secret)<8 or length(p_secret)>20000 then
    raise exception 'invalid secret length' using errcode='22023';
  end if;
  select vault.create_secret(p_secret,p_name,p_description) into v_id;
  return v_id;
end;
$$;
revoke all on function public.provider_store_secret(text,text,text) from public,anon,authenticated;
grant execute on function public.provider_store_secret(text,text,text) to service_role;

create or replace function public.provider_get_secret(p_secret_id uuid)
returns text language plpgsql security definer set search_path=''
as $$
declare v_secret text;
begin
  if coalesce(auth.role(),'')<>'service_role' then
    raise exception 'service role required' using errcode='42501';
  end if;
  select ds.decrypted_secret into v_secret from vault.decrypted_secrets ds where ds.id=p_secret_id;
  return v_secret;
end;
$$;
revoke all on function public.provider_get_secret(uuid) from public,anon,authenticated;
grant execute on function public.provider_get_secret(uuid) to service_role;

create or replace function public.claim_provider_jobs(p_worker text,p_limit integer default 10)
returns setof public.provider_jobs language sql security definer set search_path=''
as $$
  update public.provider_jobs j
  set status='processing',locked_at=now(),locked_by=p_worker,attempts=j.attempts+1,updated_at=now()
  where j.id in (
    select id from public.provider_jobs
    where (status='queued' and available_at<=now())
       or (status='processing' and locked_at<now()-interval '5 minutes')
    order by created_at for update skip locked
    limit greatest(1,least(p_limit,50))
  )
  returning j.*;
$$;
revoke all on function public.claim_provider_jobs(text,integer) from public,anon,authenticated;
grant execute on function public.claim_provider_jobs(text,integer) to service_role;

-- Editorial workflow and immutable revision snapshots.
create or replace function public.cms_enforce_editorial_workflow()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor_role text;
begin
  if (select auth.role())='service_role' then
    actor_role:='super_admin';
  else
    select m.role into actor_role from public.cms_memberships m where m.user_id=(select auth.uid());
  end if;
  if actor_role is null then
    raise exception 'CMS membership required' using errcode='42501';
  end if;
  if actor_role='author' then
    if tg_op='INSERT' then
      if new.status not in ('draft','in_review') then
        raise exception 'Authors may only create draft or review content' using errcode='42501';
      end if;
      new.author_id:=coalesce(new.author_id,(select auth.uid()));
      new.created_by:=(select auth.uid());
    else
      if old.author_id is distinct from (select auth.uid()) then
        raise exception 'Authors may edit only their own content' using errcode='42501';
      end if;
      if new.status not in ('draft','in_review') then
        raise exception 'Authors cannot approve or publish content' using errcode='42501';
      end if;
      new.author_id:=old.author_id;
    end if;
  elsif actor_role='seo_manager' then
    if tg_op='INSERT' then
      raise exception 'SEO managers cannot create content' using errcode='42501';
    end if;
    if (to_jsonb(new)-array['seo_title','seo_description','canonical_url','robots','og_image_path','updated_at','updated_by'])
       is distinct from
       (to_jsonb(old)-array['seo_title','seo_description','canonical_url','robots','og_image_path','updated_at','updated_by']) then
      raise exception 'SEO managers may only update SEO metadata' using errcode='42501';
    end if;
  end if;
  if tg_op='UPDATE' then
    new.updated_at:=now();
    new.updated_by:=(select auth.uid());
    if new.status='published' and actor_role not in ('super_admin','admin','editor') then
      raise exception 'Only editors and administrators may publish content' using errcode='42501';
    end if;
  else
    new.created_by:=coalesce(new.created_by,(select auth.uid()));
    new.updated_by:=(select auth.uid());
  end if;
  return new;
end;
$$;

create or replace function public.cms_snapshot_revision()
returns trigger language plpgsql security definer set search_path=''
as $$
declare next_revision integer;
declare entity_kind text := case when tg_table_name='cms_pages' then 'page' else 'post' end;
begin
  select coalesce(max(revision_number),0)+1 into next_revision
  from public.cms_revisions where entity_type=entity_kind and entity_id=old.id;
  insert into public.cms_revisions(entity_type,entity_id,revision_number,snapshot,created_by)
  values(entity_kind,old.id,next_revision,to_jsonb(old),(select auth.uid()));
  return new;
end;
$$;

drop trigger if exists cms_pages_workflow on public.cms_pages;
create trigger cms_pages_workflow before insert or update on public.cms_pages
for each row execute function public.cms_enforce_editorial_workflow();
drop trigger if exists cms_posts_workflow on public.cms_posts;
create trigger cms_posts_workflow before insert or update on public.cms_posts
for each row execute function public.cms_enforce_editorial_workflow();
drop trigger if exists cms_pages_revision on public.cms_pages;
create trigger cms_pages_revision before update on public.cms_pages
for each row execute function public.cms_snapshot_revision();
drop trigger if exists cms_posts_revision on public.cms_posts;
create trigger cms_posts_revision before update on public.cms_posts
for each row execute function public.cms_snapshot_revision();

-- RLS boundaries
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.cms_memberships enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_categories enable row level security;
alter table public.cms_posts enable row level security;
alter table public.cms_menus enable row level security;
alter table public.cms_media enable row level security;
alter table public.cms_revisions enable row level security;
alter table public.cms_audit_logs enable row level security;
alter table public.provider_connections enable row level security;
alter table public.provider_jobs enable row level security;
alter table public.provisioning_jobs enable row level security;
alter table public.integration_events enable row level security;
alter table public.audit_events enable row level security;

create policy members_read_own_organizations on public.organizations for select to authenticated
using (app_private.is_org_member(id));
create policy members_read_own_memberships on public.organization_members for select to authenticated
using (app_private.is_org_member(organization_id));
create policy cms_memberships_self_read on public.cms_memberships for select to authenticated
using (user_id=(select auth.uid()) or public.cms_has_role(array['super_admin','admin']));
create policy cms_memberships_super_admin_manage on public.cms_memberships for all to authenticated
using (public.cms_has_role(array['super_admin'])) with check (public.cms_has_role(array['super_admin']));

create policy cms_pages_public_read on public.cms_pages for select to anon,authenticated
using (status='published' and publish_at is not null and publish_at<=now());
create policy cms_pages_staff_read on public.cms_pages for select to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_pages_staff_insert on public.cms_pages for insert to authenticated
with check (public.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_pages_staff_update on public.cms_pages for update to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']))
with check (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_pages_staff_delete on public.cms_pages for delete to authenticated
using (public.cms_has_role(array['super_admin','admin']));

create policy cms_posts_public_read on public.cms_posts for select to anon,authenticated
using (status='published' and publish_at is not null and publish_at<=now());
create policy cms_posts_staff_read on public.cms_posts for select to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_posts_staff_insert on public.cms_posts for insert to authenticated
with check (public.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_posts_staff_update on public.cms_posts for update to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']))
with check (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_posts_staff_delete on public.cms_posts for delete to authenticated
using (public.cms_has_role(array['super_admin','admin']));

create policy cms_categories_public_read on public.cms_categories for select to anon,authenticated using (true);
create policy cms_categories_staff_write on public.cms_categories for all to authenticated
using (public.cms_has_role(array['super_admin','admin','editor']))
with check (public.cms_has_role(array['super_admin','admin','editor']));
create policy cms_menus_public_read on public.cms_menus for select to anon,authenticated using (true);
create policy cms_menus_staff_write on public.cms_menus for all to authenticated
using (public.cms_has_role(array['super_admin','admin','editor']))
with check (public.cms_has_role(array['super_admin','admin','editor']));
create policy cms_media_public_read on public.cms_media for select to anon,authenticated using (true);
create policy cms_media_staff_read on public.cms_media for select to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','media_manager']));
create policy cms_media_staff_write on public.cms_media for all to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','media_manager']))
with check (public.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy cms_revisions_staff_read on public.cms_revisions for select to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_audit_admin_read on public.cms_audit_logs for select to authenticated
using (public.cms_has_role(array['super_admin','admin']));

create policy provider_connections_admin_read on public.provider_connections for select to authenticated
using (
  public.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and exists (
    select 1 from public.organization_members m
    where m.organization_id=provider_connections.organization_id and m.user_id=(select auth.uid())
      and m.role in ('owner','admin')
  ))
);
create policy provider_connections_admin_write on public.provider_connections for all to authenticated
using (
  public.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and exists (
    select 1 from public.organization_members m
    where m.organization_id=provider_connections.organization_id and m.user_id=(select auth.uid())
      and m.role in ('owner','admin')
  ))
)
with check (
  public.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and exists (
    select 1 from public.organization_members m
    where m.organization_id=provider_connections.organization_id and m.user_id=(select auth.uid())
      and m.role in ('owner','admin')
  ))
);
create policy provisioning_jobs_admin_read on public.provisioning_jobs for select to authenticated
using (
  public.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and app_private.is_org_member(organization_id))
);
create policy integration_events_org_read on public.integration_events for select to authenticated
using (organization_id is not null and app_private.is_org_member(organization_id));
create policy audit_events_org_read on public.audit_events for select to authenticated
using (organization_id is not null and app_private.is_org_member(organization_id));

-- Client API grants are paired with RLS. Jobs/events/audit mutations remain server-only.
grant select on public.organizations,public.organization_members to authenticated;
grant select on public.cms_memberships to authenticated;
grant select on public.cms_pages,public.cms_posts,public.cms_categories,public.cms_menus,public.cms_media to anon,authenticated;
grant insert,update,delete on public.cms_pages,public.cms_posts,public.cms_categories,public.cms_menus,public.cms_media to authenticated;
grant select on public.cms_revisions,public.cms_audit_logs to authenticated;
revoke insert,update,delete on public.cms_revisions,public.cms_audit_logs from anon,authenticated;
grant usage,select on sequence public.cms_audit_logs_id_seq to authenticated;

revoke all on public.provider_connections from anon;
grant select,insert,update,delete on public.provider_connections to authenticated;
grant all on public.provider_connections,public.provider_jobs,public.provisioning_jobs,public.integration_events,public.audit_events to service_role;
revoke all on public.provider_jobs from anon,authenticated;
revoke insert,update,delete on public.provisioning_jobs,public.integration_events,public.audit_events from anon,authenticated;
grant select on public.provisioning_jobs,public.integration_events,public.audit_events to authenticated;

-- Public image delivery; upload and mutation are role-gated.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('m212-cms-media','m212-cms-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy m212_cms_storage_public_read on storage.objects for select to anon,authenticated
using(bucket_id='m212-cms-media');
create policy m212_cms_storage_staff_upload on storage.objects for insert to authenticated
with check(bucket_id='m212-cms-media' and public.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy m212_cms_storage_staff_update on storage.objects for update to authenticated
using(bucket_id='m212-cms-media' and public.cms_has_role(array['super_admin','admin','editor','media_manager']))
with check(bucket_id='m212-cms-media' and public.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy m212_cms_storage_staff_delete on storage.objects for delete to authenticated
using(bucket_id='m212-cms-media' and public.cms_has_role(array['super_admin','admin','editor','media_manager']));

comment on table public.provider_connections is 'Provider metadata only. Credentials live in Supabase Vault; never expose secret values via browser APIs.';
comment on table public.provisioning_jobs is 'Idempotent asynchronous domain, DNS, hosting, VM and SSL operations. Trusted backend only.';
comment on table public.provider_jobs is 'Sandbox-only read/test queue. Production mutations are deliberately not enabled.';
