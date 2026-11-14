import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, Badge, Button, ButtonLink, Card, EmptyState, Field, Input, Select, Switch, Textarea } from "@/design-system/components/ui";
import { cartStore, clearCart, removeLine, setCoupon, updateLine } from "@/lib/cart";
import { domainPeriodPrice } from "@/lib/domain";
import { useI18n, useMoney } from "@/lib/i18n";
import { createDemoOrder } from "@/lib/orders";
import { computeTotals, cyclePrice, type CartLine } from "@/lib/pricing";
import { useSeo } from "@/lib/seo";
import { demoSignIn, useSession, validateEmail } from "@/lib/auth";
import { useDb } from "@/lib/store";
import { PAYMENT_PROVIDERS } from "@/services/payment";
import type { BillingCycle, Order } from "@/types/models";
import { CYCLE_LABEL } from "./shared";

function useCartTotals() {
  const cart = cartStore.use();
  const data = useDb();
  const totals = useMemo(() => computeTotals(cart.lines, cart.coupon, data.coupons, data.settings.taxRate), [cart, data.coupons, data.settings.taxRate]);
  return { cart, totals, data };
}

function LineCycle({ line }: { line: CartLine }) {
  const data = useDb();
  const { locale } = useI18n();
  if (line.kind === "domain") {
    const tld = data.tlds.find((t) => `domain:${t.tld}` === line.productId);
    if (!tld || line.meta === "transfer") return <span className="text-sm text-muted-foreground">1 year</span>;
    return <Select aria-label={`Period for ${line.name}`} className="w-28" value={parseInt(line.cycle, 10)} onChange={(e) => { const y = Number(e.target.value); updateLine(line.key, { cycle: `${y}y`, unitPrice: domainPeriodPrice(tld, y) }); }}>{[1, 2, 3, 5].map((y) => <option key={y} value={y}>{y} yr</option>)}</Select>;
  }
  const p = data.products.find((x) => x.id === line.productId);
  if (!p) return null;
  const configured = !!line.meta;
  return <Select aria-label={`Billing cycle for ${line.name}`} className="w-36" value={line.cycle} onChange={(e) => {
    const c = e.target.value as BillingCycle;
    const ratio = configured ? line.unitPrice / cyclePrice(p, line.cycle as BillingCycle) : 1;
    updateLine(line.key, { cycle: c, unitPrice: Math.round(cyclePrice(p, c) * ratio) });
  }}>{p.cycles.map((c) => <option key={c} value={c}>{CYCLE_LABEL[c][locale]}</option>)}</Select>;
}

function Summary({ totals, couponEditable = true }: { totals: ReturnType<typeof computeTotals>; couponEditable?: boolean }) {
  const money = useMoney();
  const cart = cartStore.use();
  const data = useDb();
  const [code, setCode] = useState(cart.coupon);
  return (
    <Card className="h-fit p-6 lg:sticky lg:top-24">
      <h2 className="text-lg font-extrabold">Order summary</h2>
      {couponEditable && (
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setCoupon(code.trim().toUpperCase()); }}>
          <label htmlFor="coupon" className="sr-only">Coupon code</label>
          <Input id="coupon" placeholder="Coupon (try WELCOME10)" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" variant="outline">Apply</Button>
        </form>
      )}
      {totals.couponError && <p role="alert" className="mt-2 text-xs font-medium text-destructive">{totals.couponError}</p>}
      {totals.coupon && <p className="mt-2 flex items-center justify-between text-xs text-success"><span>Coupon {totals.coupon.code} applied — {totals.coupon.description}</span>{couponEditable && <button type="button" className="underline" onClick={() => { setCode(""); setCoupon(""); }}>Remove</button>}</p>}
      <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular">{money(totals.subtotal)}</dd></div>
        {totals.discount > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd className="tabular">−{money(totals.discount)}</dd></div>}
        <div className="flex justify-between"><dt>{data.settings.taxLabel}</dt><dd className="tabular">{money(totals.tax)}</dd></div>
        <div className="flex justify-between border-t pt-2 text-base font-extrabold"><dt>Total</dt><dd className="tabular">{money(totals.total)}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">Amounts are calculated in MAD; other currencies are indicative conversions.</p>
    </Card>
  );
}

