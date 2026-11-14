# Cloudflare Pages — M212

## Required Pages project settings

Configure these values in the Cloudflare Pages project:

- **Production branch:** `main`
- **Root directory:** `source`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node.js version:** `22.22.2`

The application and its lockfile are located under `source/`. Do not set the root directory to the repository root.

## Runtime pin

The application declares Node.js `>=22.22.2` in `source/package.json`. The `source/.nvmrc` file pins the same exact version.

If the Pages build environment does not honor `.nvmrc`, set the Cloudflare Pages environment variable:

```text
NODE_VERSION=22.22.2
```

Apply the setting to the appropriate Preview and Production environments, then trigger a new deployment.

## Build

From the `source/` directory:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Vite writes the production output to `source/dist`; therefore the Pages output directory, relative to the configured root, is `dist`.

## Notes

- The current package is a frontend demo release. No production provider credentials are required for its demo build.
- Keep Supabase, registrar, payment and infrastructure credentials out of the frontend bundle.
- A Git commit cannot change the Cloudflare dashboard's Root directory or environment variables. Verify those project settings separately.
- Do not mark a deployment successful until the Cloudflare Pages build completes and the deployed preview is checked.
