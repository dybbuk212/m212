import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bell, Globe, HardDrive, LifeBuoy, Receipt, Server, ShoppingBag } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, ButtonLink, Card, Dialog, EmptyState, Field, Input, PageHeader, Pagination, Select, Stat, StatusBadge, Switch, Table, Td, Textarea, Th, usePagination } from "@/design-system/components/ui";
import { validatePassword } from "@/lib/auth";
import { formatDate, useI18n, useMoney } from "@/lib/i18n";
import { invoiceHtml } from "@/lib/invoice";
import { useSeo } from "@/lib/seo";
import { db, uid } from "@/lib/store";
import { downloadText } from "@/lib/utils";
import { PasswordInput } from "@/features/storefront/AuthPages";
import type { Invoice, Ticket } from "@/types/models";
import { daysUntil, useCustomerData } from "./common";

const seo = (title: string, path: string) => ({ title: `${title} — Customer area`, description: `M212.MA customer area: ${title.toLowerCase()} (demo).`, path, noindex: true });

export function ClientDashboard() {
  useSeo(seo("Dashboard", "/client/dashboard"));
  const c = useCustomerData();
  const money = useMoney();
  const { locale } = useI18n();
  const outstanding = c.invoices.filter((i) => i.status === "pending" || i.status === "overdue");
  const renewals = [...c.domains.map((d) => ({ name: d.name, at: d.expiresAt, kind: "Domain", auto: d.autoRenew })), ...c.hosting.map((h) => ({ name: `${h.plan} — ${h.domain}`, at: h.renewsAt, kind: "Hosting", auto: true })), ...c.vps.map((v) => ({ name: v.hostname, at: v.renewsAt, kind: "VPS", auto: true }))]
    .filter((r) => daysUntil(r.at) <= 90).sort((a, b) => a.at.localeCompare(b.at));
  const openTickets = c.tickets.filter((t) => t.status !== "closed");
  return (
    <>
      <PageHeader eyebrow="Customer area" title={`Welcome, ${c.customer?.name.split(" ")[0] ?? "customer"}`} description="Overview of your demo services, billing and support." actions={<ButtonLink to="/domains/search" search={{ q: "" }} variant="brand">Register a domain</ButtonLink>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active services" value={c.hosting.filter((h) => h.status === "active").length + c.vps.filter((v) => v.status !== "stopped").length + c.servers.length} icon={<HardDrive className="h-4 w-4" />} />
        <Stat label="Domains" value={c.domains.length} icon={<Globe className="h-4 w-4" />} />
        <Stat label="Outstanding" value={money(outstanding.reduce((s, i) => s + i.total, 0))} hint={`${outstanding.length} invoice(s)`} icon={<Receipt className="h-4 w-4" />} />
        <Stat label="Open tickets" value={openTickets.length} icon={<LifeBuoy className="h-4 w-4" />} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5"><h2 className="mb-3 font-extrabold">Upcoming renewals (90 days)</h2>
          {renewals.length === 0 ? <p className="text-sm text-muted-foreground">Nothing due soon.</p> : <ul className="divide-y text-sm">{renewals.map((r) => <li key={r.name} className="flex items-center justify-between py-2"><span><Badge tone="info" className="mr-2">{r.kind}</Badge>{r.name}</span><span className="text-right">{formatDate(r.at, locale)} {!r.auto && <Badge tone="warning">auto-renew off</Badge>}</span></li>)}</ul>}</Card>
        <Card className="p-5"><h2 className="mb-3 font-extrabold">Outstanding invoices</h2>
          {outstanding.length === 0 ? <p className="text-sm text-muted-foreground">All settled.</p> : <ul className="divide-y text-sm">{outstanding.map((i) => <li key={i.id} className="flex items-center justify-between py-2"><span className="font-mono">{i.number}</span><span>{money(i.total)} <StatusBadge status={i.status} /></span></li>)}</ul>}
          <ButtonLink to="/client/invoices" variant="outline" size="sm" className="mt-3">All invoices</ButtonLink></Card>
        <Card className="p-5"><h2 className="mb-3 font-extrabold">Recent orders</h2>
          {c.orders.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet.</p> : <ul className="divide-y text-sm">{c.orders.slice(0, 4).map((o) => <li key={o.id} className="flex items-center justify-between py-2"><span className="font-mono">{o.number}</span><span>{money(o.total)} <StatusBadge status={o.paymentStatus} /></span></li>)}</ul>}</Card>
        <Card className="p-5"><h2 className="mb-3 flex items-center gap-2 font-extrabold"><Bell className="h-4 w-4" />Notifications</h2>
          <ul className="divide-y text-sm">{c.notifications.slice(0, 4).map((n) => <li key={n.id} className="py-2"><p className={n.read ? "" : "font-bold"}>{n.title}</p><p className="text-muted-foreground">{n.body}</p></li>)}</ul>
          <ButtonLink to="/client/notifications" variant="outline" size="sm" className="mt-3">View all</ButtonLink></Card>
      </div>
    </>
  );
}

export function ClientDomains() {
  useSeo(seo("Domains", "/client/domains"));
  const { domains } = useCustomerData();
  const { locale } = useI18n();
  const [q, setQ] = useState("");
  const list = domains.filter((d) => d.name.includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Domains" description="Manage nameservers, DNS, contacts and renewal preferences." actions={<ButtonLink to="/domains/search" search={{ q: "" }} variant="brand">Register</ButtonLink>} />
      <div className="mb-4 max-w-xs"><Input aria-label="Search domains" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {list.length === 0 ? <EmptyState title="No domains" body="Domains you register or transfer appear here." /> : (
        <Table><thead><tr><Th>Domain</Th><Th>Status</Th><Th>Expires</Th><Th>Auto-renew</Th><Th>Lock</Th><Th /></tr></thead><tbody>
          {list.map((d) => <tr key={d.id}><Td className="font-semibold">{d.name}</Td><Td><StatusBadge status={d.status} /></Td><Td>{formatDate(d.expiresAt, locale)} <span className="text-xs text-muted-foreground">({daysUntil(d.expiresAt)} d)</span></Td><Td>{d.autoRenew ? "On" : <Badge tone="warning">Off</Badge>}</Td><Td>{d.locked ? "Locked" : "Unlocked"}</Td><Td><ButtonLink to="/client/domains/$id" params={{ id: d.id }} size="sm" variant="outline">Manage</ButtonLink></Td></tr>)}
        </tbody></Table>)}
    </>
  );
}

export function ClientHosting() {
  useSeo(seo("Hosting", "/client/hosting"));
  const { hosting } = useCustomerData();
  return (
    <>
      <PageHeader title="Hosting" description="Your web hosting accounts." actions={<ButtonLink to="/hosting" variant="outline">Add hosting</ButtonLink>} />
      {hosting.length === 0 ? <EmptyState title="No hosting accounts" /> : <div className="grid gap-4 md:grid-cols-2">{hosting.map((h) => (
        <Card key={h.id} className="p-5"><div className="flex items-start justify-between"><div><p className="font-extrabold">{h.domain}</p><p className="text-sm text-muted-foreground">{h.plan} · {h.server}</p></div><StatusBadge status={h.status} /></div>
          <p className="mt-3 text-sm">Disk {h.diskUsedGb} / {h.diskLimitGb} GB · SSL <StatusBadge status={h.ssl} /></p>
          <ButtonLink to="/client/hosting/$id" params={{ id: h.id }} size="sm" className="mt-4">Manage</ButtonLink></Card>))}</div>}
    </>
  );
}

export function ClientVps() {
  useSeo(seo("VPS", "/client/vps"));
  const { vps } = useCustomerData();
  return (
    <>
      <PageHeader title="Virtual servers" description="Your VPS instances (simulated)." actions={<ButtonLink to="/vps" variant="outline">Order VPS</ButtonLink>} />
      {vps.length === 0 ? <EmptyState title="No VPS" /> : <Table><thead><tr><Th>Hostname</Th><Th>Plan</Th><Th>Status</Th><Th>IPv4</Th><Th>OS</Th><Th /></tr></thead><tbody>
        {vps.map((v) => <tr key={v.id}><Td className="font-semibold">{v.hostname}</Td><Td>{v.plan}</Td><Td><StatusBadge status={v.status} /></Td><Td className="font-mono text-xs">{v.ipv4}</Td><Td>{v.os}</Td><Td><ButtonLink to="/client/vps/$id" params={{ id: v.id }} size="sm" variant="outline">Manage</ButtonLink></Td></tr>)}</tbody></Table>}
    </>
  );
}

export function ClientServers() {
  useSeo(seo("Dedicated servers", "/client/servers"));
  const { servers } = useCustomerData();
  return (
    <>
      <PageHeader title="Dedicated servers" />
      {servers.length === 0 ? <EmptyState title="No dedicated servers" body="Dedicated servers are delivered after a quote. Request a custom configuration to get started." action={<ButtonLink to="/dedicated-servers" variant="brand"><Server className="h-4 w-4" />View servers</ButtonLink>} />
        : <Table><thead><tr><Th>Hostname</Th><Th>CPU</Th><Th>RAM</Th><Th>IP</Th><Th>Status</Th></tr></thead><tbody>{servers.map((s) => <tr key={s.id}><Td>{s.hostname}</Td><Td>{s.cpu}</Td><Td>{s.ramGb} GB</Td><Td className="font-mono text-xs">{s.ip}</Td><Td><StatusBadge status={s.status} /></Td></tr>)}</tbody></Table>}
    </>
  );
}

export function ClientOrders() {
  useSeo(seo("Orders", "/client/orders"));
  const { orders } = useCustomerData();
  const money = useMoney();
  const { locale } = useI18n();
  const [open, setOpen] = useState<string | null>(null);
  const p = usePagination(orders, 8);
  return (
    <>
      <PageHeader title="Orders" description="Demo orders are never charged and are not provisioned." actions={<ButtonLink to="/cart" variant="outline"><ShoppingBag className="h-4 w-4" />Cart</ButtonLink>} />
      {orders.length === 0 ? <EmptyState title="No orders yet" action={<ButtonLink to="/hosting">Browse products</ButtonLink>} /> : <>
        <Table><thead><tr><Th>Number</Th><Th>Date</Th><Th>Total</Th><Th>Payment</Th><Th>Provisioning</Th><Th /></tr></thead><tbody>
          {p.slice.map((o) => <Fragment key={o.id}>
            <tr><Td className="font-mono">{o.number}</Td><Td>{formatDate(o.date, locale)}</Td><Td className="tabular">{money(o.total)}</Td><Td><StatusBadge status={o.paymentStatus} /></Td><Td><Badge>not connected</Badge></Td><Td><Button size="sm" variant="ghost" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}>{open === o.id ? "Hide" : "Details"}</Button></Td></tr>
            {open === o.id && <tr><Td colSpan={6} className="bg-muted/40"><ul className="space-y-1 text-sm">{o.items.map((i, k) => <li key={k} className="flex justify-between"><span>{i.name} · {i.cycle} × {i.quantity}</span><span className="tabular">{money(i.unitPrice * i.quantity)}</span></li>)}</ul>{o.discount > 0 && <p className="mt-1 text-sm text-success">Discount {o.coupon}: −{money(o.discount)}</p>}<p className="text-sm">Tax {money(o.tax)} · Payment method: {o.paymentMethod}</p></Td></tr>}
          </Fragment>)}
        </tbody></Table><Pagination {...p} /></>}
    </>
  );
}

