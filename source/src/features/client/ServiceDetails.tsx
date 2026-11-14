import { useParams } from "@tanstack/react-router";
import { ClientTicketDetail } from "./ClientPages";
import { Lock, Monitor, Power, RefreshCw, RotateCcw, Trash2, Unlock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, ButtonLink, Card, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Progress, Select, Sparkline, StatusBadge, Switch, Table, Tabs, Td, Th } from "@/components/ui";
import { formatDate, useI18n } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";
import { db, uid } from "@/lib/store";
import type { DnsRecord, Domain, FirewallRule } from "@/types/models";
import { daysUntil, useCustomerData } from "./common";

const HOST_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
export function validateDnsRecord(r: Omit<DnsRecord, "id">): string | null {
  if (!/^(@|\*|[a-z0-9_*-]+(\.[a-z0-9_-]+)*)$/i.test(r.name)) return "Invalid record name.";
  if (r.ttl < 60 || r.ttl > 86400) return "TTL must be between 60 and 86400 seconds.";
  if (r.type === "A" && !/^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/.test(r.value)) return "A records need a valid IPv4 address.";
  if (r.type === "AAAA" && !/^[0-9a-f:]+$/i.test(r.value)) return "AAAA records need a valid IPv6 address.";
  if ((r.type === "CNAME" || r.type === "MX" || r.type === "NS") && !HOST_RE.test(r.value.replace(/\.$/, ""))) return `${r.type} records need a hostname.`;
  if (r.type === "MX" && (r.priority === undefined || r.priority < 0 || r.priority > 65535)) return "MX records need a priority between 0 and 65535.";
  if (r.type === "TXT" && (r.value.length === 0 || r.value.length > 255)) return "TXT value must be 1–255 characters.";
  return null;
}

const SimNote = () => <Alert tone="warning" className="mb-6">Changes are saved locally to demonstrate the workflow. No registrar, DNS server or hypervisor is connected.</Alert>;

