
-- Avoid deprecated auth.role() and keep internal helpers private to PostgREST.
create or replace function public.cms_enforce_editorial_workflow()
returns trigger language plpgsql security definer set search_path=''
as $$
declare actor_role text;
begin
  if coalesce(auth.jwt()->>'role','')='service_role' then
    actor_role:='super_admin';
  else
    select m.role into actor_role from public.cms_memberships m
    where m.user_id=(select auth.uid());
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
revoke all on function public.cms_enforce_editorial_workflow() from public,anon,authenticated;

-- Published content remains public; internal CMS readers are authorized by private role lookup.
drop policy if exists cms_pages_read on public.cms_pages;
create policy cms_pages_read on public.cms_pages for select to anon,authenticated
using ((status='published' and publish_at is not null and publish_at<=now())
  or app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
drop policy if exists cms_posts_read on public.cms_posts;
create policy cms_posts_read on public.cms_posts for select to anon,authenticated
using ((status='published' and publish_at is not null and publish_at<=now())
  or app_private.cms_has_role(array['super_admin','admin','editor','author','seo_manager']));
