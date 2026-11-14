import { useState } from "react";
import { toast } from "sonner";
import { Alert, Badge, BarChart, Button, Card, ConfirmDialog, Dialog, EmptyState, Field, Input, PageHeader, Select, Stat, StatusBadge, Table, Td, Th } from "@/design-system/components/ui";
import { useSession, validateEmail } from "@/lib/auth";
import { formatDate, useMoney } from "@/lib/i18n";
import { orderNumber } from "@/lib/orders";
import { RESELLER_DISCOUNT, resellerMargin, wholesalePrice } from "@/lib/pricing";
import { useSeo } from "@/lib/seo";
import { db, uid, useDb } from "@/lib/store";
import { DEMO_RESELLER_ID } from "@/data/seed";
import type { Customer, Order } from "@/types/models";
import { downloadInvoice, NewTicketDialog } from "@/features/client/ClientPages";

function useReseller() {
  const session = useSession();
  const data = useDb();
  const id = session?.resellerId ?? DEMO_RESELLER_ID;
  const reseller = data.resellers.find((r) => r.id === id) ?? data.resellers[0]!;
  const customers = data.customers.filter((c) => c.resellerId === reseller.id);
  const ids = new Set(customers.map((c) => c.id));
  const orders = data.orders.filter((o) => ids.has(o.customerId)).sort((a, b) => b.date.localeCompare(a.date));
  const invoices = data.invoices.filter((i) => ids.has(i.customerId));
  const retail = (productId: string) => data.resellerPrices.find((p) => p.productId === productId)?.retail;
  return { data, reseller, customers, orders, invoices, retail };
}
const seo = (t: string, path: string) => ({ title: `${t} — Reseller`, description: `M212.MA reseller portal: ${t.toLowerCase()} (demo).`, path, noindex: true });

export function commissionFor(orders: Order[], rate: number) {
  return orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.subtotal - o.discount) * rate, 0);
}

export function ResellerDashboard() {
  useSeo(seo("Dashboard", "/reseller/dashboard"));
  const r = useReseller();
  const money = useMoney();
  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return { key: d.toISOString().slice(0, 7), label: d.toLocaleString("en", { month: "short" }) }; });
  const series = months.map((m) => ({ label: m.label, value: Math.round(commissionFor(r.orders.filter((o) => o.date.startsWith(m.key)), r.reseller.commissionRate)) }));
  return (
    <>
      <PageHeader eyebrow={r.reseller.company} title="Reseller dashboard" description={`Tier: ${r.reseller.tier} · wholesale discount ${RESELLER_DISCOUNT[r.reseller.tier] * 100}% · commission ${r.reseller.commissionRate * 100}%`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Customers" value={r.customers.length} />
        <Stat label="Orders" value={r.orders.length} />
        <Stat label="Sales (demo)" value={money(r.orders.reduce((s, o) => s + o.total, 0))} />
        <Stat label="Commission (demo)" value={money(commissionFor(r.orders, r.reseller.commissionRate))} />
      </div>
      <Card className="mt-6 p-5"><h2 className="mb-4 font-extrabold">Commission — last 6 months (demo)</h2><BarChart data={series} label="Monthly commission" format={money} /></Card>
    </>
  );
}

