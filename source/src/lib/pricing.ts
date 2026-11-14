import type { BillingCycle, Coupon, Product } from "@/types/models";

export const CYCLE_MONTHS: Record<BillingCycle, number> = { monthly: 1, quarterly: 3, annually: 12, biennially: 24 };
/** Discount applied for longer commitment. */
export const CYCLE_DISCOUNT: Record<BillingCycle, number> = { monthly: 0, quarterly: 0.05, annually: 0.15, biennially: 0.25 };

export function cyclePrice(product: Pick<Product, "priceMonthly">, cycle: BillingCycle): number {
  return Math.round(product.priceMonthly * CYCLE_MONTHS[cycle] * (1 - CYCLE_DISCOUNT[cycle]));
}

export interface CartLine { key: string; productId: string; name: string; kind: "product" | "domain"; cycle: string; quantity: number; unitPrice: number; meta?: string; autoRenew?: boolean }
export interface Totals { subtotal: number; discount: number; tax: number; total: number; couponError?: string; coupon?: Coupon }

export function findCoupon(code: string, coupons: Coupon[]): Coupon | undefined {
  const c = code.trim().toUpperCase();
  return coupons.find((x) => x.code.toUpperCase() === c);
}

export function computeTotals(lines: CartLine[], couponCode: string, coupons: Coupon[], taxRate: number, today = new Date()): Totals {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * Math.max(0, l.quantity), 0);
  let discount = 0;
  let couponError: string | undefined;
  let coupon: Coupon | undefined;
  if (couponCode.trim()) {
    coupon = findCoupon(couponCode, coupons);
    if (!coupon) couponError = "Coupon not found.";
    else if (!coupon.active) { couponError = "This coupon is not active."; coupon = undefined; }
    else if (coupon.expiresAt && new Date(coupon.expiresAt) < today) { couponError = "This coupon has expired."; coupon = undefined; }
    else discount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : Math.min(subtotal, coupon.value);
  }
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * taxRate * 100) / 100;
  return { subtotal, discount, tax, total: Math.round((taxable + tax) * 100) / 100, couponError, coupon };
}

export function resellerMargin(wholesale: number, retail: number) {
  const margin = retail - wholesale;
  return { margin, percent: retail > 0 ? Math.round((margin / retail) * 1000) / 10 : 0 };
}

export const RESELLER_DISCOUNT = { starter: 0.15, business: 0.25, enterprise: 0.35 } as const;
export function wholesalePrice(priceMonthly: number, tier: keyof typeof RESELLER_DISCOUNT) {
  return Math.round(priceMonthly * (1 - RESELLER_DISCOUNT[tier]) * 100) / 100;
}
