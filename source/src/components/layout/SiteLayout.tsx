import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Globe, Menu as MenuIcon, ShoppingCart, User, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/Logo";
import { Button, ButtonLink, HrefLink } from "@/components/ui";
import { cartStore } from "@/lib/cart";
import { prefs, useI18n } from "@/lib/i18n";
import { signOut, useSession } from "@/lib/auth";
import { useDb } from "@/lib/store";
import type { Currency } from "@/types/models";

type NavLink = { to: string; label: string; desc: string };
export function useMegaMenu() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const groups: { id: string; label: string; links: NavLink[] }[] = [
    { id: "domains", label: fr ? "Domaines" : "Domains", links: [
      { to: "/domains/search", label: fr ? "Rechercher un domaine" : "Domain search", desc: fr ? "Vérifiez un nom (démo)" : "Check a name (demo)" },
      { to: "/domains/pricing", label: fr ? "Tarifs des extensions" : "TLD pricing", desc: ".ma, .com, .io…" },
      { to: "/domains", label: fr ? "Transfert & renouvellement" : "Transfers & renewals", desc: fr ? "Déplacez vos domaines" : "Move your domains" } ] },
    { id: "hosting", label: fr ? "Hébergement" : "Hosting", links: [
      { to: "/hosting/shared", label: fr ? "Mutualisé" : "Shared hosting", desc: fr ? "Sites vitrines et blogs" : "Websites and blogs" },
      { to: "/hosting/wordpress", label: "WordPress", desc: fr ? "WordPress géré" : "Managed WordPress" },
      { to: "/hosting/reseller", label: fr ? "Revendeur" : "Reseller", desc: fr ? "Votre marque d'hébergement" : "White-label hosting" } ] },
    { id: "servers", label: fr ? "Serveurs" : "Servers", links: [
      { to: "/vps/linux", label: "Linux VPS", desc: fr ? "Accès root" : "Full root access" },
      { to: "/vps/windows", label: "Windows VPS", desc: "RDP, Windows Server" },
      { to: "/dedicated-servers", label: fr ? "Serveurs dédiés" : "Dedicated servers", desc: "Bare metal" },
      { to: "/cloud", label: "Cloud", desc: fr ? "Stockage objet et plus" : "Object storage & more" } ] },
    { id: "security", label: fr ? "Sécurité & email" : "Security & email", links: [
      { to: "/ssl", label: fr ? "Certificats SSL" : "SSL certificates", desc: "DV, OV, EV, wildcard" },
      { to: "/business-email", label: fr ? "Email professionnel" : "Business email", desc: fr ? "Boîtes à votre nom" : "Mailboxes on your domain" } ] },
  ];
  return groups;
}

