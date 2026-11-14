import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect, type RouteComponent } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { HomePage } from "@/features/storefront/HomePage";
import { DomainPricingPage, DomainSearchPage, DomainsPage } from "@/features/storefront/DomainPages";
import { BusinessEmailPage, CloudPage, DedicatedPage, HostingOverviewPage, PricingPage, ResellerHostingPage, SharedHostingPage, SslPage, VpsLinuxPage, VpsOverviewPage, VpsWindowsPage, WordpressHostingPage } from "@/features/storefront/ProductPages";
import { AboutPage, BlogListPage, BlogPostPage, CmsPageView, ContactPage, KnowledgebasePage, LegalPage, NotFoundPage, SupportPage } from "@/features/storefront/ContentPages";
import { LoginPage, RegisterPage } from "@/features/storefront/AuthPages";
import { CartPage, CheckoutPage } from "@/features/storefront/CartCheckout";
const load_ClientPages = () => import("@/features/client/ClientPages");
const ClientDashboard = lazyRouteComponent(load_ClientPages, "ClientDashboard");
const ClientDomains = lazyRouteComponent(load_ClientPages, "ClientDomains");
const ClientHosting = lazyRouteComponent(load_ClientPages, "ClientHosting");
const ClientInvoices = lazyRouteComponent(load_ClientPages, "ClientInvoices");
const ClientNotifications = lazyRouteComponent(load_ClientPages, "ClientNotifications");
const ClientOrders = lazyRouteComponent(load_ClientPages, "ClientOrders");
const ClientPayments = lazyRouteComponent(load_ClientPages, "ClientPayments");
const ClientProfile = lazyRouteComponent(load_ClientPages, "ClientProfile");
const ClientSecurity = lazyRouteComponent(load_ClientPages, "ClientSecurity");
const ClientServers = lazyRouteComponent(load_ClientPages, "ClientServers");
const ClientSupport = lazyRouteComponent(load_ClientPages, "ClientSupport");
const ClientVps = lazyRouteComponent(load_ClientPages, "ClientVps");
const load_ServiceDetails = () => import("@/features/client/ServiceDetails");
const ClientDomainDetailRoute = lazyRouteComponent(load_ServiceDetails, "ClientDomainDetailRoute");
const ClientTicketDetailRoute = lazyRouteComponent(load_ServiceDetails, "ClientTicketDetailRoute");
const ClientHostingDetailRoute = lazyRouteComponent(load_ServiceDetails, "ClientHostingDetailRoute");
const ClientVpsDetailRoute = lazyRouteComponent(load_ServiceDetails, "ClientVpsDetailRoute");
const load_ResellerPages = () => import("@/features/reseller/ResellerPages");
const ResellerBranding = lazyRouteComponent(load_ResellerPages, "ResellerBranding");
const ResellerCommissions = lazyRouteComponent(load_ResellerPages, "ResellerCommissions");
const ResellerCustomers = lazyRouteComponent(load_ResellerPages, "ResellerCustomers");
const ResellerDashboard = lazyRouteComponent(load_ResellerPages, "ResellerDashboard");
const ResellerInvoices = lazyRouteComponent(load_ResellerPages, "ResellerInvoices");
const ResellerOrders = lazyRouteComponent(load_ResellerPages, "ResellerOrders");
const ResellerPricing = lazyRouteComponent(load_ResellerPages, "ResellerPricing");
const ResellerProducts = lazyRouteComponent(load_ResellerPages, "ResellerProducts");
const ResellerSettings = lazyRouteComponent(load_ResellerPages, "ResellerSettings");
const ResellerSupport = lazyRouteComponent(load_ResellerPages, "ResellerSupport");
const load_AdminCommerce = () => import("@/features/admin/AdminCommerce");
const AdminAnalytics = lazyRouteComponent(load_AdminCommerce, "AdminAnalytics");
const AdminCoupons = lazyRouteComponent(load_AdminCommerce, "AdminCoupons");
const AdminCustomers = lazyRouteComponent(load_AdminCommerce, "AdminCustomers");
const AdminDashboard = lazyRouteComponent(load_AdminCommerce, "AdminDashboard");
const AdminInvoices = lazyRouteComponent(load_AdminCommerce, "AdminInvoices");
const AdminOrders = lazyRouteComponent(load_AdminCommerce, "AdminOrders");
const AdminPayments = lazyRouteComponent(load_AdminCommerce, "AdminPayments");
const AdminResellers = lazyRouteComponent(load_AdminCommerce, "AdminResellers");
const AdminSubscriptions = lazyRouteComponent(load_AdminCommerce, "AdminSubscriptions");
const AdminTickets = lazyRouteComponent(load_AdminCommerce, "AdminTickets");
const load_AdminCatalog = () => import("@/features/admin/AdminCatalog");
const AdminCategories = lazyRouteComponent(load_AdminCatalog, "AdminCategories");
const AdminDomains = lazyRouteComponent(load_AdminCatalog, "AdminDomains");
const AdminProducts = lazyRouteComponent(load_AdminCatalog, "AdminProducts");
const AdminRegistrars = lazyRouteComponent(load_AdminCatalog, "AdminRegistrars");
const load_AdminInfra = () => import("@/features/admin/AdminInfra");
const AdminHosting = lazyRouteComponent(load_AdminInfra, "AdminHosting");
const load_AdminIntegrationDashboard = () => import("@/features/admin/AdminIntegrationDashboard");
const AdminProviders = lazyRouteComponent(load_AdminIntegrationDashboard, "AdminIntegrationDashboard");
const AdminServers = lazyRouteComponent(load_AdminInfra, "AdminServers");
const AdminSupportDepartments = lazyRouteComponent(load_AdminInfra, "AdminSupportDepartments");
const AdminVps = lazyRouteComponent(load_AdminInfra, "AdminVps");
const load_AdminSystem = () => import("@/features/admin/AdminSystem");
const AdminAuditLogs = lazyRouteComponent(load_AdminSystem, "AdminAuditLogs");
const AdminSecurity = lazyRouteComponent(load_AdminSystem, "AdminSecurity");
const AdminSeo = lazyRouteComponent(load_AdminSystem, "AdminSeo");
const AdminSettings = lazyRouteComponent(load_AdminSystem, "AdminSettings");
const load_CmsAdmin = () => import("@/features/cms/CmsAdmin");
const CmsBlogEditorRoute = lazyRouteComponent(load_CmsAdmin, "CmsBlogEditorRoute");
const CmsBlogList = lazyRouteComponent(load_CmsAdmin, "CmsBlogList");
const CmsMedia = lazyRouteComponent(load_CmsAdmin, "CmsMedia");
const CmsMenus = lazyRouteComponent(load_CmsAdmin, "CmsMenus");
const CmsPageEditorRoute = lazyRouteComponent(load_CmsAdmin, "CmsPageEditorRoute");
const CmsPagesList = lazyRouteComponent(load_CmsAdmin, "CmsPagesList");