function CustomerDialog({ initial, onClose, resellerId }: { initial: Customer | null | "new"; onClose: () => void; resellerId: string }) {
  const editing = initial && initial !== "new" ? initial : null;
  const [f, setF] = useState({ name: editing?.name ?? "", email: editing?.email ?? "", company: editing?.company ?? "", country: editing?.country ?? "MA", status: editing?.status ?? "active" });
  const [err, setErr] = useState<Record<string, string>>({});
  if (!initial) return null;
  return (
    <Dialog open title={editing ? "Edit customer" : "New customer"} onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => {
      const e: Record<string, string> = {}; if (f.name.trim().length < 2) e.name = "Required"; if (!validateEmail(f.email)) e.email = "Invalid email";
      if (db.get().customers.some((c) => c.email.toLowerCase() === f.email.toLowerCase() && c.id !== editing?.id)) e.email = "Email already used";
      setErr(e); if (Object.keys(e).length) return;
      if (editing) db.patch("customers", editing.id, { ...f, company: f.company || undefined, status: f.status as Customer["status"] });
      else db.insert("customers", { id: uid("cus"), ...f, company: f.company || undefined, status: f.status as Customer["status"], createdAt: new Date().toISOString(), resellerId });
      db.log("reseller", editing ? "customer.update" : "customer.create", f.email); toast.success("Customer saved"); onClose();
    }}>Save</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" error={err.name}>{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label="Email" error={err.email}>{(id) => <Input id={id} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
        <Field label="Company">{(id) => <Input id={id} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />}</Field>
        <Field label="Country">{(id) => <Select id={id} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}><option value="MA">Morocco</option><option value="FR">France</option><option value="OTHER">Other</option></Select>}</Field>
        <Field label="Status">{(id) => <Select id={id} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Customer["status"] })}><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option></Select>}</Field>
      </div>
    </Dialog>
  );
}

export function ResellerCustomers() {
  useSeo(seo("Customers", "/reseller/customers"));
  const r = useReseller();
  const money = useMoney();
  const [edit, setEdit] = useState<Customer | null | "new">(null);
  const [assign, setAssign] = useState<Customer | null>(null);
  const [del, setDel] = useState<Customer | null>(null);
  const [productId, setProductId] = useState("");
  const resellable = r.data.products.filter((p) => r.retail(p.id) !== undefined);
  return (
    <>
      <PageHeader title="Customers" description="Customers you manage. Assigning a product creates a demo order at your retail price." actions={<Button variant="brand" onClick={() => setEdit("new")}>New customer</Button>} />
      {r.customers.length === 0 ? <EmptyState title="No customers yet" action={<Button onClick={() => setEdit("new")}>Create a demo customer</Button>} /> : <Table><thead><tr><Th>Name</Th><Th>Email</Th><Th>Status</Th><Th>Orders</Th><Th>Since</Th><Th /></tr></thead><tbody>
        {r.customers.map((c) => <tr key={c.id}><Td className="font-semibold">{c.name}<span className="block text-xs text-muted-foreground">{c.company}</span></Td><Td>{c.email}</Td><Td><StatusBadge status={c.status} /></Td><Td>{r.orders.filter((o) => o.customerId === c.id).length}</Td><Td>{formatDate(c.createdAt)}</Td>
          <Td className="space-x-1 whitespace-nowrap"><Button size="sm" variant="outline" onClick={() => { setAssign(c); setProductId(resellable[0]?.id ?? ""); }}>Assign product</Button><Button size="sm" variant="ghost" onClick={() => setEdit(c)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => setDel(c)}>Delete</Button></Td></tr>)}</tbody></Table>}
      {edit && <CustomerDialog key={edit === "new" ? "new" : edit.id} initial={edit} onClose={() => setEdit(null)} resellerId={r.reseller.id} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title="Delete customer?" body={`${del?.name} will be removed from your demo customer list.`} onConfirm={() => { if (del) { db.remove("customers", del.id); db.log("reseller", "customer.delete", del.email); toast.success("Customer deleted"); } }} />
      <Dialog open={!!assign} onClose={() => setAssign(null)} title={`Assign product to ${assign?.name ?? ""}`} footer={<><Button variant="outline" onClick={() => setAssign(null)}>Cancel</Button><Button disabled={!productId} onClick={() => {
        const p = r.data.products.find((x) => x.id === productId); const price = r.retail(productId); if (!assign || !p || price === undefined) return;
        const tax = Math.round(price * r.data.settings.taxRate * 100) / 100;
        db.insert("orders", { id: uid("ord"), number: orderNumber(), customerId: assign.id, customerName: assign.name, customerEmail: assign.email, date: new Date().toISOString(), items: [{ productId: p.id, name: p.name, cycle: "monthly", quantity: 1, unitPrice: price }],
          subtotal: price, discount: 0, tax, total: price + tax, paymentMethod: "reseller-account", paymentStatus: "DEMO_PENDING", provisioningStatus: "NOT_CONNECTED", status: "pending", notes: `Assigned by reseller ${r.reseller.company}` });
        db.log("reseller", "product.assign", `${p.name} → ${assign.email}`); toast.success("Product assigned (demo order created)"); setAssign(null);
      }}>Assign</Button></>}>
        {resellable.length === 0 ? <Alert tone="warning">Set retail prices in Pricing first.</Alert> : <Field label="Product">{(id) => <Select id={id} value={productId} onChange={(e) => setProductId(e.target.value)}>{resellable.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(r.retail(p.id) ?? 0)}/mo</option>)}</Select>}</Field>}
      </Dialog>
    </>
  );
}

