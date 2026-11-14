export type ProviderCategory = "registrar" | "plesk" | "hypervisor" | "dns" | "payment" | "email" | "storage";
export type ProviderEnvironment = "sandbox" | "production";
export type ProviderConnection = {
  id: string;
  provider_key: string;
  category: ProviderCategory;
  environment: ProviderEnvironment;
  endpoint_url: string | null;
  account_reference: string | null;
  username: string | null;
  secret_id: string | null;
  config: Record<string, unknown>;
};
export type AdapterTestResult = {
  ok: boolean;
  provider: string;
  checkedAt: string;
  capabilities: string[];
  account?: Record<string, unknown>;
  errorCode?: string;
};
export interface ProviderAdapter {
  readonly category: ProviderCategory;
  test(connection: ProviderConnection, secret: string): Promise<AdapterTestResult>;
}
export function validatePublicHttpsEndpoint(raw: string | null): URL {
  if (!raw) throw new Error("provider_endpoint_missing");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("provider_endpoint_invalid"); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("provider_endpoint_https_required");
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.endsWith(".lan") || host === "metadata.google.internal" ||
      /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) {
    throw new Error("provider_endpoint_private_address_blocked");
  }
  return url;
}
