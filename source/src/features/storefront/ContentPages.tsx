import { Link } from "@tanstack/react-router";
import { BookOpen, Building2, Clock, LifeBuoy, Mail, MapPin, Phone, Search } from "lucide-react";
import { useState } from "react";
import { Alert, Badge, Button, ButtonLink, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { validateEmail } from "@/lib/auth";
import { formatDate, useI18n } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";
import { db, uid, useDb } from "@/lib/store";
import { BlockRenderer, MediaImage } from "@/features/cms/BlockRenderer";
import { PageHero, Section, SectionHeading } from "./shared";

export function AboutPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  useSeo({ title: fr ? "À propos de M212.MA" : "About M212.MA", description: fr ? "M212.MA, fournisseur marocain de domaines, d'hébergement et d'infrastructure cloud." : "M212.MA is a Moroccan provider of domains, hosting and cloud infrastructure.", path: "/about" });
  return (
    <>
      <PageHero eyebrow={fr ? "À propos" : "About"} title={fr ? "Une infrastructure de confiance, pensée au Maroc" : "Trusted infrastructure, built from Morocco"} body={fr ? "M212.MA accompagne entreprises, agences et développeurs, au Maroc et à l'international." : "M212.MA serves businesses, agencies and developers in Morocco and internationally."} />
      <Section className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4 text-muted-foreground">
          <h2 className="text-2xl font-extrabold">{fr ? "Notre approche" : "Our approach"}</h2>
          <p>{fr ? "Le nom M212 fait référence à l'indicatif téléphonique du Maroc. Nous voulons rendre l'hébergement professionnel accessible, avec des prix clairs en dirhams et un support dans les langues de nos clients." : "The name M212 refers to Morocco's international dialling code. We want to make professional hosting accessible, with clear pricing in dirhams and support in our customers' languages."}</p>
          <p>{fr ? "Nous travaillons avec des partenaires de colocation et de cloud. Nous ne revendiquons pas la propriété de centres de données." : "We work with colocation and cloud partners. We do not claim ownership of data centres."}</p>
          <Alert tone="warning">{fr ? "Cette version est une démonstration frontend : aucun service n'est encore commercialisé via ce site." : "This release is a frontend demonstration: no services are sold through this site yet."}</Alert>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[{ i: Building2, t: fr ? "Entreprise" : "Company", b: fr ? "Informations légales à compléter avant lancement." : "Legal details to be completed before launch." }, { i: MapPin, t: "Casablanca", b: fr ? "Siège prévu" : "Planned headquarters" }, { i: LifeBuoy, t: "Support", b: "FR · AR · EN" }, { i: Clock, t: fr ? "Disponibilité" : "Availability", b: fr ? "Horaires à confirmer" : "Hours to be confirmed" }].map((x) => <Card key={x.t} className="p-5"><x.i className="h-5 w-5 text-brand-red" aria-hidden /><p className="mt-2 font-bold">{x.t}</p><p className="text-sm text-muted-foreground">{x.b}</p></Card>)}
        </div>
      </Section>
    </>
  );
}