export function downloadInvoice(inv: Invoice) {
  const d = db.get();
  downloadText(`${inv.number}.html`, invoiceHtml(inv, d.customers.find((c) => c.id === inv.customerId), d.settings), "text/html");
}

export function InvoiceDetail({ inv, onClose }: { inv: Invoice | null; onClose: () => void }) {
  const money = useMoney();
  const settings = db.get().settings;
  if (!inv) return null;
  return (
    <Dialog open title={`Invoice ${inv.number}`} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => downloadInvoice(inv)}>Download (demo)</Button></>}>
      <Badge tone="demo">Demonstration invoice — not a tax document</Badge>
      <p className="mt-3 text-sm">Issued {formatDate(inv.issuedAt)} · Due {formatDate(inv.dueAt)} · <StatusBadge status={inv.status} /></p>
      <ul className="mt-3 divide-y rounded border text-sm">{inv.lines.map((l, i) => <li key={i} className="flex justify-between p-2"><span>{l.description}</span><span className="tabular">{money(l.amount)}</span></li>)}</ul>
      <p className="mt-2 text-right text-sm">Tax {money(inv.tax)}</p><p className="text-right font-extrabold">Total {money(inv.total)}</p>
      {(inv.status === "pending" || inv.status === "overdue") && <Alert className="mt-4" title="How to pay (demo)">{settings.payment.bankDetails}. Use <strong>{inv.number}</strong> as reference. No online payment is connected.</Alert>}
    </Dialog>
  );
}

