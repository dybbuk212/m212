export type ProviderCategory = "registrar" | "plesk" | "hypervisor" | "dns" | "payment" | "email" | "storage";
export type ProviderEnvironment = "sandbox" | "production";
export type ProviderConnection = {
  id: string; provider_key: string; category: ProviderCategory; environment: ProviderEnvironment;
  endpoint_url: string | null; account_reference: string | null; username: string | null;
  secret_id: string | null; config: Record<string, unknown>;
};
export type AdapterTestResult = {
  ok: boolean; provider: string; checkedAt: string; capabilities: string[];
  account?: Record<string, unknown>; errorCode?: string;
};
export interface ProviderAdapter {
  readonly category: ProviderCategory;
  test(connection: ProviderConnection, secret: string): Promise<AdapterTestResult>;
}
function isPrivateIp(address: string): boolean {
  const ip = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (ip === "::1" || ip === "::" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:") || ip.startsWith("::ffff:")) return true;
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a,b] = parts;
  return a === 0 || a === 10 || a === 127 || a === 169 && b === 254 ||
    a === 172 && b >= 16 && b <= 31 || a === 192 && b === 168 ||
    a >= 224 || a === 100 && b >= 64 && b <= 127;
}
export async function validatePublicHttpsEndpoint(raw: string | null): Promise<URL> {
  if (!raw) throw new Error("provider_endpoint_missing");
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("provider_endpoint_invalid"); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("provider_endpoint_https_required");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.endsWith(".lan") || host === "metadata.google.internal" || isPrivateIp(host)) {
    throw new Error("provider_endpoint_private_address_blocked");
  }
  // Resolve immediately before the outbound request and fail closed on private/reserved answers.
  let addresses: string[] = [];
  try {
    const [a, aaaa] = await Promise.all([
      Deno.resolveDns(host, "A").catch(() => [] as string[]),
      Deno.resolveDns(host, "AAAA").catch(() => [] as string[]),
    ]);
    addresses = [...a, ...aaaa];
  } catch { throw new Error("provider_endpoint_dns_validation_failed"); }
  if (addresses.length === 0 || addresses.some(isPrivateIp)) throw new Error("provider_endpoint_private_or_unresolved_host");
  return url;
}
