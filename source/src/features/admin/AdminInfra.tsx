import { toast } from "sonner";
import { Alert, Badge, Button, Card, PageHeader, Progress, StatusBadge, Table, Td, Th } from "@/components/ui";
import { useSeo } from "@/lib/seo";
import { db, uid, useDb } from "@/lib/store";
import { PAYMENT_PROVIDERS } from "@/services/payment";
import type { DedicatedServer, HostingService, VPSService } from "@/types/models";
import { EntityManager } from "./EntityManager";
import { adminSeo, audit } from "./AdminCommerce";

export function AdminHosting() {
  useSeo(adminSeo("Hosting accounts", "/admin/hosting"));
  const d = useDb();
  return (<><PageHeader title="Hosting accounts" />
    <EntityManager<HostingService> entityName="Hosting account" items={d.hosting} searchKeys={["domain", "plan", "server"]} filter={{ key: "status", label: "Statuses", options: ["active", "suspended", "pending"] }}
      columns={[{ label: "Domain", render: (h) => <strong>{h.domain}</strong> }, { label: "Customer", render: (h) => d.customers.find((c) => c.id === h.customerId)?.name }, { label: "Plan", render: (h) => h.plan }, { label: "Server", render: (h) => <span className="text-xs">{h.server}</span> },
        { label: "Disk", render: (h) => <div className="w-28"><Progress value={(h.diskUsedGb / h.diskLimitGb) * 100} label={`Disk ${h.domain}`} /><span className="text-xs">{h.diskUsedGb}/{h.diskLimitGb} GB</span></div> }, { label: "Status", render: (h) => <StatusBadge status={h.status} /> }]}
      fields={[{ key: "domain", label: "Primary domain", kind: "text", required: true }, { key: "customerId", label: "Customer", kind: "select", options: d.customers.map((c) => ({ value: c.id, label: c.name })) },
        { key: "productId", label: "Product", kind: "select", options: d.products.filter((p) => ["shared", "wordpress", "reseller-hosting"].includes(p.type)).map((p) => ({ value: p.id, label: p.name })) },
        { key: "server", label: "Server", kind: "select", options: d.servers.map((s) => ({ value: `${s.hostname} (demo)`, label: s.hostname })) }, { key: "diskLimitGb", label: "Disk limit (GB)", kind: "number" }, { key: "bandwidthLimitGb", label: "Bandwidth limit (GB)", kind: "number" },
        { key: "status", label: "Status", kind: "select", options: ["active", "suspended", "pending"].map((v) => ({ value: v, label: v })) }, { key: "renewsAt", label: "Renews", kind: "date" }]}
      create={() => ({ id: uid("hst"), customerId: d.customers[0]?.id ?? "", productId: "shared-starter", domain: "", plan: "Starter", server: `${d.servers[0]?.hostname ?? "web"} (demo)`, status: "pending", diskUsedGb: 0, diskLimitGb: 10, bandwidthUsedGb: 0, bandwidthLimitGb: 100, ftpAccounts: [], databases: [], mailboxes: [], backups: [], ssl: "none", php: "8.3", renewsAt: new Date(Date.now() + 365 * 86400000).toISOString() })}
      onSave={(h, isNew) => { const plan = d.products.find((p) => p.id === h.productId)?.name ?? h.plan; const x = { ...h, plan }; if (isNew) db.insert("hosting", x); else db.patch("hosting", h.id, x); audit("hosting.save", h.domain); }}
      onDelete={(h) => { db.remove("hosting", h.id); audit("hosting.delete", h.domain); }}
      rowActions={(h) => <Button size="sm" variant="ghost" onClick={() => { const s = h.status === "suspended" ? "active" : "suspended"; db.patch("hosting", h.id, { status: s }); audit(`hosting.${s}`, h.domain); toast.success(`Account ${s} (demo)`); }}>{h.status === "suspended" ? "Unsuspend" : "Suspend"}</Button>} /></>);
}