export function ResellerProducts() {
  useSeo(seo("Products", "/reseller/products"));
  const r = useReseller();
  const money = useMoney();
  const toggle = (productId: string, base: number) => {
    const exists = r.retail(productId) !== undefined;
    db.update((d) => ({ ...d, resellerPrices: exists ? d.resellerPrices.filter((p) => p.productId !== productId) : [...d.resellerPrices, { productId, retail: Math.round(base * 1.1) }] }));
    toast.success(exists ? "Removed from your catalogue" : "Added to your catalogue at a 10% markup");
  };
  return (
    <>
      <PageHeader title="Products" description="Choose which products you resell. Wholesale prices reflect your tier discount." />
      <Table><thead><tr><Th>Product</Th><Th>Type</Th><Th>List price</Th><Th>Your wholesale</Th><Th>In your catalogue</Th></tr></thead><tbody>
        {r.data.products.filter((p) => p.visible && p.type !== "dedicated").map((p) => <tr key={p.id}><Td className="font-semibold">{p.name}</Td><Td><Badge>{p.type}</Badge></Td><Td className="tabular">{money(p.priceMonthly)}</Td><Td className="tabular font-semibold">{money(wholesalePrice(p.priceMonthly, r.reseller.tier))}</Td>
          <Td><Button size="sm" variant={r.retail(p.id) !== undefined ? "success" : "outline"} onClick={() => toggle(p.id, p.priceMonthly)}>{r.retail(p.id) !== undefined ? "Reselling" : "Add"}</Button></Td></tr>)}</tbody></Table>
    </>
  );
}

export function ResellerPricing() {
  useSeo(seo("Pricing", "/reseller/pricing"));
  const r = useReseller();
  const money = useMoney();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const rows = r.data.resellerPrices.map((rp) => ({ rp, p: r.data.products.find((x) => x.id === rp.productId) })).filter((x) => x.p);
  return (
    <>
      <PageHeader title="Pricing & margins" description="Set retail prices (monthly, MAD). Margins are calculated against your wholesale price." />
      {rows.length === 0 ? <EmptyState title="No products in your catalogue" body="Add products first." /> : <Table><thead><tr><Th>Product</Th><Th>Wholesale</Th><Th>Retail</Th><Th>Margin</Th><Th /></tr></thead><tbody>
        {rows.map(({ rp, p }) => { const wh = wholesalePrice(p!.priceMonthly, r.reseller.tier); const val = draft[rp.productId] ?? String(rp.retail); const m = resellerMargin(wh, Number(val) || 0); return (
          <tr key={rp.productId}><Td className="font-semibold">{p!.name}</Td><Td className="tabular">{money(wh)}</Td>
            <Td><Input aria-label={`Retail price for ${p!.name}`} type="number" min={0} step="0.5" className="w-28" value={val} onChange={(e) => setDraft({ ...draft, [rp.productId]: e.target.value })} /></Td>
            <Td><span className={m.margin < 0 ? "font-semibold text-destructive" : "font-semibold text-success"}>{money(m.margin)} ({m.percent}%)</span></Td>
            <Td><Button size="sm" disabled={draft[rp.productId] === undefined} onClick={() => { const n = Number(val); if (!(n > 0)) { toast.error("Retail price must be positive"); return; } if (n < wh) toast.warning("Retail below wholesale — negative margin"); db.update((d) => ({ ...d, resellerPrices: d.resellerPrices.map((x) => x.productId === rp.productId ? { ...x, retail: n } : x) })); const { [rp.productId]: _, ...rest } = draft; void _; setDraft(rest); toast.success("Price saved"); }}>Save</Button></Td></tr>); })}
      </tbody></Table>}
    </>
  );
}