export function ContactPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  const settings = useDb().settings;
  useSeo({ title: fr ? "Contacter M212.MA" : "Contact M212.MA", description: fr ? "Contactez l'équipe commerciale ou le support M212.MA." : "Contact the M212.MA sales or support team.", path: "/contact" });
  const [f, setF] = useState({ name: "", email: "", department: "sales", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ref, setRef] = useState("");
  return (
    <Section className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
      <div>
        <SectionHeading as="h1" eyebrow="Contact" title={fr ? "Parlons de votre projet" : "Let's talk about your project"} />
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3"><Mail className="h-4 w-4 text-brand-red" aria-hidden />{settings.company.email}</li>
          <li className="flex gap-3"><Phone className="h-4 w-4 text-brand-red" aria-hidden />{settings.company.phone}</li>
          <li className="flex gap-3"><MapPin className="h-4 w-4 text-brand-red" aria-hidden />{settings.company.address}</li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">{fr ? "Coordonnées provisoires à confirmer avant lancement." : "Placeholder contact details to be confirmed before launch."}</p>
      </div>
      <Card className="p-6">
        {ref ? <Alert tone="success" title={fr ? "Message enregistré (démo)" : "Message saved (demo)"}>{fr ? "Référence" : "Reference"} <strong>{ref}</strong>. {fr ? "Aucun email n'est envoyé ; le message est visible dans Admin › Tickets." : "No email is sent; the message is visible in Admin › Tickets."} <Button size="sm" variant="outline" className="ml-2" onClick={() => { setRef(""); setF({ ...f, subject: "", message: "" }); }}>{fr ? "Nouveau" : "New message"}</Button></Alert> : (
          <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => {
            e.preventDefault();
            const errs: Record<string, string> = {};
            if (f.name.trim().length < 2) errs.name = fr ? "Nom requis" : "Name is required";
            if (!validateEmail(f.email)) errs.email = fr ? "Email invalide" : "Enter a valid email";
            if (f.subject.trim().length < 3) errs.subject = fr ? "Objet requis" : "Subject is required";
            if (f.message.trim().length < 10) errs.message = fr ? "10 caractères minimum" : "At least 10 characters";
            setErrors(errs); if (Object.keys(errs).length) return;
            const number = `T-DEMO-${Math.floor(7000 + Math.random() * 2000)}`; const at = new Date().toISOString();
            db.insert("tickets", { id: uid("tic"), number, customerId: "guest", subject: f.subject, department: f.department as "sales", priority: "medium", status: "open", createdAt: at, updatedAt: at, messages: [{ id: uid("msg"), author: `${f.name} <${f.email}>`, role: "customer", body: f.message, at }] });
            db.log(f.email, "contact.submit", number); setRef(number);
          }}>
            <Field label={fr ? "Nom" : "Name"} error={errors.name}>{(id) => <Input id={id} autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
            <Field label="Email" error={errors.email}>{(id) => <Input id={id} type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
            <Field label={fr ? "Service" : "Department"}>{(id) => <Select id={id} value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}><option value="sales">{fr ? "Commercial" : "Sales"}</option><option value="technical">{fr ? "Technique" : "Technical"}</option><option value="billing">{fr ? "Facturation" : "Billing"}</option></Select>}</Field>
            <Field label={fr ? "Objet" : "Subject"} error={errors.subject}>{(id) => <Input id={id} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />}</Field>
            <Field label="Message" error={errors.message} className="sm:col-span-2">{(id) => <Textarea id={id} rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />}</Field>
            <Button type="submit" variant="brand" className="sm:col-span-2">{fr ? "Envoyer" : "Send message"}</Button>
          </form>
        )}
      </Card>
    </Section>
  );
}

export const KB_ARTICLES = [
  { id: "dns-propagation", cat: "Domains", title: "How long does DNS propagation take?", body: "DNS changes usually propagate within minutes but can take up to 48 hours depending on TTL values and resolver caches." },
  { id: "point-domain", cat: "Domains", title: "Point your domain to M212 hosting", body: "Set the nameservers to ns1.m212.ma and ns2.m212.ma, or create an A record pointing to your hosting IP shown in the customer area." },
  { id: "ma-requirements", cat: "Domains", title: ".ma registration requirements", body: "The .ma registry may require supporting information. Keep your contact data accurate and check the current registry rules." },
  { id: "email-setup", cat: "Email", title: "Configure email on your phone", body: "Use IMAP on port 993 (SSL) and SMTP on port 465 (SSL) with your full email address as username." },
  { id: "spf-dkim", cat: "Email", title: "SPF, DKIM and DMARC explained", body: "SPF lists authorised senders, DKIM signs messages, and DMARC tells receivers what to do when checks fail." },
  { id: "wp-staging", cat: "Hosting", title: "Use WordPress staging", body: "Create a staging copy from the hosting panel, test changes, then push to production." },
  { id: "backups-restore", cat: "Hosting", title: "Restore a backup", body: "Open your hosting service in the customer area, go to Backups and choose a restore point." },
  { id: "ssh-keys", cat: "VPS", title: "Connect to your VPS with SSH keys", body: "Generate a key with ssh-keygen, add the public key in the VPS panel and connect with ssh root@your-ip." },
  { id: "firewall", cat: "VPS", title: "Configure the VPS firewall", body: "Allow only the ports you need. Restrict SSH (22) or RDP (3389) to known IP ranges." },
  { id: "invoice-pay", cat: "Billing", title: "Pay an invoice by bank transfer", body: "Use the invoice number as the transfer reference. Payments are matched manually in this demonstration." },
];

