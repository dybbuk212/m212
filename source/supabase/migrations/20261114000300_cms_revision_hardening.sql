-- Close the CMS revision forgery path identified during review.
-- Revision snapshots must be created only by the SECURITY DEFINER update trigger.
drop policy if exists cms_revisions_staff_insert on public.cms_revisions;
revoke insert, update, delete on public.cms_revisions from anon, authenticated;
grant select on public.cms_revisions to authenticated;
