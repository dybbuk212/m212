import type { Domain, Invoice, Order } from "@/types/models";
import type { CartLine, Totals } from "./pricing";
import { db, uid } from "./store";

export function orderNumber(date = new Date(), seq = Math.floor(Math.random() * 90000) + 10000) {
  return `M212-DEMO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${seq}`;
}

export interface CheckoutInput {
  customer: { id?: string; name: string; email: string; company?: string; phone?: string; country: string };
  address: { line1: string; city: string; country: string; postcode: string };
  lines: CartLine[]; totals: Totals; couponCode?: string; paymentMethod: string; notes?: string;
}

/** Creates a DEMO order + pending invoice (+ demo-pending domain records). Never marks anything paid. */
export function createDemoOrder(input: CheckoutInput): Order {
  const state = db.get();
  const now = new Date();
  let customerId = input.customer.id ?? state.customers.find((c) => c.email.toLowerCase() === input.customer.email.toLowerCase())?.id;
  if (!customerId) {
    customerId = uid("cus");
    db.insert("customers", { id: customerId, name: input.customer.name, email: input.customer.email, company: input.customer.company, phone: input.customer.phone, country: input.customer.country, status: "pending", createdAt: now.toISOString() });
  }
  const order: Order = {
    id: uid("ord"), number: orderNumber(now), customerId, customerName: input.customer.name, customerEmail: input.customer.email, date: now.toISOString(),
    items: input.lines.map((l) => ({ productId: l.productId, name: l.name + (l.meta && l.kind === "product" ? ` (${l.meta})` : ""), cycle: l.cycle as Order["items"][number]["cycle"], quantity: l.quantity, unitPrice: l.unitPrice, meta: l.meta })),
    subtotal: input.totals.subtotal, discount: input.totals.discount, tax: input.totals.tax, total: input.totals.total, coupon: input.totals.coupon?.code,
    paymentMethod: input.paymentMethod, paymentStatus: "DEMO_PENDING", provisioningStatus: "NOT_CONNECTED", status: "pending", notes: input.notes ?? "", billingAddress: input.address,
  };
  db.insert("orders", order);
  const due = new Date(now); due.setDate(due.getDate() + 14);
  const invoice: Invoice = {
    id: uid("inv"), number: `INV-DEMO-${now.getFullYear()}-${order.number.slice(-5)}`, customerId, orderId: order.id, issuedAt: now.toISOString(), dueAt: due.toISOString(),
    lines: [...order.items.map((i) => ({ description: `${i.name} × ${i.quantity}`, amount: i.unitPrice * i.quantity })), ...(order.discount ? [{ description: `Discount ${order.coupon ?? ""}`.trim(), amount: -order.discount }] : [])],
    tax: order.tax, total: order.total, status: "pending",
  };
  db.insert("invoices", invoice);
  for (const l of input.lines.filter((x) => x.kind === "domain")) {
    const name = l.name.split(" — ")[0]!; const years = parseInt(l.cycle, 10) || 1; const exp = new Date(now); exp.setFullYear(exp.getFullYear() + years);
    const domain: Domain = { id: uid("dom"), name, customerId, registrar: state.tlds.find((t) => name.endsWith(t.tld))?.registrar ?? "registrar-a", registeredAt: now.toISOString(), expiresAt: exp.toISOString(),
      autoRenew: l.autoRenew ?? true, locked: true, privacy: false, nameservers: ["ns1.m212.ma", "ns2.m212.ma"], dns: [], status: "demo-pending",
      contact: { name: input.customer.name, email: input.customer.email, phone: input.customer.phone ?? "", address: `${input.address.line1}, ${input.address.city}` } };
    db.insert("domains", domain);
  }
  db.insert("notifications", { id: uid("ntf"), customerId, title: "Demo order received", body: `${order.number} was created. Payment: DEMO/PENDING. Provisioning: NOT CONNECTED.`, at: now.toISOString(), read: false });
  db.log(input.customer.email, "order.create", order.number);
  return order;
}
