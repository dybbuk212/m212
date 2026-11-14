import { useNavigate } from "@tanstack/react-router";
import { Check, Cpu, HardDrive, Mail, Server, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Alert, Badge, Button, ButtonLink, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { useI18n, useMoney } from "@/lib/i18n";
import { cyclePrice, CYCLE_MONTHS } from "@/lib/pricing";
import { useSeo } from "@/lib/seo";
import { db, uid, useDb } from "@/lib/store";
import { validateEmail } from "@/lib/auth";
import type { BillingCycle, Product, ProductType } from "@/types/models";
import { addProductToCart, ComparisonTable, CyclePicker, Faq, PageHero, PlanGrid, PriceFrom, Section, SectionHeading, ServerVisual } from "./shared";

function useProducts(type: ProductType, filter?: (p: Product) => boolean) {
  return useDb().products.filter((p) => p.type === type && p.visible && (!filter || filter(p)));
}

function ProductLanding({ path, seoTitle, seoDescription, eyebrow, title, body, products, faq, children, aside }: {
  path: string; seoTitle: string; seoDescription: string; eyebrow: string; title: string; body: string; products: Product[]; faq: { q: string; a: string }[]; children?: ReactNode; aside?: ReactNode;
}) {
  useSeo({ title: seoTitle, description: seoDescription, path });
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} body={body} aside={aside}>
        {products.length > 0 && <PriceFrom mad={Math.min(...products.map((p) => p.priceMonthly))} />}
      </PageHero>
      {products.length > 0 && <Section><PlanGrid products={products} /></Section>}
      {children}
      {products.length > 1 && <Section><ComparisonTable products={products} /></Section>}
      <Section><Faq items={faq} /></Section>
    </>
  );
}

const Points = ({ items }: { items: { icon: typeof Cpu; title: string; body: string }[] }) => (
  <Section className="grid gap-6 md:grid-cols-3">
    {items.map((x) => <Card key={x.title} className="p-6"><x.icon className="h-6 w-6 text-brand-red" aria-hidden /><h2 className="mt-3 text-lg font-extrabold">{x.title}</h2><p className="mt-1 text-sm text-muted-foreground">{x.body}</p></Card>)}
  </Section>
);

export function HostingOverviewPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  const data = useDb();
  useSeo({ title: fr ? "Hébergement web" : "Web hosting", description: fr ? "Hébergement mutualisé, WordPress et revendeur sur stockage NVMe." : "Shared, WordPress and reseller hosting on NVMe storage.", path: "/hosting" });
  const lines = [
    { to: "/hosting/shared" as const, title: fr ? "Mutualisé" : "Shared hosting", body: fr ? "Pour sites vitrines, blogs et petites boutiques." : "For brochure sites, blogs and small shops.", type: "shared" },
    { to: "/hosting/wordpress" as const, title: "WordPress", body: fr ? "Optimisé, mis à jour et sécurisé pour WordPress." : "Tuned, updated and secured for WordPress.", type: "wordpress" },
    { to: "/hosting/reseller" as const, title: fr ? "Revendeur" : "Reseller", body: fr ? "Revendez l'hébergement sous votre marque." : "Resell hosting under your own brand.", type: "reseller-hosting" },
  ];
  return (
    <>
      <PageHero eyebrow={fr ? "Hébergement" : "Hosting"} title={fr ? "L'hébergement adapté à chaque projet" : "Hosting for every kind of project"} body={fr ? "Choisissez la formule ; vous pourrez évoluer à tout moment." : "Pick the right family — you can move up at any time."} aside={<ServerVisual />} />
      <Section className="grid gap-6 md:grid-cols-3">
        {lines.map((l) => (
          <Card key={l.to} className="flex flex-col p-6">
            <h2 className="text-xl font-extrabold">{l.title}</h2><p className="mt-1 flex-1 text-sm text-muted-foreground">{l.body}</p>
            <div className="mt-4"><PriceFrom mad={Math.min(...data.products.filter((p) => p.type === l.type).map((p) => p.priceMonthly))} /></div>
            <ButtonLink to={l.to} className="mt-4" variant="outline">{fr ? "Voir les offres" : "View plans"}</ButtonLink>
          </Card>
        ))}
      </Section>
    </>
  );
}

