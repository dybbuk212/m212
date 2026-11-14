import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getProviderAdapter } from "../_shared/provider-adapters/registry.ts";
import type { ProviderCategory, ProviderConnection } from "../_shared/provider-adapters/types.ts";

const allowedOrigins = (Deno.env.get("ADMIN_DASHBOARD_ORIGINS") ?? "https://m212.ma,https://m212-1gk.pages.dev")
  .split(",").map((value) => value.trim()).filter(Boolean);
const cors = (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  return {
    ...(allowedOrigins.includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
};
const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store" } });
const allowedCategories = new Set(["registrar", "plesk", "hypervisor", "dns", "payment", "email", "storage"]);
const allowedEnvironments = new Set(["sandbox", "production"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (!["GET", "POST"].includes(req.method)) return json(req, 405, { error: "method_not_allowed" });
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json(req, 401, { error: "authentication_required" });
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json(req, 503, { error: "server_configuration_missing" });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json(req, 401, { error: "invalid_session" });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: membership, error: membershipError } = await admin
    .from("cms_memberships").select("role").eq("user_id", userData.user.id).maybeSingle();
  if (membershipError) return json(req, 503, { error: "authorization_check_failed" });
  if (!membership || !["super_admin", "admin"].includes(membership.role)) return json(req, 403, { error: "administrator_role_required" });

  if (req.method === "GET") {
    const { data, error } = await admin.from("provider_connections")
      .select("id,provider_key,display_name,category,environment,endpoint_url,account_reference,username,config,status,last_tested_at,last_error_code,created_at,updated_at")
      .order("category").order("display_name");
    if (error) return json(req, 500, { error: "provider_list_failed" });
    return json(req, 200, { connections: data ?? [] });
  }

  let input: Record<string, unknown>;
  try { input = await req.json(); } catch { return json(req, 400, { error: "invalid_json" }); }
  if (input.action === "save") {
    const providerKey = String(input.provider_key ?? "").trim().toLowerCase();
    const displayName = String(input.display_name ?? "").trim();
    const category = String(input.category ?? "");
    const environment = String(input.environment ?? "sandbox");
    const endpoint = input.endpoint_url ? String(input.endpoint_url).trim() : null;
    const accountReference = input.account_reference ? String(input.account_reference).trim() : null;
    const username = input.username ? String(input.username).trim() : null;
    const secret = typeof input.secret === "string" ? input.secret : "";
    const config = input.config && typeof input.config === "object" && !Array.isArray(input.config) ? input.config : {};
    if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(providerKey) || displayName.length < 2 || displayName.length > 120 ||
        !allowedCategories.has(category) || !allowedEnvironments.has(environment)) return json(req, 422, { error: "invalid_provider_metadata" });
    if (endpoint) {
      try {
        const url = new URL(endpoint);
        if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) return json(req, 422, { error: "https_endpoint_required" });
      } catch { return json(req, 422, { error: "invalid_endpoint_url" }); }
    }
    if (secret && secret.length < 8) return json(req, 422, { error: "secret_too_short" });
    if (JSON.stringify(config).length > 8000) return json(req, 422, { error: "config_too_large" });
    let secretId: string | null = null;
    if (secret) {
      const { data: storedSecret, error: secretError } = await admin.rpc("provider_store_secret", {
        p_secret: secret, p_name: `m212:${category}:${providerKey}:${displayName}`,
        p_description: `M212 provider credential; environment=${environment}`,
      });
      if (secretError || !storedSecret) return json(req, 500, { error: "vault_secret_store_failed" });
      secretId = storedSecret as string;
    }
    const record: Record<string, unknown> = {
      provider_key: providerKey, display_name: displayName, category, environment,
      endpoint_url: endpoint, account_reference: accountReference, username, config,
      status: secret || input.id ? "configured" : "not_verified",
      updated_by: userData.user.id, updated_at: new Date().toISOString(),
    };
    if (secretId) record.secret_id = secretId;
    if (input.id) record.id = String(input.id);
    else record.created_by = userData.user.id;
    const { data, error } = await admin.from("provider_connections").upsert(record, { onConflict: "id" })
      .select("id,provider_key,display_name,category,environment,endpoint_url,account_reference,username,config,status,last_tested_at,last_error_code,updated_at")
      .single();
    if (error) return json(req, 500, { error: "provider_save_failed" });
    await admin.from("cms_audit_logs").insert({
      actor_id: userData.user.id, action: "provider.configuration.saved",
      entity_type: "provider_connection", entity_id: String(data.id),
      metadata: { category, provider_key: providerKey, environment, secret_updated: Boolean(secret) },
    });
    return json(req, 200, { connection: data, secret_saved: Boolean(secret), message: "Configuration saved. Run a read-only sandbox connection test before enabling provisioning." });
  }

  if (input.action === "test") {
    const id = String(input.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json(req, 422, { error: "invalid_connection_id" });
    const { data: connection, error } = await admin.from("provider_connections")
      .select("id,provider_key,category,environment,endpoint_url,account_reference,username,secret_id,config")
      .eq("id", id).maybeSingle();
    if (error || !connection) return json(req, 404, { error: "provider_connection_not_found" });
    const adapter = getProviderAdapter(connection.category as ProviderCategory);
    if (!adapter) return json(req, 409, {
      error: "provider_adapter_not_available",
      message: `No adapter is installed for ${connection.category}. Add the provider vendor/model before testing or provisioning.`,
    });
    if (!connection.secret_id) return json(req, 422, { error: "provider_secret_missing" });
    const { data: secret, error: secretError } = await admin.rpc("provider_get_secret", { p_secret_id: connection.secret_id });
    if (secretError || typeof secret !== "string" || !secret) return json(req, 500, { error: "provider_secret_retrieval_failed" });
    let result;
    try {
      result = await adapter.test(connection as ProviderConnection, secret);
    } catch (error) {
      const code = error instanceof Error ? error.message : "provider_test_failed";
      result = { ok: false, provider: connection.category, checkedAt: new Date().toISOString(), capabilities: [], errorCode: code };
    }
    const nextStatus = result.ok ? "verified" : "error";
    await admin.from("provider_connections").update({
      status: nextStatus, last_tested_at: result.checkedAt, last_error_code: result.errorCode ?? null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    await admin.from("cms_audit_logs").insert({
      actor_id: userData.user.id, action: result.ok ? "provider.connection.verified" : "provider.connection.test_failed",
      entity_type: "provider_connection", entity_id: id,
      metadata: { category: connection.category, environment: connection.environment, error_code: result.errorCode ?? null, capabilities: result.capabilities },
    });
    return json(req, result.ok ? 200 : 502, { result });
  }
  return json(req, 400, { error: "unsupported_action" });
});
