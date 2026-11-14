# M212 CMS production backend foundation

This directory is the production-oriented persistence/security foundation for the existing CMS UI. It does **not** claim that the current React demo UI has been switched from localStorage/IndexedDB to Supabase yet.

## Components

- `migrations/20261114000100_cms_core.sql`: CMS content, category, menu, media metadata, revisions, memberships and audit tables; RLS policies; public media bucket.
- `functions/cms-publish-scheduler/index.ts`: authenticated scheduler endpoint to publish approved pages/posts after their scheduled time.

## Apply

1. Create a Supabase project for M212.MA.
2. Link the project with the Supabase CLI.
3. Review and apply the migration: `supabase db push`.
4. Create the first `cms_memberships` row for a trusted user through a privileged, audited operator process. Never let users self-assign roles.
5. Configure `CMS_SCHEDULER_SECRET` and the service role key as Edge Function secrets. Never put either in a `VITE_*` variable or browser bundle.
6. Deploy `cms-publish-scheduler` and configure Supabase Cron/external scheduler to POST to it with `x-cms-scheduler-secret`.
7. Test RLS using anon, normal authenticated, editor, admin and super-admin identities before importing production content.

## Role matrix

| Role | Pages/posts | Menus/categories | Media | Memberships/audit |
|---|---|---|---|---|
| super_admin | full | full | full | manage/read |
| admin | full | full | full | read |
| editor | create/edit/publish workflow | manage | upload/manage | no |
| author | create/edit | read | read | no |
| seo_manager | edit SEO-capable content | read | read | no |
| media_manager | read | read | manage | no |

RLS is the enforcement boundary; hiding controls in React is not authorization.

## Current limitations / required integration work

The current frontend CMS persists content in the demo store and IndexedDB. The next integration change must introduce a typed repository backed by Supabase Auth/PostgREST/Storage, map the existing `CmsPage`, `BlogPost`, `Menu`, and `MediaItem` types to the SQL schema, and remove demo-mode writes from production builds. Do not enable commercial publishing until that adapter and its integration tests are complete.

The migration deliberately supports French, English and Arabic content, revision snapshots, canonical/robots metadata, translation groups, editorial states and scheduled publication. Rich-text rendering must sanitize HTML; the existing plain-text renderer should not render untrusted HTML.
