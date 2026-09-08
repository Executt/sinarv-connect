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

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: callerRoles } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id);
  const isSuperAdmin = callerRoles?.some((r: any) => r.role === "super_admin") ?? false;
  const isGov = isSuperAdmin || (callerRoles?.some((r: any) => r.role === "gov") ?? false);
  if (!isGov) {
    return new Response(JSON.stringify({ error: "Forbidden: gov or super_admin role required" }), { status: 403, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Get caller IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") || "unknown";

  // LIST USERS
  if (req.method === "GET" && (!action || action === "list")) {
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

  // GET AUDIT LOGS
  if (req.method === "GET" && action === "audit-logs") {
    const { data: logs, error } = await adminClient
      .from("role_audit_logs")
      .select("*")
      .order("performed_at", { ascending: false })
      .limit(200);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    // Enrich with user emails
    const userIds = [...new Set([
      ...(logs || []).map((l: any) => l.user_id),
      ...(logs || []).map((l: any) => l.performed_by),
    ])];

    const { data: profiles } = await adminClient.from("profiles").select("user_id, email, display_name");
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const enriched = (logs || []).map((l: any) => ({
      ...l,
      user_email: profileMap.get(l.user_id)?.email || l.user_id,
      performed_by_email: profileMap.get(l.performed_by)?.email || l.performed_by,
    }));

    return new Response(JSON.stringify({ logs: enriched }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // MANAGE ROLES (POST)
  if (req.method === "POST") {
    const body = await req.json();
    const { user_id, role, action: roleAction } = body;

    if (!user_id || !role || !["add", "remove"].includes(roleAction)) {
      return new Response(JSON.stringify({ error: "user_id, role, and action (add|remove) required" }), { status: 400, headers: corsHeaders });
    }

    // R-IA-03: papéis administrativos só podem ser concedidos/removidos por super_admin.
    const validRoles = ["gov", "cooperativa", "industria", "ponto_coleta", "super_admin"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400, headers: corsHeaders });
    }
    if ((role === "super_admin" || role === "gov") && !isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: only super_admin can manage gov/super_admin roles" }), { status: 403, headers: corsHeaders });
    }

    if (roleAction === "add") {
      const { error } = await adminClient.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id,role" });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    } else {
      // Nunca remover o último administrador do sistema
      if (role === "super_admin" || role === "gov") {
        const { count } = await adminClient
          .from("user_roles").select("id", { count: "exact", head: true }).eq("role", role);
        if ((count ?? 0) <= 1) {
          return new Response(JSON.stringify({ error: `Não é possível remover o último usuário com papel ${role}` }), { status: 409, headers: corsHeaders });
        }
      }
      const { error } = await adminClient.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
    }

    // Log the audit entry
    await adminClient.from("role_audit_logs").insert({
      user_id,
      role,
      action: roleAction,
      performed_by: caller.id,
      ip_address: clientIp,
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
});