export function SharedHostingPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  return <ProductLanding path="/hosting/shared" seoTitle={fr ? "Hébergement mutualisé" : "Shared web hosting"} seoDescription={fr ? "Hébergement mutualisé NVMe avec SSL gratuit, emails et sauvegardes." : "NVMe shared hosting with free SSL, email and backups."}
    eyebrow={fr ? "Hébergement mutualisé" : "Shared hosting"} title={fr ? "Votre site en ligne, simplement" : "Get your website online, simply"} body={fr ? "Panneau de contrôle, installateur en un clic, emails et SSL inclus." : "Control panel, one-click installer, email and SSL included."}
    products={useProducts("shared")} faq={[
      { q: fr ? "Puis-je héberger plusieurs sites ?" : "Can I host several websites?", a: fr ? "Oui à partir de l'offre Personal." : "Yes, from the Personal plan upwards." },
      { q: fr ? "Que signifie « non mesurée » ?" : "What does “unmetered” mean?", a: fr ? "Pas de quota fixe, sous réserve d'une utilisation raisonnable décrite dans nos conditions." : "No fixed quota, subject to the fair-use policy in our terms." },
      { q: fr ? "Migrez-vous mon site ?" : "Do you migrate my site?", a: fr ? "Une migration assistée est prévue ; elle n'est pas opérée dans cette démonstration." : "Assisted migration is planned; it is not performed in this demonstration." } ]}>
    <Points items={[{ icon: HardDrive, title: "NVMe", body: fr ? "Stockage rapide pour des pages qui s'affichent vite." : "Fast storage for fast-loading pages." }, { icon: ShieldCheck, title: "SSL", body: fr ? "Certificat gratuit installé automatiquement." : "Free certificate installed automatically." }, { icon: Mail, title: "Email", body: fr ? "Boîtes mail sur votre domaine." : "Mailboxes on your own domain." }]} />
  </ProductLanding>;
}

export function WordpressHostingPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  return <ProductLanding path="/hosting/wordpress" seoTitle={fr ? "Hébergement WordPress géré" : "Managed WordPress hosting"} seoDescription={fr ? "WordPress rapide et sécurisé : cache serveur, mises à jour et staging." : "Fast, secure WordPress with server caching, updates and staging."}
    eyebrow="WordPress" title={fr ? "WordPress, sans la maintenance" : "WordPress without the maintenance"} body={fr ? "Mises à jour automatiques, cache serveur, scan de malware et environnement de test." : "Automatic updates, server caching, malware scanning and staging."}
    products={useProducts("wordpress")} faq={[
      { q: "WooCommerce?", a: fr ? "WP Business et WP Professional sont dimensionnés pour WooCommerce." : "WP Business and WP Professional are sized for WooCommerce." },
      { q: fr ? "Qu'est-ce que le staging ?" : "What is staging?", a: fr ? "Une copie de votre site pour tester avant de publier." : "A copy of your site to test changes before publishing." } ]}>
    <Section><Card className="grid gap-6 p-8 md:grid-cols-4">{["PHP 8.3 + OPcache", "Object cache", fr ? "Mises à jour plugins" : "Plugin auto-updates", fr ? "Restauration 1 clic" : "One-click restore"].map((x) => <p key={x} className="flex items-center gap-2 font-semibold"><Check className="h-4 w-4 text-brand-green" aria-hidden />{x}</p>)}</Card></Section>
  </ProductLanding>;
}