export function ClientInvoices() {
  useSeo(seo("Invoices", "/client/invoices"));
  const { invoices } = useCustomerData();
  const money = useMoney();
  const { locale } = useI18n();
  const [status, setStatus] = useState("all");
  const [sel, setSel] = useState<Invoice | null>(null);
  const list = invoices.filter((i) => status === "all" || i.status === status);
  return (
    <>
      <PageHeader title="Invoices" />
      <div className="mb-4 w-48"><Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="overdue">Overdue</option><option value="demo-paid">Demo paid</option></Select></div>
      {list.length === 0 ? <EmptyState title="No invoices" /> : <Table><thead><tr><Th>Number</Th><Th>Issued</Th><Th>Due</Th><Th>Total</Th><Th>Status</Th><Th /></tr></thead><tbody>
        {list.map((i) => <tr key={i.id}><Td className="font-mono">{i.number}</Td><Td>{formatDate(i.issuedAt, locale)}</Td><Td>{formatDate(i.dueAt, locale)}{i.status === "overdue" && <AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-destructive" aria-label="Overdue" />}</Td><Td className="tabular">{money(i.total)}</Td><Td><StatusBadge status={i.status} /></Td>
          <Td className="space-x-1 whitespace-nowrap"><Button size="sm" variant="outline" onClick={() => setSel(i)}>View</Button><Button size="sm" variant="ghost" onClick={() => downloadInvoice(i)}>Download</Button></Td></tr>)}
      </tbody></Table>}
      <InvoiceDetail inv={sel} onClose={() => setSel(null)} />
    </>
  );
}

export function ClientPayments() {
  useSeo(seo("Payments", "/client/payments"));
  const { payments, data } = useCustomerData();
  const money = useMoney();
  return (
    <>
      <PageHeader title="Payments" description="Payments recorded against your invoices (demo records)." />
      <Alert tone="warning" className="mb-4">No payment provider is connected. Entries here are demonstration records only.</Alert>
      {payments.length === 0 ? <EmptyState title="No payments recorded" /> : <Table><thead><tr><Th>Date</Th><Th>Invoice</Th><Th>Method</Th><Th>Amount</Th><Th>Status</Th></tr></thead><tbody>
        {payments.map((p) => <tr key={p.id}><Td>{formatDate(p.date)}</Td><Td className="font-mono">{data.invoices.find((i) => i.id === p.invoiceId)?.number ?? p.invoiceId}</Td><Td>{p.method}</Td><Td className="tabular">{money(p.amount)}</Td><Td><StatusBadge status={p.status} /></Td></tr>)}</tbody></Table>}
    </>
  );
}

export function NewTicketDialog({ open, onClose, customerId, author }: { open: boolean; onClose: () => void; customerId: string; author: string }) {
  const [f, setF] = useState({ subject: "", department: "technical" as Ticket["department"], priority: "medium" as Ticket["priority"], message: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <Dialog open={open} onClose={onClose} title="New support ticket" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="brand" onClick={() => {
      const e: Record<string, string> = {}; if (f.subject.trim().length < 4) e.subject = "Subject must be at least 4 characters"; if (f.message.trim().length < 10) e.message = "Describe the issue (10+ characters)";
      setErr(e); if (Object.keys(e).length) return;
      const at = new Date().toISOString(); const number = `T-DEMO-${Math.floor(5600 + Math.random() * 3000)}`;
      db.insert("tickets", { id: uid("tic"), number, customerId, subject: f.subject.trim(), department: f.department, priority: f.priority, status: "open", createdAt: at, updatedAt: at, messages: [{ id: uid("msg"), author, role: "customer", body: f.message.trim(), at }] });
      db.log(author, "ticket.create", number); toast.success(`Ticket ${number} created`); setF({ subject: "", department: "technical", priority: "medium", message: "" }); onClose();
    }}>Create ticket</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Subject" error={err.subject} className="sm:col-span-2">{(id) => <Input id={id} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />}</Field>
        <Field label="Department">{(id) => <Select id={id} value={f.department} onChange={(e) => setF({ ...f, department: e.target.value as Ticket["department"] })}><option value="technical">Technical</option><option value="billing">Billing</option><option value="sales">Sales</option><option value="abuse">Abuse</option></Select>}</Field>
        <Field label="Priority">{(id) => <Select id={id} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Ticket["priority"] })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></Select>}</Field>
        <Field label="Message" error={err.message} className="sm:col-span-2">{(id) => <Textarea id={id} rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />}</Field>
      </div>
    </Dialog>
  );
}

