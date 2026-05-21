import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: { shareToken?: string; reporterEmail?: string; reason?: string } = {};

  try {
    payload = await req.json();
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const shareToken = String(payload.shareToken || "").trim();
  const reporterEmail = String(payload.reporterEmail || "").trim();
  const reason = String(payload.reason || "").trim();

  if (!shareToken) {
    return new Response(JSON.stringify({ error: "Missing share token." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: sharedRow, error: sharedError } = await supabaseAdmin
    .from("shared_driver_diagrams")
    .select("share_token")
    .eq("share_token", shareToken)
    .eq("is_public_gallery", true)
    .is("revoked_at", null)
    .maybeSingle();

  if (sharedError || !sharedRow) {
    return new Response(JSON.stringify({ error: "Gallery item not found." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error } = await supabaseAdmin.from("gallery_item_reports").insert({
    share_token: shareToken,
    reporter_email: reporterEmail,
    reason,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message || "Unable to save report." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