export function ResellerHostingPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  return <ProductLanding path="/hosting/reseller" seoTitle={fr ? "Hébergement revendeur" : "Reseller hosting"} seoDescription={fr ? "Créez votre marque d'hébergement avec des comptes en marque blanche." : "Build your own hosting brand with white-label accounts."}
    eyebrow={fr ? "Revendeur" : "Reseller"} title={fr ? "Votre marque, notre infrastructure" : "Your brand, our infrastructure"} body={fr ? "Créez des comptes clients, fixez vos prix et gardez la marge." : "Create client accounts, set your prices and keep the margin."}
    products={useProducts("reseller-hosting")} faq={[
      { q: fr ? "Mes clients voient-ils M212 ?" : "Will my customers see M212?", a: fr ? "Non, les serveurs de noms et le portail peuvent porter votre marque." : "No — nameservers and the portal can carry your own brand." },
      { q: fr ? "Comment fonctionne la commission ?" : "How do commissions work?", a: fr ? "Vous achetez au prix de gros et facturez votre prix de vente ; le portail revendeur calcule votre marge." : "You buy at wholesale and bill your retail price; the reseller portal calculates your margin." } ]}>
    <Section><Alert title={fr ? "Portail revendeur de démonstration" : "Reseller portal demo"}>{fr ? "Explorez le portail revendeur avec le compte de démonstration." : "Explore the reseller portal with the demo account."} <ButtonLink to="/reseller/dashboard" size="sm" variant="outline" className="ml-2">{fr ? "Ouvrir" : "Open"}</ButtonLink></Alert></Section>
  </ProductLanding>;
}

export function VpsOverviewPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  return <ProductLanding path="/vps" seoTitle={fr ? "Serveurs VPS Linux et Windows" : "VPS hosting — Linux and Windows"} seoDescription={fr ? "VPS NVMe avec accès root, gérés ou non gérés." : "NVMe VPS with root access, managed or unmanaged."}
    eyebrow="VPS" title={fr ? "Des ressources dédiées, à la demande" : "Dedicated resources, on demand"} body={fr ? "Choisissez Linux ou Windows, géré ou non géré." : "Choose Linux or Windows, managed or unmanaged."} products={useProducts("vps")} faq={[
      { q: fr ? "Géré ou non géré ?" : "Managed or unmanaged?", a: fr ? "Non géré : vous administrez le serveur. Géré : nous gérons mises à jour, surveillance et sauvegardes." : "Unmanaged: you administer the server. Managed: we handle patching, monitoring and backups." } ]}>
    <Section className="grid gap-6 md:grid-cols-2">
      <Card className="p-6"><h2 className="text-xl font-extrabold">Linux VPS</h2><p className="mt-1 text-sm text-muted-foreground">Ubuntu, Debian, AlmaLinux, Rocky.</p><ButtonLink to="/vps/linux" className="mt-4">{fr ? "Configurer" : "Configure"}</ButtonLink></Card>
      <Card className="p-6"><h2 className="text-xl font-extrabold">Windows VPS</h2><p className="mt-1 text-sm text-muted-foreground">Windows Server 2022, RDP.</p><ButtonLink to="/vps/windows" className="mt-4">{fr ? "Configurer" : "Configure"}</ButtonLink></Card>
    </Section>
  </ProductLanding>;
}

const DATACENTERS = ["Casablanca (planned partner site)", "Paris (partner)", "Frankfurt (partner)"];
const LINUX_OS = ["Ubuntu 24.04 LTS", "Debian 12", "AlmaLinux 9", "Rocky Linux 9"];

