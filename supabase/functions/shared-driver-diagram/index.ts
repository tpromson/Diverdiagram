import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 60;
const CLEANUP_RETENTION_HOURS = 24;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return req.headers.get("cf-connecting-ip") || "unknown";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const shareToken = url.searchParams.get("share");

  if (!shareToken) {
    return new Response(JSON.stringify({ error: "Missing share token." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isUuid(shareToken)) {
    return new Response(JSON.stringify({ error: "Invalid share token." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const clientIp = getClientIp(req);

  const { count, error: rateLimitError } = await supabaseAdmin
    .from("shared_driver_diagram_request_logs")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", clientIp)
    .gte("requested_at", new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString());

  if (rateLimitError) {
    return new Response(JSON.stringify({ error: "Unable to validate the share link right now." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const requestCount = count ?? 0;
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    return new Response(JSON.stringify({ error: "Too many requests. Please try again in a few minutes." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "600" },
    });
  }

  const { error: requestLogError } = await supabaseAdmin.from("shared_driver_diagram_request_logs").insert({
    ip_address: clientIp,
    share_token: shareToken,
  });

  if (requestLogError) {
    return new Response(JSON.stringify({ error: "Unable to validate the share link right now." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cleanupCutoff = new Date(Date.now() - CLEANUP_RETENTION_HOURS * 60 * 60 * 1000).toISOString();

  const cleanupPromise = Promise.all([
    supabaseAdmin
      .from("shared_driver_diagrams")
      .delete()
      .or(`revoked_at.lt.${cleanupCutoff},expires_at.lt.${cleanupCutoff}`),
    supabaseAdmin
      .from("shared_driver_diagram_request_logs")
      .delete()
      .lt("requested_at", cleanupCutoff),
  ]);

  const { data: row, error } = await supabaseAdmin
    .from("shared_driver_diagrams")
    .select("title, purpose_title, diagram_data, mermaid_code, shared_at, expires_at, revoked_at")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message || "Unable to load shared diagram." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!row || row.revoked_at) {
    return new Response(JSON.stringify({ error: "This shared link is unavailable." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
    return new Response(JSON.stringify({ error: "This shared link has expired." }), {
      status: 410,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  EdgeRuntime.waitUntil(cleanupPromise);

  return new Response(
    JSON.stringify({
      title: row.title,
      purpose_title: row.purpose_title,
      diagram_data: row.diagram_data,
      mermaid_code: row.mermaid_code,
      shared_at: row.shared_at,
      share_expires_at: row.expires_at,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
