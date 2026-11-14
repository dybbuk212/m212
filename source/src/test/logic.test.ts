import { describe, expect, it, beforeEach } from "vitest";
import { parseDomainInput, simulateAvailability, domainPeriodPrice } from "@/lib/domain";
import { computeTotals, cyclePrice, resellerMargin, wholesalePrice, type CartLine } from "@/lib/pricing";
import { SEED_COUPONS } from "@/data/seed";
import { SEED_TLDS } from "@/data/catalog";
import { db } from "@/lib/store";
import { createDemoOrder, orderNumber } from "@/lib/orders";
import { validateDnsRecord } from "@/features/client/ServiceDetails";
import { validateSlug, moveItem } from "@/features/cms/CmsAdmin";
import { validateMediaFile } from "@/lib/media-db";
import { validatePassword } from "@/lib/auth";
import { formatMoney } from "@/lib/i18n";
import { commissionFor } from "@/features/reseller/ResellerPages";

const tlds = SEED_TLDS.map((t) => t.tld);
const line = (unitPrice: number, quantity = 1): CartLine => ({ key: String(unitPrice), productId: "x", name: "x", kind: "product", cycle: "monthly", quantity, unitPrice });

describe("domain validation", () => {
  it("normalises URLs, case and www", () => { expect(parseDomainInput("https://www.My-Site.MA/path", tlds)).toEqual({ ok: true, label: "my-site", tld: ".ma" }); });
  it("accepts a bare label without extension", () => { expect(parseDomainInput("atlas", tlds)).toEqual({ ok: true, label: "atlas", tld: undefined }); });
  it("rejects leading hyphen", () => { expect(parseDomainInput("-bad", tlds).ok).toBe(false); });
  it("rejects invalid characters", () => { expect(parseDomainInput("hé llo", tlds).ok).toBe(false); expect(parseDomainInput("a_b.com", tlds).ok).toBe(false); });
  it("rejects unknown extensions", () => { const r = parseDomainInput("site.xyz", tlds); expect(r.ok).toBe(false); });
  it("rejects labels over 63 characters", () => { expect(parseDomainInput("a".repeat(64) + ".com", tlds).ok).toBe(false); });
  it("supports all 16 required TLDs", () => { for (const t of [".com", ".ma", ".net", ".org", ".info", ".biz", ".co", ".io", ".dev", ".app", ".shop", ".online", ".site", ".store", ".tech", ".cloud"]) expect(tlds).toContain(t); });
  it("simulated availability marks reserved names as taken", () => { expect(simulateAvailability("m212", ".ma")).toBe(false); expect(simulateAvailability("google", ".com")).toBe(false); });
  it("multi-year price uses promo first year then renewal", () => { const info = SEED_TLDS.find((t) => t.tld === ".info")!; expect(domainPeriodPrice(info, 3)).toBe(29 + 229 * 2); });
});

describe("pricing, coupons and tax", () => {
  it("applies cycle discounts", () => { expect(cyclePrice({ priceMonthly: 100 }, "monthly")).toBe(100); expect(cyclePrice({ priceMonthly: 100 }, "annually")).toBe(1020); expect(cyclePrice({ priceMonthly: 100 }, "biennially")).toBe(1800); });
  it("percent coupon WELCOME10 takes 10% and tax is 20% of the discounted amount", () => {
    const t = computeTotals([line(500, 2)], "welcome10", SEED_COUPONS, 0.2);
    expect(t).toMatchObject({ subtotal: 1000, discount: 100, tax: 180, total: 1080 });
  });
  it("fixed coupon cannot exceed subtotal", () => { expect(computeTotals([line(50)], "MAD100", SEED_COUPONS, 0.2)).toMatchObject({ discount: 50, total: 0 }); });
  it("inactive and unknown coupons give an error and no discount", () => {
    expect(computeTotals([line(100)], "EXPIRED5", SEED_COUPONS, 0.2)).toMatchObject({ discount: 0, couponError: "This coupon is not active." });
    expect(computeTotals([line(100)], "NOPE", SEED_COUPONS, 0.2).couponError).toBe("Coupon not found.");
  });
  it("expired coupons are rejected", () => {
    const c = [{ id: "e", code: "OLD", type: "percent" as const, value: 50, active: true, expiresAt: "2020-01-01T00:00:00Z", description: "" }];
    expect(computeTotals([line(100)], "OLD", c, 0.2).couponError).toBe("This coupon has expired.");
  });
  it("currency conversion uses configured rates", () => { expect(formatMoney(1000, "EUR", "en", { MAD: 1, EUR: 0.092, USD: 0.1 })).toContain("92.00"); });
  it("reseller wholesale and margin", () => { expect(wholesalePrice(100, "business")).toBe(75); expect(resellerMargin(75, 100)).toEqual({ margin: 25, percent: 25 }); });
});