const rootRoute = createRootRoute({
  component: () => (<><Outlet /><Toaster richColors position="top-right" closeButton /></>),
  notFoundComponent: () => <SiteLayout><NotFoundPage /></SiteLayout>,
});

const site = createRoute({ getParentRoute: () => rootRoute, id: "site", component: SiteLayout });
const s = <P extends string>(path: P, component: RouteComponent) => createRoute({ getParentRoute: () => site, path, component });

const domainSearch = createRoute({
  getParentRoute: () => site, path: "domains/search",
  validateSearch: (search: Record<string, unknown>): { q: string } => ({ q: typeof search.q === "string" ? search.q.slice(0, 200) : "" }),
  component: function DomainSearchRoute() { const { q } = domainSearch.useSearch(); return <DomainSearchPage q={q} />; },
});
const blogPost = createRoute({ getParentRoute: () => site, path: "blog/$slug", component: function BlogPostRoute() { const { slug } = blogPost.useParams(); return <BlogPostPage slug={slug} />; } });
const cmsPage = createRoute({ getParentRoute: () => site, path: "p/$slug", component: function CmsRoute() { const { slug } = cmsPage.useParams(); return <CmsPageView slug={slug} />; } });

const siteRoutes = [
  s("/", HomePage), s("domains", DomainsPage), domainSearch, s("domains/pricing", DomainPricingPage),
  s("hosting", HostingOverviewPage), s("hosting/shared", SharedHostingPage), s("hosting/wordpress", WordpressHostingPage), s("hosting/reseller", ResellerHostingPage),
  s("vps", VpsOverviewPage), s("vps/linux", VpsLinuxPage), s("vps/windows", VpsWindowsPage), s("dedicated-servers", DedicatedPage),
  s("ssl", SslPage), s("business-email", BusinessEmailPage), s("cloud", CloudPage), s("pricing", PricingPage),
  s("about", AboutPage), s("contact", ContactPage), s("support", SupportPage), s("knowledgebase", KnowledgebasePage), s("blog", BlogListPage), blogPost, cmsPage,
  s("legal/terms", () => <LegalPage kind="terms" />), s("legal/privacy", () => <LegalPage kind="privacy" />), s("legal/refunds", () => <LegalPage kind="refunds" />),
  s("login", LoginPage), s("register", RegisterPage), s("cart", CartPage), s("checkout", CheckoutPage),
] as const;

