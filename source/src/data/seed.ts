import type {
  ActivityLog, BlogPost, CmsPage, Coupon, Customer, DedicatedServer, Domain, HostingService, Invoice, Menu,
  Notification, Order, Payment, Reseller, ResellerPrice, Settings, Ticket, VPSService,
} from "@/types/models";
import { SEED_CATEGORIES, SEED_PRODUCTS, SEED_TLDS } from "./catalog";

export const DEMO_CUSTOMER_ID = "cus-1001";
export const DEMO_RESELLER_ID = "rsl-1";

const d = (iso: string) => new Date(iso).toISOString();

export const SEED_CUSTOMERS: Customer[] = [
  { id: DEMO_CUSTOMER_ID, name: "Yasmine Alaoui", email: "yasmine@atlas-demo.ma", company: "Atlas Studio (demo)", country: "MA", phone: "+212 600 000 001", status: "active", createdAt: d("2025-02-11") },
  { id: "cus-1002", name: "Karim Benali", email: "karim@demo-benali.ma", company: "Benali Négoce (demo)", country: "MA", status: "active", createdAt: d("2025-04-03") },
  { id: "cus-1003", name: "Claire Martin", email: "claire@demo-martin.fr", country: "FR", status: "active", createdAt: d("2025-06-21"), resellerId: DEMO_RESELLER_ID },
  { id: "cus-1004", name: "Omar Tazi", email: "omar@demo-tazi.ma", company: "Tazi Logistics (demo)", country: "MA", status: "pending", createdAt: d("2026-01-15"), resellerId: DEMO_RESELLER_ID },
  { id: "cus-1005", name: "Sara El Idrissi", email: "sara@demo-idrissi.ma", country: "MA", status: "suspended", createdAt: d("2025-09-30") },
];

export const SEED_DOMAINS: Domain[] = [
  { id: "dom-1", name: "atlas-studio.ma", customerId: DEMO_CUSTOMER_ID, registrar: "registrar-ma", registeredAt: d("2025-02-11"), expiresAt: d("2027-02-11"), autoRenew: true, locked: true, privacy: false,
    nameservers: ["ns1.m212.ma", "ns2.m212.ma"], status: "active",
    dns: [ { id: "r1", type: "A", name: "@", value: "192.0.2.10", ttl: 3600 }, { id: "r2", type: "CNAME", name: "www", value: "atlas-studio.ma", ttl: 3600 }, { id: "r3", type: "MX", name: "@", value: "mail.m212.ma", ttl: 3600, priority: 10 }, { id: "r4", type: "TXT", name: "@", value: "v=spf1 include:m212.ma ~all", ttl: 3600 } ],
    contact: { name: "Yasmine Alaoui", email: "yasmine@atlas-demo.ma", phone: "+212 600 000 001", address: "Casablanca, Morocco" } },
  { id: "dom-2", name: "atlasstudio.com", customerId: DEMO_CUSTOMER_ID, registrar: "registrar-a", registeredAt: d("2024-12-02"), expiresAt: d("2026-12-02"), autoRenew: false, locked: true, privacy: true,
    nameservers: ["ns1.m212.ma", "ns2.m212.ma"], status: "active", dns: [ { id: "r5", type: "A", name: "@", value: "192.0.2.10", ttl: 3600 } ],
    contact: { name: "Yasmine Alaoui", email: "yasmine@atlas-demo.ma", phone: "+212 600 000 001", address: "Casablanca, Morocco" } },
  { id: "dom-3", name: "atlas-shop.store", customerId: DEMO_CUSTOMER_ID, registrar: "registrar-b", registeredAt: d("2026-10-30"), expiresAt: d("2027-10-30"), autoRenew: true, locked: false, privacy: true,
    nameservers: ["ns1.external-demo.net", "ns2.external-demo.net"], status: "pending-transfer", dns: [],
    contact: { name: "Yasmine Alaoui", email: "yasmine@atlas-demo.ma", phone: "+212 600 000 001", address: "Casablanca, Morocco" } },
  { id: "dom-4", name: "benali-negoce.ma", customerId: "cus-1002", registrar: "registrar-ma", registeredAt: d("2025-04-03"), expiresAt: d("2026-04-03"), autoRenew: true, locked: true, privacy: false,
    nameservers: ["ns1.m212.ma", "ns2.m212.ma"], status: "active", dns: [], contact: { name: "Karim Benali", email: "karim@demo-benali.ma", phone: "", address: "Rabat" } },
];

