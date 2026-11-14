import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import {
  BarChart3, Boxes, Building2, CreditCard, FileText, Globe, HardDrive, Home, Image, KeyRound, LayoutList, LifeBuoy, ListTree,
  Newspaper, Package, Palette, Percent, Receipt, ScrollText, Search, Server, Settings, ShieldCheck, ShoppingBag,
  Tags, Ticket, Users, Wallet, Bell, Cpu, Plug, Repeat,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Alert, Button, ButtonLink } from "@/components/ui";
import { DemoBanner, PrefSelectors } from "./SiteLayout";
import { demoSignIn, signOut, useSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/models";
import { ThemeSwitcher } from "@/design-system/theme/ThemeSwitcher";

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }> };
type Group = { title?: string; items: Item[] };

export const PORTAL_NAV: Record<"client" | "reseller" | "admin", Group[]> = {
  client: [
    { items: [{ to: "/client/dashboard", label: "Dashboard", icon: Home }] },
    { title: "Services", items: [
      { to: "/client/domains", label: "Domains", icon: Globe }, { to: "/client/hosting", label: "Hosting", icon: HardDrive },
      { to: "/client/vps", label: "VPS", icon: Cpu }, { to: "/client/servers", label: "Dedicated servers", icon: Server } ] },
    { title: "Billing", items: [
      { to: "/client/orders", label: "Orders", icon: ShoppingBag }, { to: "/client/invoices", label: "Invoices", icon: Receipt }, { to: "/client/payments", label: "Payments", icon: Wallet } ] },
    { title: "Account", items: [
      { to: "/client/support", label: "Support", icon: LifeBuoy }, { to: "/client/notifications", label: "Notifications", icon: Bell },
      { to: "/client/profile", label: "Profile", icon: Users }, { to: "/client/security", label: "Security", icon: KeyRound } ] },
  ],
  reseller: [
    { items: [{ to: "/reseller/dashboard", label: "Dashboard", icon: Home }] },
    { title: "Business", items: [
      { to: "/reseller/customers", label: "Customers", icon: Users }, { to: "/reseller/products", label: "Products", icon: Package },
      { to: "/reseller/pricing", label: "Pricing & margins", icon: Percent }, { to: "/reseller/orders", label: "Orders", icon: ShoppingBag } ] },
    { title: "Finance", items: [ { to: "/reseller/invoices", label: "Invoices", icon: Receipt }, { to: "/reseller/commissions", label: "Commissions", icon: Wallet } ] },
    { title: "Account", items: [ { to: "/reseller/branding", label: "Branding", icon: Palette }, { to: "/reseller/support", label: "Support", icon: LifeBuoy }, { to: "/reseller/settings", label: "Settings", icon: Settings } ] },
  ],
  admin: [
    { items: [{ to: "/admin/dashboard", label: "Dashboard", icon: Home }, { to: "/admin/analytics", label: "Analytics", icon: BarChart3 }] },
    { title: "Commerce", items: [
      { to: "/admin/customers", label: "Customers", icon: Users }, { to: "/admin/orders", label: "Orders", icon: ShoppingBag }, { to: "/admin/invoices", label: "Invoices", icon: Receipt },
      { to: "/admin/payments", label: "Payments", icon: CreditCard }, { to: "/admin/subscriptions", label: "Subscriptions", icon: Repeat }, { to: "/admin/coupons", label: "Coupons", icon: Tags },
      { to: "/admin/resellers", label: "Resellers", icon: Building2 } ] },
    { title: "Catalogue", items: [
      { to: "/admin/products", label: "Products", icon: Package }, { to: "/admin/categories", label: "Categories", icon: LayoutList }, { to: "/admin/domains", label: "Domains & TLDs", icon: Globe },
      { to: "/admin/registrars", label: "Registrars", icon: Plug } ] },
    { title: "Infrastructure", items: [
      { to: "/admin/hosting", label: "Hosting accounts", icon: HardDrive }, { to: "/admin/vps", label: "VPS", icon: Cpu }, { to: "/admin/servers", label: "Servers", icon: Server },
      { to: "/admin/superadmin", label: "Super Admin · API control", icon: Boxes } ] },
    { title: "Support", items: [ { to: "/admin/tickets", label: "Tickets", icon: Ticket }, { to: "/admin/support", label: "Departments", icon: LifeBuoy } ] },
    { title: "Content", items: [
      { to: "/admin/cms/pages", label: "Pages", icon: FileText }, { to: "/admin/cms/blog", label: "Blog", icon: Newspaper }, { to: "/admin/cms/menus", label: "Menus", icon: ListTree },
      { to: "/admin/cms/media", label: "Media", icon: Image }, { to: "/admin/seo", label: "SEO", icon: Search } ] },
    { title: "System", items: [ { to: "/admin/settings", label: "Settings", icon: Settings }, { to: "/admin/security", label: "Security", icon: ShieldCheck }, { to: "/admin/audit-logs", label: "Audit logs", icon: ScrollText } ] },
  ],
};

