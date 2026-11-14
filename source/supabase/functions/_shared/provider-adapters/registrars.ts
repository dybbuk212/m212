import { validatePublicHttpsEndpoint, type ProviderAdapter, type ProviderConnection, type AdapterTestResult } from "./types.ts";

const checked = (provider: string, ok: boolean, capabilities: string[], errorCode?: string): AdapterTestResult =>
  ({ ok, provider, checkedAt: new Date().toISOString(), capabilities, ...(errorCode ? { errorCode } : {}) });
const request = async (url: URL, init: RequestInit = {}) => fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(10000) });
const json = (value: unknown) => value && typeof value === "object" ? value as Record<string, unknown> : {};

export const openproviderAdapter: ProviderAdapter = {
  category: "registrar",
  async test(c: ProviderConnection, secret: string) {
    if (c.environment !== "sandbox") throw new Error("sandbox_environment_required");
    const base = await validatePublicHttpsEndpoint(c.endpoint_url || "https://api.sandbox.openprovider.nl/v1beta");
    const [username, password] = [c.username, secret];
    if (!username || !password) throw new Error("openprovider_credentials_missing");
    const auth = await request(new URL("/v1beta/auth/login", base.origin), {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, ip: String(c.config.api_ip ?? "0.0.0.0") }),
    });
    if (!auth.ok) return checked("openprovider", false, [], auth.status === 401 ? "openprovider_auth_failed" : "openprovider_auth_http_error");
    const token = String(json(json(await auth.json()).data).token ?? "");
    if (!token) return checked("openprovider", false, [], "openprovider_token_missing");
    const probe = await request(new URL("/v1beta/domains/check", base.origin), {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ domains: [{ name: "m212-sandbox-probe", extension: "com" }] }),
    });
    return checked("openprovider", probe.ok, probe.ok ? ["connection.test", "domains.availability_check"] : [], probe.ok ? undefined : "openprovider_probe_failed");
  },
};

export const namecheapAdapter: ProviderAdapter = {
  category: "registrar",
  async test(c: ProviderConnection, secret: string) {
    if (c.environment !== "sandbox") throw new Error("sandbox_environment_required");
    const base = await validatePublicHttpsEndpoint(c.endpoint_url || "https://api.sandbox.namecheap.com/xml.response");
    const username = c.username || String(c.config.api_user ?? "");
    const clientIp = String(c.config.client_ip ?? "");
    if (!username || !clientIp || !secret) throw new Error("namecheap_credentials_or_client_ip_missing");
    const params = new URLSearchParams({ ApiUser: username, ApiKey: secret, UserName: username, ClientIp: clientIp, Command: "namecheap.users.getBalances" });
    const response = await request(new URL(`${base.pathname}?${params}`, base.origin));
    const xml = await response.text();
    const ok = response.ok && /<ApiResponse[^>]+Status="OK"/i.test(xml);
    return checked("namecheap", ok, ok ? ["connection.test", "account.balance.read"] : [], ok ? undefined : "namecheap_api_probe_failed");
  },
};

export const ovhAdapter: ProviderAdapter = {
  category: "registrar",
  async test(c: ProviderConnection, secret: string) {
    if (c.environment !== "sandbox") throw new Error("sandbox_environment_required");
    const base = await validatePublicHttpsEndpoint(c.endpoint_url || "https://eu.api.ovh.com/1.0");
    const appKey = String(c.config.application_key ?? "");
    const consumerKey = String(c.config.consumer_key ?? "");
    if (!appKey || !consumerKey || !secret) throw new Error("ovh_credentials_missing");
    const method = "GET", path = "/1.0/me", body = "", timestamp = String(Math.floor(Date.now()/1000));
    const sha = await crypto.subtle.digest("SHA-1", new TextEncoder().encode([secret, consumerKey, method, base.origin + path, body, timestamp].join("+")));
    const hex = [...new Uint8Array(sha)].map(x=>x.toString(16).padStart(2,"0")).join("");
    const response = await request(new URL(path, base.origin), { headers: {
      "X-Ovh-Application": appKey, "X-Ovh-Consumer": consumerKey, "X-Ovh-Timestamp": timestamp,
      "X-Ovh-Signature": `$1$${hex}`, Accept: "application/json",
    }});
    return checked("ovh", response.ok, response.ok ? ["connection.test", "account.profile.read"] : [], response.ok ? undefined : "ovh_api_probe_failed");
  },
};
