import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, Card, ConfirmDialog, Field, Input, PageHeader, Pagination, Select, Switch, Table, Td, Textarea, Th, usePagination } from "@/design-system/components/ui";
import { mediaDb } from "@/lib/media-db";
import { SITE_URL, useSeo } from "@/lib/seo";
import { db, useDb } from "@/lib/store";
import { downloadText } from "@/lib/utils";
import type { Currency, Settings } from "@/types/models";
import { adminSeo, audit } from "./AdminCommerce";

export function DemoDataTools() {
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Card className="p-5">
      <h2 className="font-extrabold">Demo data</h2>
      <p className="mt-1 text-sm text-muted-foreground">All records live in this browser. Export a JSON backup, import one, or reset to the original seed.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { downloadText(`m212-demo-data-${new Date().toISOString().slice(0, 10)}.json`, db.exportJson(), "application/json"); audit("data.export", "json"); }}><Download className="h-4 w-4" />Export JSON</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />Import JSON</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Import demo data file" onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
          if (f.size > 5 * 1024 * 1024) { toast.error("File too large (max 5 MB)"); return; }
          try { db.importJson(await f.text()); audit("data.import", f.name); toast.success("Demo data imported"); } catch (err) { toast.error(err instanceof Error ? err.message : "Import failed"); }
        }} />
        <Button variant="danger" onClick={() => setConfirm(true)}><RotateCcw className="h-4 w-4" />Reset demo data</Button>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Reset all demo data?" body="Every customer, order, CMS page and setting will return to the original seed. Uploaded media will be deleted. This cannot be undone." confirmLabel="Reset"
        onConfirm={() => { db.reset(); void mediaDb.clear().catch(() => undefined); toast.success("Demo data reset"); }} />
    </Card>
  );
}

export function AdminSettings() {
  useSeo(adminSeo("Settings", "/admin/settings"));
  const d = useDb();
  const [s, setS] = useState<Settings>(d.settings);
  const save = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.company.email)) { toast.error("Company email is invalid"); return; }
    if (s.taxRate < 0 || s.taxRate > 0.5) { toast.error("Tax rate must be between 0 and 0.5"); return; }
    if (s.languages.length === 0 || s.currencies.length === 0) { toast.error("Keep at least one language and one currency"); return; }
    db.update((x) => ({ ...x, settings: s })); audit("settings.update", "general"); toast.success("Settings saved");
  };
  const co = (k: keyof Settings["company"]) => <Field key={k} label={k[0]!.toUpperCase() + k.slice(1)}>{(id) => <Input id={id} value={s.company[k]} onChange={(e) => setS({ ...s, company: { ...s.company, [k]: e.target.value } })} />}</Field>;
  const toggleList = <T extends string>(list: T[], v: T) => list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  return (
    <>
      <PageHeader title="Settings" actions={<Button onClick={save}>Save settings</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5"><h2 className="font-extrabold">Company profile</h2>{(["name", "legalName", "email", "phone", "address", "ice"] as const).map(co)}</Card>
        <div className="space-y-6">
          <Card className="space-y-3 p-5"><h2 className="font-extrabold">Brand</h2>
            <Field label="Tagline">{(id) => <Input id={id} value={s.brand.tagline} onChange={(e) => setS({ ...s, brand: { ...s.brand, tagline: e.target.value } })} />}</Field>
            <Field label="Primary colour (reference)">{(id) => <Input id={id} value={s.brand.primaryColor} onChange={(e) => setS({ ...s, brand: { ...s.brand, primaryColor: e.target.value } })} />}</Field></Card>
          <Card className="space-y-3 p-5"><h2 className="font-extrabold">Languages & currencies</h2>
            <div className="flex gap-4 text-sm">{(["en", "fr"] as const).map((l) => <label key={l} className="flex items-center gap-2"><input type="checkbox" className="accent-brand-green" checked={s.languages.includes(l)} onChange={() => setS({ ...s, languages: toggleList(s.languages, l) })} />{l.toUpperCase()}</label>)}</div>
            <div className="grid gap-3 sm:grid-cols-3">{(["MAD", "EUR", "USD"] as Currency[]).map((c) => <Field key={c} label={`${c} rate (per 1 MAD)`}>{(id) => <Input id={id} type="number" step="0.001" disabled={c === "MAD"} value={s.rates[c]} onChange={(e) => setS({ ...s, rates: { ...s.rates, [c]: Number(e.target.value) } })} />}</Field>)}</div>
            <p className="text-xs text-muted-foreground">Rates are manual demo assumptions, not live exchange rates.</p></Card>
          <Card className="space-y-3 p-5"><h2 className="font-extrabold">Tax</h2><div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rate (0–0.5)">{(id) => <Input id={id} type="number" step="0.01" value={s.taxRate} onChange={(e) => setS({ ...s, taxRate: Number(e.target.value) })} />}</Field>
            <Field label="Label">{(id) => <Input id={id} value={s.taxLabel} onChange={(e) => setS({ ...s, taxLabel: e.target.value })} />}</Field></div></Card>
        </div>
        <Card className="space-y-3 p-5"><h2 className="font-extrabold">Email configuration <Badge tone="demo">placeholder</Badge></h2>
          <Field label="Provider">{(id) => <Select id={id} value={s.email.provider} onChange={(e) => setS({ ...s, email: { ...s.email, provider: e.target.value } })}><option>Not connected</option><option>SMTP (backend)</option><option>Transactional API (backend)</option></Select>}</Field>
          <Field label="From address">{(id) => <Input id={id} value={s.email.fromAddress} onChange={(e) => setS({ ...s, email: { ...s.email, fromAddress: e.target.value } })} />}</Field>
          <p className="text-xs text-muted-foreground">SMTP passwords and API keys must be configured on the backend, never here.</p></Card>
        <Card className="space-y-3 p-5"><h2 className="font-extrabold">Payment configuration <Badge tone="demo">placeholder</Badge></h2>
          {([["bankTransfer", "Bank transfer"], ["cardPlaceholder", "Card payment (placeholder)"], ["moroccanProvider", "Moroccan provider (placeholder)"], ["internationalProvider", "International provider (placeholder)"]] as const).map(([k, l]) => <div key={k} className="flex items-center justify-between text-sm"><span>{l}</span><Switch checked={s.payment[k]} onChange={(v) => setS({ ...s, payment: { ...s.payment, [k]: v } })} label={l} /></div>)}
          <Field label="Bank transfer instructions">{(id) => <Textarea id={id} value={s.payment.bankDetails} onChange={(e) => setS({ ...s, payment: { ...s.payment, bankDetails: e.target.value } })} />}</Field></Card>
        <Card className="space-y-3 p-5"><h2 className="font-extrabold">Registrar configuration <Badge tone="demo">placeholder</Badge></h2>
          <p className="text-sm text-muted-foreground">Enable adapters and sandbox mode on the Registrars page. Credentials belong on the backend.</p>
          <ul className="text-sm">{s.registrars.map((r) => <li key={r.id}>{r.name}: {r.enabled ? "enabled" : "disabled"}{r.sandbox ? " (sandbox)" : ""}</li>)}</ul></Card>
        <DemoDataTools />
      </div>
    </>
  );
}