const client = createRoute({ getParentRoute: () => rootRoute, path: "client", component: () => <PortalLayout area="client" /> });
const c = <P extends string>(path: P, component: RouteComponent) => createRoute({ getParentRoute: () => client, path, component });
const clientDomain = createRoute({ getParentRoute: () => client, path: "domains/$id", component: ClientDomainDetailRoute });
const clientHosting = createRoute({ getParentRoute: () => client, path: "hosting/$id", component: ClientHostingDetailRoute });
const clientVps = createRoute({ getParentRoute: () => client, path: "vps/$id", component: ClientVpsDetailRoute });
const clientTicket = createRoute({ getParentRoute: () => client, path: "support/$id", component: ClientTicketDetailRoute });
const clientRoutes = [
  createRoute({ getParentRoute: () => client, path: "/", beforeLoad: () => { throw redirect({ to: "/client/dashboard" }); } }),
  c("dashboard", ClientDashboard), c("domains", ClientDomains), clientDomain, c("hosting", ClientHosting), clientHosting, c("vps", ClientVps), clientVps,
  c("servers", ClientServers), c("orders", ClientOrders), c("invoices", ClientInvoices), c("payments", ClientPayments), c("support", ClientSupport), clientTicket,
  c("profile", ClientProfile), c("security", ClientSecurity), c("notifications", ClientNotifications),
] as const;

const reseller = createRoute({ getParentRoute: () => rootRoute, path: "reseller", component: () => <PortalLayout area="reseller" /> });
const r = <P extends string>(path: P, component: RouteComponent) => createRoute({ getParentRoute: () => reseller, path, component });
const resellerRoutes = [
  createRoute({ getParentRoute: () => reseller, path: "/", beforeLoad: () => { throw redirect({ to: "/reseller/dashboard" }); } }),
  r("dashboard", ResellerDashboard), r("customers", ResellerCustomers), r("products", ResellerProducts), r("pricing", ResellerPricing), r("orders", ResellerOrders),
  r("invoices", ResellerInvoices), r("commissions", ResellerCommissions), r("branding", ResellerBranding), r("support", ResellerSupport), r("settings", ResellerSettings),
] as const;

const admin = createRoute({ getParentRoute: () => rootRoute, path: "admin", component: () => <PortalLayout area="admin" /> });
const a = <P extends string>(path: P, component: RouteComponent) => createRoute({ getParentRoute: () => admin, path, component });
const pageEditor = createRoute({ getParentRoute: () => admin, path: "cms/pages/$id", component: CmsPageEditorRoute });
const postEditor = createRoute({ getParentRoute: () => admin, path: "cms/blog/$id", component: CmsBlogEditorRoute });
const adminRoutes = [
  createRoute({ getParentRoute: () => admin, path: "/", beforeLoad: () => { throw redirect({ to: "/admin/dashboard" }); } }),
  a("dashboard", AdminDashboard), a("customers", AdminCustomers), a("products", AdminProducts), a("categories", AdminCategories), a("domains", AdminDomains), a("registrars", AdminRegistrars),
  a("hosting", AdminHosting), a("vps", AdminVps), a("servers", AdminServers), a("orders", AdminOrders), a("invoices", AdminInvoices), a("payments", AdminPayments), a("subscriptions", AdminSubscriptions),
  a("tickets", AdminTickets), a("support", AdminSupportDepartments), a("cms/pages", CmsPagesList), pageEditor, a("cms/blog", CmsBlogList), postEditor, a("cms/menus", CmsMenus), a("cms/media", CmsMedia),
  a("seo", AdminSeo), a("coupons", AdminCoupons), a("resellers", AdminResellers), a("analytics", AdminAnalytics), a("providers", AdminProviders), a("settings", AdminSettings), a("security", AdminSecurity), a("audit-logs", AdminAuditLogs),
] as const;

export const routeTree = rootRoute.addChildren([
  site.addChildren([...siteRoutes]),
  client.addChildren([...clientRoutes]),
  reseller.addChildren([...resellerRoutes]),
  admin.addChildren([...adminRoutes]),
]);

export function createAppRouter(opts?: { history?: Parameters<typeof createRouter>[0]["history"] }) {
  return createRouter({ routeTree, defaultPreload: "intent", scrollRestoration: true, history: opts?.history });
}

declare module "@tanstack/react-router" {
  interface Register { router: ReturnType<typeof createAppRouter> }
}
