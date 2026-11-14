import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, Card, PageHeader, StatusBadge, Switch, Table, Tabs, Td, Th } from "@/components/ui";
import { formatDate, useMoney } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";
import { db, uid, useDb } from "@/lib/store";
import { REGISTRAR_ADAPTERS } from "@/services/registrar";
import type { Category, Domain, Product, Tld } from "@/types/models";
import { EntityManager } from "./EntityManager";
import { adminSeo, audit } from "./AdminCommerce";

const TYPES = ["shared", "wordpress", "reseller-hosting", "vps", "dedicated", "ssl", "email", "cloud"];
const CYCLES = ["monthly", "quarterly", "annually", "biennially"] as const;

export function AdminProducts() {
  useSeo(adminSeo("Products", "/admin/products"));
  const d = useDb(); const money = useMoney();
  type Row = Product & { tag: string; specsText: string; cyclesText: string };
  const rows: Row[] = d.products.map((p) => ({ ...p, tag: p.tagline.en, specsText: Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join("\n"), cyclesText: p.cycles.join(", ") }));
  const toProduct = (r: Row): Product => {
    const specs = Object.fromEntries(String(r.specsText).split("\n").map((l) => l.split(":")).filter((x) => x.length >= 2).map(([k, ...v]) => [k!.trim(), v.join(":").trim()]));
    const cycles = String(r.cyclesText).split(/[,\s]+/).filter((c): c is Product["cycles"][number] => (CYCLES as readonly string[]).includes(c));
    const { tag, specsText, cyclesText, ...rest } = r; void specsText; void cyclesText;
    return { ...rest, tagline: { en: tag, fr: r.tagline.fr || tag }, specs, cycles: cycles.length ? cycles : ["monthly"], priceMonthly: Number(r.priceMonthly), features: r.features.filter(Boolean) };
  };
  return (<><PageHeader title="Products" description="Changes appear immediately on the public storefront." />
    <EntityManager<Row> entityName="Product" items={rows} searchKeys={["name", "type", "id"]} filter={{ key: "type", label: "Types", options: TYPES }}
      columns={[{ label: "Product", render: (p) => <><strong>{p.name}</strong><span className="block text-xs text-muted-foreground">{p.id}</span></> }, { label: "Type", render: (p) => <Badge>{p.type}</Badge> }, { label: "Price / mo", render: (p) => money(p.priceMonthly) }, { label: "Cycles", render: (p) => <span className="text-xs">{p.cyclesText}</span> },
        { label: "Visible", render: (p) => <Switch checked={p.visible} onChange={(v) => { db.patch("products", p.id, { visible: v }); audit("product.visibility", p.id); }} label={`Visible ${p.name}`} /> },
        { label: "Featured", render: (p) => <Switch checked={p.featured} onChange={(v) => { db.patch("products", p.id, { featured: v }); audit("product.featured", p.id); }} label={`Featured ${p.name}`} /> }]}
      fields={[{ key: "name", label: "Name", kind: "text", required: true }, { key: "type", label: "Product type", kind: "select", options: TYPES.map((t) => ({ value: t, label: t })) },
        { key: "categoryId", label: "Category", kind: "select", options: d.categories.map((c) => ({ value: c.id, label: c.name })) },
        { key: "priceMonthly", label: "Monthly price (MAD, excl. tax)", kind: "number", required: true, validate: (v) => Number(v) <= 0 ? "Must be positive" : null },
        { key: "cyclesText", label: "Billing cycles", kind: "text", hint: "Comma separated: monthly, quarterly, annually, biennially" }, { key: "badge", label: "Badge", kind: "text" },
        { key: "tag", label: "Tagline", kind: "text", full: true, required: true }, { key: "specsText", label: "Specifications", kind: "textarea", hint: "One per line — Key: Value" },
        { key: "features", label: "Features", kind: "list", hint: "One per line" }, { key: "visible", label: "Visible on storefront", kind: "switch" }, { key: "featured", label: "Featured", kind: "switch" }]}
      create={() => ({ id: uid("prd"), type: "shared", categoryId: d.categories[0]?.id ?? "", name: "", tagline: { en: "", fr: "" }, tag: "", priceMonthly: 0, cycles: ["monthly"], cyclesText: "monthly, annually", specs: {}, specsText: "Storage: 10 GB", features: [], visible: false, featured: false })}
      onSave={(r, isNew) => { const p = toProduct(r); if (isNew) db.insert("products", p); else db.patch("products", p.id, p); audit(isNew ? "product.create" : "product.update", p.name); }}
      onDelete={(r) => { db.remove("products", r.id); audit("product.delete", r.name); }} /></>);
}

