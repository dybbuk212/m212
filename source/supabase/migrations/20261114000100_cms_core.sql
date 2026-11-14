-- M212 CMS production foundation
-- Apply with: supabase db push
-- Security model: public may read published content; authenticated CMS users need an
-- explicit role in cms_memberships. No client may write with anon privileges.

create extension if not exists pgcrypto with schema extensions;

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
  seo_title text not null default '' check (length(seo_title) <= 70),
  seo_description text not null default '' check (length(seo_description) <= 160),
  canonical_url text,
  robots text not null default 'index,follow' check (robots in ('index,follow','noindex,follow','noindex,nofollow')),
  og_image_path text,
  featured_image_path text,
  blocks jsonb not null default '[]'::jsonb check (jsonb_typeof(blocks) = 'array'),
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
  seo_title text not null default '' check (length(seo_title) <= 70),
  seo_description text not null default '' check (length(seo_description) <= 160),
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
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_media (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/avif','image/gif')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
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
  revision_number integer not null check (revision_number > 0),
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(entity_type, entity_id, revision_number)
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

create index if not exists cms_pages_public_idx on public.cms_pages(status, publish_at) where status = 'published';
create index if not exists cms_posts_public_idx on public.cms_posts(status, publish_at) where status = 'published';
create index if not exists cms_posts_category_idx on public.cms_posts(category_id);
create index if not exists cms_revisions_entity_idx on public.cms_revisions(entity_type, entity_id, revision_number desc);
create index if not exists cms_audit_created_idx on public.cms_audit_logs(created_at desc);

create or replace function public.cms_has_role(allowed_roles text[])
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.cms_memberships m
    where m.user_id = (select auth.uid()) and m.role = any(allowed_roles)
  );
$$;

revoke all on function public.cms_has_role(text[]) from public;
grant execute on function public.cms_has_role(text[]) to anon, authenticated;

alter table public.cms_memberships enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_categories enable row level security;
alter table public.cms_posts enable row level security;
alter table public.cms_menus enable row level security;
alter table public.cms_media enable row level security;
alter table public.cms_revisions enable row level security;
alter table public.cms_audit_logs enable row level security;

create policy cms_memberships_self_read on public.cms_memberships for select to authenticated
using (user_id = (select auth.uid()) or public.cms_has_role(array['super_admin','admin']));
create policy cms_memberships_admin_manage on public.cms_memberships for all to authenticated
using (public.cms_has_role(array['super_admin'])) with check (public.cms_has_role(array['super_admin']));

create policy cms_pages_public_read on public.cms_pages for select to anon, authenticated
using (status = 'published' and publish_at is not null and publish_at <= now());
create policy cms_pages_staff_read on public.cms_pages for select to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_pages_staff_insert on public.cms_pages for insert to authenticated
with check (public.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_pages_staff_update on public.cms_pages for update to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']))
with check (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_pages_staff_delete on public.cms_pages for delete to authenticated
using (public.cms_has_role(array['super_admin','admin']));

create policy cms_posts_public_read on public.cms_posts for select to anon, authenticated
using (status = 'published' and publish_at is not null and publish_at <= now());
create policy cms_posts_staff_read on public.cms_posts for select to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_posts_staff_insert on public.cms_posts for insert to authenticated
with check (public.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_posts_staff_update on public.cms_posts for update to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']))
with check (public.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_posts_staff_delete on public.cms_posts for delete to authenticated
using (public.cms_has_role(array['super_admin','admin']));

create policy cms_categories_public_read on public.cms_categories for select to anon, authenticated using (true);
create policy cms_categories_staff_write on public.cms_categories for all to authenticated
using (public.cms_has_role(array['super_admin','admin','editor'])) with check (public.cms_has_role(array['super_admin','admin','editor']));
create policy cms_menus_public_read on public.cms_menus for select to anon, authenticated using (true);
create policy cms_menus_staff_write on public.cms_menus for all to authenticated
using (public.cms_has_role(array['super_admin','admin','editor'])) with check (public.cms_has_role(array['super_admin','admin','editor']));
create policy cms_media_public_read on public.cms_media for select to anon, authenticated using (true);
create policy cms_media_staff_read on public.cms_media for select to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author','media_manager']));
create policy cms_media_staff_write on public.cms_media for all to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','media_manager']))
with check (public.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy cms_revisions_staff_read on public.cms_revisions for select to authenticated
using (public.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_revisions_staff_insert on public.cms_revisions for insert to authenticated
with check (public.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_audit_admin_read on public.cms_audit_logs for select to authenticated
using (public.cms_has_role(array['super_admin','admin']));

-- The media bucket is public-read for published-site images. Upload/update/delete remain role-gated.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('m212-cms-media','m212-cms-media',true,10485760,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy cms_storage_public_read on storage.objects for select to anon, authenticated
using (bucket_id = 'm212-cms-media');
create policy cms_storage_staff_upload on storage.objects for insert to authenticated
with check (bucket_id = 'm212-cms-media' and public.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy cms_storage_staff_update on storage.objects for update to authenticated
using (bucket_id = 'm212-cms-media' and public.cms_has_role(array['super_admin','admin','editor','media_manager']))
with check (bucket_id = 'm212-cms-media' and public.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy cms_storage_staff_delete on storage.objects for delete to authenticated
using (bucket_id = 'm212-cms-media' and public.cms_has_role(array['super_admin','admin','editor','media_manager']));

-- Do not grant browser roles write access to the append-only audit table.
revoke insert, update, delete on public.cms_audit_logs from anon, authenticated;
grant select on public.cms_audit_logs to authenticated;
