export type Locale = "en" | "fr";
export type Currency = "MAD" | "EUR" | "USD";
export type Localized = { en: string; fr: string };
export type BillingCycle = "monthly" | "quarterly" | "annually" | "biennially";
export type Role = "guest" | "customer" | "reseller" | "admin";

export type ProductType =
  | "shared" | "wordpress" | "reseller-hosting" | "vps" | "dedicated" | "ssl" | "email" | "cloud";

export interface Product {
  id: string;
  type: ProductType;
  categoryId: string;
  name: string;
  tagline: Localized;
  /** Monthly base price in MAD (excl. tax). */
  priceMonthly: number;
  cycles: BillingCycle[];
  specs: Record<string, string>;
  features: string[];
  visible: boolean;
  featured: boolean;
  badge?: string;
}

export interface Category { id: string; name: string; slug: string; order: number; description: string }

export interface Tld {
  tld: string;
  register: number;
  renew: number;
  transfer: number;
  promo?: number;
  restricted?: string;
  privacy: boolean;
  registrar: string;
}

export interface Customer {
  id: string; name: string; email: string; company?: string; country: string; phone?: string;
  status: "active" | "suspended" | "pending"; createdAt: string; resellerId?: string;
}

export interface DnsRecord { id: string; type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS"; name: string; value: string; ttl: number; priority?: number }

export interface Domain {
  id: string; name: string; customerId: string; registrar: string; registeredAt: string; expiresAt: string;
  autoRenew: boolean; locked: boolean; privacy: boolean; nameservers: string[]; dns: DnsRecord[];
  status: "active" | "pending-transfer" | "expired" | "demo-pending";
  contact: { name: string; email: string; phone: string; address: string };
}

export interface HostingService {
  id: string; customerId: string; productId: string; domain: string; plan: string; server: string;
  status: "active" | "suspended" | "pending"; diskUsedGb: number; diskLimitGb: number; bandwidthUsedGb: number; bandwidthLimitGb: number;
  ftpAccounts: { id: string; user: string; path: string }[];
  databases: { id: string; name: string; sizeMb: number }[];
  mailboxes: { id: string; address: string; quotaMb: number }[];
  backups: { id: string; date: string; sizeMb: number }[];
  ssl: "active" | "pending" | "none"; php: string; renewsAt: string;
}

export interface FirewallRule { id: string; port: string; protocol: "TCP" | "UDP"; source: string; action: "allow" | "deny" }

export interface VPSService {
  id: string; customerId: string; productId: string; hostname: string; plan: string; status: "running" | "stopped" | "rebooting";
  os: string; vcpu: number; ramGb: number; storageGb: number; ipv4: string; ipv6: string; datacenter: string;
  managed: boolean; cpuHistory: number[]; ramHistory: number[]; firewall: FirewallRule[]; backups: { id: string; date: string; sizeGb: number }[];
  renewsAt: string;
}

export interface DedicatedServer {
  id: string; provider: string; hostname: string; ip: string; cpu: string; ramGb: number; storage: string; os: string;
  status: "online" | "maintenance" | "offline"; customerId?: string; load: number;
}

export interface OrderItem { productId: string; name: string; cycle: BillingCycle | "1y" | "2y" | "3y"; quantity: number; unitPrice: number; meta?: string }

export interface Order {
  id: string; number: string; customerId: string; customerName: string; customerEmail: string; date: string;
  items: OrderItem[]; subtotal: number; discount: number; tax: number; total: number; coupon?: string;
  paymentMethod: string; paymentStatus: "DEMO_PENDING" | "DEMO_PAID" | "CANCELLED";
  provisioningStatus: "NOT_CONNECTED"; status: "pending" | "processing" | "completed" | "cancelled"; notes: string;
  billingAddress?: { line1: string; city: string; country: string; postcode: string };
}

export interface Invoice {
  id: string; number: string; customerId: string; orderId?: string; issuedAt: string; dueAt: string;
  lines: { description: string; amount: number }[]; tax: number; total: number; status: "pending" | "demo-paid" | "overdue" | "cancelled";
}

export interface Payment { id: string; invoiceId: string; customerId: string; date: string; amount: number; method: string; status: "demo-recorded" | "demo-refunded" }

export interface TicketMessage { id: string; author: string; role: "customer" | "staff"; body: string; at: string; internal?: boolean }

export interface Ticket {
  id: string; number: string; customerId: string; subject: string; department: "sales" | "technical" | "billing" | "abuse";
  priority: "low" | "medium" | "high" | "urgent"; status: "open" | "answered" | "customer-reply" | "closed";
  assignee?: string; createdAt: string; updatedAt: string; messages: TicketMessage[];
}

export interface Reseller {
  id: string; name: string; email: string; company: string; tier: "starter" | "business" | "enterprise";
  commissionRate: number; status: "active" | "pending"; brand: { name: string; color: string; supportEmail: string; domain: string };
}

export interface ResellerPrice { productId: string; retail: number }

export type CmsBlock =
  | { id: string; type: "hero"; title: string; subtitle: string; ctaLabel: string; ctaHref: string }
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "image"; src: string; alt: string }
  | { id: string; type: "image-text"; src: string; alt: string; text: string }
  | { id: string; type: "features"; items: string[] }
  | { id: string; type: "pricing"; productIds: string[] }
  | { id: string; type: "faq"; items: { q: string; a: string }[] }
  | { id: string; type: "cta"; title: string; ctaLabel: string; ctaHref: string }
  | { id: string; type: "testimonials"; items: { quote: string; author: string }[] }
  | { id: string; type: "contact"; email: string; phone: string };

export type CmsBlockType = CmsBlock["type"];

export interface CmsPage {
  id: string; title: string; slug: string; seoTitle: string; seoDescription: string; featuredImage?: string;
  status: "draft" | "published"; publishAt: string; blocks: CmsBlock[]; updatedAt: string;
}

export interface BlogPost {
  id: string; title: string; slug: string; category: string; tags: string[]; featuredImage?: string; excerpt: string; content: string;
  seoTitle: string; seoDescription: string; status: "draft" | "published"; publishedAt: string; author: string;
}

export interface MenuItem { id: string; label: string; href: string }
export interface Menu { id: string; name: string; location: "header" | "footer" | "none"; items: MenuItem[] }
export interface MediaItem { id: string; name: string; type: string; size: number; createdAt: string }

export interface Coupon { id: string; code: string; type: "percent" | "fixed"; value: number; active: boolean; expiresAt?: string; description: string }

export interface Notification { id: string; customerId: string; title: string; body: string; at: string; read: boolean }
export interface ActivityLog { id: string; at: string; actor: string; action: string; target: string }

export interface Settings {
  company: { name: string; legalName: string; email: string; phone: string; address: string; ice: string };
  brand: { primaryColor: string; tagline: string };
  languages: Locale[]; defaultLocale: Locale;
  currencies: Currency[]; defaultCurrency: Currency; rates: Record<Currency, number>;
  taxRate: number; taxLabel: string;
  email: { provider: string; fromAddress: string };
  payment: { bankTransfer: boolean; cardPlaceholder: boolean; moroccanProvider: boolean; internationalProvider: boolean; bankDetails: string };
  registrars: { id: string; name: string; enabled: boolean; sandbox: boolean }[];
  security: { mfaRequiredForAdmins: boolean; sessionMinutes: number; ipAllowlist: string };
  seo: { defaultTitle: string; defaultDescription: string; ogImage: string };
}