export function SupportPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  useSeo({ title: fr ? "Support et assistance" : "Support centre", description: fr ? "Obtenez de l'aide : base de connaissances, tickets et contact." : "Get help: knowledgebase, tickets and contact options.", path: "/support" });
  return (
    <>
      <PageHero eyebrow="Support" title={fr ? "Comment pouvons-nous aider ?" : "How can we help?"} body={fr ? "Cherchez une réponse, ouvrez un ticket ou contactez l'équipe." : "Search for an answer, open a ticket or contact the team."} />
      <Section className="grid gap-6 md:grid-cols-3">
        <Card className="p-6"><BookOpen className="h-6 w-6 text-brand-red" aria-hidden /><h2 className="mt-3 text-lg font-extrabold">{fr ? "Base de connaissances" : "Knowledgebase"}</h2><p className="mt-1 text-sm text-muted-foreground">{KB_ARTICLES.length} {fr ? "articles" : "articles"}</p><ButtonLink to="/knowledgebase" className="mt-4" variant="outline">{fr ? "Parcourir" : "Browse"}</ButtonLink></Card>
        <Card className="p-6"><LifeBuoy className="h-6 w-6 text-brand-red" aria-hidden /><h2 className="mt-3 text-lg font-extrabold">{fr ? "Tickets" : "Tickets"}</h2><p className="mt-1 text-sm text-muted-foreground">{fr ? "Depuis votre espace client." : "From your customer area."}</p><ButtonLink to="/client/support" className="mt-4" variant="outline">{fr ? "Ouvrir un ticket" : "Open a ticket"}</ButtonLink></Card>
        <Card className="p-6"><Mail className="h-6 w-6 text-brand-red" aria-hidden /><h2 className="mt-3 text-lg font-extrabold">Contact</h2><p className="mt-1 text-sm text-muted-foreground">{fr ? "Questions commerciales." : "Sales questions."}</p><ButtonLink to="/contact" className="mt-4" variant="outline">Contact</ButtonLink></Card>
      </Section>
      <Section><Card className="p-6"><h2 className="text-lg font-extrabold">{fr ? "État des services" : "Service status"}</h2><p className="mt-1 text-sm text-muted-foreground">{fr ? "Aucune supervision réelle n'est connectée. Une page d'état publique sera ajoutée avec le backend." : "No real monitoring is connected. A public status page will be added with the backend."}</p></Card></Section>
    </>
  );
}