export function ClientDomainDetail({ id }: { id: string }) {
  const { domains } = useCustomerData();
  const { locale } = useI18n();
  const d = domains.find((x) => x.id === id);
  useSeo({ title: d ? `${d.name} — Domain` : "Domain", description: "Domain management (demo).", path: `/client/domains/${id}`, noindex: true });
  const [tab, setTab] = useState<"overview" | "ns" | "dns" | "contacts" | "transfer">("overview");
  const [ns, setNs] = useState<string[]>(d?.nameservers ?? []);
  const [rec, setRec] = useState<Omit<DnsRecord, "id">>({ type: "A", name: "@", value: "", ttl: 3600 });
  const [recErr, setRecErr] = useState("");
  const [contact, setContact] = useState(d?.contact ?? { name: "", email: "", phone: "", address: "" });
  const [del, setDel] = useState<string | null>(null);
  if (!d) return <EmptyState title="Domain not found" action={<ButtonLink to="/client/domains">Back to domains</ButtonLink>} />;
  const patch = (c: Partial<Domain>, msg: string) => { db.patch("domains", d.id, c); db.log("customer", "domain.update", d.name); toast.success(msg); };
  return (
    <>
      <PageHeader eyebrow="Domain" title={d.name} actions={<StatusBadge status={d.status} />} />
      <SimNote />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "overview", label: "Overview" }, { id: "ns", label: "Nameservers" }, { id: "dns", label: "DNS records" }, { id: "contacts", label: "Contacts" }, { id: "transfer", label: "Transfer & lock" }]} />
      <div className="mt-6">
        {tab === "overview" && <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5"><dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Registered</dt><dd>{formatDate(d.registeredAt, locale)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Expires</dt><dd className="font-semibold">{formatDate(d.expiresAt, locale)} ({daysUntil(d.expiresAt)} days)</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Registrar adapter</dt><dd>{d.registrar} <Badge tone="demo">not connected</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">WHOIS privacy</dt><dd>{d.privacy ? "Enabled" : "Disabled"}</dd></div>
          </dl></Card>
          <Card className="space-y-4 p-5"><h2 className="font-extrabold">Renewal preferences</h2>
            <div className="flex items-center justify-between text-sm"><span>Auto-renew</span><Switch checked={d.autoRenew} onChange={(v) => patch({ autoRenew: v }, `Auto-renew ${v ? "enabled" : "disabled"}`)} label="Auto-renew" /></div>
            <div className="flex items-center justify-between text-sm"><span>WHOIS privacy</span><Switch checked={d.privacy} onChange={(v) => patch({ privacy: v }, `Privacy ${v ? "enabled" : "disabled"}`)} label="WHOIS privacy" /></div>
            <Button variant="outline" onClick={() => { const e = new Date(d.expiresAt); e.setFullYear(e.getFullYear() + 1); patch({ expiresAt: e.toISOString() }, "Renewed 1 year (simulated — no charge)"); }}><RefreshCw className="h-4 w-4" />Renew 1 year (simulated)</Button>
          </Card></div>}
        {tab === "ns" && <Card className="max-w-xl space-y-3 p-5">
          {ns.map((n, i) => <div key={i} className="flex gap-2"><Input aria-label={`Nameserver ${i + 1}`} value={n} onChange={(e) => setNs(ns.map((x, j) => (j === i ? e.target.value : x)))} />{ns.length > 2 && <Button variant="ghost" size="icon" aria-label="Remove nameserver" onClick={() => setNs(ns.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>}</div>)}
          <div className="flex gap-2">{ns.length < 4 && <Button variant="outline" onClick={() => setNs([...ns, ""])}>Add nameserver</Button>}<Button variant="ghost" onClick={() => setNs(["ns1.m212.ma", "ns2.m212.ma"])}>Use M212 defaults</Button></div>
          <Button onClick={() => { const bad = ns.find((n) => !HOST_RE.test(n.trim())); if (ns.length < 2 || bad !== undefined) { toast.error(bad !== undefined ? `Invalid nameserver: ${bad || "(empty)"}` : "At least two nameservers are required"); return; } patch({ nameservers: ns.map((n) => n.trim().toLowerCase()) }, "Nameservers saved (demo)"); }}>Save nameservers</Button>
        </Card>}
        {tab === "dns" && <div className="space-y-4">
          <Card className="p-5"><form className="grid items-end gap-3 sm:grid-cols-[100px_1fr_2fr_90px_90px_auto]" onSubmit={(e) => { e.preventDefault(); const er = validateDnsRecord(rec); setRecErr(er ?? ""); if (er) return; patch({ dns: [...d.dns, { ...rec, id: uid("dns") }] }, "Record added"); setRec({ ...rec, value: "" }); }}>
            <Field label="Type">{(fid) => <Select id={fid} value={rec.type} onChange={(e) => setRec({ ...rec, type: e.target.value as DnsRecord["type"], priority: e.target.value === "MX" ? 10 : undefined })}>{["A", "AAAA", "CNAME", "MX", "TXT", "NS"].map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
            <Field label="Name">{(fid) => <Input id={fid} value={rec.name} onChange={(e) => setRec({ ...rec, name: e.target.value })} />}</Field>
            <Field label="Value">{(fid) => <Input id={fid} value={rec.value} onChange={(e) => setRec({ ...rec, value: e.target.value })} />}</Field>
            <Field label="TTL">{(fid) => <Input id={fid} type="number" value={rec.ttl} onChange={(e) => setRec({ ...rec, ttl: Number(e.target.value) })} />}</Field>
            <Field label="Priority">{(fid) => <Input id={fid} type="number" disabled={rec.type !== "MX"} value={rec.priority ?? ""} onChange={(e) => setRec({ ...rec, priority: Number(e.target.value) })} />}</Field>
            <Button type="submit">Add</Button>
          </form>{recErr && <p role="alert" className="mt-2 text-sm text-destructive">{recErr}</p>}</Card>
          {d.dns.length === 0 ? <EmptyState title="No DNS records" body="Add an A record pointing to your server." /> : <Table><thead><tr><Th>Type</Th><Th>Name</Th><Th>Value</Th><Th>TTL</Th><Th /></tr></thead><tbody>
            {d.dns.map((r) => <tr key={r.id}><Td><Badge tone="info">{r.type}</Badge></Td><Td className="font-mono text-xs">{r.name}</Td><Td className="font-mono text-xs">{r.priority !== undefined && `${r.priority} `}{r.value}</Td><Td>{r.ttl}</Td><Td><Button size="icon" variant="ghost" aria-label={`Delete ${r.type} ${r.name}`} onClick={() => setDel(r.id)}><Trash2 className="h-4 w-4" /></Button></Td></tr>)}</tbody></Table>}
          <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete DNS record?" body="The record will be removed from this demo zone." onConfirm={() => patch({ dns: d.dns.filter((r) => r.id !== del) }, "Record deleted")} />
        </div>}
        {tab === "contacts" && <Card className="max-w-2xl p-5"><form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!contact.name || !/@/.test(contact.email)) { toast.error("Name and valid email are required"); return; } patch({ contact }, "Contacts saved (demo)"); }}>
          {(["name", "email", "phone", "address"] as const).map((k) => <Field key={k} label={k[0]!.toUpperCase() + k.slice(1)}>{(fid) => <Input id={fid} value={contact[k]} onChange={(e) => setContact({ ...contact, [k]: e.target.value })} />}</Field>)}
          <div className="sm:col-span-2"><Button type="submit">Save contacts</Button></div></form></Card>}
        {tab === "transfer" && <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5"><h2 className="font-extrabold">Registrar lock</h2><p className="mt-1 text-sm text-muted-foreground">{d.locked ? "Locked: outgoing transfers are blocked." : "Unlocked: the domain can be transferred away."}</p>
            <Button className="mt-4" variant={d.locked ? "outline" : "primary"} onClick={() => patch({ locked: !d.locked }, d.locked ? "Domain unlocked (demo)" : "Domain locked")}>{d.locked ? <><Unlock className="h-4 w-4" />Unlock</> : <><Lock className="h-4 w-4" />Lock</>}</Button></Card>
          <Card className="p-5"><h2 className="font-extrabold">Transfer status</h2><p className="mt-2 text-sm"><StatusBadge status={d.status} /></p>
            {d.status === "pending-transfer" ? <p className="mt-2 text-sm text-muted-foreground">Incoming transfer awaiting approval by the losing registrar (simulated).</p> : <p className="mt-2 text-sm text-muted-foreground">No transfer in progress.</p>}
            <Button className="mt-4" variant="outline" onClick={() => toast.info("EPP code generation requires a connected registrar.")}>Request EPP code</Button></Card>
        </div>}
      </div>
    </>
  );
}

