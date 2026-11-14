import { Link } from "@tanstack/react-router";
import { Eye, FileDown, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, BarChart, Button, Card, Dialog, EmptyState, Field, Input, PageHeader, Select, Stat, StatusBadge, Table, Td, Textarea, Th } from "@/components/ui";
import { formatDate, useMoney } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";
import { db, uid, useDb } from "@/lib/store";
import type { Coupon, Customer, Invoice, Order, Reseller } from "@/types/models";
import { downloadInvoice, TicketThread } from "@/features/client/ClientPages";
import { EntityManager } from "./EntityManager";

export const audit = (action: string, target: string) => db.log("Admin (demo)", action, target);
export const adminSeo = (t: string, path: string) => ({ title: `${t} — Admin`, description: `M212.MA administration: ${t.toLowerCase()} (demo).`, path, noindex: true });

export function monthlyRevenue(orders: Order[], months = 6, now = new Date()) {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label: d.toLocaleString("en", { month: "short" }), value: orders.filter((o) => o.status !== "cancelled" && o.date.slice(0, 7) === key).reduce((s, o) => s + o.total, 0) };
  });
}

export function AdminDashboard() {
  useSeo(adminSeo("Dashboard", "/admin/dashboard"));
  const d = useDb(); const money = useMoney();
  const outstanding = d.invoices.filter((i) => i.status === "pending" || i.status === "overdue");
  const renewals = d.domains.filter((x) => (new Date(x.expiresAt).getTime() - Date.now()) / 86400000 < 60).length;
  return (
    <>
      <PageHeader eyebrow="Administration" title="Dashboard" description="All figures are computed from local demo data." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Demo revenue" value={money(d.orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0))} />
        <Stat label="Orders" value={d.orders.length} hint={`${d.orders.filter((o) => o.status === "pending").length} pending`} />
        <Stat label="Customers" value={d.customers.length} />
        <Stat label="Active services" value={d.hosting.filter((h) => h.status === "active").length + d.vps.filter((v) => v.status === "running").length} />
        <Stat label="Domains" value={d.domains.length} />
        <Stat label="Renewals < 60 days" value={renewals} />
        <Stat label="Outstanding invoices" value={money(outstanding.reduce((s, i) => s + i.total, 0))} hint={`${outstanding.length} invoice(s)`} />
        <Stat label="Open tickets" value={d.tickets.filter((t) => t.status !== "closed").length} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5"><h2 className="mb-4 font-extrabold">Sales — last 6 months</h2><BarChart data={monthlyRevenue(d.orders)} label="Monthly demo revenue" format={money} /></Card>
        <Card className="p-5"><h2 className="mb-3 font-extrabold">Recent activity</h2><ul className="space-y-2 text-sm">{d.activity.slice(0, 8).map((a) => <li key={a.id} className="flex justify-between gap-3"><span><strong>{a.actor}</strong> <span className="font-mono text-xs text-muted-foreground">{a.action}</span> {a.target}</span><span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.at)}</span></li>)}</ul><Link to="/admin/audit-logs" className="mt-3 inline-block text-sm font-semibold text-brand-green">Audit log →</Link></Card>
      </div>
      <Card className="mt-6 p-5"><h2 className="mb-3 font-extrabold">Recent orders</h2>
        <Table><thead><tr><Th>Number</Th><Th>Customer</Th><Th>Date</Th><Th>Total</Th><Th>Status</Th></tr></thead><tbody>{[...d.orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((o) => <tr key={o.id}><Td className="font-mono">{o.number}</Td><Td>{o.customerName}</Td><Td>{formatDate(o.date)}</Td><Td className="tabular">{money(o.total)}</Td><Td><StatusBadge status={o.status} /></Td></tr>)}</tbody></Table></Card>
    </>
  );
}