export function ResellerOrders() {
  useSeo(seo("Orders", "/reseller/orders"));
  const r = useReseller(); const money = useMoney();
  return (<><PageHeader title="Orders" description="Orders placed by or for your customers." />
    {r.orders.length === 0 ? <EmptyState title="No orders" /> : <Table><thead><tr><Th>Number</Th><Th>Customer</Th><Th>Date</Th><Th>Items</Th><Th>Total</Th><Th>Payment</Th></tr></thead><tbody>
      {r.orders.map((o) => <tr key={o.id}><Td className="font-mono">{o.number}</Td><Td>{o.customerName}</Td><Td>{formatDate(o.date)}</Td><Td className="text-xs">{o.items.map((i) => i.name).join(", ")}</Td><Td className="tabular">{money(o.total)}</Td><Td><StatusBadge status={o.paymentStatus} /></Td></tr>)}</tbody></Table>}</>);
}

export function ResellerInvoices() {
  useSeo(seo("Invoices", "/reseller/invoices"));
  const r = useReseller(); const money = useMoney();
  return (<><PageHeader title="Invoices" description="Invoices issued to your customers." />
    {r.invoices.length === 0 ? <EmptyState title="No invoices" body="Invoices appear when your customers check out." /> : <Table><thead><tr><Th>Number</Th><Th>Customer</Th><Th>Due</Th><Th>Total</Th><Th>Status</Th><Th /></tr></thead><tbody>
      {r.invoices.map((i) => <tr key={i.id}><Td className="font-mono">{i.number}</Td><Td>{r.customers.find((c) => c.id === i.customerId)?.name}</Td><Td>{formatDate(i.dueAt)}</Td><Td className="tabular">{money(i.total)}</Td><Td><StatusBadge status={i.status} /></Td><Td><Button size="sm" variant="ghost" onClick={() => downloadInvoice(i)}>Download</Button></Td></tr>)}</tbody></Table>}</>);
}

export function ResellerCommissions() {
  useSeo(seo("Commissions", "/reseller/commissions"));
  const r = useReseller(); const money = useMoney();
  const rows = r.orders.map((o) => ({ o, c: commissionFor([o], r.reseller.commissionRate) }));
  return (<><PageHeader title="Commissions" description={`Commission rate ${r.reseller.commissionRate * 100}% of net order value (demo calculation, not payable).`} />
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><Stat label="Total earned (demo)" value={money(rows.reduce((s, x) => s + x.c, 0))} /><Stat label="Pending (unpaid orders)" value={money(rows.filter((x) => x.o.paymentStatus !== "DEMO_PAID").reduce((s, x) => s + x.c, 0))} /><Stat label="Confirmed (demo paid)" value={money(rows.filter((x) => x.o.paymentStatus === "DEMO_PAID").reduce((s, x) => s + x.c, 0))} /></div>
    {rows.length === 0 ? <EmptyState title="No commissions yet" /> : <Table><thead><tr><Th>Order</Th><Th>Customer</Th><Th>Net value</Th><Th>Commission</Th><Th>Status</Th></tr></thead><tbody>
      {rows.map(({ o, c }) => <tr key={o.id}><Td className="font-mono">{o.number}</Td><Td>{o.customerName}</Td><Td className="tabular">{money(o.subtotal - o.discount)}</Td><Td className="tabular font-semibold">{money(c)}</Td><Td><StatusBadge status={o.paymentStatus} /></Td></tr>)}</tbody></Table>}</>);
}