export function ClientSupport() {
  useSeo(seo("Support", "/client/support"));
  const { tickets, customerId, customer } = useCustomerData();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader title="Support tickets" actions={<Button variant="brand" onClick={() => setOpen(true)}>New ticket</Button>} />
      {tickets.length === 0 ? <EmptyState title="No tickets" body="Need help? Open a ticket." /> : <Table><thead><tr><Th>Number</Th><Th>Subject</Th><Th>Department</Th><Th>Priority</Th><Th>Status</Th><Th>Updated</Th></tr></thead><tbody>
        {tickets.map((t) => <tr key={t.id}><Td className="font-mono"><Link to="/client/support/$id" params={{ id: t.id }} className="font-semibold text-brand-green underline">{t.number}</Link></Td><Td>{t.subject}</Td><Td className="capitalize">{t.department}</Td><Td><Badge tone={t.priority === "urgent" || t.priority === "high" ? "danger" : "neutral"}>{t.priority}</Badge></Td><Td><StatusBadge status={t.status} /></Td><Td>{formatDate(t.updatedAt)}</Td></tr>)}</tbody></Table>}
      <NewTicketDialog open={open} onClose={() => setOpen(false)} customerId={customerId} author={customer?.name ?? "Customer"} />
    </>
  );
}

export function TicketThread({ ticket, viewer }: { ticket: Ticket; viewer: "customer" | "staff" }) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const msgs = ticket.messages.filter((m) => viewer === "staff" || !m.internal);
  return (
    <div className="space-y-4">
      <ol className="space-y-3">{msgs.map((m) => (
        <li key={m.id} className={`rounded-lg border p-4 ${m.internal ? "border-dashed border-warning bg-warning-wash" : m.role === "staff" ? "bg-brand-ice/60" : "bg-card"}`}>
          <p className="text-xs text-muted-foreground"><strong className="text-foreground">{m.author}</strong> · {new Date(m.at).toLocaleString()} {m.internal && <Badge tone="warning">internal note</Badge>}</p>
          <p className="mt-1 whitespace-pre-line text-sm">{m.body}</p>
        </li>))}</ol>
      {ticket.status !== "closed" ? (
        <form className="space-y-2" onSubmit={(e) => {
          e.preventDefault(); if (body.trim().length < 2) return;
          const at = new Date().toISOString(); const author = viewer === "staff" ? "Support (demo)" : db.get().customers.find((c) => c.id === ticket.customerId)?.name ?? "Customer";
          db.patch("tickets", ticket.id, { messages: [...ticket.messages, { id: uid("msg"), author, role: viewer, body: body.trim(), at, internal: viewer === "staff" && internal }], updatedAt: at, status: viewer === "staff" ? (internal ? ticket.status : "answered") : "customer-reply" });
          db.log(author, internal ? "ticket.note" : "ticket.reply", ticket.number); setBody(""); toast.success(internal ? "Internal note added" : "Reply sent (saved locally)");
        }}>
          <label htmlFor="reply" className="text-sm font-semibold">{viewer === "staff" && internal ? "Internal note" : "Reply"}</label>
          <Textarea id="reply" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex items-center justify-between">
            {viewer === "staff" ? <span className="flex items-center gap-2 text-sm"><Switch checked={internal} onChange={setInternal} label="Internal note" />Internal note</span> : <span />}
            <Button type="submit">{viewer === "staff" && internal ? "Add note" : "Send reply"}</Button>
          </div>
        </form>
      ) : <Alert>This ticket is closed.</Alert>}
    </div>
  );
}

