import type { Category, Product, Tld } from "@/types/models";

const all: Product["cycles"] = ["monthly", "quarterly", "annually", "biennially"];
const yearly: Product["cycles"] = ["annually", "biennially"];

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-shared", name: "Shared hosting", slug: "hosting/shared", order: 1, description: "cPanel-style shared web hosting" },
  { id: "cat-wordpress", name: "WordPress hosting", slug: "hosting/wordpress", order: 2, description: "Managed WordPress plans" },
  { id: "cat-reseller", name: "Reseller hosting", slug: "hosting/reseller", order: 3, description: "White-label hosting for agencies" },
  { id: "cat-vps", name: "VPS", slug: "vps", order: 4, description: "Linux and Windows virtual servers" },
  { id: "cat-dedicated", name: "Dedicated servers", slug: "dedicated-servers", order: 5, description: "Bare-metal servers" },
  { id: "cat-ssl", name: "SSL certificates", slug: "ssl", order: 6, description: "DV, OV, EV, wildcard and multi-domain" },
  { id: "cat-email", name: "Business email", slug: "business-email", order: 7, description: "Professional mailboxes" },
];

export const SEED_PRODUCTS: Product[] = [
  // Shared
  { id: "shared-starter", type: "shared", categoryId: "cat-shared", name: "Starter", tagline: { en: "One website, everything included.", fr: "Un site, tout compris." }, priceMonthly: 19, cycles: all,
    specs: { Websites: "1", Storage: "10 GB NVMe", Bandwidth: "100 GB", Email: "5 mailboxes", Databases: "2" }, features: ["Free SSL", "Weekly backups", "1-click installer"], visible: true, featured: false },
  { id: "shared-personal", type: "shared", categoryId: "cat-shared", name: "Personal", tagline: { en: "For blogs and portfolios.", fr: "Pour blogs et portfolios." }, priceMonthly: 35, cycles: all,
    specs: { Websites: "3", Storage: "30 GB NVMe", Bandwidth: "Unmetered*", Email: "20 mailboxes", Databases: "10" }, features: ["Free SSL", "Daily backups", "1-click installer", "Free .ma domain 1st year"], visible: true, featured: false },
  { id: "shared-business", type: "shared", categoryId: "cat-shared", name: "Business", tagline: { en: "For growing companies.", fr: "Pour les entreprises en croissance." }, priceMonthly: 69, cycles: all,
    specs: { Websites: "10", Storage: "75 GB NVMe", Bandwidth: "Unmetered*", Email: "Unlimited", Databases: "Unlimited" }, features: ["Free SSL", "Daily backups", "Staging", "Priority support", "Free domain 1st year"], visible: true, featured: true, badge: "Most chosen" },
  { id: "shared-premium", type: "shared", categoryId: "cat-shared", name: "Premium", tagline: { en: "Maximum resources on shared.", fr: "Ressources maximales en mutualisé." }, priceMonthly: 109, cycles: all,
    specs: { Websites: "Unlimited", Storage: "150 GB NVMe", Bandwidth: "Unmetered*", Email: "Unlimited", Databases: "Unlimited" }, features: ["Free SSL", "Hourly snapshots", "Staging", "Dedicated IP", "Priority support"], visible: true, featured: false },
  // WordPress
  { id: "wp-starter", type: "wordpress", categoryId: "cat-wordpress", name: "WP Starter", tagline: { en: "A tuned home for one WordPress site.", fr: "Un hébergement optimisé pour un site WordPress." }, priceMonthly: 39, cycles: all,
    specs: { Sites: "1", Storage: "20 GB NVMe", Visits: "~25k / month", Cache: "Server-level", Staging: "No" }, features: ["Auto core updates", "Malware scan", "Free SSL"], visible: true, featured: false },
  { id: "wp-business", type: "wordpress", categoryId: "cat-wordpress", name: "WP Business", tagline: { en: "WooCommerce-ready performance.", fr: "Performances prêtes pour WooCommerce." }, priceMonthly: 89, cycles: all,
    specs: { Sites: "5", Storage: "60 GB NVMe", Visits: "~100k / month", Cache: "Server + object cache", Staging: "Yes" }, features: ["Auto plugin updates", "Malware removal", "Free SSL", "Staging"], visible: true, featured: true, badge: "Best for shops" },
  { id: "wp-professional", type: "wordpress", categoryId: "cat-wordpress", name: "WP Professional", tagline: { en: "For agencies and high-traffic sites.", fr: "Pour agences et sites à fort trafic." }, priceMonthly: 169, cycles: all,
    specs: { Sites: "20", Storage: "150 GB NVMe", Visits: "~400k / month", Cache: "Server + object + edge", Staging: "Yes" }, features: ["Everything in Business", "Dedicated PHP workers", "Priority support"], visible: true, featured: false },
  // Reseller
  { id: "res-starter", type: "reseller-hosting", categoryId: "cat-reseller", name: "Reseller Starter", tagline: { en: "Start your hosting brand.", fr: "Lancez votre marque d'hébergement." }, priceMonthly: 149, cycles: all,
    specs: { Accounts: "25 cPanel-style", Storage: "100 GB NVMe", Bandwidth: "1 TB", "White label": "Yes" }, features: ["Private nameservers", "Billing portal access", "Wholesale domains"], visible: true, featured: false },
  { id: "res-business", type: "reseller-hosting", categoryId: "cat-reseller", name: "Reseller Business", tagline: { en: "For established agencies.", fr: "Pour les agences établies." }, priceMonthly: 289, cycles: all,
    specs: { Accounts: "75", Storage: "250 GB NVMe", Bandwidth: "3 TB", "White label": "Yes" }, features: ["Private nameservers", "Free SSL for all clients", "Priority support"], visible: true, featured: true, badge: "Agency favourite" },
  { id: "res-enterprise", type: "reseller-hosting", categoryId: "cat-reseller", name: "Reseller Enterprise", tagline: { en: "Scale without limits.", fr: "Évoluez sans limites." }, priceMonthly: 549, cycles: all,
    specs: { Accounts: "Unlimited", Storage: "600 GB NVMe", Bandwidth: "Unmetered*", "White label": "Yes" }, features: ["Dedicated IP pool", "Account manager", "Custom wholesale pricing"], visible: true, featured: false },
  // VPS
  { id: "vps-linux-s", type: "vps", categoryId: "cat-vps", name: "Linux VPS S", tagline: { en: "Unmanaged Linux, full root.", fr: "Linux non géré, accès root." }, priceMonthly: 99, cycles: all,
    specs: { vCPU: "2", RAM: "4 GB", Storage: "80 GB NVMe", Bandwidth: "4 TB", IP: "1 IPv4 + /64 IPv6", OS: "Linux" }, features: ["Root access", "Snapshots", "DDoS filtering"], visible: true, featured: false },
  { id: "vps-linux-m", type: "vps", categoryId: "cat-vps", name: "Linux VPS M", tagline: { en: "Balanced compute for apps.", fr: "Puissance équilibrée pour vos applications." }, priceMonthly: 189, cycles: all,
    specs: { vCPU: "4", RAM: "8 GB", Storage: "160 GB NVMe", Bandwidth: "8 TB", IP: "1 IPv4 + /64 IPv6", OS: "Linux" }, features: ["Root access", "Snapshots", "DDoS filtering"], visible: true, featured: true, badge: "Popular" },
  { id: "vps-windows", type: "vps", categoryId: "cat-vps", name: "Windows VPS", tagline: { en: "Windows Server with RDP.", fr: "Windows Server avec RDP." }, priceMonthly: 259, cycles: all,
    specs: { vCPU: "4", RAM: "8 GB", Storage: "160 GB NVMe", Bandwidth: "8 TB", IP: "1 IPv4", OS: "Windows Server 2022" }, features: ["Licence included", "RDP access", "Snapshots"], visible: true, featured: false },
  { id: "vps-managed", type: "vps", categoryId: "cat-vps", name: "Managed VPS", tagline: { en: "We run the server, you run the business.", fr: "Nous gérons le serveur, vous gérez votre activité." }, priceMonthly: 449, cycles: all,
    specs: { vCPU: "6", RAM: "16 GB", Storage: "320 GB NVMe", Bandwidth: "10 TB", IP: "2 IPv4", OS: "AlmaLinux / Ubuntu" }, features: ["OS patching", "Monitoring 24/7", "Daily backups", "Control panel"], visible: true, featured: false },
  // Dedicated
  { id: "ded-entry", type: "dedicated", categoryId: "cat-dedicated", name: "Entry", tagline: { en: "Bare metal for steady workloads.", fr: "Bare metal pour charges régulières." }, priceMonthly: 990, cycles: ["monthly", "annually"],
    specs: { CPU: "Intel Xeon E-2386G · 6c/12t", RAM: "32 GB ECC", Storage: "2 × 512 GB NVMe", Network: "1 Gbps", IPMI: "Yes" }, features: ["Hardware replacement", "Remote reboot"], visible: true, featured: false },
  { id: "ded-pro", type: "dedicated", categoryId: "cat-dedicated", name: "Professional", tagline: { en: "For databases and busy apps.", fr: "Pour bases de données et applis chargées." }, priceMonthly: 1890, cycles: ["monthly", "annually"],
    specs: { CPU: "AMD EPYC 4344P · 8c/16t", RAM: "64 GB ECC", Storage: "2 × 1.92 TB NVMe", Network: "1 Gbps", IPMI: "Yes" }, features: ["Hardware replacement", "Remote reboot", "Backup space 500 GB"], visible: true, featured: true, badge: "Recommended" },
  { id: "ded-enterprise", type: "dedicated", categoryId: "cat-dedicated", name: "Enterprise", tagline: { en: "High-core compute and storage.", fr: "Calcul et stockage haute capacité." }, priceMonthly: 3990, cycles: ["monthly", "annually"],
    specs: { CPU: "AMD EPYC 9354P · 32c/64t", RAM: "256 GB ECC", Storage: "4 × 3.84 TB NVMe", Network: "10 Gbps", IPMI: "Yes" }, features: ["Hardware replacement", "Private VLAN", "Backup space 2 TB"], visible: true, featured: false },
  // SSL
  { id: "ssl-dv", type: "ssl", categoryId: "cat-ssl", name: "Domain Validation (DV)", tagline: { en: "Encrypt a website in minutes.", fr: "Chiffrez un site en quelques minutes." }, priceMonthly: 12, cycles: yearly,
    specs: { Validation: "Domain", Issuance: "Minutes", Domains: "1", Warranty: "Issuer dependent" }, features: ["Padlock in browsers", "Automated issuance"], visible: true, featured: false },
  { id: "ssl-ov", type: "ssl", categoryId: "cat-ssl", name: "Organization Validation (OV)", tagline: { en: "Shows your verified organization.", fr: "Affiche votre organisation vérifiée." }, priceMonthly: 59, cycles: yearly,
    specs: { Validation: "Organization", Issuance: "1–3 days", Domains: "1", Warranty: "Issuer dependent" }, features: ["Company details in certificate", "Business verification"], visible: true, featured: true, badge: "For companies" },
  { id: "ssl-ev", type: "ssl", categoryId: "cat-ssl", name: "Extended Validation (EV)", tagline: { en: "The highest validation level.", fr: "Le niveau de validation le plus élevé." }, priceMonthly: 129, cycles: yearly,
    specs: { Validation: "Extended", Issuance: "3–7 days", Domains: "1", Warranty: "Issuer dependent" }, features: ["Strict identity checks", "For finance and e-commerce"], visible: true, featured: false },
  { id: "ssl-wildcard", type: "ssl", categoryId: "cat-ssl", name: "Wildcard SSL", tagline: { en: "Every subdomain covered.", fr: "Tous vos sous-domaines couverts." }, priceMonthly: 79, cycles: yearly,
    specs: { Validation: "Domain", Issuance: "Minutes", Domains: "*.yourdomain", Warranty: "Issuer dependent" }, features: ["Unlimited subdomains"], visible: true, featured: false },
  { id: "ssl-multi", type: "ssl", categoryId: "cat-ssl", name: "Multi-domain SSL", tagline: { en: "Up to 25 domains, one certificate.", fr: "Jusqu'à 25 domaines, un certificat." }, priceMonthly: 99, cycles: yearly,
    specs: { Validation: "Domain or Org", Issuance: "Minutes–3 days", Domains: "Up to 25 SANs", Warranty: "Issuer dependent" }, features: ["SAN certificate", "Add domains later"], visible: true, featured: false },
  // Email
  { id: "mail-single", type: "email", categoryId: "cat-email", name: "Mailbox", tagline: { en: "One professional address.", fr: "Une adresse professionnelle." }, priceMonthly: 15, cycles: all,
    specs: { Mailboxes: "1", Storage: "10 GB", "Spam filter": "Yes", Webmail: "Yes" }, features: ["IMAP / SMTP", "Calendar & contacts"], visible: true, featured: false },
  { id: "mail-team", type: "email", categoryId: "cat-email", name: "Business Team", tagline: { en: "Email for small teams.", fr: "La messagerie des petites équipes." }, priceMonthly: 59, cycles: all,
    specs: { Mailboxes: "5", Storage: "25 GB each", "Spam filter": "Advanced", Webmail: "Yes" }, features: ["Shared calendars", "Aliases", "Mobile sync"], visible: true, featured: true, badge: "Best value" },
  { id: "mail-pro", type: "email", categoryId: "cat-email", name: "Business Pro", tagline: { en: "For whole organizations.", fr: "Pour toute l'organisation." }, priceMonthly: 189, cycles: all,
    specs: { Mailboxes: "25", Storage: "50 GB each", "Spam filter": "Advanced + quarantine", Webmail: "Yes" }, features: ["Archiving", "Shared mailboxes", "Admin console"], visible: true, featured: false },
  // Cloud
  { id: "cloud-object", type: "cloud", categoryId: "cat-vps", name: "Object Storage", tagline: { en: "S3-compatible storage, billed per TB.", fr: "Stockage compatible S3, facturé au To." }, priceMonthly: 79, cycles: ["monthly"],
    specs: { Capacity: "1 TB", Egress: "1 TB included", API: "S3-compatible" }, features: ["Versioning", "Lifecycle rules"], visible: true, featured: false },
];