export const SEED_HOSTING: HostingService[] = [
  { id: "hst-1", customerId: DEMO_CUSTOMER_ID, productId: "shared-business", domain: "atlas-studio.ma", plan: "Business", server: "web-cas-03 (demo)", status: "active",
    diskUsedGb: 21.4, diskLimitGb: 75, bandwidthUsedGb: 180, bandwidthLimitGb: 1000, php: "8.3", ssl: "active", renewsAt: d("2027-02-11"),
    ftpAccounts: [{ id: "f1", user: "deploy@atlas-studio.ma", path: "/public_html" }],
    databases: [{ id: "db1", name: "atlas_wp", sizeMb: 312 }, { id: "db2", name: "atlas_crm", sizeMb: 88 }],
    mailboxes: [{ id: "m1", address: "contact@atlas-studio.ma", quotaMb: 5120 }, { id: "m2", address: "yasmine@atlas-studio.ma", quotaMb: 10240 }],
    backups: [{ id: "b1", date: d("2026-11-13"), sizeMb: 2210 }, { id: "b2", date: d("2026-11-12"), sizeMb: 2198 }] },
  { id: "hst-2", customerId: DEMO_CUSTOMER_ID, productId: "wp-starter", domain: "atlasstudio.com", plan: "WP Starter", server: "wp-cas-01 (demo)", status: "active",
    diskUsedGb: 4.1, diskLimitGb: 20, bandwidthUsedGb: 22, bandwidthLimitGb: 250, php: "8.2", ssl: "pending", renewsAt: d("2026-12-02"),
    ftpAccounts: [], databases: [{ id: "db3", name: "wp_main", sizeMb: 120 }], mailboxes: [], backups: [{ id: "b3", date: d("2026-11-13"), sizeMb: 640 }] },
];

const hist = (seed: number) => Array.from({ length: 24 }, (_, i) => Math.round(25 + 20 * Math.sin((i + seed) / 3) + ((i * 7 + seed) % 11)));

export const SEED_VPS: VPSService[] = [
  { id: "vps-1", customerId: DEMO_CUSTOMER_ID, productId: "vps-linux-m", hostname: "app01.atlas-studio.ma", plan: "Linux VPS M", status: "running", os: "Ubuntu 24.04 LTS",
    vcpu: 4, ramGb: 8, storageGb: 160, ipv4: "192.0.2.44", ipv6: "2001:db8:212::44", datacenter: "Casablanca (demo)", managed: false,
    cpuHistory: hist(1), ramHistory: hist(5), renewsAt: d("2026-12-20"),
    firewall: [ { id: "fw1", port: "22", protocol: "TCP", source: "203.0.113.0/24", action: "allow" }, { id: "fw2", port: "443", protocol: "TCP", source: "0.0.0.0/0", action: "allow" } ],
    backups: [{ id: "vb1", date: d("2026-11-13"), sizeGb: 18 }] },
];