export function CartPage() {
  useSeo({ title: "Your cart", description: "Review the products in your M212.MA cart.", path: "/cart", noindex: true });
  const { cart, totals } = useCartTotals();
  const money = useMoney();
  if (cart.lines.length === 0) return <div className="mx-auto max-w-3xl px-4 py-16"><h1 className="mb-6 text-3xl font-extrabold">Your cart</h1><EmptyState title="Your cart is empty" body="Search a domain or choose a hosting plan to get started." action={<div className="flex justify-center gap-2"><ButtonLink to="/domains/search" search={{ q: "" }} variant="brand">Find a domain</ButtonLink><ButtonLink to="/hosting" variant="outline">Hosting plans</ButtonLink></div>} /></div>;
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-6 flex items-center justify-between"><h1 className="text-3xl font-extrabold">Your cart</h1><Button variant="ghost" size="sm" onClick={clearCart}>Empty cart</Button></div>
        <ul className="space-y-3">
          {cart.lines.map((l) => (
            <li key={l.key}><Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-bold">{l.name}</p>
                {l.meta && l.kind === "product" && <p className="text-xs text-muted-foreground">{l.meta}</p>}
                <div className="mt-1 flex items-center gap-2"><Badge tone={l.kind === "domain" ? "info" : "neutral"}>{l.kind}</Badge>
                  {l.kind === "domain" && l.meta !== "transfer" && <span className="flex items-center gap-2 text-xs"><Switch checked={l.autoRenew ?? true} onChange={(v) => updateLine(l.key, { autoRenew: v })} label={`Auto-renew ${l.name}`} />Auto-renew</span>}</div>
              </div>
              <LineCycle line={l} />
              {l.kind === "product" ? (
                <div className="flex items-center gap-1" role="group" aria-label={`Quantity for ${l.name}`}>
                  <Button size="icon" variant="outline" aria-label="Decrease quantity" onClick={() => l.quantity > 1 ? updateLine(l.key, { quantity: l.quantity - 1 }) : removeLine(l.key)}><Minus className="h-4 w-4" /></Button>
                  <span className="w-8 text-center font-semibold tabular" aria-live="polite">{l.quantity}</span>
                  <Button size="icon" variant="outline" aria-label="Increase quantity" onClick={() => updateLine(l.key, { quantity: Math.min(20, l.quantity + 1) })}><Plus className="h-4 w-4" /></Button>
                </div>
              ) : <span className="w-[108px]" />}
              <p className="w-28 text-right font-display font-extrabold tabular">{money(l.unitPrice * l.quantity)}</p>
              <Button size="icon" variant="ghost" aria-label={`Remove ${l.name}`} onClick={() => removeLine(l.key)}><Trash2 className="h-4 w-4" /></Button>
            </Card></li>
          ))}
        </ul>
        <div className="mt-6 flex gap-2"><ButtonLink to="/domains/search" search={{ q: "" }} variant="outline">Add a domain</ButtonLink><ButtonLink to="/hosting" variant="ghost">Continue shopping</ButtonLink></div>
      </div>
      <div className="space-y-3"><Summary totals={totals} /><ButtonLink to="/checkout" variant="brand" size="lg" className="w-full">Proceed to checkout</ButtonLink></div>
    </div>
  );
}

const STEPS = ["Customer", "Account", "Billing address", "Configuration", "Review", "Payment", "Confirmation"] as const;

