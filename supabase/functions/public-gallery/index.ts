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

  const url = new URL(req.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset") || "0"));
  const limit = Math.min(24, Math.max(1, Number(url.searchParams.get("limit") || "12")));

  const { data: rows, error } = await supabaseAdmin
    .from("shared_driver_diagrams")
    .select(
      "share_token, title, purpose_title, diagram_data, mermaid_code, shared_at, expires_at, revoked_at, is_public_gallery, gallery_submitted_at, gallery_submitter_name, gallery_hidden_at"
    )
    .eq("is_public_gallery", true)
    .is("revoked_at", null)
    .is("gallery_hidden_at", null)
    .order("gallery_submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

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

  return new Response(JSON.stringify({ items, hasMore: (rows || []).length === limit, nextOffset: offset + items.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