export const SEED_SERVERS: DedicatedServer[] = [
  { id: "srv-1", provider: "Colocation partner A (demo)", hostname: "web-cas-03", ip: "192.0.2.10", cpu: "EPYC 7443P", ramGb: 256, storage: "8 × 3.84 TB NVMe", os: "AlmaLinux 9", status: "online", load: 41 },
  { id: "srv-2", provider: "Colocation partner A (demo)", hostname: "wp-cas-01", ip: "192.0.2.11", cpu: "EPYC 7443P", ramGb: 256, storage: "8 × 3.84 TB NVMe", os: "AlmaLinux 9", status: "online", load: 63 },
  { id: "srv-3", provider: "Cloud partner B (demo)", hostname: "kvm-eu-07", ip: "198.51.100.7", cpu: "Xeon Gold 6338", ramGb: 512, storage: "Ceph pool", os: "Proxmox VE 8", status: "maintenance", load: 12 },
];

export const SEED_ORDERS: Order[] = [
  { id: "ord-1", number: "M212-DEMO-10021", customerId: DEMO_CUSTOMER_ID, customerName: "Yasmine Alaoui", customerEmail: "yasmine@atlas-demo.ma", date: d("2026-10-30"),
    items: [{ productId: "domain:.store", name: "atlas-shop.store — transfer", cycle: "1y", quantity: 1, unitPrice: 499 }], subtotal: 499, discount: 0, tax: 100, total: 599,
    paymentMethod: "bank-transfer", paymentStatus: "DEMO_PENDING", provisioningStatus: "NOT_CONNECTED", status: "pending", notes: "" },
  { id: "ord-2", number: "M212-DEMO-10007", customerId: DEMO_CUSTOMER_ID, customerName: "Yasmine Alaoui", customerEmail: "yasmine@atlas-demo.ma", date: d("2025-12-20"),
    items: [{ productId: "vps-linux-m", name: "Linux VPS M", cycle: "monthly", quantity: 1, unitPrice: 189 }], subtotal: 189, discount: 0, tax: 38, total: 227,
    paymentMethod: "bank-transfer", paymentStatus: "DEMO_PAID", provisioningStatus: "NOT_CONNECTED", status: "completed", notes: "Seed record" },
  { id: "ord-3", number: "M212-DEMO-10011", customerId: "cus-1002", customerName: "Karim Benali", customerEmail: "karim@demo-benali.ma", date: d("2026-04-03"),
    items: [{ productId: "shared-personal", name: "Personal hosting", cycle: "annually", quantity: 1, unitPrice: 378 }], subtotal: 378, discount: 38, tax: 68, total: 408, coupon: "WELCOME10",
    paymentMethod: "moroccan-provider", paymentStatus: "DEMO_PAID", provisioningStatus: "NOT_CONNECTED", status: "completed", notes: "" },
  { id: "ord-4", number: "M212-DEMO-10015", customerId: "cus-1003", customerName: "Claire Martin", customerEmail: "claire@demo-martin.fr", date: d("2026-07-09"),
    items: [{ productId: "wp-business", name: "WP Business", cycle: "annually", quantity: 1, unitPrice: 961 }], subtotal: 961, discount: 0, tax: 192, total: 1153,
    paymentMethod: "international-provider", paymentStatus: "DEMO_PAID", provisioningStatus: "NOT_CONNECTED", status: "completed", notes: "Via reseller" },
];

export const SEED_INVOICES: Invoice[] = [
  { id: "inv-1", number: "INV-DEMO-2026-0141", customerId: DEMO_CUSTOMER_ID, orderId: "ord-1", issuedAt: d("2026-10-30"), dueAt: d("2026-11-20"), lines: [{ description: "Domain transfer atlas-shop.store (1 year)", amount: 499 }], tax: 100, total: 599, status: "pending" },
  { id: "inv-2", number: "INV-DEMO-2026-0102", customerId: DEMO_CUSTOMER_ID, orderId: "ord-2", issuedAt: d("2026-10-20"), dueAt: d("2026-11-05"), lines: [{ description: "Linux VPS M — November 2026", amount: 189 }], tax: 38, total: 227, status: "overdue" },
  { id: "inv-3", number: "INV-DEMO-2026-0077", customerId: DEMO_CUSTOMER_ID, issuedAt: d("2026-02-11"), dueAt: d("2026-02-25"), lines: [{ description: "Business hosting — 12 months", amount: 745 }, { description: "atlas-studio.ma renewal", amount: 199 }], tax: 189, total: 1133, status: "demo-paid" },
  { id: "inv-4", number: "INV-DEMO-2026-0090", customerId: "cus-1002", orderId: "ord-3", issuedAt: d("2026-04-03"), dueAt: d("2026-04-17"), lines: [{ description: "Personal hosting — 12 months", amount: 340 }], tax: 68, total: 408, status: "demo-paid" },
];