export function ResellerBranding() {
  useSeo(seo("Branding", "/reseller/branding"));
  const r = useReseller();
  const [b, setB] = useState(r.reseller.brand);
  return (<><PageHeader title="Branding" description="White-label settings shown to your customers." />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6"><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!/^#[0-9a-f]{6}$/i.test(b.color)) { toast.error("Colour must be a hex value like #1f6f50"); return; } if (!validateEmail(b.supportEmail)) { toast.error("Invalid support email"); return; } db.patch("resellers", r.reseller.id, { brand: b }); toast.success("Branding saved"); }}>
        <Field label="Brand name">{(id) => <Input id={id} value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} />}</Field>
        <Field label="Primary colour">{(id) => <div className="flex gap-2"><input type="color" aria-label="Pick colour" value={b.color} onChange={(e) => setB({ ...b, color: e.target.value })} className="h-10 w-14 rounded border" /><Input id={id} value={b.color} onChange={(e) => setB({ ...b, color: e.target.value })} /></div>}</Field>
        <Field label="Support email">{(id) => <Input id={id} value={b.supportEmail} onChange={(e) => setB({ ...b, supportEmail: e.target.value })} />}</Field>
        <Field label="Portal domain" hint="DNS and SSL for custom portal domains require the backend.">{(id) => <Input id={id} value={b.domain} onChange={(e) => setB({ ...b, domain: e.target.value })} />}</Field>
        <Button type="submit">Save branding</Button></form></Card>
      <Card className="overflow-hidden"><div className="p-4 text-sm font-bold text-on-dark" style={{ background: b.color }}>{b.name || "Your brand"}</div><div className="space-y-2 p-5 text-sm"><p className="font-semibold">Preview — customer portal header</p><p className="text-muted-foreground">Support: {b.supportEmail}</p><p className="text-muted-foreground">https://{b.domain}</p></div></Card>
    </div></>);
}

export function ResellerSupport() {
  useSeo(seo("Support", "/reseller/support"));
  const r = useReseller();
  const [open, setOpen] = useState(false);
  const ids = new Set([r.reseller.id, ...r.customers.map((c) => c.id)]);
  const tickets = r.data.tickets.filter((t) => ids.has(t.customerId));
  return (<><PageHeader title="Support" description="Your requests to M212 and your customers' tickets." actions={<Button variant="brand" onClick={() => setOpen(true)}>New request</Button>} />
    {tickets.length === 0 ? <EmptyState title="No tickets" /> : <Table><thead><tr><Th>Number</Th><Th>From</Th><Th>Subject</Th><Th>Status</Th><Th>Updated</Th></tr></thead><tbody>
      {tickets.map((t) => <tr key={t.id}><Td className="font-mono">{t.number}</Td><Td>{t.customerId === r.reseller.id ? "You" : r.customers.find((c) => c.id === t.customerId)?.name}</Td><Td>{t.subject}</Td><Td><StatusBadge status={t.status} /></Td><Td>{formatDate(t.updatedAt)}</Td></tr>)}</tbody></Table>}
    <NewTicketDialog open={open} onClose={() => setOpen(false)} customerId={r.reseller.id} author={r.reseller.name} /></>);
}

export function ResellerSettings() {
  useSeo(seo("Settings", "/reseller/settings"));
  const r = useReseller();
  const [f, setF] = useState({ name: r.reseller.name, email: r.reseller.email, company: r.reseller.company });
  return (<><PageHeader title="Settings" />
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6"><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!validateEmail(f.email)) { toast.error("Invalid email"); return; } db.patch("resellers", r.reseller.id, f); toast.success("Settings saved"); }}>
        <Field label="Contact name">{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label="Email">{(id) => <Input id={id} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
        <Field label="Company">{(id) => <Input id={id} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />}</Field>
        <Button type="submit">Save</Button></form></Card>
      <Card className="space-y-3 p-6"><h2 className="font-extrabold">Account tier</h2><p className="text-sm">Current tier: <Badge tone="info">{r.reseller.tier}</Badge> · status <StatusBadge status={r.reseller.status} /></p><p className="text-sm text-muted-foreground">Tier changes are approved by M212 administrators.</p>
        <h2 className="pt-3 font-extrabold">API access</h2><p className="text-sm text-muted-foreground">Reseller API keys will be issued by the future backend. No keys are generated or stored in the browser.</p></Card>
    </div></>);
}
