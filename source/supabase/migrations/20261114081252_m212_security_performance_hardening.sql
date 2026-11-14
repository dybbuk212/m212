
create or replace function app_private.cms_has_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.cms_memberships m
    where m.user_id=(select auth.uid()) and m.role=any(allowed_roles));
$$;
revoke all on function app_private.cms_has_role(text[]) from public,anon;
grant usage on schema app_private to authenticated;
grant execute on function app_private.cms_has_role(text[]) to authenticated;

-- Drop every existing policy that depends on the old exposed helper.
drop policy if exists cms_memberships_self_read on public.cms_memberships;
drop policy if exists cms_memberships_super_admin_manage on public.cms_memberships;
drop policy if exists cms_pages_staff_read on public.cms_pages;
drop policy if exists cms_pages_staff_insert on public.cms_pages;
drop policy if exists cms_pages_staff_update on public.cms_pages;
drop policy if exists cms_pages_staff_delete on public.cms_pages;
drop policy if exists cms_posts_staff_read on public.cms_posts;
drop policy if exists cms_posts_staff_insert on public.cms_posts;
drop policy if exists cms_posts_staff_update on public.cms_posts;
drop policy if exists cms_posts_staff_delete on public.cms_posts;
drop policy if exists cms_categories_staff_write on public.cms_categories;
drop policy if exists cms_menus_staff_write on public.cms_menus;
drop policy if exists cms_media_staff_read on public.cms_media;
drop policy if exists cms_media_staff_write on public.cms_media;
drop policy if exists cms_revisions_staff_read on public.cms_revisions;
drop policy if exists cms_audit_admin_read on public.cms_audit_logs;
drop policy if exists provider_connections_admin_read on public.provider_connections;
drop policy if exists provider_connections_admin_write on public.provider_connections;
drop policy if exists provisioning_jobs_admin_read on public.provisioning_jobs;
drop policy if exists m212_cms_storage_staff_upload on storage.objects;
drop policy if exists m212_cms_storage_staff_update on storage.objects;
drop policy if exists m212_cms_storage_staff_delete on storage.objects;

-- Revoke and remove the public RPC helper after its dependent policies are detached.
revoke all on function public.cms_has_role(text[]) from public,anon,authenticated;
drop function public.cms_has_role(text[]);

-- Trigger functions are callable by triggers, not exposed as RPC endpoints.
revoke all on function public.cms_enforce_editorial_workflow() from public,anon,authenticated;
revoke all on function public.cms_snapshot_revision() from public,anon,authenticated;