export const SEED_PAYMENTS: Payment[] = [
  { id: "pay-1", invoiceId: "inv-3", customerId: DEMO_CUSTOMER_ID, date: d("2026-02-14"), amount: 1133, method: "bank-transfer", status: "demo-recorded" },
  { id: "pay-2", invoiceId: "inv-4", customerId: "cus-1002", date: d("2026-04-04"), amount: 408, method: "moroccan-provider", status: "demo-recorded" },
];

export const SEED_TICKETS: Ticket[] = [
  { id: "tic-1", number: "T-DEMO-5512", customerId: DEMO_CUSTOMER_ID, subject: "SSL pending on atlasstudio.com", department: "technical", priority: "medium", status: "answered", assignee: "Support (demo)",
    createdAt: d("2026-11-10"), updatedAt: d("2026-11-11"), messages: [
      { id: "m1", author: "Yasmine Alaoui", role: "customer", body: "The certificate for atlasstudio.com still shows pending. Can you check?", at: d("2026-11-10T09:12:00Z") },
      { id: "m2", author: "Support (demo)", role: "staff", body: "The domain's A record must point to the hosting server before issuance. Please update DNS and we will retry.", at: d("2026-11-11T08:40:00Z") },
      { id: "m3", author: "Support (demo)", role: "staff", body: "Internal: auto-SSL retry scheduled.", at: d("2026-11-11T08:41:00Z"), internal: true } ] },
  { id: "tic-2", number: "T-DEMO-5498", customerId: "cus-1002", subject: "Invoice copy request", department: "billing", priority: "low", status: "open", createdAt: d("2026-11-08"), updatedAt: d("2026-11-08"),
    messages: [{ id: "m4", author: "Karim Benali", role: "customer", body: "Could you send a copy of my April invoice with our ICE number?", at: d("2026-11-08T14:00:00Z") }] },
];

export const SEED_RESELLERS: Reseller[] = [
  { id: DEMO_RESELLER_ID, name: "Mehdi Ouazzani", email: "mehdi@demo-webagency.ma", company: "WebAgency Maroc (demo)", tier: "business", commissionRate: 0.2, status: "active",
    brand: { name: "WebAgency Cloud", color: "#1f6f50", supportEmail: "support@demo-webagency.ma", domain: "cloud.demo-webagency.ma" } },
  { id: "rsl-2", name: "Lina Haddad", email: "lina@demo-pixel.ma", company: "Pixel Lab (demo)", tier: "starter", commissionRate: 0.15, status: "pending",
    brand: { name: "Pixel Hosting", color: "#c8262f", supportEmail: "help@demo-pixel.ma", domain: "host.demo-pixel.ma" } },
];

export const SEED_RESELLER_PRICES: ResellerPrice[] = [
  { productId: "shared-starter", retail: 25 }, { productId: "shared-business", retail: 85 }, { productId: "wp-business", retail: 109 }, { productId: "vps-linux-s", retail: 129 },
];