export function AdminAnalytics() {
  useSeo(adminSeo("Analytics", "/admin/analytics"));
  const d = useDb(); const money = useMoney();
  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of d.orders) for (const i of o.items) { const type = i.productId.startsWith("domain:") ? "domain" : d.products.find((p) => p.id === i.productId)?.type ?? "other"; m.set(type, (m.get(type) ?? 0) + i.unitPrice * i.quantity); }
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [d.orders, d.products]);
  const aov = d.orders.length ? d.orders.reduce((s, o) => s + o.total, 0) / d.orders.length : 0;
  const coupons = d.orders.filter((o) => o.coupon).length;
  return (
    <>
      <PageHeader title="Analytics" description="Computed locally from demo orders. No visitor tracking is installed." />
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Average order value" value={money(aov)} /><Stat label="Orders using coupons" value={`${coupons} / ${d.orders.length}`} /><Stat label="Customers by country" value={[...new Set(d.customers.map((c) => c.country))].join(" · ")} /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5"><h2 className="mb-4 font-extrabold">Revenue by product type</h2>{byType.length ? <BarChart data={byType} label="Revenue by product type" format={money} /> : <p className="text-sm text-muted-foreground">No data.</p>}</Card>
        <Card className="p-5"><h2 className="mb-4 font-extrabold">Revenue — 12 months</h2><BarChart data={monthlyRevenue(d.orders, 12)} label="12 month revenue" format={money} /></Card>
      </div>
    </>
  );
}

export function AdminCustomers() {
  useSeo(adminSeo("Customers", "/admin/customers"));
  const d = useDb();
  const [view, setView] = useState<Customer | null>(null);
  const money = useMoney();
  return (
    <>
      <PageHeader title="Customers" />
      <EntityManager<Customer> entityName="Customer" items={d.customers} searchKeys={["name", "email", "company"]}
        filter={{ key: "status", label: "Statuses", options: ["active", "pending", "suspended"] }}
        columns={[{ label: "Name", render: (c) => <><strong>{c.name}</strong><span className="block text-xs text-muted-foreground">{c.company}</span></> }, { label: "Email", render: (c) => c.email }, { label: "Country", render: (c) => c.country }, { label: "Status", render: (c) => <StatusBadge status={c.status} /> }, { label: "Reseller", render: (c) => c.resellerId ? <Badge tone="info">{d.resellers.find((r) => r.id === c.resellerId)?.company ?? c.resellerId}</Badge> : "—" }]}
        fields={[{ key: "name", label: "Name", kind: "text", required: true }, { key: "email", label: "Email", kind: "email", required: true, validate: (v, it) => d.customers.some((c) => c.email.toLowerCase() === String(v).toLowerCase() && c.id !== it.id) ? "Email already exists" : null },
          { key: "company", label: "Company", kind: "text" }, { key: "phone", label: "Phone", kind: "text" }, { key: "country", label: "Country", kind: "select", options: ["MA", "FR", "ES", "US", "OTHER"].map((v) => ({ value: v, label: v })) },
          { key: "status", label: "Status", kind: "select", options: ["active", "pending", "suspended"].map((v) => ({ value: v, label: v })) },
          { key: "resellerId", label: "Reseller", kind: "select", options: [{ value: "", label: "— none —" }, ...d.resellers.map((r) => ({ value: r.id, label: r.company }))] }]}
        create={() => ({ id: uid("cus"), name: "", email: "", country: "MA", status: "active", createdAt: new Date().toISOString() })}
        onSave={(c, isNew) => { const clean = { ...c, resellerId: c.resellerId || undefined }; if (isNew) db.insert("customers", clean); else db.patch("customers", c.id, clean); audit(isNew ? "customer.create" : "customer.update", c.email); }}
        onDelete={(c) => { db.remove("customers", c.id); audit("customer.delete", c.email); }}
        rowActions={(c) => <Button size="icon" variant="ghost" aria-label="View customer" onClick={() => setView(c)}><Eye className="h-4 w-4" /></Button>} />
      {view && <Dialog open wide title={view.name} onClose={() => setView(null)}>
        <div className="grid gap-4 text-sm sm:grid-cols-4">{[["Orders", d.orders.filter((o) => o.customerId === view.id).length], ["Domains", d.domains.filter((x) => x.customerId === view.id).length], ["Services", d.hosting.filter((x) => x.customerId === view.id).length + d.vps.filter((x) => x.customerId === view.id).length], ["Billed", money(d.invoices.filter((i) => i.customerId === view.id).reduce((s, i) => s + i.total, 0))]].map(([k, v]) => <Card key={String(k)} className="p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-extrabold">{v}</p></Card>)}</div>
        <h3 className="mb-2 mt-5 font-extrabold">Domains</h3><ul className="text-sm">{d.domains.filter((x) => x.customerId === view.id).map((x) => <li key={x.id}>{x.name} — <StatusBadge status={x.status} /></li>)}</ul>
        <h3 className="mb-2 mt-5 font-extrabold">Tickets</h3><ul className="text-sm">{d.tickets.filter((t) => t.customerId === view.id).map((t) => <li key={t.id}>{t.number} — {t.subject} <StatusBadge status={t.status} /></li>)}</ul>
      </Dialog>}
    </>
  );
}