-- Rebuild read paths with one permissive SELECT policy per CMS table.
drop policy if exists cms_pages_public_read on public.cms_pages;
create policy cms_pages_read on public.cms_pages for select to anon,authenticated
using ((status='published' and publish_at is not null and publish_at<=now())
  or (auth.role()='authenticated' and app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager'])));
create policy cms_pages_staff_insert on public.cms_pages for insert to authenticated
with check (app_private.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_pages_staff_update on public.cms_pages for update to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager']))
with check (app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_pages_staff_delete on public.cms_pages for delete to authenticated
using (app_private.cms_has_role(array['super_admin','admin']));

drop policy if exists cms_posts_public_read on public.cms_posts;
create policy cms_posts_read on public.cms_posts for select to anon,authenticated
using ((status='published' and publish_at is not null and publish_at<=now())
  or (auth.role()='authenticated' and app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager'])));
create policy cms_posts_staff_insert on public.cms_posts for insert to authenticated
with check (app_private.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_posts_staff_update on public.cms_posts for update to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager']))
with check (app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
create policy cms_posts_staff_delete on public.cms_posts for delete to authenticated
using (app_private.cms_has_role(array['super_admin','admin']));

create policy cms_memberships_self_read on public.cms_memberships for select to authenticated
using (user_id=(select auth.uid()) or app_private.cms_has_role(array['super_admin','admin']));
create policy cms_memberships_super_admin_insert on public.cms_memberships for insert to authenticated
with check (app_private.cms_has_role(array['super_admin']));
create policy cms_memberships_super_admin_update on public.cms_memberships for update to authenticated
using (app_private.cms_has_role(array['super_admin']))
with check (app_private.cms_has_role(array['super_admin']));
create policy cms_memberships_super_admin_delete on public.cms_memberships for delete to authenticated
using (app_private.cms_has_role(array['super_admin']));

create policy cms_categories_staff_insert on public.cms_categories for insert to authenticated
with check (app_private.cms_has_role(array['super_admin','admin','editor']));
create policy cms_categories_staff_update on public.cms_categories for update to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor']))
with check (app_private.cms_has_role(array['super_admin','admin','editor']));
create policy cms_categories_staff_delete on public.cms_categories for delete to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor']));

create policy cms_menus_staff_insert on public.cms_menus for insert to authenticated
with check (app_private.cms_has_role(array['super_admin','admin','editor']));
create policy cms_menus_staff_update on public.cms_menus for update to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor']))
with check (app_private.cms_has_role(array['super_admin','admin','editor']));
create policy cms_menus_staff_delete on public.cms_menus for delete to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor']));

create policy cms_media_staff_insert on public.cms_media for insert to authenticated
with check (app_private.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy cms_media_staff_update on public.cms_media for update to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor','media_manager']))
with check (app_private.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy cms_media_staff_delete on public.cms_media for delete to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor','media_manager']));

create policy cms_revisions_staff_read on public.cms_revisions for select to authenticated
using (app_private.cms_has_role(array['super_admin','admin','editor','author']));
create policy cms_audit_admin_read on public.cms_audit_logs for select to authenticated
using (app_private.cms_has_role(array['super_admin','admin']));

create policy provider_connections_admin_read on public.provider_connections for select to authenticated
using (app_private.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and exists(select 1 from public.organization_members m
    where m.organization_id=provider_connections.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin'))));
create policy provider_connections_admin_insert on public.provider_connections for insert to authenticated
with check (app_private.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and exists(select 1 from public.organization_members m
    where m.organization_id=provider_connections.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin'))));
create policy provider_connections_admin_update on public.provider_connections for update to authenticated
using (app_private.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and exists(select 1 from public.organization_members m
    where m.organization_id=provider_connections.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin'))))
with check (app_private.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and exists(select 1 from public.organization_members m
    where m.organization_id=provider_connections.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin'))));
create policy provider_connections_admin_delete on public.provider_connections for delete to authenticated
using (app_private.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and exists(select 1 from public.organization_members m
    where m.organization_id=provider_connections.organization_id and m.user_id=(select auth.uid()) and m.role in ('owner','admin'))));

create policy provisioning_jobs_admin_read on public.provisioning_jobs for select to authenticated
using (app_private.cms_has_role(array['super_admin','admin'])
  or (organization_id is not null and app_private.is_org_member(organization_id)));

create policy m212_cms_storage_staff_upload on storage.objects for insert to authenticated
with check (bucket_id='m212-cms-media' and app_private.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy m212_cms_storage_staff_update on storage.objects for update to authenticated
using (bucket_id='m212-cms-media' and app_private.cms_has_role(array['super_admin','admin','editor','media_manager']))
with check (bucket_id='m212-cms-media' and app_private.cms_has_role(array['super_admin','admin','editor','media_manager']));
create policy m212_cms_storage_staff_delete on storage.objects for delete to authenticated
using (bucket_id='m212-cms-media' and app_private.cms_has_role(array['super_admin','admin','editor','media_manager']));

-- Restrict all browser roles explicitly for the internal worker queue.
create policy provider_jobs_deny_browser on public.provider_jobs for all to anon,authenticated
using(false) with check(false);

-- Foreign-key indexes for tenant, actor and queue access patterns.
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists audit_events_actor_idx on public.audit_events(actor_user_id);
create index if not exists cms_audit_logs_actor_idx on public.cms_audit_logs(actor_id);
create index if not exists cms_media_created_by_idx on public.cms_media(created_by);
create index if not exists cms_menus_updated_by_idx on public.cms_menus(updated_by);
create index if not exists cms_pages_author_idx on public.cms_pages(author_id);
create index if not exists cms_pages_created_by_idx on public.cms_pages(created_by);
create index if not exists cms_pages_updated_by_idx on public.cms_pages(updated_by);
create index if not exists cms_posts_author_idx on public.cms_posts(author_id);
create index if not exists cms_posts_created_by_idx on public.cms_posts(created_by);
create index if not exists cms_posts_updated_by_idx on public.cms_posts(updated_by);
create index if not exists cms_revisions_created_by_idx on public.cms_revisions(created_by);
create index if not exists integration_events_org_idx on public.integration_events(organization_id);
create index if not exists provider_connections_created_by_idx on public.provider_connections(created_by);
create index if not exists provider_connections_updated_by_idx on public.provider_connections(updated_by);
create index if not exists provider_jobs_connection_idx on public.provider_jobs(provider_connection_id);
create index if not exists provisioning_jobs_created_by_idx on public.provisioning_jobs(created_by);
create index if not exists provisioning_jobs_org_idx on public.provisioning_jobs(organization_id);
