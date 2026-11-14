# Deploying M212.MA to Cloudflare Pages (Direct Upload — no Git required)

The application builds to a **static** folder. Cloudflare Pages serves it; no Functions, Workers, KV,
database, Git repository or Lovable account are needed.

- Build command: `npm run build`
- Output directory: **`dist`**
- Node version for local builds: 20+
- Environment variables: none required

The ready-made output of the verified build is also shipped in the `cloudflare-pages/` folder of the delivery
package — you can upload that folder directly and skip steps B–D.

## A. Get the ZIP

Download `M212-MA-CLOUDFLARE-READY-v2.0.zip` to your computer.

## B. Extract it

```bash
unzip M212-MA-CLOUDFLARE-READY-v2.0.zip
cd M212-MA-CLOUDFLARE-READY-v2.0/source
```

## C. Install dependencies

```bash
npm ci
```

## D. Verify and build locally

```bash
npm run typecheck
npm test
npm run build          # writes dist/
npm run preview        # optional: check http://localhost:4173, refresh deep links such as /admin/dashboard
```

`dist/` contains `index.html`, hashed `assets/`, `_headers` (security + caching headers), `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons and `og-image.png`.

## E. Deploy with Direct Upload

**Dashboard (no tooling):**
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Project name: `m212-ma` → **Create project**.
3. Drag the **contents** of `dist/` (or the `cloudflare-pages/` folder) into the upload area. `index.html` must be
   at the top level of what you upload.
4. **Deploy site**. You get a `https://m212-ma.pages.dev` URL.
5. For updates: project → **Create deployment** → upload the new `dist/`.

**CLI alternative (optional):**
```bash
npx wrangler login
npx wrangler pages deploy dist --project-name m212-ma
```

## F. Custom domain m212.ma

1. Pages project → **Custom domains** → **Set up a custom domain** → `m212.ma` (and optionally `www.m212.ma`).
2. If the `m212.ma` zone is on Cloudflare, DNS records are created automatically. Otherwise create a `CNAME`
   from `www` to `m212-ma.pages.dev` at your DNS host; for the apex, move the zone's nameservers to Cloudflare
   (recommended) because most registrars cannot CNAME an apex.
3. Cloudflare issues the TLS certificate automatically once DNS resolves. Optionally add a redirect rule
   `www.m212.ma/* → https://m212.ma/$1` (301).

## G. Environment variables

None are required. To change the canonical URL used in metadata, set `VITE_SITE_URL` **before building**
(e.g. `VITE_SITE_URL=https://staging.m212.ma npm run build`). Cloudflare dashboard variables do not affect a
Direct Upload build because the build runs on your machine. Never put secrets in `VITE_*` variables.

## Notes

- **Deep links / refresh:** there is intentionally no `_redirects` file and no top-level `404.html`. In that case
  Cloudflare Pages applies single-page-application behaviour and serves `index.html` for any path that is not a
  real file, so `/admin/dashboard`, `/client/domains/…` etc. work after refresh. (A `/* /index.html 200` rule is
  flagged by Cloudflare as an infinite loop and ignored, so it is not shipped.) Unknown paths render the app's own
  404 page.
- `_headers` sets a strict Content-Security-Policy (`'self'` only), HSTS, `X-Frame-Options: DENY`, and long-term
  caching for hashed `/assets/*`. If you later add analytics or a payment page from another origin, extend the CSP.
- `robots.txt` disallows `/admin/`, `/client/`, `/reseller/`, `/cart`, `/checkout`.