const now = d("2026-11-01");
export const SEED_PAGES: CmsPage[] = [
  { id: "pg-1", title: "Hosting for Moroccan startups", slug: "startups", seoTitle: "Hosting for startups | M212.MA", seoDescription: "Launch on reliable infrastructure with M212.MA startup offers.", status: "published", publishAt: now, updatedAt: now,
    blocks: [
      { id: "b1", type: "hero", title: "Hosting for Moroccan startups", subtitle: "Ship faster with NVMe hosting, local support and simple pricing in MAD.", ctaLabel: "See VPS plans", ctaHref: "/vps" },
      { id: "b2", type: "features", items: ["Local support in French, Arabic and English", "Pricing in MAD, EUR or USD", "Upgrade from shared to VPS anytime"] },
      { id: "b3", type: "pricing", productIds: ["shared-business", "vps-linux-s", "vps-linux-m"] },
      { id: "b4", type: "faq", items: [{ q: "Is there a startup discount?", a: "Use the demo coupon STARTUP20 in this demonstration." }] },
      { id: "b5", type: "cta", title: "Talk to our team", ctaLabel: "Contact us", ctaHref: "/contact" } ] },
  { id: "pg-2", title: "Data centre partners", slug: "infrastructure", seoTitle: "Infrastructure | M212.MA", seoDescription: "How M212.MA works with infrastructure partners.", status: "draft", publishAt: now, updatedAt: now,
    blocks: [ { id: "b6", type: "heading", text: "Our infrastructure approach" }, { id: "b7", type: "text", text: "M212.MA works with colocation and cloud partners. This page is a draft." } ] },
];

export const SEED_POSTS: BlogPost[] = [
  { id: "post-1", title: "How to choose between shared hosting and a VPS", slug: "shared-vs-vps", category: "Guides", tags: ["hosting", "vps"], excerpt: "A practical checklist to decide when your website has outgrown shared hosting.",
    content: "Shared hosting is ideal when you run a few websites with predictable traffic.\n\nA VPS gives you dedicated resources and root access. Move when you need custom software, background workers, or consistent performance under load.\n\nStart small: every M212 plan can be upgraded.", seoTitle: "Shared hosting vs VPS | M212.MA Blog", seoDescription: "When to move from shared hosting to a VPS.", status: "published", publishedAt: d("2026-10-12"), author: "M212 Team" },
  { id: "post-2", title: "Registering a .ma domain: what you need", slug: "register-ma-domain", category: "Domains", tags: ["domains", ".ma"], excerpt: "Requirements and tips for registering a Moroccan .ma domain name.",
    content: "The .ma extension is managed by the Moroccan registry. Registry rules apply and may require supporting information.\n\nCheck your name, prepare your company details, and keep contact information accurate.", seoTitle: ".ma domain requirements | M212.MA Blog", seoDescription: "What you need to register a .ma domain.", status: "published", publishedAt: d("2026-09-02"), author: "M212 Team" },
  { id: "post-3", title: "Draft: email deliverability checklist", slug: "email-deliverability", category: "Email", tags: ["email", "dns"], excerpt: "SPF, DKIM and DMARC explained.", content: "Draft content.", seoTitle: "Email deliverability", seoDescription: "SPF, DKIM, DMARC.", status: "draft", publishedAt: d("2026-11-20"), author: "M212 Team" },
];

export const SEED_MENUS: Menu[] = [
  { id: "menu-footer", name: "Footer — Resources", location: "footer", items: [
    { id: "mi1", label: "Knowledgebase", href: "/knowledgebase" }, { id: "mi2", label: "Blog", href: "/blog" }, { id: "mi3", label: "Startups", href: "/p/startups" }, { id: "mi4", label: "Status (demo)", href: "/support" } ] },
  { id: "menu-header", name: "Header — Extra links", location: "header", items: [ { id: "mi5", label: "Cloud", href: "/cloud" } ] },
];