export function AdminOrders() {
  useSeo(adminSeo("Orders", "/admin/orders"));
  const d = useDb(); const money = useMoney();
  const [sel, setSel] = useState<Order | null>(null);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const list = [...d.orders].sort((a, b) => b.date.localeCompare(a.date)).filter((o) => (status === "all" || o.status === status) && (o.number + o.customerName + o.customerEmail).toLowerCase().includes(q.toLowerCase()));
  const current = sel ? d.orders.find((o) => o.id === sel.id) ?? null : null;
  return (
    <>
      <PageHeader title="Orders" description="Payment is never processed; provisioning is not connected." />
      <div className="mb-4 flex flex-wrap gap-2"><Input aria-label="Search orders" className="w-64" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} /><Select aria-label="Filter status" className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{["pending", "processing", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}</Select></div>
      {list.length === 0 ? <EmptyState title="No orders" /> : <Table><thead><tr><Th>Number</Th><Th>Customer</Th><Th>Date</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th /></tr></thead><tbody>
        {list.map((o) => <tr key={o.id}><Td className="font-mono">{o.number}</Td><Td>{o.customerName}<span className="block text-xs text-muted-foreground">{o.customerEmail}</span></Td><Td>{formatDate(o.date)}</Td><Td className="tabular">{money(o.total)}</Td><Td><StatusBadge status={o.paymentStatus} /></Td><Td><StatusBadge status={o.status} /></Td><Td><Button size="sm" variant="outline" onClick={() => setSel(o)}>Open</Button></Td></tr>)}</tbody></Table>}
      {current && <OrderDialog order={current} onClose={() => setSel(null)} />}
    </>
  );
}

function OrderDialog({ order, onClose }: { order: Order; onClose: () => void }) {
  const money = useMoney();
  const [notes, setNotes] = useState(order.notes);
  const [status, setStatus] = useState(order.status);
  return (
    <Dialog open wide title={`Order ${order.number}`} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={() => { db.patch("orders", order.id, { notes, status, paymentStatus: status === "cancelled" ? "CANCELLED" : order.paymentStatus }); audit("order.update", order.number); toast.success("Order saved"); onClose(); }}>Save</Button></>}>
      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div><p className="text-muted-foreground">Customer</p><p className="font-semibold">{order.customerName}</p><p>{order.customerEmail}</p></div>
        <div><p className="text-muted-foreground">Payment</p><StatusBadge status={order.paymentStatus} /> <span className="text-xs">via {order.paymentMethod}</span></div>
        <div><p className="text-muted-foreground">Provisioning</p><Badge>NOT CONNECTED</Badge></div>
      </div>
      <Table className="mt-4"><thead><tr><Th>Item</Th><Th>Cycle</Th><Th>Qty</Th><Th>Amount</Th></tr></thead><tbody>{order.items.map((i, k) => <tr key={k}><Td>{i.name}</Td><Td>{i.cycle}</Td><Td>{i.quantity}</Td><Td className="tabular">{money(i.unitPrice * i.quantity)}</Td></tr>)}</tbody></Table>
      <p className="mt-2 text-right text-sm">Subtotal {money(order.subtotal)} · Discount −{money(order.discount)} · Tax {money(order.tax)} · <strong>Total {money(order.total)}</strong></p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[200px_1fr]">
        <Field label="Status">{(id) => <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as Order["status"])}>{["pending", "processing", "completed", "cancelled"].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
        <Field label="Internal notes">{(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}</Field>
      </div>
    </Dialog>
  );
}