export function ClientTicketDetail({ id }: { id: string }) {
  const { tickets } = useCustomerData();
  const t = tickets.find((x) => x.id === id);
  useSeo(seo(t ? t.number : "Ticket", `/client/support/${id}`));
  if (!t) return <EmptyState title="Ticket not found" action={<ButtonLink to="/client/support">Back</ButtonLink>} />;
  return (
    <>
      <PageHeader eyebrow={t.number} title={t.subject} description={`${t.department} · priority ${t.priority}`} actions={<><StatusBadge status={t.status} />{t.status !== "closed" && <Button variant="outline" size="sm" onClick={() => { db.patch("tickets", t.id, { status: "closed", updatedAt: new Date().toISOString() }); toast.success("Ticket closed"); }}>Close ticket</Button>}</>} />
      <TicketThread ticket={t} viewer="customer" />
    </>
  );
}

export function ClientProfile() {
  useSeo(seo("Profile", "/client/profile"));
  const { customer } = useCustomerData();
  const [f, setF] = useState({ name: customer?.name ?? "", company: customer?.company ?? "", phone: customer?.phone ?? "", country: customer?.country ?? "MA" });
  if (!customer) return <EmptyState title="No profile" />;
  return (
    <>
      <PageHeader title="Profile" />
      <Card className="max-w-2xl p-6">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (f.name.trim().length < 2) { toast.error("Name is required"); return; } db.patch("customers", customer.id, { ...f, company: f.company || undefined }); db.log(customer.email, "profile.update", customer.id); toast.success("Profile saved"); }}>
          <Field label="Full name">{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
          <Field label="Email" hint="Changing email requires verification by the future backend.">{(id) => <Input id={id} value={customer.email} disabled />}</Field>
          <Field label="Company">{(id) => <Input id={id} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />}</Field>
          <Field label="Phone">{(id) => <Input id={id} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}</Field>
          <Field label="Country">{(id) => <Select id={id} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}><option value="MA">Morocco</option><option value="FR">France</option><option value="ES">Spain</option><option value="US">United States</option><option value="OTHER">Other</option></Select>}</Field>
          <div className="sm:col-span-2"><Button type="submit">Save profile</Button></div>
        </form>
      </Card>
    </>
  );
}

