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

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { error: "Missing authorization token.", status: 401, user: null };
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { error: "Unable to verify this account.", status: 401, user: null };
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("gallery_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !adminRow) {
    return { error: "This account does not have moderation access.", status: 403, user: null };
  }

  return { error: "", status: 200, user };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const adminCheck = await requireAdmin(req);
  if (!adminCheck.user) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const offset = Math.max(0, Number(url.searchParams.get("offset") || "0"));
    const limit = Math.min(20, Math.max(1, Number(url.searchParams.get("limit") || "10")));

    const { data: reportRows, error: reportError } = await supabaseAdmin
      .from("gallery_item_reports")
      .select("id, share_token, reporter_email, reason, reported_at, resolved_at")
      .is("resolved_at", null)
      .order("reported_at", { ascending: false });

    if (reportError) {
      return new Response(JSON.stringify({ error: reportError.message || "Unable to load moderation reports." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reportByShareToken = new Map<string, any[]>();
    for (const row of reportRows || []) {
      const current = reportByShareToken.get(row.share_token) || [];
      current.push(row);
      reportByShareToken.set(row.share_token, current);
    }

    const reportedShareTokens = Array.from(reportByShareToken.keys());

    const { data: hiddenRows, error: hiddenError } = await supabaseAdmin
      .from("shared_driver_diagrams")
      .select("share_token, title, purpose_title, thumbnail_svg, gallery_submitter_name, is_public_gallery, gallery_hidden_at, gallery_hidden_reason, gallery_submitted_at")
      .not("gallery_hidden_at", "is", null)
      .order("gallery_hidden_at", { ascending: false });

    if (hiddenError) {
      return new Response(JSON.stringify({ error: hiddenError.message || "Unable to load hidden gallery items." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hiddenByToken = new Map((hiddenRows || []).map((row) => [row.share_token, row]));
    const combinedTokens = Array.from(new Set([...reportedShareTokens, ...hiddenByToken.keys()]));
    const pageTokens = combinedTokens.slice(offset, offset + limit);

    if (!pageTokens.length) {
      return new Response(JSON.stringify({ items: [], hasMore: false, nextOffset: offset }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: itemRows, error: itemError } = await supabaseAdmin
      .from("shared_driver_diagrams")
      .select("share_token, title, purpose_title, thumbnail_svg, gallery_submitter_name, is_public_gallery, gallery_hidden_at, gallery_hidden_reason, gallery_submitted_at")
      .in("share_token", pageTokens);

    if (itemError) {
      return new Response(JSON.stringify({ error: itemError.message || "Unable to load moderation items." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rowByToken = new Map((itemRows || []).map((row) => [row.share_token, row]));
    const items = pageTokens
      .map((token) => {
        const row = rowByToken.get(token) || hiddenByToken.get(token);
        if (!row) return null;
        const reports = (reportByShareToken.get(token) || []).slice(0, 5);
        return {
          ...row,
          report_count: (reportByShareToken.get(token) || []).length,
          recent_reports: reports,
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ items, hasMore: combinedTokens.length > offset + items.length, nextOffset: offset + items.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: { action?: string; shareToken?: string; note?: string } = {};
  try {
    payload = await req.json();
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const action = String(payload.action || "").trim();
  const shareToken = String(payload.shareToken || "").trim();
  const note = String(payload.note || "").trim();

  if (!action || !shareToken) {
    return new Response(JSON.stringify({ error: "Missing moderation action." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "hide") {
    const { error } = await supabaseAdmin
      .from("shared_driver_diagrams")
      .update({
        is_public_gallery: false,
        gallery_hidden_at: new Date().toISOString(),
        gallery_hidden_reason: note,
        gallery_hidden_by: adminCheck.user.id,
      })
      .eq("share_token", shareToken);

    if (error) {
      return new Response(JSON.stringify({ error: error.message || "Unable to hide this gallery item." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (action === "restore") {
    const { error } = await supabaseAdmin
      .from("shared_driver_diagrams")
      .update({
        is_public_gallery: true,
        gallery_hidden_at: null,
        gallery_hidden_reason: "",
        gallery_hidden_by: null,
      })
      .eq("share_token", shareToken);

    if (error) {
      return new Response(JSON.stringify({ error: error.message || "Unable to restore this gallery item." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (action === "hide" || action === "resolve_reports") {
    const { error } = await supabaseAdmin
      .from("gallery_item_reports")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: adminCheck.user.id,
        resolution_note: note,
      })
      .eq("share_token", shareToken)
      .is("resolved_at", null);

    if (error) {
      return new Response(JSON.stringify({ error: error.message || "Unable to resolve moderation reports." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