export function VpsConfigurator({ os }: { os: "linux" | "windows" }) {
  const { locale } = useI18n(); const fr = locale === "fr";
  const money = useMoney();
  const navigate = useNavigate();
  const bases = useDb().products.filter((p) => p.type === "vps" && p.visible && (os === "windows" ? p.id === "vps-windows" : p.id !== "vps-windows"));
  const [baseId, setBaseId] = useState(bases[0]?.id ?? "");
  const base = bases.find((b) => b.id === baseId) ?? bases[0];
  const [system, setSystem] = useState(os === "windows" ? "Windows Server 2022" : LINUX_OS[0]!);
  const [dc, setDc] = useState(DATACENTERS[0]!);
  const [managed, setManaged] = useState(base?.id === "vps-managed");
  const [backup, setBackup] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [support, setSupport] = useState<"standard" | "priority">("standard");
  const [extraIps, setExtraIps] = useState(0);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  if (!base) return null;
  const extras = (managed && base.id !== "vps-managed" ? 250 : 0) + (backup ? 29 : 0) + (monitoring ? 19 : 0) + (support === "priority" ? 99 : 0) + extraIps * 30;
  const monthly = base.priceMonthly + extras;
  const total = cyclePrice({ priceMonthly: monthly }, cycle);
  const meta = [system, dc, managed ? "managed" : "unmanaged", backup && "backups", monitoring && "monitoring", `${support} support`, extraIps && `+${extraIps} IPv4`].filter(Boolean).join(" · ");
  const opt = (label: string, node: ReactNode) => <div className="flex items-center justify-between gap-4 border-t py-3 text-sm first:border-t-0"><span className="font-semibold">{label}</span>{node}</div>;
  return (
    <Section className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-extrabold">{fr ? "Configurez votre VPS" : "Configure your VPS"}</h2>
        <div role="radiogroup" aria-label="Plan" className="mb-4 grid gap-3 sm:grid-cols-3">
          {bases.map((b) => (
            <button key={b.id} type="button" role="radio" aria-checked={b.id === base.id} onClick={() => { setBaseId(b.id); setManaged(b.id === "vps-managed"); }}
              className={`rounded-lg border p-4 text-left transition ${b.id === base.id ? "border-2 border-brand-green bg-success-wash" : "hover:bg-muted"}`}>
              <p className="font-bold">{b.name}</p><p className="text-xs text-muted-foreground">{b.specs.vCPU} vCPU · {b.specs.RAM} · {b.specs.Storage}</p><p className="mt-1 text-sm font-semibold">{money(b.priceMonthly)}/mo</p>
            </button>
          ))}
        </div>
        {opt(fr ? "Système" : "Operating system", <Select className="w-56" value={system} onChange={(e) => setSystem(e.target.value)} aria-label="Operating system">{(os === "windows" ? ["Windows Server 2022", "Windows Server 2019"] : LINUX_OS).map((o) => <option key={o}>{o}</option>)}</Select>)}
        {opt(fr ? "Centre de données" : "Data centre", <Select className="w-56" value={dc} onChange={(e) => setDc(e.target.value)} aria-label="Data centre">{DATACENTERS.map((o) => <option key={o}>{o}</option>)}</Select>)}
        {opt(fr ? "Géré (+250 MAD/mois)" : "Managed (+250 MAD/mo)", <input type="checkbox" className="h-5 w-5 accent-brand-green" checked={managed} disabled={base.id === "vps-managed"} onChange={(e) => setManaged(e.target.checked)} aria-label="Managed" />)}
        {opt(fr ? "Sauvegardes quotidiennes (+29)" : "Daily backups (+29)", <input type="checkbox" className="h-5 w-5 accent-brand-green" checked={backup} onChange={(e) => setBackup(e.target.checked)} aria-label="Backups" />)}
        {opt(fr ? "Surveillance avancée (+19)" : "Advanced monitoring (+19)", <input type="checkbox" className="h-5 w-5 accent-brand-green" checked={monitoring} onChange={(e) => setMonitoring(e.target.checked)} aria-label="Monitoring" />)}
        {opt(fr ? "Niveau de support" : "Support level", <Select className="w-56" value={support} onChange={(e) => setSupport(e.target.value as "standard" | "priority")} aria-label="Support level"><option value="standard">Standard</option><option value="priority">Priority (+99)</option></Select>)}
        {opt(fr ? "IPv4 supplémentaires (+30 chacune)" : "Extra IPv4 (+30 each)", <Input type="number" min={0} max={8} className="w-24" value={extraIps} onChange={(e) => setExtraIps(Math.max(0, Math.min(8, Number(e.target.value) || 0)))} aria-label="Extra IPv4" />)}
        {opt("IPv6", <span className="text-muted-foreground">/64 {fr ? "inclus" : "included"}</span>)}
      </Card>
      <Card className="h-fit p-6 lg:sticky lg:top-24">
        <h3 className="font-extrabold">{fr ? "Récapitulatif" : "Summary"}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{base.name} — {meta}</p>
        <div className="my-4"><CyclePicker cycles={base.cycles} value={cycle} onChange={setCycle} /></div>
        <p className="font-display text-3xl font-extrabold tabular">{money(total / CYCLE_MONTHS[cycle])}<span className="text-sm text-muted-foreground">/mo</span></p>
        <p className="text-xs text-muted-foreground">{money(total)} {fr ? "par période, HT" : "per period, excl. tax"}</p>
        <Button className="mt-5 w-full" variant="brand" onClick={() => { addProductToCart(base, cycle, meta, total); toast.success(fr ? "VPS ajouté" : "VPS added to cart"); void navigate({ to: "/cart" }); }}>{fr ? "Ajouter au panier" : "Add to cart"}</Button>
        <p className="mt-3 text-xs text-muted-foreground">{fr ? "Aucun serveur n'est créé : le provisionnement n'est pas connecté." : "No server is created: provisioning is not connected."}</p>
      </Card>
    </Section>
  );
}

