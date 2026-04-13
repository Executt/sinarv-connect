import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Validate caller JWT
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: corsHeaders });
  }

  const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
  }

  // Check caller has gov role
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: callerRoles } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id);
  const isGov = callerRoles?.some((r: any) => r.role === "gov");
  if (!isGov) {
    return new Response(JSON.stringify({ error: "Forbidden: gov role required" }), { status: 403, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // LIST USERS
  if (req.method === "GET" || action === "list") {
    const { data: authUsers } = await adminClient.auth.admin.listUsers({ perPage: 500 });
    const { data: allRoles } = await adminClient.from("user_roles").select("*");
    const { data: profiles } = await adminClient.from("profiles").select("*");

    const users = (authUsers?.users || []).map((u: any) => {
      const profile = profiles?.find((p: any) => p.user_id === u.id);
      const roles = (allRoles || []).filter((r: any) => r.user_id === u.id).map((r: any) => r.role);
      return {
        id: u.id,
        email: u.email,
        display_name: profile?.display_name || u.user_metadata?.display_name || "",
        created_at: u.created_at,
        roles,
      };
    });

    return new Response(JSON.stringify({ users }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // MANAGE ROLES (POST)
  if (req.method === "POST") {
    const body = await req.json();
    const { user_id, role, action: roleAction } = body;

    if (!user_id || !role || !["add", "remove"].includes(roleAction)) {
      return new Response(JSON.stringify({ error: "user_id, role, and action (add|remove) required" }), { status: 400, headers: corsHeaders });
    }

    const validRoles = ["gov", "cooperativa", "industria", "ponto_coleta"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400, headers: corsHeaders });
    }

    if (roleAction === "add") {
      const { error } = await adminClient.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id,role" });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    } else {
      const { error } = await adminClient.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
});