export function KnowledgebasePage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  useSeo({ title: fr ? "Base de connaissances" : "Knowledgebase", description: fr ? "Guides pratiques : domaines, email, hébergement, VPS et facturation." : "How-to guides for domains, email, hosting, VPS and billing.", path: "/knowledgebase" });
  const [q, setQ] = useState(""); const [cat, setCat] = useState("All");
  const cats = ["All", ...Array.from(new Set(KB_ARTICLES.map((a) => a.cat)))];
  const list = KB_ARTICLES.filter((a) => (cat === "All" || a.cat === cat) && (a.title + a.body).toLowerCase().includes(q.toLowerCase()));
  return (
    <Section className="max-w-4xl">
      <SectionHeading as="h1" eyebrow="Knowledgebase" title={fr ? "Guides et réponses" : "Guides and answers"} />
      <div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Search articles</span><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden /><Input className="pl-9" placeholder={fr ? "Rechercher…" : "Search articles…"} value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <Select aria-label="Category" className="sm:w-48" value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</Select></div>
      <div className="mt-6 space-y-3">
        {list.length === 0 && <p className="text-muted-foreground">{fr ? "Aucun résultat." : "No articles match your search."}</p>}
        {list.map((a) => <details key={a.id} className="group rounded-lg border bg-card p-4"><summary className="cursor-pointer list-none font-semibold text-brand-navy"><Badge tone="info" className="mr-2">{a.cat}</Badge>{a.title}</summary><p className="mt-2 text-sm text-muted-foreground">{a.body}</p></details>)}
      </div>
    </Section>
  );
}