export function ClientHostingDetail({ id }: { id: string }) {
  const { hosting } = useCustomerData();
  const h = hosting.find((x) => x.id === id);
  useSeo({ title: h ? `${h.domain} — Hosting` : "Hosting", description: "Hosting management (demo).", path: `/client/hosting/${id}`, noindex: true });
  const [tab, setTab] = useState<"overview" | "ftp" | "db" | "email" | "backups" | "config">("overview");
  const [input, setInput] = useState("");
  const [php, setPhp] = useState(h?.php ?? "8.3");
  if (!h) return <EmptyState title="Hosting account not found" action={<ButtonLink to="/client/hosting">Back</ButtonLink>} />;
  const save = (c: Partial<typeof h>, msg: string) => { db.patch("hosting", h.id, c); toast.success(msg); };
  const addForm = (label: string, placeholder: string, onAdd: (v: string) => string | null) => (
    <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const err = onAdd(input.trim()); if (err) toast.error(err); else setInput(""); }}>
      <label className="sr-only" htmlFor="add-x">{label}</label><Input id="add-x" placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)} /><Button type="submit">{label}</Button>
    </form>
  );
  return (
    <>
      <PageHeader eyebrow={h.plan} title={h.domain} description={h.server} actions={<StatusBadge status={h.status} />} />
      <SimNote />
      <Tabs value={tab} onChange={(t) => { setTab(t); setInput(""); }} tabs={[{ id: "overview", label: "Overview" }, { id: "ftp", label: "FTP" }, { id: "db", label: "Databases" }, { id: "email", label: "Email" }, { id: "backups", label: "Backups" }, { id: "config", label: "Configuration" }]} />
      <div className="mt-6">
        {tab === "overview" && <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5"><p className="text-sm font-semibold">Disk usage (demo)</p><p className="my-2 font-display text-2xl font-extrabold">{h.diskUsedGb} <span className="text-sm text-muted-foreground">/ {h.diskLimitGb} GB</span></p><Progress value={(h.diskUsedGb / h.diskLimitGb) * 100} label="Disk usage" /></Card>
          <Card className="p-5"><p className="text-sm font-semibold">Bandwidth this month (demo)</p><p className="my-2 font-display text-2xl font-extrabold">{h.bandwidthUsedGb} <span className="text-sm text-muted-foreground">/ {h.bandwidthLimitGb} GB</span></p><Progress value={(h.bandwidthUsedGb / h.bandwidthLimitGb) * 100} label="Bandwidth usage" /></Card>
          <Card className="p-5"><p className="text-sm font-semibold">SSL certificate</p><p className="my-2"><StatusBadge status={h.ssl} /></p>{h.ssl !== "active" && <Button size="sm" variant="outline" onClick={() => save({ ssl: "pending" }, "SSL issuance requested (simulated)")}>Request SSL</Button>}</Card>
        </div>}
        {tab === "ftp" && <>{addForm("Add FTP user", `user@${h.domain}`, (v) => { if (!/^[a-z0-9._-]+@/.test(v)) return "Use the form user@domain"; save({ ftpAccounts: [...h.ftpAccounts, { id: uid("ftp"), user: v, path: "/public_html" }] }, "FTP account created (demo)"); return null; })}
          {h.ftpAccounts.length === 0 ? <EmptyState title="No FTP accounts" /> : <Table><thead><tr><Th>User</Th><Th>Directory</Th><Th /></tr></thead><tbody>{h.ftpAccounts.map((f) => <tr key={f.id}><Td className="font-mono text-xs">{f.user}</Td><Td>{f.path}</Td><Td><Button size="sm" variant="ghost" onClick={() => save({ ftpAccounts: h.ftpAccounts.filter((x) => x.id !== f.id) }, "FTP account removed")}>Remove</Button></Td></tr>)}</tbody></Table>}</>}
        {tab === "db" && <>{addForm("Create database", "database_name", (v) => { if (!/^[a-z][a-z0-9_]{2,31}$/.test(v)) return "3–32 chars: lower-case letters, digits, underscore"; if (h.databases.some((x) => x.name === v)) return "Database already exists"; save({ databases: [...h.databases, { id: uid("db"), name: v, sizeMb: 0 }] }, "Database created (demo)"); return null; })}
          {h.databases.length === 0 ? <EmptyState title="No databases" /> : <Table><thead><tr><Th>Name</Th><Th>Size</Th><Th /></tr></thead><tbody>{h.databases.map((x) => <tr key={x.id}><Td className="font-mono text-xs">{x.name}</Td><Td>{x.sizeMb} MB</Td><Td><Button size="sm" variant="ghost" onClick={() => save({ databases: h.databases.filter((y) => y.id !== x.id) }, "Database dropped (demo)")}>Drop</Button></Td></tr>)}</tbody></Table>}</>}
        {tab === "email" && <>{addForm("Add mailbox", `name@${h.domain}`, (v) => { if (!v.endsWith("@" + h.domain) || !/^[a-z0-9._-]+@/.test(v)) return `Address must end with @${h.domain}`; save({ mailboxes: [...h.mailboxes, { id: uid("mb"), address: v, quotaMb: 5120 }] }, "Mailbox created (demo)"); return null; })}
          {h.mailboxes.length === 0 ? <EmptyState title="No mailboxes" /> : <Table><thead><tr><Th>Address</Th><Th>Quota</Th><Th /></tr></thead><tbody>{h.mailboxes.map((m) => <tr key={m.id}><Td>{m.address}</Td><Td>{(m.quotaMb / 1024).toFixed(0)} GB</Td><Td><Button size="sm" variant="ghost" onClick={() => save({ mailboxes: h.mailboxes.filter((x) => x.id !== m.id) }, "Mailbox removed")}>Remove</Button></Td></tr>)}</tbody></Table>}</>}
        {tab === "backups" && <>
          <Button className="mb-4" onClick={() => save({ backups: [{ id: uid("bk"), date: new Date().toISOString(), sizeMb: Math.round(h.diskUsedGb * 100) }, ...h.backups] }, "Backup created (simulated)")}>Create backup now</Button>
          <Table><thead><tr><Th>Date</Th><Th>Size</Th><Th /></tr></thead><tbody>{h.backups.map((b) => <tr key={b.id}><Td>{new Date(b.date).toLocaleString()}</Td><Td>{(b.sizeMb / 1024).toFixed(2)} GB</Td><Td><Button size="sm" variant="outline" onClick={() => toast.info(`Restore from ${new Date(b.date).toLocaleDateString()} simulated — no files changed.`)}><RotateCcw className="h-4 w-4" />Restore</Button></Td></tr>)}</tbody></Table></>}
        {tab === "config" && <Card className="max-w-md space-y-3 p-5"><Field label="PHP version">{(fid) => <Select id={fid} value={php} onChange={(e) => setPhp(e.target.value)}>{["8.1", "8.2", "8.3", "8.4"].map((v) => <option key={v}>{v}</option>)}</Select>}</Field><Button onClick={() => save({ php }, `PHP ${php} saved (demo)`)}>Save configuration</Button></Card>}
      </div>
    </>
  );
}