export const SEED_COUPONS: Coupon[] = [
  { id: "cp-1", code: "WELCOME10", type: "percent", value: 10, active: true, description: "10% off the first order (demo)" },
  { id: "cp-2", code: "STARTUP20", type: "percent", value: 20, active: true, description: "20% off for startups (demo)" },
  { id: "cp-3", code: "MAD100", type: "fixed", value: 100, active: true, description: "100 MAD off orders (demo)" },
  { id: "cp-4", code: "EXPIRED5", type: "percent", value: 5, active: false, description: "Inactive coupon (demo)" },
];

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: "n1", customerId: DEMO_CUSTOMER_ID, title: "Invoice overdue", body: "INV-DEMO-2026-0102 is past its due date.", at: d("2026-11-06"), read: false },
  { id: "n2", customerId: DEMO_CUSTOMER_ID, title: "Domain renewal soon", body: "atlasstudio.com expires on 2 Dec 2026 and auto-renew is off.", at: d("2026-11-02"), read: false },
  { id: "n3", customerId: DEMO_CUSTOMER_ID, title: "Ticket answered", body: "Support replied to T-DEMO-5512.", at: d("2026-11-11"), read: true },
];

export const SEED_ACTIVITY: ActivityLog[] = [
  { id: "a1", at: d("2026-11-11T08:40:00Z"), actor: "Support (demo)", action: "ticket.reply", target: "T-DEMO-5512" },
  { id: "a2", at: d("2026-10-30T10:00:00Z"), actor: "Yasmine Alaoui", action: "order.create", target: "M212-DEMO-10021" },
  { id: "a3", at: d("2026-10-01T12:00:00Z"), actor: "Admin (demo)", action: "settings.update", target: "tax" },
];

export const SEED_SETTINGS: Settings = {
  company: { name: "M212.MA", legalName: "M212 SARL (placeholder)", email: "contact@m212.ma", phone: "+212 5 00 00 00 00 (placeholder)", address: "Casablanca, Morocco", ice: "ICE placeholder" },
  brand: { primaryColor: "#1b2a44", tagline: "Domains, hosting and cloud infrastructure" },
  languages: ["en", "fr"], defaultLocale: "en",
  currencies: ["MAD", "EUR", "USD"], defaultCurrency: "MAD", rates: { MAD: 1, EUR: 0.092, USD: 0.1 },
  taxRate: 0.2, taxLabel: "VAT (demo assumption 20%)",
  email: { provider: "Not connected", fromAddress: "no-reply@m212.ma" },
  payment: { bankTransfer: true, cardPlaceholder: true, moroccanProvider: true, internationalProvider: true, bankDetails: "Bank details placeholder — configure before launch" },
  registrars: [ { id: "registrar-a", name: "Registrar adapter A", enabled: false, sandbox: true }, { id: "registrar-b", name: "Registrar adapter B", enabled: false, sandbox: true }, { id: "registrar-ma", name: ".ma registrar adapter", enabled: false, sandbox: true } ],
  security: { mfaRequiredForAdmins: true, sessionMinutes: 30, ipAllowlist: "" },
  seo: { defaultTitle: "M212.MA | Domains, hosting and cloud infrastructure", defaultDescription: "Domain names, web hosting, VPS, dedicated servers, SSL and business email.", ogImage: "https://m212.ma/og-image.png" },
};

export function createSeed() {
  return structuredClone({
    products: SEED_PRODUCTS, categories: SEED_CATEGORIES, tlds: SEED_TLDS, customers: SEED_CUSTOMERS, domains: SEED_DOMAINS,
    hosting: SEED_HOSTING, vps: SEED_VPS, servers: SEED_SERVERS, orders: SEED_ORDERS, invoices: SEED_INVOICES, payments: SEED_PAYMENTS,
    tickets: SEED_TICKETS, resellers: SEED_RESELLERS, resellerPrices: SEED_RESELLER_PRICES, pages: SEED_PAGES, posts: SEED_POSTS,
    menus: SEED_MENUS, media: [] as import("@/types/models").MediaItem[], coupons: SEED_COUPONS, notifications: SEED_NOTIFICATIONS,
    activity: SEED_ACTIVITY as ActivityLog[], settings: SEED_SETTINGS,
  });
}
export type Db = ReturnType<typeof createSeed>;
