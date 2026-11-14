import { Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Globe, HardDrive, Lock, Mail, Server } from "lucide-react";
import { Card, ButtonLink } from "@/design-system/components/ui";
import { Logo } from "@/design-system/navigation/Logo";
import { useI18n, useMoney } from "@/lib/i18n";
import { useSeo } from "@/lib/seo";
import { useDb } from "@/lib/store";
import { effectiveRegisterPrice } from "@/lib/domain";
import { DEMO_TESTIMONIALS, DomainSearchBox, Faq, PlanGrid, Section, SectionHeading, ServerVisual, Testimonials, TrustStrip, PriceFrom } from "./shared";

export function HomePage() {
  const { locale } = useI18n();
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
      <section className="m212-reference-hero relative isolate overflow-hidden">
        <div className="m212-reference-cloud m212-cloud-a" aria-hidden />
        <div className="m212-reference-cloud m212-cloud-b" aria-hidden />
        <div className="m212-reference-wave" aria-hidden />
        <div className="relative mx-auto grid min-h-[min(790px,calc(100svh-110px))] max-w-[1640px] items-center gap-6 px-5 pb-12 pt-12 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,.78fr)] lg:px-14 lg:py-16">
          <div className="relative z-10 max-w-[850px]">
            <div className="mb-7 flex items-center gap-4 sm:gap-6">
              <div className="hidden shrink-0 rounded-[2rem] bg-white/35 p-3 shadow-sm ring-1 ring-white/70 sm:block"><Logo /></div>
              <p className="m212-reference-kicker">{fr ? "Domaines · Hébergement · Cloud" : "Domains · Hosting · Cloud"}</p>
            </div>
            <h1 className="max-w-[900px] text-[clamp(2.55rem,5.4vw,5.6rem)] font-extrabold leading-[1.04] tracking-[-.045em] text-[#101d45]">
              {fr ? <>Réservez Votre <span className="m212-reference-highlight">Domaine</span><br/>et Hébergement Gratuit</> : <>Find Your <span className="m212-reference-highlight">Domain</span><br/>and Hosting in One Place</>}
            </h1>
            <p className="mt-6 max-w-3xl text-xl font-medium leading-snug text-[#152b57] sm:text-2xl lg:text-[2rem]">
              {fr ? "En Quelques Secondes — Votre présence en ligne, simplement." : "Your online presence, launched in just a few seconds."}
            </p>
            <div className="m212-reference-search mt-9 max-w-[900px] rounded-full bg-white p-2.5 sm:p-3">
              <DomainSearchBox size="lg" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm text-[#243b65]">
              <span className="font-bold">{fr ? "Extensions populaires :" : "Popular extensions:"}</span>
              {popular.slice(0,5).map(p => <Link key={p.tld} to="/domains/pricing" className="m212-reference-tld">{p.tld}<span className="ml-2 text-xs font-medium text-slate-500">{money(effectiveRegisterPrice(p))}</span></Link>)}
            </div>
          </div>
          <div className="relative z-[1] mx-auto flex w-full max-w-[620px] items-end justify-center self-end lg:self-center">
            <div className="m212-reference-art-panel w-full">
              <div className="m212-reference-server-art" aria-hidden><ServerVisual /></div>
              <div className="m212-reference-person" aria-hidden>
                <div className="m212-person-cap"><span>✦</span></div>
                <div className="m212-person-head"><span className="m212-person-hair"/><span className="m212-person-smile"/></div>
                <div className="m212-person-body"><div className="m212-person-shirt"/><div className="m212-person-laptop"/></div>
                <div className="m212-person-chair"/>
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