export function AdminSecurity() {
  useSeo(adminSeo("Security", "/admin/security"));
  const d = useDb();
  const [sec, setSec] = useState(d.settings.security);
  return (<><PageHeader title="Security" actions={<Button onClick={() => { if (sec.sessionMinutes < 5 || sec.sessionMinutes > 1440) { toast.error("Session timeout 5–1440 minutes"); return; } db.update((x) => ({ ...x, settings: { ...x.settings, security: sec } })); audit("security.update", "policy"); toast.success("Security policy saved"); }}>Save policy</Button>} />
    <Alert tone="danger" className="mb-6" title="This frontend is not a security boundary">Roles are selected locally for demonstration. Real authentication, MFA, session expiry, IP restrictions and authorization checks must be enforced by the backend. These settings record the intended policy.</Alert>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4 p-5"><h2 className="font-extrabold">Policy (intended)</h2>
        <div className="flex items-center justify-between text-sm"><span>Require MFA for administrators</span><Switch checked={sec.mfaRequiredForAdmins} onChange={(v) => setSec({ ...sec, mfaRequiredForAdmins: v })} label="Require MFA" /></div>
        <Field label="Session timeout (minutes)">{(id) => <Input id={id} type="number" value={sec.sessionMinutes} onChange={(e) => setSec({ ...sec, sessionMinutes: Number(e.target.value) })} />}</Field>
        <Field label="Admin IP allowlist (CIDR, one per line)">{(id) => <Textarea id={id} value={sec.ipAllowlist} onChange={(e) => setSec({ ...sec, ipAllowlist: e.target.value })} />}</Field></Card>
      <Card className="p-5"><h2 className="mb-3 font-extrabold">Frontend hardening in this release</h2><ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li>Content-Security-Policy, X-Frame-Options and HSTS via <code>_headers</code></li><li>No secrets, API keys or tokens in the bundle</li><li>No passwords or card data stored</li><li>Media uploads validated by type and size</li><li>User-provided invoice content HTML-escaped</li><li>Admin, client and reseller paths disallowed in robots.txt</li></ul></Card>
    </div></>);
}