export function AdminVps() {
  useSeo(adminSeo("VPS", "/admin/vps"));
  const d = useDb();
  return (<><PageHeader title="VPS instances" />
    <EntityManager<VPSService> entityName="VPS" items={d.vps} searchKeys={["hostname", "ipv4", "plan"]} filter={{ key: "status", label: "Statuses", options: ["running", "stopped", "rebooting"] }}
      columns={[{ label: "Hostname", render: (v) => <strong>{v.hostname}</strong> }, { label: "Customer", render: (v) => d.customers.find((c) => c.id === v.customerId)?.name }, { label: "Resources", render: (v) => `${v.vcpu} vCPU · ${v.ramGb} GB · ${v.storageGb} GB` }, { label: "IPv4", render: (v) => <span className="font-mono text-xs">{v.ipv4}</span> }, { label: "Status", render: (v) => <StatusBadge status={v.status} /> }]}
      fields={[{ key: "hostname", label: "Hostname", kind: "text", required: true }, { key: "customerId", label: "Customer", kind: "select", options: d.customers.map((c) => ({ value: c.id, label: c.name })) }, { key: "plan", label: "Plan", kind: "text" }, { key: "os", label: "OS", kind: "text" },
        { key: "vcpu", label: "vCPU", kind: "number" }, { key: "ramGb", label: "RAM (GB)", kind: "number" }, { key: "storageGb", label: "Storage (GB)", kind: "number" },
        { key: "ipv4", label: "IPv4", kind: "text", validate: (v) => /^(\d{1,3}\.){3}\d{1,3}$/.test(String(v)) ? null : "Invalid IPv4" }, { key: "ipv6", label: "IPv6", kind: "text" }, { key: "datacenter", label: "Data centre", kind: "text" },
        { key: "status", label: "Status", kind: "select", options: ["running", "stopped", "rebooting"].map((v) => ({ value: v, label: v })) }, { key: "managed", label: "Managed", kind: "switch" }]}
      create={() => ({ id: uid("vps"), customerId: d.customers[0]?.id ?? "", productId: "vps-linux-s", hostname: "", plan: "Linux VPS S", status: "stopped", os: "Ubuntu 24.04 LTS", vcpu: 2, ramGb: 4, storageGb: 80, ipv4: "192.0.2.100", ipv6: "2001:db8::100", datacenter: "Casablanca (demo)", managed: false, cpuHistory: Array(24).fill(10), ramHistory: Array(24).fill(20), firewall: [], backups: [], renewsAt: new Date(Date.now() + 30 * 86400000).toISOString() })}
      onSave={(v, isNew) => { if (isNew) db.insert("vps", v); else db.patch("vps", v.id, v); audit("vps.save", v.hostname); }}
      onDelete={(v) => { db.remove("vps", v.id); audit("vps.delete", v.hostname); }} /></>);
}

