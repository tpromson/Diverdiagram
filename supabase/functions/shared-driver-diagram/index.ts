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
  const shareToken = url.searchParams.get("share");

  if (!shareToken) {
    return new Response(JSON.stringify({ error: "Missing share token." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
