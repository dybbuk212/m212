import { pleskAdapter } from "./plesk.ts";
import type { ProviderAdapter, ProviderCategory } from "./types.ts";

const adapters: Partial<Record<ProviderCategory, ProviderAdapter>> = {
  plesk: pleskAdapter,
};
export function getProviderAdapter(category: ProviderCategory): ProviderAdapter | null {
  return adapters[category] ?? null;
}