export function ClientSecurity() {
  useSeo(seo("Security", "/client/security"));
  const [cur, setCur] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [err, setErr] = useState("");
  const [mfa, setMfa] = useState(false);
  return (
    <>
      <PageHeader title="Security" />
      <Alert tone="warning" className="mb-6" title="DEMO MODE">Passwords are validated in the browser but never stored or sent. MFA and session management require the future backend.</Alert>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6"><h2 className="mb-4 font-extrabold">Change password</h2>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const v = validatePassword(pw); if (!cur) setErr("Enter your current password"); else if (v) setErr(v); else if (pw !== pw2) setErr("Passwords do not match"); else { setErr(""); setCur(""); setPw(""); setPw2(""); toast.success("Password validated (demo — nothing stored)"); } }}>
            <Field label="Current password">{(id) => <PasswordInput id={id} value={cur} onChange={setCur} autoComplete="current-password" />}</Field>
            <Field label="New password" hint="10+ characters with upper, lower and digits">{(id) => <PasswordInput id={id} value={pw} onChange={setPw} autoComplete="new-password" />}</Field>
            <Field label="Confirm new password">{(id) => <PasswordInput id={id} value={pw2} onChange={setPw2} autoComplete="new-password" />}</Field>
            {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
            <Button type="submit">Update password</Button>
          </form></Card>
        <Card className="p-6"><h2 className="mb-4 font-extrabold">Two-factor authentication</h2>
          <div className="flex items-center gap-3"><Switch checked={mfa} onChange={(v) => { setMfa(v); toast.info("MFA enrolment requires the backend; preference shown for demo only."); }} label="Enable 2FA" /><span className="text-sm">Authenticator app (placeholder)</span></div>
          <h3 className="mb-2 mt-6 text-sm font-extrabold">Active sessions</h3>
          <p className="text-sm text-muted-foreground">This browser (demo session). Real session listing needs the backend.</p></Card>
      </div>
    </>
  );
}

export function ClientNotifications() {
  useSeo(seo("Notifications", "/client/notifications"));
  const { notifications } = useCustomerData();
  return (
    <>
      <PageHeader title="Notifications" actions={<Button variant="outline" onClick={() => notifications.forEach((n) => !n.read && db.patch("notifications", n.id, { read: true }))}>Mark all as read</Button>} />
      {notifications.length === 0 ? <EmptyState title="No notifications" /> : <ul className="space-y-2">{notifications.map((n) => (
        <li key={n.id}><Card className={`flex items-start justify-between gap-4 p-4 ${n.read ? "" : "border-l-4 border-l-brand-red"}`}>
          <div><p className={n.read ? "font-semibold" : "font-extrabold"}>{n.title}</p><p className="text-sm text-muted-foreground">{n.body}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(n.at)}</p></div>
          <div className="flex gap-1">{!n.read && <Button size="sm" variant="ghost" onClick={() => db.patch("notifications", n.id, { read: true })}>Mark read</Button>}<Button size="sm" variant="ghost" onClick={() => db.remove("notifications", n.id)}>Dismiss</Button></div>
        </Card></li>))}</ul>}
    </>
  );
}