export function BlogListPage() {
  const { locale } = useI18n(); const fr = locale === "fr";
  const posts = useDb().posts.filter((p) => p.status === "published" && new Date(p.publishedAt) <= new Date()).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const [cat, setCat] = useState("All");
  const cats = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];
  useSeo({ title: fr ? "Blog M212.MA" : "M212.MA Blog", description: fr ? "Conseils et actualités sur les domaines, l'hébergement et le cloud." : "Tips and news about domains, hosting and cloud.", path: "/blog" });
  const shown = posts.filter((p) => cat === "All" || p.category === cat);
  return (
    <Section>
      <SectionHeading as="h1" eyebrow="Blog" title={fr ? "Conseils et actualités" : "Guides and news"} />
      <div className="mb-6 flex flex-wrap gap-2">{cats.map((c) => <Button key={c} size="sm" variant={c === cat ? "primary" : "outline"} onClick={() => setCat(c)}>{c}</Button>)}</div>
      {shown.length === 0 ? <p className="text-muted-foreground">{fr ? "Aucun article publié." : "No published articles yet."}</p> : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group">
              <Card className="h-full overflow-hidden transition group-hover:shadow-pop">
                <MediaImage src={p.featuredImage} alt={p.title} className="aspect-[16/9] w-full object-cover" />
                <div className="p-5"><div className="flex gap-2 text-xs text-muted-foreground"><Badge tone="info">{p.category}</Badge>{formatDate(p.publishedAt, locale)}</div><h2 className="mt-2 text-lg font-extrabold group-hover:underline">{p.title}</h2><p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p></div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
}

export function BlogPostPage({ slug, preview }: { slug: string; preview?: boolean }) {
  const { locale } = useI18n();
  const post = useDb().posts.find((p) => p.slug === slug);
  const visible = post && (preview || (post.status === "published" && new Date(post.publishedAt) <= new Date()));
  useSeo({ title: visible ? post.seoTitle || post.title : "Article not found", description: visible ? post.seoDescription || post.excerpt : "This article is not available.", path: `/blog/${slug}`, noindex: !visible || preview });
  if (!visible) return <NotFoundPage />;
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      {preview && <Alert tone="warning" className="mb-6" title="Preview">Status: {post.status}. Only visible to administrators in preview.</Alert>}
      <Link to="/blog" className="text-sm font-semibold text-brand-green">← Blog</Link>
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{post.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{post.author} · {formatDate(post.publishedAt, locale)} · {post.category}</p>
      {post.featuredImage && <MediaImage src={post.featuredImage} alt={post.title} className="mt-6 w-full rounded-xl" />}
      <div className="mt-6 space-y-4 text-foreground/90">{post.content.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
      <div className="mt-8 flex flex-wrap gap-2">{post.tags.map((t) => <Badge key={t}>#{t}</Badge>)}</div>
    </article>
  );
}

export function CmsPageView({ slug, preview }: { slug: string; preview?: boolean }) {
  const page = useDb().pages.find((p) => p.slug === slug);
  const visible = page && (preview || (page.status === "published" && new Date(page.publishAt) <= new Date()));
  useSeo({ title: visible ? page.seoTitle || page.title : "Page not found", description: visible ? page.seoDescription : "This page is not available.", path: `/p/${slug}`, noindex: !visible || preview });
  if (!visible) return <NotFoundPage />;
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      {preview && <Alert tone="warning" title="Preview">Status: {page.status}. Publish date: {formatDate(page.publishAt)}.</Alert>}
      {page.featuredImage && <MediaImage src={page.featuredImage} alt={page.title} className="max-h-80 w-full rounded-xl object-cover" />}
      {page.blocks.length === 0 && <h1 className="text-3xl font-extrabold">{page.title}</h1>}
      {page.blocks.map((b) => <BlockRenderer key={b.id} block={b} />)}
    </div>
  );
}

const LEGAL = {
  terms: { title: { en: "Terms of service", fr: "Conditions générales" }, sections: [
    ["Scope", "These terms will govern the supply of domains, hosting and related services by M212.MA once commercial operations begin. This demonstration release does not form any contract."],
    ["Accounts", "Customers are responsible for keeping their account details accurate and their credentials secure."],
    ["Acceptable use", "Services may not be used for unlawful content, spam, malware distribution or attacks on other networks. Unmetered resources are subject to fair use."],
    ["Domains", "Domain registrations are subject to the policies of each registry, including ANRT rules for .ma."],
    ["Liability", "Final liability terms must be reviewed by qualified Moroccan counsel before launch."] ] },
  privacy: { title: { en: "Privacy policy", fr: "Politique de confidentialité" }, sections: [
    ["Data in this demo", "This frontend demo stores your cart, preferences and demo records only in your browser's local storage and IndexedDB. Nothing is sent to a server."],
    ["Cookies", "No tracking or advertising cookies are used."],
    ["Future processing", "When commercial services launch, personal data will be processed in line with Moroccan law 09-08 and, where applicable, the GDPR. This section must be completed before launch."],
    ["Your rights", "You may clear all demo data at any time from the admin settings (Reset demo data) or by clearing your browser storage."] ] },
  refunds: { title: { en: "Refund policy", fr: "Politique de remboursement" }, sections: [
    ["Hosting", "A money-back period for hosting plans is planned; the exact duration will be published before launch."],
    ["Domains", "Domain registrations and renewals are generally non-refundable once processed by the registry."],
    ["Demo orders", "Demo orders created on this site are not payments and cannot be refunded because nothing is charged."] ] },
} as const;

export function LegalPage({ kind }: { kind: keyof typeof LEGAL }) {
  const { locale } = useI18n();
  const doc = LEGAL[kind];
  useSeo({ title: doc.title[locale], description: `${doc.title.en} — M212.MA`, path: `/legal/${kind}` });
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-red">Legal</p>
      <h1 className="mt-2 text-3xl font-extrabold">{doc.title[locale]}</h1>
      <Alert tone="warning" className="mt-4">Draft for the demonstration release — to be reviewed by legal counsel before commercial launch.</Alert>
      <div className="mt-8 space-y-6">{doc.sections.map(([h, b]) => <section key={h}><h2 className="text-lg font-extrabold">{h}</h2><p className="mt-1 text-muted-foreground">{b}</p></section>)}</div>
      <nav className="mt-10 flex gap-4 text-sm font-semibold text-brand-green" aria-label="Legal documents"><Link to="/legal/terms">Terms</Link><Link to="/legal/privacy">Privacy</Link><Link to="/legal/refunds">Refunds</Link></nav>
    </article>
  );
}

export function NotFoundPage() {
  useSeo({ title: "Page not found", description: "The page you are looking for does not exist.", path: "/404", noindex: true });
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-red">404</p>
      <h1 className="mt-4 text-2xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you are looking for does not exist or has moved.</p>
      <div className="mt-6 flex justify-center gap-2"><ButtonLink to="/">Home</ButtonLink><ButtonLink to="/support" variant="outline">Support</ButtonLink></div>
    </div>
  );
}