function MegaMenu() {
  const groups = useMegaMenu();
  const [open, setOpen] = useState<string | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(null), [path]);
  return (
    <nav aria-label="Main" className="hidden lg:block" onMouseLeave={() => setOpen(null)}>
      <ul className="flex items-center gap-1">
        {groups.map((g) => (
          <li key={g.id} className="relative" onMouseEnter={() => setOpen(g.id)}>
            <button type="button" aria-expanded={open === g.id} onClick={() => setOpen(open === g.id ? null : g.id)} className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted">
              {g.label}<ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </button>
            {open === g.id && (
              <div className="absolute left-0 top-full z-40 w-80 pt-2">
                <div className="animate-rise rounded-lg border bg-card p-2 shadow-pop">
                  {g.links.map((l) => (
                    <HrefLink key={l.to} href={l.to} className="block rounded-md px-3 py-2.5 hover:bg-muted">
                      <span className="block text-sm font-semibold text-brand-navy">{l.label}</span>
                      <span className="block text-xs text-muted-foreground">{l.desc}</span>
                    </HrefLink>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
        <li><Link to="/pricing" className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted">{useI18n().t("nav.pricing")}</Link></li>
        <li><Link to="/support" className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-muted">{useI18n().t("nav.support")}</Link></li>
      </ul>
    </nav>
  );
}

export function PrefSelectors({ compact = false }: { compact?: boolean }) {
  const { locale, currency, setLocale, setCurrency } = useI18n();
  return (
    <div className="flex items-center gap-1.5">
      <label className="sr-only" htmlFor={`lang-${compact}`}>Language</label>
      <div className="flex items-center gap-1 rounded-md border bg-card px-2">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <select id={`lang-${compact}`} value={locale} onChange={(e) => setLocale(e.target.value as "en" | "fr")} className="h-8 bg-transparent text-xs font-semibold">
          <option value="en">EN</option><option value="fr">FR</option>
        </select>
      </div>
      <label className="sr-only" htmlFor={`cur-${compact}`}>Currency</label>
      <select id={`cur-${compact}`} value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="h-8 rounded-md border bg-card px-2 text-xs font-semibold">
        <option value="MAD">MAD</option><option value="EUR">EUR</option><option value="USD">USD</option>
      </select>
    </div>
  );
}

export function portalHome(role: string) { return role === "admin" ? "/admin/dashboard" : role === "reseller" ? "/reseller/dashboard" : "/client/dashboard"; }

export function DemoBanner() {
  const { t } = useI18n();
  return <div className="bg-warning-wash px-4 py-1.5 text-center text-xs font-semibold text-warning-foreground" role="note">{t("demo.banner")}</div>;
}

function Header() {
  const { t } = useI18n();
  const cart = cartStore.use();
  const session = useSession();
  const [mobile, setMobile] = useState(false);
  const groups = useMegaMenu();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setMobile(false), [path]);
  const count = cart.lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Logo />
        <div className="flex-1"><MegaMenu /></div>
        <div className="hidden md:block"><PrefSelectors /></div>
        <Link to="/cart" className="relative rounded-md p-2 hover:bg-muted" aria-label={`${t("nav.cart")} (${count})`}>
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-brand-red px-1.5 text-[10px] font-bold text-on-dark">{count}</span>}
        </Link>
        {session ? (
          <div className="hidden items-center gap-2 sm:flex">
            <ButtonLink to={portalHome(session.role) as "/client/dashboard"} variant="outline" size="sm"><User className="h-4 w-4" />{t("nav.account")}</ButtonLink>
            <Button variant="ghost" size="sm" onClick={signOut}>{t("nav.logout")}</Button>
          </div>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <ButtonLink to="/login" variant="ghost" size="sm">{t("nav.login")}</ButtonLink>
            <ButtonLink to="/register" variant="brand" size="sm">{t("nav.register")}</ButtonLink>
          </div>
        )}
        <button type="button" className="rounded-md p-2 hover:bg-muted lg:hidden" aria-label="Open menu" aria-expanded={mobile} onClick={() => setMobile(true)}><MenuIcon className="h-5 w-5" /></button>
      </div>
      {mobile && createPortal(
        <div className="fixed inset-0 z-50 bg-brand-navy-deep/60 lg:hidden" onClick={() => setMobile(false)}>
          <div role="dialog" aria-label="Menu" className="animate-rise ml-auto h-full w-[88%] max-w-sm overflow-y-auto bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><Logo /><button type="button" aria-label="Close menu" onClick={() => setMobile(false)} className="rounded p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
            <PrefSelectors compact />
            {groups.map((g) => (
              <div key={g.id} className="mt-5">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.label}</p>
                {g.links.map((l) => <HrefLink key={l.to} href={l.to} className="block rounded px-2 py-2 text-sm font-semibold hover:bg-muted">{l.label}</HrefLink>)}
              </div>
            ))}
            <div className="mt-5 grid gap-2">
              <ButtonLink to="/pricing" variant="outline">{t("nav.pricing")}</ButtonLink>
              <ButtonLink to="/support" variant="outline">{t("nav.support")}</ButtonLink>
              {session ? <><ButtonLink to={portalHome(session.role) as "/client/dashboard"}>{t("nav.account")}</ButtonLink><Button variant="ghost" onClick={signOut}>{t("nav.logout")}</Button></>
                : <><ButtonLink to="/login" variant="outline">{t("nav.login")}</ButtonLink><ButtonLink to="/register" variant="brand">{t("nav.register")}</ButtonLink></>}
            </div>
          </div>
        </div>, document.body
      )}
    </header>
  );
}

function Footer() {
  const { t, locale } = useI18n();
  const data = useDb();
  const fr = locale === "fr";
  const footerMenus = data.menus.filter((m) => m.location === "footer");
  const cols: { title: string; links: [string, string][] }[] = [
    { title: fr ? "Produits" : "Products", links: [["/domains", fr ? "Domaines" : "Domains"], ["/hosting", fr ? "Hébergement" : "Hosting"], ["/vps", "VPS"], ["/dedicated-servers", fr ? "Dédiés" : "Dedicated"], ["/ssl", "SSL"], ["/business-email", "Email"]] },
    { title: fr ? "Société" : "Company", links: [["/about", fr ? "À propos" : "About"], ["/contact", "Contact"], ["/hosting/reseller", fr ? "Revendeurs" : "Resellers"], ["/pricing", fr ? "Tarifs" : "Pricing"]] },
    { title: fr ? "Légal" : "Legal", links: [["/legal/terms", fr ? "Conditions" : "Terms"], ["/legal/privacy", fr ? "Confidentialité" : "Privacy"], ["/legal/refunds", fr ? "Remboursements" : "Refunds"]] },
  ];
  return (
    <footer className="hero-surface mt-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-5">
        <div className="md:col-span-1"><Logo onDark /><p className="mt-3 text-sm text-on-dark-muted">{data.settings.brand.tagline}</p><p className="mt-2 text-xs text-on-dark-muted">{data.settings.company.address}</p></div>
        {cols.map((c) => (
          <div key={c.title}><p className="text-sm font-bold text-on-dark">{c.title}</p><ul className="mt-3 space-y-2">{c.links.map(([href, label]) => <li key={href}><HrefLink href={href} className="text-sm text-on-dark-muted hover:text-on-dark">{label}</HrefLink></li>)}</ul></div>
        ))}
        {footerMenus.map((m) => (
          <div key={m.id}><p className="text-sm font-bold text-on-dark">{m.name.split("—").pop()?.trim()}</p><ul className="mt-3 space-y-2">{m.items.map((i) => <li key={i.id}><HrefLink href={i.href} className="text-sm text-on-dark-muted hover:text-on-dark">{i.label}</HrefLink></li>)}</ul></div>
        ))}
      </div>
      <div className="border-t border-on-dark/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-on-dark-muted sm:flex-row sm:justify-between"><span>© {new Date().getFullYear()} {data.settings.company.name}. {t("footer.rights")}</span><span>{fr ? "Version de démonstration frontend — v2.0" : "Frontend demonstration release — v2.0"}</span></div></div>
    </footer>
  );
}

function CookieNotice() {
  const p = prefs.use();
  const { t } = useI18n();
  if (p.cookiesAccepted) return null;
  return (
    <div role="region" aria-label="Privacy notice" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl flex-col gap-3 rounded-lg border bg-card p-4 shadow-pop sm:flex-row sm:items-center">
      <p className="flex-1 text-sm text-muted-foreground">{t("cookie.text")} <Link to="/legal/privacy" className="font-semibold text-brand-green underline">Privacy</Link></p>
      <Button size="sm" onClick={() => prefs.set({ ...p, cookiesAccepted: true })}>{t("cookie.ok")}</Button>
    </div>
  );
}

export function SiteLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:p-2">Skip to content</a>
      <DemoBanner />
      <Header />
      <main id="main" className="flex-1">{children ?? <Outlet />}</main>
      <Footer />
      <CookieNotice />
    </div>
  );
}