export function AdminAuditLogs() {
  useSeo(adminSeo("Audit logs", "/admin/audit-logs"));
  const d = useDb();
  const [q, setQ] = useState("");
  const list = d.activity.filter((a) => (a.actor + a.action + a.target).toLowerCase().includes(q.toLowerCase()));
  const p = usePagination(list, 15);
  return (<><PageHeader title="Audit logs" description="Local activity log (last 300 events). A tamper-proof log requires the backend." actions={<Button variant="outline" onClick={() => downloadText("m212-audit-log.json", JSON.stringify(d.activity, null, 2), "application/json")}><Download className="h-4 w-4" />Export</Button>} />
    <Input aria-label="Search logs" className="mb-4 w-72" placeholder="Search actor, action, target…" value={q} onChange={(e) => setQ(e.target.value)} />
    <Table><thead><tr><Th>Time</Th><Th>Actor</Th><Th>Action</Th><Th>Target</Th></tr></thead><tbody>{p.slice.map((a) => <tr key={a.id}><Td className="whitespace-nowrap text-xs">{new Date(a.at).toLocaleString()}</Td><Td>{a.actor}</Td><Td><span className="font-mono text-xs">{a.action}</span></Td><Td>{a.target}</Td></tr>)}</tbody></Table><Pagination {...p} /></>);
}

export const PUBLIC_ROUTES = ["/", "/domains", "/domains/search", "/domains/pricing", "/hosting", "/hosting/shared", "/hosting/wordpress", "/hosting/reseller", "/vps", "/vps/linux", "/vps/windows", "/dedicated-servers", "/ssl", "/business-email", "/cloud", "/pricing", "/about", "/contact", "/support", "/knowledgebase", "/blog", "/legal/terms", "/legal/privacy", "/legal/refunds"];

export function buildSitemap(extra: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...PUBLIC_ROUTES, ...extra].map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join("\n")}\n</urlset>\n`;
}

export function AdminSeo() {
  useSeo(adminSeo("SEO", "/admin/seo"));
  const d = useDb();
  const [seo, setSeo] = useState(d.settings.seo);
  const cmsUrls = [...d.pages.filter((p) => p.status === "published").map((p) => `/p/${p.slug}`), ...d.posts.filter((p) => p.status === "published").map((p) => `/blog/${p.slug}`)];
  return (<><PageHeader title="SEO" actions={<Button onClick={() => { if (seo.defaultTitle.length > 70) toast.warning("Title longer than 70 characters may be truncated"); db.update((x) => ({ ...x, settings: { ...x.settings, seo } })); audit("seo.update", "defaults"); toast.success("SEO defaults saved"); }}>Save</Button>} />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-3 p-5"><h2 className="font-extrabold">Defaults</h2>
        <Field label={`Default title (${seo.defaultTitle.length}/70)`}>{(id) => <Input id={id} value={seo.defaultTitle} onChange={(e) => setSeo({ ...seo, defaultTitle: e.target.value })} />}</Field>
        <Field label={`Default description (${seo.defaultDescription.length}/160)`}>{(id) => <Textarea id={id} value={seo.defaultDescription} onChange={(e) => setSeo({ ...seo, defaultDescription: e.target.value })} />}</Field>
        <Field label="Open Graph image URL">{(id) => <Input id={id} value={seo.ogImage} onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })} />}</Field>
        <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Search preview</p><p className="font-semibold text-brand-green">{seo.defaultTitle}</p><p className="text-xs text-success">{SITE_URL}/</p><p className="text-sm text-muted-foreground">{seo.defaultDescription}</p></div></Card>
      <Card className="p-5"><h2 className="font-extrabold">Sitemap</h2><p className="mt-1 text-sm text-muted-foreground">public/sitemap.xml ships the {PUBLIC_ROUTES.length} static routes. Published CMS pages and posts can be added by regenerating:</p>
        <ul className="mt-2 text-xs">{cmsUrls.map((u) => <li key={u} className="font-mono">{u}</li>)}</ul>
        <Button className="mt-3" variant="outline" onClick={() => downloadText("sitemap.xml", buildSitemap(cmsUrls), "application/xml")}><Download className="h-4 w-4" />Download sitemap.xml</Button></Card>
    </div></>);
}
