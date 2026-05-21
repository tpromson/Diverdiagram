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

  const { data: rows, error } = await supabaseAdmin
    .from("shared_driver_diagrams")
    .select(
      "share_token, title, purpose_title, diagram_data, mermaid_code, shared_at, expires_at, revoked_at, is_public_gallery, gallery_submitted_at, gallery_submitter_name"
    )
    .eq("is_public_gallery", true)
    .is("revoked_at", null)
    .order("gallery_submitted_at", { ascending: false })
    .limit(60);

  if (error) {
    return new Response(JSON.stringify({ error: error.message || "Unable to load gallery items." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const items = (rows || []).filter((row) => {
    if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
      return false;
    }
    return true;
  });

  return new Response(JSON.stringify({ items }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