export function VpsLinuxPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  useSeo({ title: "Linux VPS", description: fr ? "VPS Linux NVMe avec accès root : Ubuntu, Debian, AlmaLinux." : "NVMe Linux VPS with root access: Ubuntu, Debian, AlmaLinux.", path: "/vps/linux" });
  return <><PageHero eyebrow="Linux VPS" title={fr ? "Linux, root et NVMe" : "Linux, root access, NVMe"} body={fr ? "Déployez votre distribution préférée et configurez tout." : "Run your favourite distribution and configure everything."} /><VpsConfigurator os="linux" />
    <Section><Faq items={[{ q: "SSH?", a: fr ? "Accès SSH par clé ; restreignez le port 22 avec le pare-feu." : "Key-based SSH access; restrict port 22 with the firewall." }, { q: fr ? "Puis-je changer d'OS ?" : "Can I change OS?", a: fr ? "Oui, la réinstallation est disponible dans l'espace client (démo)." : "Yes, reinstall is available in the customer area (demo)." }]} /></Section></>;
}

export function VpsWindowsPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  useSeo({ title: "Windows VPS", description: fr ? "VPS Windows Server 2022 avec licence et RDP." : "Windows Server 2022 VPS with licence and RDP.", path: "/vps/windows" });
  return <><PageHero eyebrow="Windows VPS" title={fr ? "Windows Server, licence incluse" : "Windows Server, licence included"} body={fr ? "Bureau à distance, .NET, IIS ou MSSQL Express." : "Remote desktop, .NET, IIS or SQL Server Express."} /><VpsConfigurator os="windows" />
    <Section><Faq items={[{ q: "RDP?", a: fr ? "Accès RDP ; nous recommandons de restreindre les IP sources." : "RDP access; we recommend restricting source IPs." }, { q: fr ? "Licences SQL Server ?" : "SQL Server licences?", a: fr ? "Seule l'édition Express est incluse." : "Only the Express edition is included." }]} /></Section></>;
}

