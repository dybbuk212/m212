/** Shared navigation contract. Role filtering is presentation only; route/API authorization remains authoritative. */
export type M212Workspace = "public" | "customer" | "reseller" | "admin" | "super_admin";
export type M212NavigationItem = {
  id: string;
  label: string;
  href: string;
  workspaces: readonly M212Workspace[];
  children?: readonly Omit<M212NavigationItem, "workspaces">[];
};

export const PUBLIC_PRIMARY_NAV: readonly M212NavigationItem[] = [
  { id: "domains", label: "Domaines", href: "/domains", workspaces: ["public", "customer", "reseller", "admin", "super_admin"] },
  { id: "hosting", label: "Hébergement", href: "/hosting", workspaces: ["public", "customer", "reseller", "admin", "super_admin"] },
  { id: "servers", label: "Serveurs", href: "/vps", workspaces: ["public", "customer", "reseller", "admin", "super_admin"] },
  { id: "security-email", label: "Sécurité & Email", href: "/ssl", workspaces: ["public", "customer", "reseller", "admin", "super_admin"] },
  { id: "pricing", label: "Tarifs", href: "/pricing", workspaces: ["public", "customer", "reseller", "admin", "super_admin"] },
  { id: "support", label: "Support", href: "/support", workspaces: ["public", "customer", "reseller", "admin", "super_admin"] },
];

export function navigationForWorkspace(workspace: M212Workspace) {
  return PUBLIC_PRIMARY_NAV.filter((item) => item.workspaces.includes(workspace));
}
