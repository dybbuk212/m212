import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, Select } from "@/design-system/components/ui";
import { addLine } from "@/lib/cart";
import { useI18n, useMoney } from "@/lib/i18n";
import { CYCLE_DISCOUNT, CYCLE_MONTHS, cyclePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { BillingCycle, Product } from "@/types/models";

export const CYCLE_LABEL: Record<BillingCycle, { en: string; fr: string }> = {
  monthly: { en: "Monthly", fr: "Mensuel" }, quarterly: { en: "Quarterly", fr: "Trimestriel" }, annually: { en: "Annually", fr: "Annuel" }, biennially: { en: "2 years", fr: "2 ans" },
};

export function Section({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={cn("mx-auto max-w-7xl px-4 py-14", className)}>{children}</section>;
}
export function SectionHeading({ eyebrow, title, body, center, as: Tag = "h2" }: { eyebrow?: string; title: string; body?: string; center?: boolean; as?: "h1" | "h2" }) {
  return (
    <div className={cn("mb-8 max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-red">{eyebrow}</p>}
      <Tag className="text-2xl font-extrabold sm:text-3xl">{title}</Tag>
      {body && <p className="mt-2 text-muted-foreground">{body}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, body, children, aside }: { eyebrow: string; title: string; body: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="hero-surface relative overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[1.3fr_1fr] lg:py-20">
        <div className="animate-rise">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-on-dark-muted">{eyebrow}</p>
          <h1 className="text-3xl font-extrabold text-on-dark sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-lg text-on-dark-muted">{body}</p>
          {children && <div className="mt-7">{children}</div>}
        </div>
        {aside && <div className="animate-rise self-center">{aside}</div>}
      </div>
    </div>
  );
}

export function CyclePicker({ cycles, value, onChange }: { cycles: BillingCycle[]; value: BillingCycle; onChange: (c: BillingCycle) => void }) {
  const { locale } = useI18n();
  return (
    <div role="radiogroup" aria-label="Billing cycle" className="inline-flex flex-wrap gap-1 rounded-lg border bg-card p-1">
      {cycles.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} onClick={() => onChange(c)}
          className={cn("rounded-md px-3 py-1.5 text-sm font-semibold transition", value === c ? "bg-brand-navy-deep text-on-dark" : "text-muted-foreground hover:bg-muted")}>
          {CYCLE_LABEL[c][locale]}{CYCLE_DISCOUNT[c] > 0 && <span className="ml-1 text-xs text-brand-green">-{CYCLE_DISCOUNT[c] * 100}%</span>}
        </button>
      ))}
    </div>
  );
}

export function addProductToCart(p: Product, cycle: BillingCycle, meta?: string, priceOverride?: number) {
  const safe = p.cycles.includes(cycle) ? cycle : p.cycles[0]!;
  addLine({ key: `${p.id}:${safe}:${meta ?? ""}`, productId: p.id, name: p.name, kind: "product", cycle: safe, quantity: 1, unitPrice: priceOverride ?? cyclePrice(p, safe), meta });
}

export function PlanCard({ product, cycle, onAdd }: { product: Product; cycle: BillingCycle; onAdd?: () => void }) {
  const { l, t } = useI18n();
  const money = useMoney();
  const navigate = useNavigate();
  const c = product.cycles.includes(cycle) ? cycle : product.cycles[product.cycles.length - 1]!;
  const total = cyclePrice(product, c);
  const perMonth = total / CYCLE_MONTHS[c];
  return (
    <Card className={cn("relative flex flex-col p-6", product.featured && "border-2 border-brand-green")}>
      {product.badge && <Badge tone={product.featured ? "success" : "info"} className="absolute -top-3 left-6">{product.badge}</Badge>}
      <h3 className="text-xl font-extrabold">{product.name}</h3>
      <p className="mt-1 min-h-10 text-sm text-muted-foreground">{l(product.tagline)}</p>
      <p className="mt-5 font-display text-3xl font-extrabold tabular text-brand-navy">{money(perMonth)}<span className="text-sm font-semibold text-muted-foreground">{t("common.perMonth")}</span></p>
      <p className="text-xs text-muted-foreground">{money(total)} · {CYCLE_LABEL[c][useI18n().locale]} · {t("common.exclTax")}</p>
      <dl className="mt-5 space-y-1.5 border-t pt-4 text-sm">
        {Object.entries(product.specs).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
      </dl>
      <ul className="mt-4 flex-1 space-y-1.5 text-sm">
        {product.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" aria-hidden />{f}</li>)}
      </ul>
      <Button className="mt-6 w-full" variant={product.featured ? "brand" : "primary"} onClick={() => {
        if (onAdd) { onAdd(); return; }
        addProductToCart(product, c);
        toast.success(`${product.name} — ${t("common.added")}`, { action: { label: "View cart", onClick: () => void navigate({ to: "/cart" }) } });
      }}>{t("common.addToCart")}</Button>
    </Card>
  );
}

export function PlanGrid({ products, cycles }: { products: Product[]; cycles?: BillingCycle[] }) {
  const available = cycles ?? (Array.from(new Set(products.flatMap((p) => p.cycles))) as BillingCycle[]);
  const [cycle, setCycle] = useState<BillingCycle>(available.includes("annually") ? "annually" : available[0]!);
  return (
    <div>
      <div className="mb-8 flex justify-center"><CyclePicker cycles={available} value={cycle} onChange={setCycle} /></div>
      <div className={cn("grid gap-6 pt-3", products.length >= 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
        {products.map((p) => <PlanCard key={p.id} product={p} cycle={cycle} />)}
      </div>
    </div>
  );
}

export function ComparisonTable({ products }: { products: Product[] }) {
  const { t } = useI18n();
  const keys = Array.from(new Set(products.flatMap((p) => Object.keys(p.specs))));
  const features = Array.from(new Set(products.flatMap((p) => p.features)));
  return (
    <div>
      <h3 className="mb-4 text-xl font-extrabold">{t("common.compare")}</h3>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">{t("common.compare")}</caption>
          <thead><tr><th scope="col" className="p-3 text-left text-muted-foreground">&nbsp;</th>{products.map((p) => <th key={p.id} scope="col" className="p-3 text-left font-display font-extrabold text-brand-navy">{p.name}</th>)}</tr></thead>
          <tbody>
            {keys.map((k) => <tr key={k} className="border-t"><th scope="row" className="p-3 text-left font-medium text-muted-foreground">{k}</th>{products.map((p) => <td key={p.id} className="p-3 font-semibold">{p.specs[k] ?? "—"}</td>)}</tr>)}
            {features.map((f) => <tr key={f} className="border-t"><th scope="row" className="p-3 text-left font-medium text-muted-foreground">{f}</th>{products.map((p) => <td key={p.id} className="p-3">{p.features.includes(f) ? <Check className="h-4 w-4 text-brand-green" aria-label="Included" /> : <span aria-label="Not included" className="text-muted-foreground">—</span>}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-2xl font-extrabold">{t("common.faq")}</h2>
      <div className="divide-y rounded-lg border bg-card">
        {items.map((it) => (
          <details key={it.q} className="group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-brand-navy">{it.q}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden /></summary>
            <p className="mt-2 text-sm text-muted-foreground">{it.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function Testimonials({ items }: { items: { quote: string; author: string }[] }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3"><h2 className="text-2xl font-extrabold">What customers could say</h2><Badge tone="demo">Demo content</Badge></div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((t) => <Card key={t.author} className="p-6"><blockquote className="text-sm">“{t.quote}”</blockquote><p className="mt-4 text-xs font-bold text-muted-foreground">{t.author}</p></Card>)}
      </div>
    </div>
  );
}

export const DEMO_TESTIMONIALS = [
  { quote: "Moving our agency sites was straightforward and support answered in French within the hour.", author: "Sample persona — agency owner, Casablanca" },
  { quote: "Pricing in dirhams with clear renewal prices is exactly what our finance team wanted.", author: "Sample persona — finance lead, Rabat" },
  { quote: "We started on shared hosting and upgraded to a VPS without changing provider.", author: "Sample persona — startup CTO, Tangier" },
];

export function DomainSearchBox({ initial = "", onDark = false, size = "lg" }: { initial?: string; onDark?: boolean; size?: "md" | "lg" }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); void navigate({ to: "/domains/search", search: { q: q.trim() } }); }} className="w-full">
      <div className={cn("flex gap-2 rounded-xl p-2 shadow-pop", onDark ? "bg-card" : "border bg-card")}>
        <label htmlFor="domain-q" className="sr-only">Domain name</label>
        <div className="flex flex-1 items-center gap-2 pl-2"><Search className="h-5 w-5 text-muted-foreground" aria-hidden />
          <input id="domain-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} autoComplete="off"
            className={cn("w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground", size === "lg" ? "h-12 text-lg" : "h-10")} />
        </div>
        <Button type="submit" variant="brand" size={size === "lg" ? "lg" : "md"}>{t("search.button")}</Button>
      </div>
      <p className={cn("mt-2 text-xs", onDark ? "text-on-dark-muted" : "text-muted-foreground")}>{t("search.demoNote")}</p>
    </form>
  );
}

export function TrustStrip() {
  const { locale } = useI18n();
  const items = locale === "fr"
    ? ["Support local FR / AR / EN", "Prix transparents en MAD", "Stockage NVMe", "SSL gratuit sur l'hébergement", "Sauvegardes incluses"]
    : ["Local support in FR / AR / EN", "Transparent MAD pricing", "NVMe storage", "Free SSL on hosting", "Backups included"];
  return <div className="border-y bg-card"><ul className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-8 gap-y-2 px-4 py-4 text-sm font-semibold text-muted-foreground">{items.map((i) => <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-green" aria-hidden />{i}</li>)}</ul></div>;
}

export function ServerVisual() {
  return (
    <div className="rounded-xl border border-on-dark/15 bg-on-dark/5 p-5 backdrop-blur" aria-hidden>
      {["web-cas-03", "wp-cas-01", "kvm-eu-07", "mail-cas-02", "db-cas-05"].map((h, i) => (
        <div key={h} className="mb-2 flex items-center gap-3 rounded-md bg-brand-navy-deep/70 px-3 py-2.5 last:mb-0">
          <span className={cn("h-2 w-2 rounded-full", i === 2 ? "bg-warning" : "bg-brand-green")} />
          <span className="font-mono text-xs text-on-dark-muted">{h}</span>
          <div className="ml-auto flex gap-1">{Array.from({ length: 8 }, (_, j) => <span key={j} className="h-3 w-1.5 rounded-sm bg-on-dark/20" />)}</div>
        </div>
      ))}
      <p className="mt-3 text-center text-[11px] text-on-dark-muted">Illustration — not a live status view</p>
    </div>
  );
}

export function PriceFrom({ mad, suffix }: { mad: number; suffix?: string }) {
  const money = useMoney();
  const { t } = useI18n();
  return <span className="text-sm text-muted-foreground">{t("common.from")} <strong className="font-display text-lg text-brand-navy">{money(mad)}</strong>{suffix ?? t("common.perMonth")}</span>;
}

export function SelectCycle({ value, onChange, cycles }: { value: BillingCycle; onChange: (c: BillingCycle) => void; cycles: BillingCycle[] }) {
  const { locale } = useI18n();
  return <Select value={value} onChange={(e) => onChange(e.target.value as BillingCycle)} aria-label="Billing cycle">{cycles.map((c) => <option key={c} value={c}>{CYCLE_LABEL[c][locale]}</option>)}</Select>;
}