export function CheckoutPage() {
  useSeo({ title: "Checkout", description: "Complete your M212.MA demo order.", path: "/checkout", noindex: true });
  const { cart, totals } = useCartTotals();
  const session = useSession();
  const data = useDb();
  const money = useMoney();
  const navigate = useNavigate();
  const existing = session?.customerId ? data.customers.find((c) => c.id === session.customerId) : undefined;
  const [step, setStep] = useState(0);
  const [customer, setCustomer] = useState({ name: existing?.name ?? session?.name ?? "", email: existing?.email ?? session?.email ?? "", company: existing?.company ?? "", phone: existing?.phone ?? "", country: existing?.country ?? "MA" });
  const [accountMode, setAccountMode] = useState<"existing" | "create" | "guest">(session?.role === "customer" ? "existing" : "create");
  const [address, setAddress] = useState({ line1: "", city: "", postcode: "", country: "MA" });
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState(PAYMENT_PROVIDERS[0]!.id);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<Order | null>(null);
  const enabled = PAYMENT_PROVIDERS.filter((p) => ({ "bank-transfer": data.settings.payment.bankTransfer, card: data.settings.payment.cardPlaceholder, "moroccan-provider": data.settings.payment.moroccanProvider, "international-provider": data.settings.payment.internationalProvider } as Record<string, boolean>)[p.id]);

  if (!order && cart.lines.length === 0) return <div className="mx-auto max-w-3xl px-4 py-16"><h1 className="mb-6 text-3xl font-extrabold">Checkout</h1><EmptyState title="Nothing to check out" body="Your cart is empty." action={<ButtonLink to="/hosting">Browse plans</ButtonLink>} /></div>;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) { if (customer.name.trim().length < 2) e.name = "Name is required"; if (!validateEmail(customer.email)) e.email = "Enter a valid email"; }
    if (step === 2) { if (!address.line1.trim()) e.line1 = "Address is required"; if (!address.city.trim()) e.city = "City is required"; if (!/^[A-Za-z0-9 -]{3,10}$/.test(address.postcode)) e.postcode = "Enter a valid postcode"; }
    if (step === 5) { if (!agree) e.agree = "Please confirm you understand this is a demo order"; }
    setErrors(e); return Object.keys(e).length === 0;
  };
  const next = () => {
    if (!validate()) return;
    if (step === 1 && accountMode !== "guest" && session?.role !== "customer") demoSignIn("customer", { name: customer.name, email: customer.email, customerId: data.customers.find((c) => c.email === customer.email)?.id });
    if (step === 5) {
      const o = createDemoOrder({ customer: { ...customer, id: session?.role === "customer" ? session.customerId : undefined }, address, lines: cart.lines, totals, paymentMethod: payment, notes });
      if (accountMode !== "guest") demoSignIn("customer", { name: customer.name, email: customer.email, customerId: o.customerId });
      setOrder(o); clearCart(); setStep(6); return;
    }
    setStep(step + 1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Checkout</h1>
      <ol className="mt-6 flex flex-wrap gap-2" aria-label="Checkout progress">
        {STEPS.map((s, i) => <li key={s} aria-current={i === step ? "step" : undefined} className={`rounded-full px-3 py-1 text-xs font-bold ${i === step ? "bg-brand-navy-deep text-on-dark" : i < step ? "bg-success-wash text-success" : "bg-muted text-muted-foreground"}`}>{i + 1}. {s}</li>)}
      </ol>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="p-6">
          {step === 0 && <div className="grid gap-4 sm:grid-cols-2">
            <h2 className="text-xl font-extrabold sm:col-span-2">Customer information</h2>
            <Field label="Full name" error={errors.name}>{(id) => <Input id={id} autoComplete="name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />}</Field>
            <Field label="Email" error={errors.email}>{(id) => <Input id={id} type="email" autoComplete="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />}</Field>
            <Field label="Company (optional)">{(id) => <Input id={id} value={customer.company} onChange={(e) => setCustomer({ ...customer, company: e.target.value })} />}</Field>
            <Field label="Phone (optional)">{(id) => <Input id={id} type="tel" autoComplete="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />}</Field>
          </div>}
          {step === 1 && <div className="space-y-3">
            <h2 className="text-xl font-extrabold">Account</h2>
            {session?.role === "customer" && <Alert tone="success">Signed in (demo) as {session.name}.</Alert>}
            {(["existing", "create", "guest"] as const).map((m) => (
              <label key={m} className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${accountMode === m ? "border-brand-green bg-success-wash" : ""}`}>
                <input type="radio" name="acct" checked={accountMode === m} onChange={() => setAccountMode(m)} className="mt-1 accent-brand-green" />
                <span><strong>{m === "existing" ? "I already have an account (demo sign-in)" : m === "create" ? "Create an account (demo)" : "Continue without an account"}</strong>
                  <span className="block text-sm text-muted-foreground">{m === "guest" ? "The order is saved, but you will not see it in the customer area." : "No password is collected or stored in this demo."}</span></span>
              </label>))}
          </div>}
          {step === 2 && <div className="grid gap-4 sm:grid-cols-2">
            <h2 className="text-xl font-extrabold sm:col-span-2">Billing address</h2>
            <Field label="Address" error={errors.line1} className="sm:col-span-2">{(id) => <Input id={id} autoComplete="street-address" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />}</Field>
            <Field label="City" error={errors.city}>{(id) => <Input id={id} autoComplete="address-level2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />}</Field>
            <Field label="Postcode" error={errors.postcode}>{(id) => <Input id={id} autoComplete="postal-code" value={address.postcode} onChange={(e) => setAddress({ ...address, postcode: e.target.value })} />}</Field>
            <Field label="Country">{(id) => <Select id={id} value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}><option value="MA">Morocco</option><option value="FR">France</option><option value="ES">Spain</option><option value="US">United States</option><option value="OTHER">Other</option></Select>}</Field>
          </div>}
          {step === 3 && <div className="space-y-4">
            <h2 className="text-xl font-extrabold">Product configuration</h2>
            {cart.lines.map((l) => <div key={l.key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p className="font-semibold">{l.name}</p>{l.meta && <p className="text-xs text-muted-foreground">{l.meta}</p>}</div><LineCycle line={l} /></div>)}
            <Field label="Order notes (optional)" hint="e.g. preferred hostname or migration needs">{(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}</Field>
          </div>}
          {step === 4 && <div className="space-y-4">
            <h2 className="text-xl font-extrabold">Review</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Customer</dt><dd className="font-semibold">{customer.name} — {customer.email}</dd></div><div><dt className="text-muted-foreground">Billing address</dt><dd className="font-semibold">{address.line1}, {address.postcode} {address.city}, {address.country}</dd></div></dl>
            <ul className="divide-y rounded-lg border text-sm">{cart.lines.map((l) => <li key={l.key} className="flex justify-between gap-4 p-3"><span>{l.name} <span className="text-muted-foreground">· {l.cycle} × {l.quantity}</span></span><span className="font-semibold tabular">{money(l.unitPrice * l.quantity)}</span></li>)}</ul>
          </div>}
          {step === 5 && <div className="space-y-3">
            <h2 className="text-xl font-extrabold">Payment method</h2>
            <Alert tone="warning" title="No payment is processed">This demo never collects card numbers, CVV or bank credentials. The order will be saved as DEMO / PENDING.</Alert>
            {enabled.map((p) => (
              <label key={p.id} className={`flex cursor-pointer gap-3 rounded-lg border p-4 ${payment === p.id ? "border-brand-green bg-success-wash" : ""}`}>
                <input type="radio" name="pay" checked={payment === p.id} onChange={() => setPayment(p.id)} className="mt-1 accent-brand-green" />
                <span><strong>{p.label}</strong> {!p.connected && <Badge tone="demo">not connected</Badge>}<span className="block text-sm text-muted-foreground">{p.description}</span></span>
              </label>))}
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-brand-green" checked={agree} onChange={(e) => setAgree(e.target.checked)} />I understand this creates a demonstration order only and accept the <Link to="/legal/terms" className="font-semibold text-brand-green underline">draft terms</Link>.</label>
            {errors.agree && <p role="alert" className="text-xs text-destructive">{errors.agree}</p>}
          </div>}
          {step === 6 && order && <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-brand-green" aria-hidden />
            <h2 className="text-2xl font-extrabold">Demo order created</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Order number</dt><dd className="font-mono font-bold">{order.number}</dd></div>
              <div><dt className="text-muted-foreground">Date</dt><dd className="font-semibold">{new Date(order.date).toLocaleString()}</dd></div>
              <div><dt className="text-muted-foreground">Customer reference</dt><dd className="font-mono font-semibold">{order.customerId}</dd></div>
              <div><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{money(order.total)}</dd></div>
              <div><dt className="text-muted-foreground">Payment status</dt><dd><Badge tone="warning">DEMO / PENDING</Badge></dd></div>
              <div><dt className="text-muted-foreground">Provisioning status</dt><dd><Badge tone="neutral">NOT CONNECTED</Badge></dd></div>
            </dl>
            <ul className="divide-y rounded-lg border text-sm">{order.items.map((i, k) => <li key={k} className="flex justify-between p-3"><span>{i.name} × {i.quantity}</span><span className="tabular">{money(i.unitPrice * i.quantity)}</span></li>)}</ul>
            <div className="flex flex-wrap gap-2">{accountMode !== "guest" && <Button onClick={() => void navigate({ to: "/client/orders" })}>View in customer area</Button>}<ButtonLink to="/" variant="outline">Back to home</ButtonLink></div>
          </div>}
          {step < 6 && <div className="mt-8 flex justify-between border-t pt-4">
            <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
            <Button variant="brand" onClick={next}>{step === 5 ? "Place demo order" : "Continue"}</Button>
          </div>}
        </Card>
        {step < 6 && <Summary totals={totals} couponEditable={step < 5} />}
      </div>
    </div>
  );
}
