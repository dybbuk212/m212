import { Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Globe, HardDrive, Lock, Mail, Server } from "lucide-react";
import { Card, ButtonLink } from "@/components/ui";
import { useI18n, useMoney } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";
import { useDb } from "@/lib/store";
import { effectiveRegisterPrice } from "@/lib/domain";
import { DEMO_TESTIMONIALS, DomainSearchBox, Faq, PlanGrid, Section, SectionHeading, ServerVisual, Testimonials, TrustStrip, PriceFrom } from "./shared";

export function HomePage() {
  const { t, locale } = useI18n();
  const fr = locale === "fr";
  const data = useDb();
  const money = useMoney();
  useSeo({ title: "M212.MA | Domains, hosting and cloud infrastructure", description: fr ? "Noms de domaine, hébergement web, VPS, serveurs dédiés, SSL et email professionnel au Maroc." : "Domain names, web hosting, VPS, dedicated servers, SSL and business email for Morocco and international customers.", path: "/" });
  const min = (type: string) => Math.min(...data.products.filter((p) => p.type === type && p.visible).map((p) => p.priceMonthly));
  const cats = [
    { to: "/hosting/shared", icon: HardDrive, title: fr ? "Hébergement web" : "Web hosting", body: fr ? "NVMe, SSL gratuit, sauvegardes." : "NVMe, free SSL, backups.", price: min("shared") },
    { to: "/hosting/wordpress", icon: Globe, title: "WordPress", body: fr ? "Mises à jour et cache gérés." : "Managed updates and caching.", price: min("wordpress") },
    { to: "/vps", icon: Cpu, title: "VPS", body: fr ? "Linux ou Windows, accès root." : "Linux or Windows, full root.", price: min("vps") },
    { to: "/dedicated-servers", icon: Server, title: fr ? "Serveurs dédiés" : "Dedicated servers", body: "Bare metal, IPMI.", price: min("dedicated") },
    { to: "/ssl", icon: Lock, title: "SSL", body: "DV, OV, EV, wildcard.", price: min("ssl") },
    { to: "/business-email", icon: Mail, title: fr ? "Email pro" : "Business email", body: fr ? "Votre nom de domaine." : "On your own domain.", price: min("email") },
  ] as const;
  const popular = [".ma", ".com", ".shop", ".online", ".io", ".net"].map((x) => data.tlds.find((t) => t.tld === x)).filter((x) => x !== undefined);
  return (
    <>
      <section className="m212-home-hero relative isolate overflow-hidden">
        <div className="m212-home-orbit m212-home-orbit-one" aria-hidden />
        <div className="m212-home-orbit m212-home-orbit-two" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:py-20 lg:grid-cols-[1.2fr_.8fr] lg:py-24">
          <div className="relative z-10 max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-green/20 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-brand-green shadow-sm">
              <span className="h-2 w-2 rounded-full bg-brand-green" />
              {fr ? "Domaines · Hébergement · Cloud" : "Domains · Hosting · Cloud"}
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] text-brand-navy sm:text-5xl lg:text-6xl">
              {fr ? <>Votre présence en ligne commence par un <span className="m212-home-highlight">nom de domaine.</span></> : <>Your online presence starts with a <span className="m212-home-highlight">domain name.</span></>}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700 sm:text-xl">
              {fr ? "Trouvez votre domaine, puis choisissez votre hébergement, serveur et services professionnels au même endroit." : "Find your domain, then choose hosting, servers and professional services in one place."}
            </p>
            <div className="mt-8 max-w-3xl rounded-2xl border border-white/80 bg-white/90 p-2 shadow-[0_22px_60px_-30px_rgba(18,39,82,.42)] backdrop-blur">
              <DomainSearchBox size="lg" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600">
              <span className="font-semibold">{fr ? "Extensions populaires :" : "Popular extensions:"}</span>
              {popular.map((p) => <Link key={p.tld} to="/domains/pricing" className="rounded-full border border-white/90 bg-white/65 px-3 py-1.5 font-semibold text-brand-navy transition hover:border-brand-green/50 hover:bg-white">{p.tld}<span className="ml-2 text-xs font-normal text-slate-500">{money(effectiveRegisterPrice(p))}</span></Link>)}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="m212-home-art-glow" aria-hidden />
            <div className="relative rounded-[2rem] border border-white/80 bg-white/55 p-4 shadow-[0_28px_80px_-38px_rgba(18,39,82,.45)] backdrop-blur-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between rounded-xl border border-white/80 bg-white/80 px-4 py-3">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{fr ? "Votre espace en ligne" : "Your online space"}</p><p className="mt-1 font-display text-lg font-extrabold text-brand-navy">M212.MA</p></div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{fr ? "Tout-en-un" : "All-in-one"}</span>
              </div>
              <ServerVisual />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/hosting" className="rounded-xl border border-white/80 bg-white/85 p-3 transition hover:-translate-y-0.5"><span className="block text-xs text-slate-500">{fr ? "Hébergement" : "Hosting"}</span><strong className="mt-1 block text-sm text-brand-navy">{fr ? "Lancer un site" : "Launch a website"}</strong></Link>
                <Link to="/vps" className="rounded-xl border border-white/80 bg-white/85 p-3 transition hover:-translate-y-0.5"><span className="block text-xs text-slate-500">{fr ? "Serveurs" : "Servers"}</span><strong className="mt-1 block text-sm text-brand-navy">VPS & Cloud</strong></Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <TrustStrip />
      <Section>
        <SectionHeading eyebrow={fr ? "Produits" : "Products"} title={fr ? "Tout pour être en ligne" : "Everything to get online"} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c) => (
            <Link key={c.to} to={c.to} className="group">
              <Card className="m212-product-card h-full p-6 transition group-hover:shadow-pop">
                <c.icon className="h-7 w-7 text-brand-red" aria-hidden />
                <h3 className="mt-4 text-lg font-extrabold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
                <div className="mt-4 flex items-center justify-between"><PriceFrom mad={c.price} /><ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" aria-hidden /></div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
      <div className="bg-brand-ice/60"><Section>
        <SectionHeading center eyebrow={fr ? "Hébergement mutualisé" : "Shared hosting"} title={fr ? "Des offres simples, des prix clairs" : "Simple plans, clear prices"} body={fr ? "Prix hors taxes. Renouvellement au même tarif." : "Prices exclude tax. Renewals at the same price."} />
        <PlanGrid products={data.products.filter((p) => p.type === "shared" && p.visible)} />
      </Section></div>
      <Section className="grid gap-10 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow={fr ? "Sécurité" : "Security"} title={fr ? "Une plateforme pensée pour la confiance" : "Built around trust"} />
          <ul className="space-y-4 text-sm">
            {(fr ? ["Isolation des comptes et pare-feu applicatif", "Sauvegardes automatiques avec restauration en libre-service", "Verrouillage de domaine et protection des données WHOIS lorsque l'extension le permet", "Transparence : cette version est une démonstration sans traitement réel"]
              : ["Account isolation and web application firewall", "Automatic backups with self-service restores", "Domain lock and WHOIS privacy where the extension allows it", "Transparency: this release is a demonstration with no real processing"]).map((x) => <li key={x} className="flex gap-3"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" aria-hidden />{x}</li>)}
          </ul>
          <div className="mt-6 flex gap-2"><ButtonLink to="/about" variant="outline">{fr ? "À propos" : "About M212"}</ButtonLink><ButtonLink to="/contact">{fr ? "Parler à un expert" : "Talk to an expert"}</ButtonLink></div>
        </div>
        <Faq items={fr ? [
          { q: "Puis-je payer en dirhams ?", a: "Oui, les prix sont affichés en MAD par défaut. EUR et USD sont proposés à titre indicatif." },
          { q: "La disponibilité des domaines est-elle réelle ?", a: "Non. Dans cette version de démonstration, la disponibilité est simulée et aucun registraire n'est connecté." },
          { q: "Puis-je passer d'un hébergement mutualisé à un VPS ?", a: "Oui, chaque offre peut évoluer." } ] : [
          { q: "Can I pay in dirhams?", a: "Yes, prices are shown in MAD by default. EUR and USD are shown as indicative conversions." },
          { q: "Is domain availability real?", a: "No. In this demonstration release availability is simulated and no registrar is connected." },
          { q: "Can I move from shared hosting to a VPS?", a: "Yes, every plan can be upgraded." } ]} />
      </Section>
      <Section><Testimonials items={DEMO_TESTIMONIALS} /></Section>
      <Section>
        <div className="hero-surface flex flex-col items-start gap-4 rounded-2xl p-10 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-extrabold text-on-dark">{fr ? "Prêt à lancer votre projet ?" : "Ready to launch your project?"}</h2><p className="mt-1 text-on-dark-muted">{fr ? "Commencez par un nom de domaine." : "Start with a domain name."}</p></div>
          <div className="flex gap-2"><ButtonLink to="/domains/search" search={{ q: "" }} variant="brand" size="lg">{fr ? "Trouver un domaine" : "Find a domain"}</ButtonLink><ButtonLink to="/pricing" variant="onDark" size="lg">{fr ? "Voir les tarifs" : "See pricing"}</ButtonLink></div>
        </div>
      </Section>
    </>
  );
}