export function ClientVpsDetail({ id }: { id: string }) {
  const { vps } = useCustomerData();
  const v = vps.find((x) => x.id === id);
  useSeo({ title: v ? `${v.hostname} — VPS` : "VPS", description: "VPS management (demo).", path: `/client/vps/${id}`, noindex: true });
  const [tab, setTab] = useState<"overview" | "firewall" | "backups" | "console">("overview");
  const [reinstall, setReinstall] = useState(false);
  const [os, setOs] = useState("Ubuntu 24.04 LTS");
  const [rule, setRule] = useState<Omit<FirewallRule, "id">>({ port: "", protocol: "TCP", source: "0.0.0.0/0", action: "allow" });
  if (!v) return <EmptyState title="VPS not found" action={<ButtonLink to="/client/vps">Back</ButtonLink>} />;
  const save = (c: Partial<typeof v>, msg: string) => { db.patch("vps", v.id, c); db.log("customer", "vps.action", v.hostname); toast.success(msg); };
  const lastCpu = v.cpuHistory.at(-1) ?? 0, lastRam = v.ramHistory.at(-1) ?? 0;
  return (
    <>
      <PageHeader eyebrow={v.plan} title={v.hostname} description={`${v.os} · ${v.datacenter}`} actions={<>
        <StatusBadge status={v.status} />
        {v.status === "running" ? <Button size="sm" variant="outline" onClick={() => save({ status: "stopped" }, "Stop simulated")}><Power className="h-4 w-4" />Stop</Button> : <Button size="sm" onClick={() => save({ status: "running" }, "Start simulated")}><Power className="h-4 w-4" />Start</Button>}
        <Button size="sm" variant="outline" disabled={v.status !== "running"} onClick={() => { save({ status: "rebooting" }, "Reboot simulated"); setTimeout(() => db.patch("vps", v.id, { status: "running" }), 2500); }}><RefreshCw className="h-4 w-4" />Restart</Button>
        <Button size="sm" variant="danger" onClick={() => setReinstall(true)}>Reinstall</Button></>} />
      <SimNote />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "overview", label: "Overview & monitoring" }, { id: "firewall", label: "Firewall" }, { id: "backups", label: "Backups" }, { id: "console", label: "Console" }]} />
      <div className="mt-6">
        {tab === "overview" && <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5"><p className="text-sm font-semibold">CPU (demo metrics) — {v.status === "running" ? lastCpu : 0}%</p><Sparkline values={v.status === "running" ? v.cpuHistory : v.cpuHistory.map(() => 0)} label="CPU usage last 24 hours" /></Card>
          <Card className="p-5"><p className="text-sm font-semibold">RAM (demo metrics) — {v.status === "running" ? lastRam : 0}%</p><Sparkline values={v.status === "running" ? v.ramHistory : v.ramHistory.map(() => 0)} label="RAM usage last 24 hours" /></Card>
          <Card className="p-5 md:col-span-2"><dl className="grid gap-3 text-sm sm:grid-cols-3">
            {[["vCPU", v.vcpu], ["RAM", `${v.ramGb} GB`], ["Storage", `${v.storageGb} GB NVMe`], ["IPv4", v.ipv4], ["IPv6", v.ipv6], ["Management", v.managed ? "Managed" : "Unmanaged"]].map(([k, val]) => <div key={String(k)}><dt className="text-muted-foreground">{k}</dt><dd className="font-mono font-semibold">{val}</dd></div>)}
          </dl></Card></div>}
        {tab === "firewall" && <div className="space-y-4">
          <Card className="p-5"><form className="grid items-end gap-3 sm:grid-cols-5" onSubmit={(e) => { e.preventDefault();
            if (!/^\d{1,5}(-\d{1,5})?$/.test(rule.port) || Number(rule.port.split("-")[0]) > 65535) { toast.error("Port must be 1–65535 or a range like 8000-8100"); return; }
            if (!/^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(rule.source)) { toast.error("Source must be CIDR, e.g. 203.0.113.0/24"); return; }
            save({ firewall: [...v.firewall, { ...rule, id: uid("fw") }] }, "Rule added (demo)"); setRule({ ...rule, port: "" }); }}>
            <Field label="Port">{(fid) => <Input id={fid} value={rule.port} onChange={(e) => setRule({ ...rule, port: e.target.value })} placeholder="443" />}</Field>
            <Field label="Protocol">{(fid) => <Select id={fid} value={rule.protocol} onChange={(e) => setRule({ ...rule, protocol: e.target.value as "TCP" })}><option>TCP</option><option>UDP</option></Select>}</Field>
            <Field label="Source">{(fid) => <Input id={fid} value={rule.source} onChange={(e) => setRule({ ...rule, source: e.target.value })} />}</Field>
            <Field label="Action">{(fid) => <Select id={fid} value={rule.action} onChange={(e) => setRule({ ...rule, action: e.target.value as "allow" })}><option value="allow">Allow</option><option value="deny">Deny</option></Select>}</Field>
            <Button type="submit">Add rule</Button></form></Card>
          <Table><thead><tr><Th>Port</Th><Th>Protocol</Th><Th>Source</Th><Th>Action</Th><Th /></tr></thead><tbody>{v.firewall.map((r) => <tr key={r.id}><Td className="font-mono">{r.port}</Td><Td>{r.protocol}</Td><Td className="font-mono text-xs">{r.source}</Td><Td><StatusBadge status={r.action} /></Td><Td><Button size="sm" variant="ghost" onClick={() => save({ firewall: v.firewall.filter((x) => x.id !== r.id) }, "Rule removed")}>Remove</Button></Td></tr>)}</tbody></Table>
        </div>}
        {tab === "backups" && <>
          <Button className="mb-4" onClick={() => save({ backups: [{ id: uid("vb"), date: new Date().toISOString(), sizeGb: Math.round(v.storageGb * 0.12) }, ...v.backups] }, "Snapshot created (simulated)")}>Create snapshot</Button>
          <Table><thead><tr><Th>Date</Th><Th>Size</Th><Th /></tr></thead><tbody>{v.backups.map((b) => <tr key={b.id}><Td>{new Date(b.date).toLocaleString()}</Td><Td>{b.sizeGb} GB</Td><Td className="space-x-1"><Button size="sm" variant="outline" onClick={() => toast.info("Restore simulated — no data changed.")}>Restore</Button><Button size="sm" variant="ghost" onClick={() => save({ backups: v.backups.filter((x) => x.id !== b.id) }, "Snapshot deleted")}>Delete</Button></Td></tr>)}</tbody></Table></>}
        {tab === "console" && <Card className="p-5"><div className="flex items-center gap-2 font-extrabold"><Monitor className="h-4 w-4" />Web console</div>
          <pre className="mt-3 h-48 overflow-auto rounded bg-brand-navy-deep p-4 font-mono text-xs text-on-dark-muted">{`M212 demo console — not connected\n\n${v.hostname} login: _\n\nA real VNC/serial console requires the provisioning backend.`}</pre></Card>}
      </div>
      <Dialog open={reinstall} onClose={() => setReinstall(false)} title="Reinstall operating system" footer={<><Button variant="outline" onClick={() => setReinstall(false)}>Cancel</Button><Button variant="danger" onClick={() => { save({ os, status: "running" }, `Reinstall with ${os} simulated`); setReinstall(false); }}>Reinstall (simulated)</Button></>}>
        <Alert tone="danger" className="mb-3">On a real server this erases all data.</Alert>
        <Field label="Operating system">{(fid) => <Select id={fid} value={os} onChange={(e) => setOs(e.target.value)}>{["Ubuntu 24.04 LTS", "Debian 12", "AlmaLinux 9", "Rocky Linux 9"].map((o) => <option key={o}>{o}</option>)}</Select>}</Field>
      </Dialog>
    </>
  );
}

const useId = () => (useParams({ strict: false }) as { id: string }).id;
export function ClientDomainDetailRoute() { const id = useId(); return <ClientDomainDetail key={id} id={id} />; }
export function ClientHostingDetailRoute() { const id = useId(); return <ClientHostingDetail key={id} id={id} />; }
export function ClientVpsDetailRoute() { const id = useId(); return <ClientVpsDetail key={id} id={id} />; }
export function ClientTicketDetailRoute() { const id = useId(); return <ClientTicketDetail key={id} id={id} />; }
