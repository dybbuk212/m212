# M212.MA SEO release checklist

## Current constraints

The storefront is a React SPA. Runtime metadata updates alone do not guarantee crawler-visible, page-specific HTML. Before claiming full SEO readiness, add prerendering or SSR for public routes and validate rendered HTML using crawler-compatible fetches.

## Required implementation

- Keep one stable canonical URL per language and route; do not use query-string language switches as the only localization strategy.
- Add distinct French and English route URLs and reciprocal `hreflang` including `x-default`.
- Generate sitemap URLs from published, indexable public pages only. Exclude admin, client, reseller, cart, checkout, login and search-result URLs.
- Add unique titles, descriptions, H1s, useful original copy, internal links and image alt text to every public landing page.
- Add valid Organization, WebSite and BreadcrumbList JSON-LD. Use Product structured data only where real product prices/availability are accurately represented.
- Ensure canonical, robots and Open Graph URLs match the final route and locale.
- Validate redirects, 404 status, trailing slash policy, robots, sitemap and structured data.
- Submit sitemap in Google Search Console and Bing Webmaster Tools after domain verification.
- Monitor Search Console indexing, Core Web Vitals and conversion events.

## Performance targets

Measure field data where available. Aim for LCP <= 2.5s, INP <= 200ms and CLS <= 0.1 at the 75th percentile. Optimize images, font loading, caching and route-level JavaScript. Do not claim a score until Lighthouse and field data are collected.
