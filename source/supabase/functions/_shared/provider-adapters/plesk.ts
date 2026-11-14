import { validatePublicHttpsEndpoint, type ProviderAdapter, type ProviderConnection, type AdapterTestResult } from "../_shared/provider-adapters/types.ts";

export const pleskAdapter: ProviderAdapter = {
  category: "plesk",
  async test(connection: ProviderConnection, secret: string): Promise<AdapterTestResult> {
    const base = validatePublicHttpsEndpoint(connection.endpoint_url);
    if (!secret || secret.length < 8) throw new Error("plesk_api_key_missing");
    const url = new URL("/api/v2/domains?limit=1", base);
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-API-Key": secret, Accept: "application/json", "Content-Type": "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      const errorCode = response.status === 401 || response.status === 403
        ? "plesk_authentication_failed"
        : response.status === 404 ? "plesk_rest_api_unavailable" : "plesk_api_request_failed";
      return { ok: false, provider: "plesk", checkedAt: new Date().toISOString(), capabilities: [], errorCode };
    }
    const body: unknown = await response.json().catch(() => null);
    if (!Array.isArray(body)) {
      return { ok: false, provider: "plesk", checkedAt: new Date().toISOString(), capabilities: [], errorCode: "plesk_unexpected_response" };
    }
    return {
      ok: true, provider: "plesk", checkedAt: new Date().toISOString(),
      capabilities: ["connection.test", "domains.read"],
      account: { endpointHost: base.hostname, sampleDomainCount: body.length },
    };
  },
};
