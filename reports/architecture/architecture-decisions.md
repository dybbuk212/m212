# Architecture Decisions (Local Mapping)

1. Kept working feature modules in place (storefront/client/reseller/admin) rather than force-move to every target subfolder to avoid breaking imports.
2. Entry point moved to src/app/main.tsx; router to src/app/router/index.tsx.
3. UI library consolidated under design-system/components/ui.tsx.
4. Theme under design-system/themes.
5. Layouts under src/layouts.
6. Target empty directories created as placeholders only; no fabricated logic.
7. Supabase migrations preserved as-is (no new migrations applied).
8. No secrets, no live provider calls, no mock success states introduced.
