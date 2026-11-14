# Cloudflare Pages — M212

**Root directory (required):** `source`

**Build command:** `npm run build`  
**Output directory:** `dist`  
**Node version:** 22 (or 20+)

## Current failure cause
Cloudflare was looking for `/opt/buildhome/repo/source` but the previous commit had the app at repo root.

## Fix applied
Application files now live under `source/` so the existing Cloudflare project setting works without dashboard changes.

## Required Cloudflare settings
- Root directory: `source`
- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: none required for demo

Push the updated tree (with `source/` containing package.json, src/, public/, etc.) and redeploy.
