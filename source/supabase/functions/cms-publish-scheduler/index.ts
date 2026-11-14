// Supabase Edge Function: publish due CMS content.
// Schedule this endpoint with Supabase Cron or an external scheduler.
// Required secret: CMS_SCHEDULER_SECRET (never expose it in VITE_* variables).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "content-type": "application/json", "cache-control": "no-store" };
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
  const expected = Deno.env.get("CMS_SCHEDULER_SECRET");
  const supplied = req.headers.get("x-cms-scheduler-secret");
  if (!expected || !supplied || supplied.length !== expected.length ||
      !crypto.subtle.timingSafeEqual(new TextEncoder().encode(supplied), new TextEncoder().encode(expected))) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return new Response("Server configuration incomplete", { status: 503, headers: cors });

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date().toISOString();
  const results = await Promise.all([
    supabase.from("cms_pages").update({ status: "published", published_at: now, updated_at: now })
      .eq("status", "approved").not("publish_at", "is", null).lte("publish_at", now).select("id"),
    supabase.from("cms_posts").update({ status: "published", published_at: now, updated_at: now })
      .eq("status", "approved").not("publish_at", "is", null).lte("publish_at", now).select("id"),
  ]);
  const errors = results.filter((r) => r.error);
  if (errors.length) return new Response(JSON.stringify({ error: "Publishing failed", details: errors.map((e) => e.error?.message) }), { status: 500, headers: cors });
  return new Response(JSON.stringify({ pagesPublished: results[0].data?.length ?? 0, postsPublished: results[1].data?.length ?? 0, executedAt: now }), { status: 200, headers: cors });
});