export function AdminCategories() {
  useSeo(adminSeo("Categories", "/admin/categories"));
  const d = useDb();
  const sorted = [...d.categories].sort((a, b) => a.order - b.order);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= sorted.length) return;
    const a = sorted[i]!, b = sorted[j]!;
    db.update((s) => ({ ...s, categories: s.categories.map((c) => c.id === a.id ? { ...c, order: b.order } : c.id === b.id ? { ...c, order: a.order } : c) }));
    audit("category.reorder", a.name);
  };
  return (<><PageHeader title="Categories" description="Order controls the pricing page and navigation grouping." />
    <EntityManager<Category> entityName="Category" items={sorted} searchKeys={["name", "slug"]} pageSize={50}
      columns={[{ label: "Order", render: (c) => { const i = sorted.findIndex((x) => x.id === c.id); return <span className="flex items-center gap-1"><Button size="icon" variant="ghost" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={`Move ${c.name} down`} disabled={i === sorted.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button><span className="tabular text-xs">{i + 1}</span></span>; } },
        { label: "Name", render: (c) => <strong>{c.name}</strong> }, { label: "Slug", render: (c) => <span className="font-mono text-xs">/{c.slug}</span> }, { label: "Products", render: (c) => d.products.filter((p) => p.categoryId === c.id).length }, { label: "Description", render: (c) => <span className="text-xs">{c.description}</span> }]}
      fields={[{ key: "name", label: "Name", kind: "text", required: true }, { key: "slug", label: "Slug", kind: "text", required: true, validate: (v) => /^[a-z0-9/-]+$/.test(String(v)) ? null : "Lower-case letters, digits, / and -" }, { key: "description", label: "Description", kind: "textarea" }]}
      create={() => ({ id: uid("cat"), name: "", slug: "", order: (sorted.at(-1)?.order ?? 0) + 1, description: "" })}
      onSave={(c, isNew) => { if (isNew) db.insert("categories", c); else db.patch("categories", c.id, c); audit("category.save", c.name); }}
      onDelete={(c) => { if (d.products.some((p) => p.categoryId === c.id)) { toast.error("Reassign the products in this category first"); return; } db.remove("categories", c.id); audit("category.delete", c.name); }} /></>);
}

export function AdminDomains() {
  useSeo(adminSeo("Domains", "/admin/domains"));
  const d = useDb(); const money = useMoney();
  const [tab, setTab] = useState<"tlds" | "records">("tlds");
  type TldRow = Tld & { id: string };
  const rows: TldRow[] = d.tlds.map((t) => ({ ...t, id: t.tld }));
  const regOpts = d.settings.registrars.map((r) => ({ value: r.id, label: r.name }));
  return (<><PageHeader title="Domains & TLDs" />
    <Tabs value={tab} onChange={setTab} tabs={[{ id: "tlds", label: "TLD catalogue & pricing" }, { id: "records", label: "Domain records" }]} />
    <div className="mt-6">
      {tab === "tlds" ? <EntityManager<TldRow> entityName="TLD" items={rows} searchKeys={["tld"]} pageSize={20}
        columns={[{ label: "TLD", render: (t) => <strong className="font-display">{t.tld}</strong> }, { label: "Register", render: (t) => <>{money(t.register)}{t.promo !== undefined && <Badge tone="brand" className="ml-1">promo {money(t.promo)}</Badge>}</> }, { label: "Renew", render: (t) => money(t.renew) }, { label: "Transfer", render: (t) => money(t.transfer) }, { label: "Registrar", render: (t) => <span className="text-xs">{t.registrar}</span> }]}
        fields={[{ key: "tld", label: "Extension", kind: "text", required: true, validate: (v, it) => !/^\.[a-z]{2,24}$/.test(String(v)) ? "Format: .ext" : d.tlds.some((t) => t.tld === v && t.tld !== it.id) ? "Already exists" : null },
          { key: "registrar", label: "Registrar assignment", kind: "select", options: regOpts }, { key: "register", label: "Register price", kind: "number", required: true }, { key: "renew", label: "Renewal price", kind: "number", required: true }, { key: "transfer", label: "Transfer price", kind: "number", required: true },
          { key: "promo", label: "Promo first-year price (optional)", kind: "number" }, { key: "privacy", label: "WHOIS privacy available", kind: "switch" }, { key: "restricted", label: "Registration requirements", kind: "textarea" }]}
        create={() => ({ id: "", tld: "", register: 0, renew: 0, transfer: 0, privacy: true, registrar: regOpts[0]?.value ?? "" })}
        onSave={(t, isNew) => { const { id, ...tld } = t; const clean: Tld = { ...tld, promo: tld.promo || undefined, restricted: tld.restricted || undefined }; db.update((s) => ({ ...s, tlds: isNew ? [...s.tlds, clean] : s.tlds.map((x) => x.tld === id ? clean : x) })); audit("tld.save", clean.tld); }}
        onDelete={(t) => { db.update((s) => ({ ...s, tlds: s.tlds.filter((x) => x.tld !== t.tld) })); audit("tld.delete", t.tld); }} />
      : <EntityManager<Domain> entityName="Domain" items={d.domains} searchKeys={["name"]} filter={{ key: "status", label: "Statuses", options: ["active", "pending-transfer", "expired", "demo-pending"] }}
        columns={[{ label: "Domain", render: (x) => <strong>{x.name}</strong> }, { label: "Customer", render: (x) => d.customers.find((c) => c.id === x.customerId)?.name ?? x.customerId }, { label: "Registrar", render: (x) => <span className="text-xs">{x.registrar}</span> }, { label: "Expires", render: (x) => formatDate(x.expiresAt) }, { label: "Status", render: (x) => <StatusBadge status={x.status} /> }]}
        fields={[{ key: "name", label: "Domain", kind: "text", required: true }, { key: "customerId", label: "Customer", kind: "select", options: d.customers.map((c) => ({ value: c.id, label: c.name })) }, { key: "registrar", label: "Registrar", kind: "select", options: regOpts },
          { key: "expiresAt", label: "Expiry date", kind: "date", required: true }, { key: "status", label: "Status", kind: "select", options: ["active", "pending-transfer", "expired", "demo-pending"].map((v) => ({ value: v, label: v })) }, { key: "autoRenew", label: "Auto-renew", kind: "switch" }, { key: "locked", label: "Locked", kind: "switch" }]}
        create={() => ({ id: uid("dom"), name: "", customerId: d.customers[0]?.id ?? "", registrar: regOpts[0]?.value ?? "", registeredAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), autoRenew: true, locked: true, privacy: false, nameservers: ["ns1.m212.ma", "ns2.m212.ma"], dns: [], status: "demo-pending", contact: { name: "", email: "", phone: "", address: "" } })}
        onSave={(x, isNew) => { if (isNew) db.insert("domains", x); else db.patch("domains", x.id, x); audit("domain.save", x.name); }}
        onDelete={(x) => { db.remove("domains", x.id); audit("domain.delete", x.name); }} />}
    </div></>);
}