describe("demo data store and orders", () => {
  beforeEach(() => db.reset());
  it("CRUD persists to localStorage", () => {
    db.insert("coupons", { id: "t1", code: "TEST", type: "percent", value: 5, active: true, description: "" });
    expect(JSON.parse(localStorage.getItem("m212.db.v2")!).coupons.some((c: { id: string }) => c.id === "t1")).toBe(true);
    db.patch("coupons", "t1", { value: 7 }); expect(db.find("coupons", "t1")?.value).toBe(7);
    db.remove("coupons", "t1"); expect(db.find("coupons", "t1")).toBeUndefined();
  });
  it("export → reset → import round-trips data", () => {
    db.patch("customers", "cus-1001", { name: "Changed" });
    const json = db.exportJson(); db.reset();
    expect(db.find("customers", "cus-1001")?.name).toBe("Yasmine Alaoui");
    db.importJson(json); expect(db.find("customers", "cus-1001")?.name).toBe("Changed");
  });
  it("rejects foreign import files", () => { expect(() => db.importJson('{"hello":1}')).toThrow(); });
  it("creates a DEMO/PENDING, NOT_CONNECTED order with invoice and domain", () => {
    const tld = SEED_TLDS.find((t) => t.tld === ".ma")!;
    const lines: CartLine[] = [{ key: "d", productId: "domain:.ma", name: "neworder.ma — registration", kind: "domain", cycle: "1y", quantity: 1, unitPrice: tld.register, autoRenew: true }];
    const totals = computeTotals(lines, "", [], 0.2);
    const o = createDemoOrder({ customer: { name: "New Person", email: "new@example.ma", country: "MA" }, address: { line1: "x", city: "Rabat", country: "MA", postcode: "10000" }, lines, totals, paymentMethod: "bank-transfer" });
    expect(o.paymentStatus).toBe("DEMO_PENDING"); expect(o.provisioningStatus).toBe("NOT_CONNECTED"); expect(o.number).toMatch(/^M212-DEMO-\d{6}-\d{5}$/);
    const s = db.get();
    expect(s.invoices.find((i) => i.orderId === o.id)?.status).toBe("pending");
    expect(s.domains.find((d) => d.name === "neworder.ma")?.status).toBe("demo-pending");
    expect(s.customers.find((c) => c.email === "new@example.ma")).toBeTruthy();
  });
  it("order numbers embed year and month", () => { expect(orderNumber(new Date(2026, 10, 14), 12345)).toBe("M212-DEMO-202611-12345"); });
  it("reseller commission excludes cancelled orders", () => {
    const o = db.get().orders[0]!;
    expect(commissionFor([{ ...o, subtotal: 100, discount: 0, status: "completed" }, { ...o, subtotal: 100, discount: 0, status: "cancelled" }], 0.2)).toBe(20);
  });
});

describe("form validators", () => {
  it("DNS records", () => {
    expect(validateDnsRecord({ type: "A", name: "@", value: "192.0.2.1", ttl: 3600 })).toBeNull();
    expect(validateDnsRecord({ type: "A", name: "@", value: "999.1.1.1", ttl: 3600 })).not.toBeNull();
    expect(validateDnsRecord({ type: "MX", name: "@", value: "mail.m212.ma", ttl: 3600 })).toContain("priority");
    expect(validateDnsRecord({ type: "CNAME", name: "www", value: "not a host", ttl: 3600 })).not.toBeNull();
    expect(validateDnsRecord({ type: "TXT", name: "@", value: "v=spf1", ttl: 30 })).toContain("TTL");
  });
  it("CMS slugs", () => { expect(validateSlug("about-us", [])).toBeNull(); expect(validateSlug("About Us", [])).not.toBeNull(); expect(validateSlug("admin", [])).toBe("This slug is reserved."); expect(validateSlug("x", ["x"])).toBe("Slug already used."); });
  it("block reordering", () => { expect(moveItem([1, 2, 3], 0, 1)).toEqual([2, 1, 3]); expect(moveItem([1, 2, 3], 0, -1)).toEqual([1, 2, 3]); });
  it("media file type and size", () => { expect(validateMediaFile({ type: "image/png", size: 1000 })).toBeNull(); expect(validateMediaFile({ type: "application/pdf", size: 10 })).not.toBeNull(); expect(validateMediaFile({ type: "image/png", size: 3 * 1024 * 1024 })).not.toBeNull(); });
  it("password policy", () => { expect(validatePassword("short")).not.toBeNull(); expect(validatePassword("alllowercase123")).not.toBeNull(); expect(validatePassword("Str0ngPassword")).toBeNull(); });
});
