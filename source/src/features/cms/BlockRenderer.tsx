import { Check, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { HrefLink, buttonClass, Card } from "@/components/ui";
import { mediaDb } from "@/lib/media-db";
import { useDb } from "@/lib/store";
import type { CmsBlock } from "@/types/models";
import { Faq, PlanCard, Testimonials } from "@/features/storefront/shared";

/** Resolves "media:<id>" references from the IndexedDB media library; plain URLs pass through. */
export function useMediaSrc(src?: string) {
  const [url, setUrl] = useState<string | undefined>(src && !src.startsWith("media:") ? src : undefined);
  useEffect(() => {
    if (!src?.startsWith("media:")) { setUrl(src); return; }
    let revoked: string | undefined; let alive = true;
    mediaDb.get(src.slice(6)).then((b) => { if (b && alive) { revoked = URL.createObjectURL(b); setUrl(revoked); } }).catch(() => setUrl(undefined));
    return () => { alive = false; if (revoked) URL.revokeObjectURL(revoked); };
  }, [src]);
  return url;
}
export function MediaImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const url = useMediaSrc(src);
  if (!url) return <div className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className ?? ""}`}>{alt || "Image"}</div>;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}

export function BlockRenderer({ block }: { block: CmsBlock }) {
  const products = useDb().products;
  switch (block.type) {
    case "hero": return (
      <div className="hero-surface rounded-2xl px-8 py-14"><h1 className="text-3xl font-extrabold text-on-dark sm:text-4xl">{block.title}</h1><p className="mt-3 max-w-2xl text-on-dark-muted">{block.subtitle}</p>
        {block.ctaLabel && <HrefLink href={block.ctaHref} className={buttonClass("brand", "lg", "mt-6")}>{block.ctaLabel}</HrefLink>}</div>);
    case "heading": return <h2 className="text-2xl font-extrabold">{block.text}</h2>;
    case "text": return <div className="max-w-3xl space-y-3 text-muted-foreground">{block.text.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>;
    case "image": return <MediaImage src={block.src} alt={block.alt} className="max-h-[480px] w-full rounded-xl object-cover" />;
    case "image-text": return <div className="grid items-center gap-8 md:grid-cols-2"><MediaImage src={block.src} alt={block.alt} className="aspect-video w-full rounded-xl object-cover" /><p className="text-muted-foreground">{block.text}</p></div>;
    case "features": return <ul className="grid gap-4 sm:grid-cols-3">{block.items.map((f) => <li key={f}><Card className="flex h-full gap-3 p-5 text-sm"><Check className="h-5 w-5 shrink-0 text-brand-green" aria-hidden />{f}</Card></li>)}</ul>;
    case "pricing": return <div className="grid gap-6 md:grid-cols-3">{block.productIds.map((id) => products.find((p) => p.id === id)).filter((p) => p !== undefined).map((p) => <PlanCard key={p.id} product={p} cycle="annually" />)}</div>;
    case "faq": return <Faq items={block.items} />;
    case "cta": return <div className="flex flex-col items-start gap-4 rounded-2xl border bg-card p-8 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-2xl font-extrabold">{block.title}</h2><HrefLink href={block.ctaHref} className={buttonClass("brand", "lg")}>{block.ctaLabel}</HrefLink></div>;
    case "testimonials": return <Testimonials items={block.items} />;
    case "contact": return <Card className="flex flex-wrap gap-6 p-6 text-sm"><span className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden />{block.email}</span><span className="flex items-center gap-2"><Phone className="h-4 w-4" aria-hidden />{block.phone}</span></Card>;
  }
}