export function AdminInvoices() {
  useSeo(adminSeo("Invoices", "/admin/invoices"));
  const d = useDb(); const money = useMoney();
  const [edit, setEdit] = useState<Invoice | null>(null);
  const [isNew, setIsNew] = useState(false);
  const blank = (): Invoice => { const now = new Date(); const due = new Date(now); due.setDate(due.getDate() + 14); return { id: uid("inv"), number: `INV-DEMO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, customerId: d.customers[0]?.id ?? "", issuedAt: now.toISOString(), dueAt: due.toISOString(), lines: [{ description: "", amount: 0 }], tax: 0, total: 0, status: "pending" }; };
  const recompute = (inv: Invoice): Invoice => { const sub = inv.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0); const tax = Math.round(sub * d.settings.taxRate * 100) / 100; return { ...inv, tax, total: sub + tax }; };
  const setStatusQuick = (inv: Invoice, status: Invoice["status"]) => {
    db.patch("invoices", inv.id, { status });
    if (status === "demo-paid" && !d.payments.some((p) => p.invoiceId === inv.id)) db.insert("payments", { id: uid("pay"), invoiceId: inv.id, customerId: inv.customerId, date: new Date().toISOString(), amount: inv.total, method: "manual (demo)", status: "demo-recorded" });
    audit("invoice.status", `${inv.number} → ${status}`); toast.success(`Marked ${status}`);
  };
  return (
    <>
      <PageHeader title="Invoices" description="Demo invoices — not tax documents." actions={<Button variant="brand" onClick={() => { setIsNew(true); setEdit(blank()); }}><Plus className="h-4 w-4" />New invoice</Button>} />
      <Table><thead><tr><Th>Number</Th><Th>Customer</Th><Th>Issued</Th><Th>Due</Th><Th>Total</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead><tbody>
        {[...d.invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).map((i) => <tr key={i.id}><Td className="font-mono">{i.number}</Td><Td>{d.customers.find((c) => c.id === i.customerId)?.name ?? i.customerId}</Td><Td>{formatDate(i.issuedAt)}</Td><Td>{formatDate(i.dueAt)}</Td><Td className="tabular">{money(i.total)}</Td><Td><StatusBadge status={i.status} /></Td>
          <Td className="whitespace-nowrap text-right">{i.status !== "demo-paid" ? <Button size="sm" variant="ghost" onClick={() => setStatusQuick(i, "demo-paid")}>Mark demo paid</Button> : <Button size="sm" variant="ghost" onClick={() => setStatusQuick(i, "pending")}>Mark pending</Button>}
            <Button size="sm" variant="ghost" onClick={() => { setIsNew(false); setEdit(structuredClone(i)); }}>Edit</Button><Button size="icon" variant="ghost" aria-label="Download invoice" onClick={() => downloadInvoice(i)}><FileDown className="h-4 w-4" /></Button></Td></tr>)}</tbody></Table>
      {edit && <Dialog open wide title={isNew ? "New invoice" : `Edit ${edit.number}`} onClose={() => setEdit(null)} footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={() => {
        const inv = recompute({ ...edit, lines: edit.lines.filter((l) => l.description.trim()) });
        if (!inv.customerId || inv.lines.length === 0) { toast.error("Choose a customer and add at least one line"); return; }
        if (isNew) db.insert("invoices", inv); else db.patch("invoices", inv.id, inv); audit(isNew ? "invoice.create" : "invoice.update", inv.number); toast.success("Invoice saved"); setEdit(null);
      }}>Save</Button></>}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Customer">{(id) => <Select id={id} value={edit.customerId} onChange={(e) => setEdit({ ...edit, customerId: e.target.value })}>{d.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}</Field>
          <Field label="Due date">{(id) => <Input id={id} type="date" value={edit.dueAt.slice(0, 10)} onChange={(e) => setEdit({ ...edit, dueAt: new Date(e.target.value).toISOString() })} />}</Field>
          <Field label="Status">{(id) => <Select id={id} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value as Invoice["status"] })}>{["pending", "demo-paid", "overdue", "cancelled"].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
        </div>
        <h3 className="mb-2 mt-4 text-sm font-extrabold">Lines</h3>
        {edit.lines.map((l, i) => <div key={i} className="mb-2 flex gap-2"><Input aria-label={`Line ${i + 1} description`} placeholder="Description" value={l.description} onChange={(e) => setEdit({ ...edit, lines: edit.lines.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })} /><Input aria-label={`Line ${i + 1} amount`} type="number" className="w-32" value={l.amount} onChange={(e) => setEdit({ ...edit, lines: edit.lines.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) } : x) })} /><Button size="icon" variant="ghost" aria-label="Remove line" onClick={() => setEdit({ ...edit, lines: edit.lines.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>)}
        <Button size="sm" variant="outline" onClick={() => setEdit({ ...edit, lines: [...edit.lines, { description: "", amount: 0 }] })}>Add line</Button>
        <p className="mt-3 text-right text-sm">Total incl. {d.settings.taxLabel}: <strong>{money(recompute(edit).total)}</strong></p>
      </Dialog>}
    </>
  );
}

export function AdminPayments() {
  useSeo(adminSeo("Payments", "/admin/payments"));
  const d = useDb(); const money = useMoney();
  return (<><PageHeader title="Payments" description="Demo payment records. No gateway is connected." />
    <Alert tone="warning" className="mb-4">Recording a demo payment never moves money. Use Invoices › Mark demo paid to create a record.</Alert>
    {d.payments.length === 0 ? <EmptyState title="No payments" /> : <Table><thead><tr><Th>Date</Th><Th>Invoice</Th><Th>Customer</Th><Th>Method</Th><Th>Amount</Th><Th>Status</Th><Th /></tr></thead><tbody>
      {d.payments.map((p) => <tr key={p.id}><Td>{formatDate(p.date)}</Td><Td className="font-mono">{d.invoices.find((i) => i.id === p.invoiceId)?.number}</Td><Td>{d.customers.find((c) => c.id === p.customerId)?.name}</Td><Td>{p.method}</Td><Td className="tabular">{money(p.amount)}</Td><Td><StatusBadge status={p.status} /></Td>
        <Td>{p.status === "demo-recorded" && <Button size="sm" variant="ghost" onClick={() => { db.patch("payments", p.id, { status: "demo-refunded" }); audit("payment.refund", p.id); toast.success("Marked refunded (demo)"); }}>Mark refunded</Button>}</Td></tr>)}</tbody></Table>}</>);
}

export function AdminSubscriptions() {
  useSeo(adminSeo("Subscriptions", "/admin/subscriptions"));
  const d = useDb();
  const rows = [
    ...d.hosting.map((h) => ({ id: h.id, kind: "Hosting", name: `${h.plan} — ${h.domain}`, customer: h.customerId, renews: h.renewsAt, status: h.status, auto: true })),
    ...d.vps.map((v) => ({ id: v.id, kind: "VPS", name: `${v.plan} — ${v.hostname}`, customer: v.customerId, renews: v.renewsAt, status: v.status, auto: true })),
    ...d.domains.map((x) => ({ id: x.id, kind: "Domain", name: x.name, customer: x.customerId, renews: x.expiresAt, status: x.status, auto: x.autoRenew })),
  ].sort((a, b) => a.renews.localeCompare(b.renews));
  return (<><PageHeader title="Subscriptions" description="Recurring services ordered by next renewal." />
    <Table><thead><tr><Th>Type</Th><Th>Service</Th><Th>Customer</Th><Th>Next renewal</Th><Th>Auto-renew</Th><Th>Status</Th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id}><Td><Badge tone="info">{r.kind}</Badge></Td><Td>{r.name}</Td><Td>{d.customers.find((c) => c.id === r.customer)?.name}</Td><Td>{formatDate(r.renews)}</Td><Td>{r.auto ? "Yes" : <Badge tone="warning">No</Badge>}</Td><Td><StatusBadge status={r.status} /></Td></tr>)}</tbody></Table></>);
}

export function AdminCoupons() {
  useSeo(adminSeo("Coupons", "/admin/coupons"));
  const d = useDb();
  return (<><PageHeader title="Coupons" description="Codes customers can apply in the cart." />
    <EntityManager<Coupon> entityName="Coupon" items={d.coupons} searchKeys={["code", "description"]}
      columns={[{ label: "Code", render: (c) => <span className="font-mono font-bold">{c.code}</span> }, { label: "Discount", render: (c) => c.type === "percent" ? `${c.value}%` : `${c.value} MAD` }, { label: "Description", render: (c) => c.description }, { label: "Expires", render: (c) => c.expiresAt ? formatDate(c.expiresAt) : "—" }, { label: "Status", render: (c) => <StatusBadge status={c.active ? "active" : "suspended"} /> }]}
      fields={[{ key: "code", label: "Code", kind: "text", required: true, validate: (v, it) => !/^[A-Z0-9]{3,20}$/.test(String(v)) ? "3–20 upper-case letters/digits" : d.coupons.some((c) => c.code === v && c.id !== it.id) ? "Code already exists" : null },
        { key: "type", label: "Type", kind: "select", options: [{ value: "percent", label: "Percent" }, { value: "fixed", label: "Fixed (MAD)" }] },
        { key: "value", label: "Value", kind: "number", required: true, validate: (v, it) => Number(v) <= 0 ? "Must be positive" : it.type === "percent" && Number(v) > 100 ? "Max 100%" : null },
        { key: "expiresAt", label: "Expires", kind: "date" }, { key: "active", label: "Active", kind: "switch" }, { key: "description", label: "Description", kind: "text", full: true }]}
      create={() => ({ id: uid("cp"), code: "", type: "percent", value: 10, active: true, description: "" })}
      onSave={(c, isNew) => { const clean = { ...c, code: c.code.toUpperCase(), expiresAt: c.expiresAt || undefined }; if (isNew) db.insert("coupons", clean); else db.patch("coupons", c.id, clean); audit("coupon.save", c.code); }}
      onDelete={(c) => { db.remove("coupons", c.id); audit("coupon.delete", c.code); }} /></>);
}

export function AdminResellers() {
  useSeo(adminSeo("Resellers", "/admin/resellers"));
  const d = useDb();
  return (<><PageHeader title="Resellers" />
    <EntityManager<Reseller> entityName="Reseller" items={d.resellers} searchKeys={["name", "company", "email"]} filter={{ key: "status", label: "Statuses", options: ["active", "pending"] }}
      columns={[{ label: "Company", render: (r) => <strong>{r.company}</strong> }, { label: "Contact", render: (r) => <>{r.name}<span className="block text-xs text-muted-foreground">{r.email}</span></> }, { label: "Tier", render: (r) => <Badge tone="info">{r.tier}</Badge> }, { label: "Commission", render: (r) => `${Math.round(r.commissionRate * 100)}%` }, { label: "Customers", render: (r) => d.customers.filter((c) => c.resellerId === r.id).length }, { label: "Status", render: (r) => <StatusBadge status={r.status} /> }]}
      fields={[{ key: "company", label: "Company", kind: "text", required: true }, { key: "name", label: "Contact name", kind: "text", required: true }, { key: "email", label: "Email", kind: "email", required: true },
        { key: "tier", label: "Tier", kind: "select", options: ["starter", "business", "enterprise"].map((v) => ({ value: v, label: v })) }, { key: "commissionRate", label: "Commission rate (0–1)", kind: "number", validate: (v) => Number(v) < 0 || Number(v) > 0.5 ? "Between 0 and 0.5" : null },
        { key: "status", label: "Status", kind: "select", options: [{ value: "active", label: "active" }, { value: "pending", label: "pending" }] }]}
      create={() => ({ id: uid("rsl"), name: "", email: "", company: "", tier: "starter", commissionRate: 0.15, status: "pending", brand: { name: "", color: "#1b2a44", supportEmail: "", domain: "" } })}
      onSave={(r, isNew) => { if (isNew) db.insert("resellers", r); else db.patch("resellers", r.id, r); audit("reseller.save", r.company); }}
      onDelete={(r) => { db.remove("resellers", r.id); audit("reseller.delete", r.company); }}
      rowActions={(r) => r.status === "pending" ? <Button size="sm" variant="success" onClick={() => { db.patch("resellers", r.id, { status: "active" }); audit("reseller.approve", r.company); toast.success("Reseller approved"); }}>Approve</Button> : null} /></>);
}

export function AdminTickets() {
  useSeo(adminSeo("Tickets", "/admin/tickets"));
  const d = useDb();
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState("open-ish");
  const list = [...d.tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).filter((t) => status === "all" || (status === "open-ish" ? t.status !== "closed" : t.status === status));
  const t = d.tickets.find((x) => x.id === sel);
  const who = (id: string) => id === "guest" ? "Website visitor" : d.customers.find((c) => c.id === id)?.name ?? d.resellers.find((r) => r.id === id)?.company ?? id;
  return (
    <>
      <PageHeader title="Tickets" />
      <div className="mb-4 w-52"><Select aria-label="Filter tickets" value={status} onChange={(e) => setStatus(e.target.value)}><option value="open-ish">Not closed</option><option value="all">All</option>{["open", "answered", "customer-reply", "closed"].map((s) => <option key={s}>{s}</option>)}</Select></div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <ul className="space-y-2">{list.length === 0 && <EmptyState title="No tickets" />}{list.map((x) => (
          <li key={x.id}><button type="button" onClick={() => setSel(x.id)} className={`w-full rounded-lg border p-3 text-left text-sm transition ${sel === x.id ? "border-brand-green bg-success-wash" : "bg-card hover:bg-muted"}`}>
            <div className="flex justify-between"><span className="font-mono text-xs">{x.number}</span><StatusBadge status={x.status} /></div><p className="mt-1 font-semibold">{x.subject}</p><p className="text-xs text-muted-foreground">{who(x.customerId)} · {x.department} · {x.priority}</p></button></li>))}</ul>
        {t ? <Card className="p-5">
          <h2 className="text-lg font-extrabold">{t.subject}</h2><p className="mb-4 text-sm text-muted-foreground">{who(t.customerId)}</p>
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            <Field label="Department">{(id) => <Select id={id} value={t.department} onChange={(e) => { db.patch("tickets", t.id, { department: e.target.value as typeof t.department }); audit("ticket.department", t.number); }}>{["sales", "technical", "billing", "abuse"].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
            <Field label="Priority">{(id) => <Select id={id} value={t.priority} onChange={(e) => { db.patch("tickets", t.id, { priority: e.target.value as typeof t.priority }); audit("ticket.priority", t.number); }}>{["low", "medium", "high", "urgent"].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
            <Field label="Status">{(id) => <Select id={id} value={t.status} onChange={(e) => { db.patch("tickets", t.id, { status: e.target.value as typeof t.status, updatedAt: new Date().toISOString() }); audit("ticket.status", t.number); }}>{["open", "answered", "customer-reply", "closed"].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
            <Field label="Assignee">{(id) => <Input id={id} value={t.assignee ?? ""} onChange={(e) => db.patch("tickets", t.id, { assignee: e.target.value })} placeholder="Unassigned" />}</Field>
          </div>
          <TicketThread ticket={t} viewer="staff" />
        </Card> : <EmptyState title="Select a ticket" body="Choose a ticket to reply, assign or add internal notes." />}
      </div>
    </>
  );
}