export function AdminRegistrars() {
  useSeo(adminSeo("Registrars", "/admin/registrars"));
  const d = useDb();
  return (<><PageHeader title="Registrars" description="Adapter placeholders implementing the RegistrarProvider interface." />
    <Alert tone="warning" className="mb-6" title="No registrar is connected">Enabling an adapter here only records the intended configuration. API credentials must be stored on a secure backend — never in this frontend.</Alert>
    <div className="grid gap-4 md:grid-cols-3">{d.settings.registrars.map((r) => { const adapter = REGISTRAR_ADAPTERS.find((a) => a.id === r.id); return (
      <Card key={r.id} className="space-y-3 p-5"><div className="flex items-center justify-between"><h2 className="font-extrabold">{r.name}</h2><Badge tone="demo">{adapter?.connected ? "connected" : "not connected"}</Badge></div>
        <p className="text-xs text-muted-foreground">TLDs assigned: {d.tlds.filter((t) => t.registrar === r.id).map((t) => t.tld).join(", ") || "none"}</p>
        <div className="flex items-center justify-between text-sm"><span>Enabled (intent)</span><Switch checked={r.enabled} label={`Enable ${r.name}`} onChange={(v) => { db.update((s) => ({ ...s, settings: { ...s.settings, registrars: s.settings.registrars.map((x) => x.id === r.id ? { ...x, enabled: v } : x) } })); audit("registrar.toggle", r.id); }} /></div>
        <div className="flex items-center justify-between text-sm"><span>Sandbox mode</span><Switch checked={r.sandbox} label={`Sandbox ${r.name}`} onChange={(v) => db.update((s) => ({ ...s, settings: { ...s.settings, registrars: s.settings.registrars.map((x) => x.id === r.id ? { ...x, sandbox: v } : x) } }))} /></div>
        <Button size="sm" variant="outline" onClick={() => adapter?.registerDomain("test.example", 1).catch((e: Error) => toast.error(e.message))}>Test connection</Button></Card>); })}</div>
    <Card className="mt-6 p-5"><h2 className="mb-2 font-extrabold">Adapter interface</h2><Table><thead><tr><Th>Method</Th><Th>Demo behaviour</Th></tr></thead><tbody>
      {[["searchDomain / checkAvailability", "Simulated, labelled SIMULATED"], ["registerDomain / renewDomain / transferDomain", "Rejects: not connected"], ["getDomainDetails", "Returns null"], ["updateNameservers / updateContacts / updateDnsRecords", "Rejects: not connected (UI saves locally)"]].map(([m, b]) => <tr key={m}><Td className="font-mono text-xs">{m}</Td><Td>{b}</Td></tr>)}</tbody></Table></Card></>);
}