const AREA_ROLE: Record<keyof typeof PORTAL_NAV, Exclude<Role, "guest">> = { client: "customer", reseller: "reseller", admin: "admin" };
const AREA_TITLE = { client: "Customer area", reseller: "Reseller portal", admin: "Administration" };

export function PortalLayout({ area }: { area: keyof typeof PORTAL_NAV }) {
  const session = useSession();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const needed = AREA_ROLE[area];

  if (!session || session.role !== needed) {
    return (
      <div className="min-h-screen bg-background">
        <DemoBanner />
        <div className="mx-auto max-w-lg px-4 py-20">
          <Logo />
          <h1 className="mt-8 text-2xl font-extrabold">{AREA_TITLE[area]}</h1>
          <Alert tone="warning" className="mt-4" title={session ? `Signed in as ${session.role} (demo)` : "Not signed in"}>
            This area is shown to the <strong>{needed}</strong> demo role. Role switching is a UI demonstration only — it is not a security boundary.
          </Alert>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="brand" onClick={() => demoSignIn(needed)}>Continue as demo {needed}</Button>
            <ButtonLink to="/login" variant="outline">Go to sign-in</ButtonLink>
            <ButtonLink to="/" variant="ghost">Back to site</ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const nav = (
    <nav aria-label={AREA_TITLE[area]} className="space-y-5">
      {PORTAL_NAV[area].map((g, i) => (
        <div key={i}>
          {g.title && <p className="mb-1 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = path === it.to || (path.startsWith(it.to + "/") && it.to.split("/").length > 2);
              return (
                <li key={it.to}>
                  <Link to={it.to as "/admin/dashboard"} aria-current={active ? "page" : undefined}
                    className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition", active ? "bg-brand-navy-deep text-on-dark" : "text-foreground hover:bg-muted")}>
                    <it.icon className="h-4 w-4" />{it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r bg-card p-4 lg:block">
          <Logo />
          <p className="mb-5 mt-1 pl-11 text-xs font-semibold text-muted-foreground">{AREA_TITLE[area]}</p>
          {nav}
        </aside>
        {open && (
          <div className="fixed inset-0 z-50 bg-brand-navy-deep/60 lg:hidden" onClick={() => setOpen(false)}>
            <aside className="h-full w-72 overflow-y-auto bg-card p-4" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between"><Logo /><button type="button" aria-label="Close menu" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
              {nav}
            </aside>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
            <button type="button" className="rounded p-2 hover:bg-muted lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><MenuIcon className="h-5 w-5" /></button>
            <div className="flex-1 text-sm text-muted-foreground"><span className="hidden sm:inline">Signed in (demo) as </span><strong className="text-foreground">{session.name}</strong></div>
            <ThemeSwitcher compact /><div className="hidden sm:block"><PrefSelectors /></div>
            <ButtonLink to="/" variant="ghost" size="sm">Site</ButtonLink>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign out</span></Button>
          </header>
          <div className="mx-auto max-w-6xl px-4 py-8 animate-rise" key={path}><Outlet /></div>
        </div>
      </div>
    </div>
  );
}
