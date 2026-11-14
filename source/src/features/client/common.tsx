import { useSession } from "@/lib/auth";
import { useDb } from "@/lib/store";
import { DEMO_CUSTOMER_ID } from "@/data/seed";

export function useCustomerData() {
  const session = useSession();
  const data = useDb();
  const customerId = session?.customerId ?? DEMO_CUSTOMER_ID;
  return {
    data, customerId, customer: data.customers.find((c) => c.id === customerId),
    domains: data.domains.filter((d) => d.customerId === customerId),
    hosting: data.hosting.filter((h) => h.customerId === customerId),
    vps: data.vps.filter((v) => v.customerId === customerId),
    servers: data.servers.filter((s) => s.customerId === customerId),
    orders: data.orders.filter((o) => o.customerId === customerId).sort((a, b) => b.date.localeCompare(a.date)),
    invoices: data.invoices.filter((i) => i.customerId === customerId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    payments: data.payments.filter((p) => p.customerId === customerId),
    tickets: data.tickets.filter((t) => t.customerId === customerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    notifications: data.notifications.filter((n) => n.customerId === customerId).sort((a, b) => b.at.localeCompare(a.at)),
  };
}

export function daysUntil(iso: string) { return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000); }
