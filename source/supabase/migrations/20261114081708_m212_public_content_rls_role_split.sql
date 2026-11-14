
-- Public visitors must not need EXECUTE on the private CMS role helper.
-- Keep public and signed-in CMS read paths in role-specific policies.
drop policy if exists cms_pages_read on public.cms_pages;
create policy cms_pages_public_read on public.cms_pages for select to anon
using (status='published' and publish_at is not null and publish_at<=now());
create policy cms_pages_staff_read on public.cms_pages for select to authenticated
using (
  (status='published' and publish_at is not null and publish_at<=now())
  or app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager'])
);

drop policy if exists cms_posts_read on public.cms_posts;
create policy cms_posts_public_read on public.cms_posts for select to anon
using (status='published' and publish_at is not null and publish_at<=now());
create policy cms_posts_staff_read on public.cms_posts for select to authenticated
using (
  (status='published' and publish_at is not null and publish_at<=now())
  or app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager'])
);