export const SEED_TLDS: Tld[] = [
  { tld: ".com", register: 119, renew: 139, transfer: 129, privacy: true, registrar: "registrar-a" },
  { tld: ".ma", register: 199, renew: 199, transfer: 199, restricted: "Moroccan presence or trademark recommended; registry rules apply (ANRT).", privacy: false, registrar: "registrar-ma" },
  { tld: ".net", register: 139, renew: 159, transfer: 149, privacy: true, registrar: "registrar-a" },
  { tld: ".org", register: 129, renew: 149, transfer: 139, privacy: true, registrar: "registrar-a" },
  { tld: ".info", register: 49, renew: 229, transfer: 199, promo: 29, privacy: true, registrar: "registrar-b" },
  { tld: ".biz", register: 159, renew: 179, transfer: 169, privacy: true, registrar: "registrar-b" },
  { tld: ".co", register: 279, renew: 319, transfer: 299, privacy: true, registrar: "registrar-b" },
  { tld: ".io", register: 449, renew: 499, transfer: 479, privacy: true, registrar: "registrar-b" },
  { tld: ".dev", register: 169, renew: 179, transfer: 179, restricted: "HTTPS is required (HSTS preloaded TLD).", privacy: true, registrar: "registrar-a" },
  { tld: ".app", register: 189, renew: 199, transfer: 199, restricted: "HTTPS is required (HSTS preloaded TLD).", privacy: true, registrar: "registrar-a" },
  { tld: ".shop", register: 39, renew: 389, transfer: 359, promo: 25, privacy: true, registrar: "registrar-b" },
  { tld: ".online", register: 35, renew: 369, transfer: 349, promo: 19, privacy: true, registrar: "registrar-b" },
  { tld: ".site", register: 29, renew: 329, transfer: 319, privacy: true, registrar: "registrar-b" },
  { tld: ".store", register: 49, renew: 529, transfer: 499, privacy: true, registrar: "registrar-b" },
  { tld: ".tech", register: 69, renew: 549, transfer: 529, privacy: true, registrar: "registrar-b" },
  { tld: ".cloud", register: 99, renew: 239, transfer: 229, privacy: true, registrar: "registrar-b" },
];