export function DedicatedPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  const [form, setForm] = useState({ name: "", email: "", cpu: "", ram: "128", storage: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState("");
  return (
    <ProductLanding path="/dedicated-servers" seoTitle={fr ? "Serveurs dédiés" : "Dedicated servers"} seoDescription={fr ? "Serveurs bare-metal Xeon et EPYC avec IPMI et RAM ECC." : "Xeon and EPYC bare-metal servers with IPMI and ECC RAM."}
      eyebrow={fr ? "Serveurs dédiés" : "Dedicated servers"} title={fr ? "Toute la machine, rien que pour vous" : "The whole machine, just for you"} body={fr ? "Processeurs serveur, RAM ECC et accès IPMI." : "Server-grade CPUs, ECC RAM and IPMI access."} products={useProducts("dedicated")}
      faq={[{ q: fr ? "Délai de mise en service ?" : "Delivery time?", a: fr ? "Selon la disponibilité chez nos partenaires ; communiqué au devis." : "Depends on partner stock; confirmed with your quote." }]}>
      <Section className="grid gap-8 lg:grid-cols-2">
        <div><SectionHeading eyebrow={fr ? "Sur mesure" : "Custom"} title={fr ? "Configuration personnalisée" : "Custom configuration"} body={fr ? "Décrivez votre besoin ; la demande est enregistrée comme ticket commercial de démonstration." : "Describe your needs; the request is saved as a demo sales ticket."} /><Server className="h-24 w-24 text-brand-ice" aria-hidden /></div>
        <Card className="p-6">
          {sent ? <Alert tone="success" title={fr ? "Demande enregistrée (démo)" : "Request saved (demo)"}>{fr ? "Référence" : "Reference"} {sent}. {fr ? "Visible dans l'administration > Tickets." : "Visible in Admin › Tickets."}</Alert> : (
            <form noValidate className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => {
              e.preventDefault();
              const errs: Record<string, string> = {};
              if (!form.name.trim()) errs.name = "Required";
              if (!validateEmail(form.email)) errs.email = "Enter a valid email";
              if (!form.cpu.trim()) errs.cpu = "Required";
              setErrors(errs); if (Object.keys(errs).length) return;
              const number = `T-DEMO-${Math.floor(6000 + Math.random() * 3000)}`; const at = new Date().toISOString();
              db.insert("tickets", { id: uid("tic"), number, customerId: "guest", subject: `Custom dedicated server — ${form.cpu}`, department: "sales", priority: "medium", status: "open", createdAt: at, updatedAt: at,
                messages: [{ id: uid("msg"), author: `${form.name} <${form.email}>`, role: "customer", body: `CPU: ${form.cpu}\nRAM: ${form.ram} GB\nStorage: ${form.storage}\n${form.notes}`, at }] });
              db.log(form.email, "quote.request", number); setSent(number);
            }}>
              <Field label={fr ? "Nom" : "Name"} error={errors.name}>{(id) => <Input id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
              <Field label="Email" error={errors.email}>{(id) => <Input id={id} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
              <Field label="CPU" error={errors.cpu}>{(id) => <Input id={id} placeholder="2 × EPYC 9354" value={form.cpu} onChange={(e) => setForm({ ...form, cpu: e.target.value })} />}</Field>
              <Field label="RAM (GB)">{(id) => <Select id={id} value={form.ram} onChange={(e) => setForm({ ...form, ram: e.target.value })}>{["64", "128", "256", "512", "1024"].map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
              <Field label={fr ? "Stockage" : "Storage"} className="sm:col-span-2">{(id) => <Input id={id} placeholder="4 × 3.84 TB NVMe RAID10" value={form.storage} onChange={(e) => setForm({ ...form, storage: e.target.value })} />}</Field>
              <Field label="Notes" className="sm:col-span-2">{(id) => <Textarea id={id} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />}</Field>
              <Button type="submit" variant="brand" className="sm:col-span-2">{fr ? "Demander un devis" : "Request a quote"}</Button>
            </form>
          )}
        </Card>
      </Section>
    </ProductLanding>
  );
}

export function SslPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  const products = useProducts("ssl");
  return (
    <ProductLanding path="/ssl" seoTitle={fr ? "Certificats SSL" : "SSL certificates"} seoDescription={fr ? "Certificats SSL DV, OV, EV, wildcard et multi-domaines." : "DV, OV, EV, wildcard and multi-domain SSL certificates."}
      eyebrow="SSL" title={fr ? "Chiffrez et rassurez" : "Encrypt and reassure"} body={fr ? "Du certificat DV en quelques minutes à l'EV pour la finance." : "From minute-issued DV to EV for finance and e-commerce."} products={products}
      faq={[{ q: fr ? "Quelle validation choisir ?" : "Which validation do I need?", a: fr ? "DV pour un site vitrine ; OV/EV pour afficher votre organisation vérifiée." : "DV for most sites; OV/EV when you need a verified organization in the certificate." },
        { q: fr ? "L'hébergement inclut-il un SSL ?" : "Does hosting include SSL?", a: fr ? "Oui, un certificat DV gratuit. Les certificats payants offrent validation et garantie." : "Yes, a free DV certificate. Paid certificates add validation and warranty." }]}>
      <Section>
        <SectionHeading title={fr ? "Niveaux de validation" : "Validation levels"} />
        <div className="grid gap-4 md:grid-cols-3">
          {[["DV", fr ? "Contrôle du domaine uniquement" : "Domain control only", "minutes"], ["OV", fr ? "Vérification de l'entreprise" : "Business verification", "1–3 days"], ["EV", fr ? "Vérification approfondie" : "Extended verification", "3–7 days"]].map(([k, v, d]) => (
            <Card key={k} className="p-6"><Badge tone="info">{k}</Badge><p className="mt-3 font-semibold">{v}</p><p className="text-sm text-muted-foreground">{fr ? "Délai" : "Issuance"}: {d}</p></Card>))}
        </div>
      </Section>
    </ProductLanding>
  );
}

export function BusinessEmailPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  const money = useMoney();
  const navigate = useNavigate();
  const single = useDb().products.find((p) => p.id === "mail-single");
  const [boxes, setBoxes] = useState(3);
  const [storage, setStorage] = useState(10);
  const monthly = single ? boxes * (single.priceMonthly + (storage - 10) * 0.5) : 0;
  return (
    <ProductLanding path="/business-email" seoTitle={fr ? "Email professionnel" : "Business email"} seoDescription={fr ? "Emails professionnels sur votre domaine avec antispam et webmail." : "Professional email on your domain with spam protection and webmail."}
      eyebrow={fr ? "Email professionnel" : "Business email"} title={fr ? "contact@votre-entreprise.ma" : "you@your-company.ma"} body={fr ? "Boîtes mail, calendriers et antispam, accessibles partout." : "Mailboxes, calendars and spam filtering, everywhere."} products={useProducts("email")}
      faq={[{ q: fr ? "Puis-je migrer mes emails ?" : "Can I migrate my mail?", a: fr ? "Oui via IMAP ; l'assistant n'est pas actif dans cette démo." : "Yes via IMAP; the wizard is not active in this demo." }]}>
      {single && <Section><Card className="grid gap-6 p-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <h2 className="text-xl font-extrabold">{fr ? "Composez votre offre" : "Build your own package"}</h2>
          <label className="block text-sm font-semibold">{fr ? "Boîtes mail" : "Mailboxes"}: {boxes}<input type="range" min={1} max={50} value={boxes} onChange={(e) => setBoxes(Number(e.target.value))} className="mt-2 w-full accent-brand-green" /></label>
          <label className="block text-sm font-semibold">{fr ? "Stockage par boîte" : "Storage per mailbox"}: {storage} GB<input type="range" min={10} max={100} step={5} value={storage} onChange={(e) => setStorage(Number(e.target.value))} className="mt-2 w-full accent-brand-green" /></label>
          <p className="text-sm text-muted-foreground">{fr ? "Antispam, webmail et IMAP/SMTP inclus." : "Spam protection, webmail and IMAP/SMTP included."}</p>
        </div>
        <div className="rounded-lg bg-muted p-5"><p className="text-sm text-muted-foreground">{fr ? "Total mensuel" : "Monthly total"}</p><p className="font-display text-3xl font-extrabold tabular">{money(monthly)}</p>
          <Button className="mt-4 w-full" variant="brand" onClick={() => { addProductToCart(single, "monthly", `${boxes} mailboxes × ${storage} GB`, Math.round(monthly)); toast.success(fr ? "Ajouté" : "Added"); void navigate({ to: "/cart" }); }}>{fr ? "Ajouter au panier" : "Add to cart"}</Button></div>
      </Card></Section>}
    </ProductLanding>
  );
}

export function CloudPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  return <ProductLanding path="/cloud" seoTitle="Cloud" seoDescription={fr ? "Stockage objet compatible S3 et services cloud." : "S3-compatible object storage and cloud services."}
    eyebrow="Cloud" title={fr ? "Des briques cloud simples" : "Simple cloud building blocks"} body={fr ? "Stockage objet aujourd'hui ; d'autres services sont prévus." : "Object storage today; more services are on the roadmap."} products={useProducts("cloud")}
    faq={[{ q: fr ? "Où sont stockées les données ?" : "Where is data stored?", a: fr ? "Chez nos partenaires d'infrastructure ; la région est choisie à la commande." : "With our infrastructure partners; region is chosen at order time." }]}>
    <Points items={[{ icon: HardDrive, title: "S3 API", body: fr ? "Compatible avec vos outils existants." : "Works with your existing tools." }, { icon: ShieldCheck, title: fr ? "Versionnage" : "Versioning", body: fr ? "Protection contre les suppressions." : "Protect against deletion." }, { icon: Cpu, title: fr ? "Feuille de route" : "Roadmap", body: fr ? "Kubernetes et bases gérées à l'étude." : "Kubernetes and managed databases under study." }]} />
  </ProductLanding>;
}

export function PricingPage() {
  const { locale, l } = useI18n(); const fr = locale === "fr";
  const data = useDb();
  const money = useMoney();
  useSeo({ title: fr ? "Tarifs" : "Pricing", description: fr ? "Tous les tarifs M212.MA : domaines, hébergement, VPS, dédiés, SSL, email." : "All M212.MA prices: domains, hosting, VPS, dedicated, SSL and email.", path: "/pricing" });
  const groups = data.categories.slice().sort((a, b) => a.order - b.order).map((c) => ({ c, products: data.products.filter((p) => p.categoryId === c.id && p.visible) })).filter((g) => g.products.length);
  return (
    <Section>
      <SectionHeading as="h1" eyebrow={fr ? "Tarifs" : "Pricing"} title={fr ? "Tous nos prix, en un coup d'œil" : "Every price at a glance"} body={fr ? "Prix mensuels HT. Remises : -5% trimestriel, -15% annuel, -25% sur 2 ans." : "Monthly prices excl. tax. Discounts: -5% quarterly, -15% annually, -25% for 2 years."} />
      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map(({ c, products }) => (
          <Card key={c.id} className="p-6">
            <h2 className="text-lg font-extrabold">{c.name}</h2>
            <ul className="mt-3 divide-y text-sm">{products.map((p) => <li key={p.id} className="flex justify-between gap-4 py-2"><span><strong>{p.name}</strong> <span className="text-muted-foreground">— {l(p.tagline)}</span></span><span className="shrink-0 font-semibold tabular">{money(p.priceMonthly)}/mo</span></li>)}</ul>
          </Card>
        ))}
        <Card className="p-6"><h2 className="text-lg font-extrabold">{fr ? "Domaines" : "Domains"}</h2><ul className="mt-3 grid grid-cols-2 gap-x-6 text-sm">{data.tlds.map((t) => <li key={t.tld} className="flex justify-between border-b py-1.5"><span className="font-bold">{t.tld}</span><span className="tabular">{money(t.promo ?? t.register)}</span></li>)}</ul><ButtonLink to="/domains/pricing" variant="outline" size="sm" className="mt-4">{fr ? "Détails" : "Full domain pricing"}</ButtonLink></Card>
      </div>
    </Section>
  );
}
