import { pleskAdapter } from "./plesk.ts";
import { openproviderAdapter, namecheapAdapter, ovhAdapter } from "./registrars.ts";
import { proxmoxAdapter, stripeAdapter, resendAdapter, cmiAdapter } from "./infrastructure.ts";
import type { ProviderAdapter, ProviderCategory } from "./types.ts";
const adapters: Partial<Record<ProviderCategory, ProviderAdapter>> = { plesk: pleskAdapter };
export function getProviderAdapter(category: ProviderCategory, providerKey?: string): ProviderAdapter | null {
  if (category === "registrar") return ({ openprovider: openproviderAdapter, namecheap: namecheapAdapter, ovh: ovhAdapter } as Record<string, ProviderAdapter>)[providerKey ?? ""] ?? null;
  if (category === "payment") return ({ cmi: cmiAdapter, stripe: stripeAdapter } as Record<string, ProviderAdapter>)[providerKey ?? ""] ?? null;
  if (category === "hypervisor" && providerKey === "proxmox") return proxmoxAdapter;
  if (category === "email" && providerKey === "resend") return resendAdapter;
  return adapters[category] ?? null;
}
