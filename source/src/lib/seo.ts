import { useEffect } from "react";
import { prefs } from "./i18n";

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://m212.ma";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}

export interface SeoInput { title: string; description: string; path: string; noindex?: boolean }

/** Client-side head management for the static SPA (title, description, OG, Twitter, canonical, robots). */
export function useSeo({ title, description, path, noindex }: SeoInput) {
  const locale = prefs.use().locale;
  useEffect(() => {
    const full = title.includes("M212.MA") ? title : `${title} | M212.MA`;
    document.title = full;
    document.documentElement.lang = locale;
    setMeta("name", "description", description);
    setMeta("property", "og:title", full);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", SITE_URL + path);
    setMeta("property", "og:locale", locale === "fr" ? "fr_MA" : "en_US");
    setMeta("name", "twitter:title", full);
    setMeta("name", "twitter:description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = SITE_URL + path;
  }, [title, description, path, noindex, locale]);
}