export function AdminServers() {
  useSeo(adminSeo("Servers", "/admin/servers"));
  const d = useDb();
  return (<><PageHeader title="Servers" description="Infrastructure inventory with demo monitoring values." />
    <div className="mb-6 grid gap-4 md:grid-cols-3">{d.servers.map((s) => <Card key={s.id} className="p-4"><div className="flex justify-between"><strong>{s.hostname}</strong><StatusBadge status={s.status} /></div><p className="text-xs text-muted-foreground">{s.provider}</p><p className="mb-1 mt-3 text-xs">Load (demo) {s.load}%</p><Progress value={s.load} label={`${s.hostname} load`} /></Card>)}</div>
    <EntityManager<DedicatedServer> entityName="Server" items={d.servers} searchKeys={["hostname", "ip", "provider"]} filter={{ key: "status", label: "Statuses", options: ["online", "maintenance", "offline"] }}
      columns={[{ label: "Hostname", render: (s) => <strong>{s.hostname}</strong> }, { label: "Provider", render: (s) => <span className="text-xs">{s.provider}</span> }, { label: "IP", render: (s) => <span className="font-mono text-xs">{s.ip}</span> }, { label: "Capacity", render: (s) => <span className="text-xs">{s.cpu} · {s.ramGb} GB · {s.storage}</span> }, { label: "OS", render: (s) => s.os }, { label: "Status", render: (s) => <StatusBadge status={s.status} /> }]}
      fields={[{ key: "hostname", label: "Hostname", kind: "text", required: true }, { key: "provider", label: "Provider", kind: "text", required: true }, { key: "ip", label: "IP address", kind: "text", required: true, validate: (v) => /^(\d{1,3}\.){3}\d{1,3}$/.test(String(v)) ? null : "Invalid IPv4" },
        { key: "cpu", label: "CPU", kind: "text" }, { key: "ramGb", label: "RAM (GB)", kind: "number" }, { key: "storage", label: "Storage", kind: "text" }, { key: "os", label: "Operating system", kind: "text" },
        { key: "status", label: "Status", kind: "select", options: ["online", "maintenance", "offline"].map((v) => ({ value: v, label: v })) }, { key: "load", label: "Load % (demo)", kind: "number", validate: (v) => Number(v) < 0 || Number(v) > 100 ? "0–100" : null },
        { key: "customerId", label: "Assigned customer (dedicated)", kind: "select", options: [{ value: "", label: "— internal —" }, ...d.customers.map((c) => ({ value: c.id, label: c.name }))] }]}
      create={() => ({ id: uid("srv"), provider: "", hostname: "", ip: "", cpu: "", ramGb: 64, storage: "", os: "AlmaLinux 9", status: "maintenance", load: 0 })}
      onSave={(s, isNew) => { const x = { ...s, customerId: s.customerId || undefined }; if (isNew) db.insert("servers", x); else db.patch("servers", s.id, x); audit("server.save", s.hostname); }}
      onDelete={(s) => { db.remove("servers", s.id); audit("server.delete", s.hostname); }} /></>);
}

export function AdminProviders() {
  useSeo(adminSeo("Providers", "/admin/providers"));
  return (<><PageHeader title="Providers & integrations" description="Status of every external integration required for production." />
    <Alert tone="warning" className="mb-6">None of these integrations are connected in the frontend release. Each requires a secure backend with server-side credentials.</Alert>
    <Table><thead><tr><Th>Integration</Th><Th>Purpose</Th><Th>Contract</Th><Th>Status</Th></tr></thead><tbody>
      {[...PAYMENT_PROVIDERS.map((p) => [p.label, "Payments", "PaymentProvider"]), ["Registrar adapters", "Domains", "RegistrarProvider"], ["Hosting control panel", "Shared hosting provisioning", "ProvisioningService"], ["Hypervisor API", "VPS provisioning", "ProvisioningService"], ["Certificate authority", "SSL issuance", "ProvisioningService"], ["Transactional email", "Notifications", "—"], ["Authentication service", "Accounts, MFA, roles", "AuthService"]].map(([n, p, c]) => <tr key={n}><Td className="font-semibold">{n}</Td><Td>{p}</Td><Td className="font-mono text-xs">{c}</Td><Td><Badge tone="demo">not connected</Badge></Td></tr>)}</tbody></Table></>);
}

export function AdminSupportDepartments() {
  useSeo(adminSeo("Support departments", "/admin/support"));
  const d = useDb();
  const deps = [["sales", "Pre-sales questions and quotes"], ["technical", "Hosting, VPS and DNS issues"], ["billing", "Invoices and payments"], ["abuse", "Abuse and security reports"]] as const;
  return (<><PageHeader title="Support departments" description="Ticket routing and workload overview." />
    <div className="grid gap-4 md:grid-cols-2">{deps.map(([k, desc]) => { const t = d.tickets.filter((x) => x.department === k); return (
      <Card key={k} className="p-5"><h2 className="font-extrabold capitalize">{k}</h2><p className="text-sm text-muted-foreground">{desc}</p>
        <div className="mt-3 flex gap-2 text-sm"><Badge tone="warning">{t.filter((x) => x.status === "open" || x.status === "customer-reply").length} awaiting reply</Badge><Badge tone="success">{t.filter((x) => x.status === "answered").length} answered</Badge><Badge>{t.filter((x) => x.status === "closed").length} closed</Badge></div></Card>); })}</div></>);
}
