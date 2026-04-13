import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = "admin@ana.gov.br";
  const password = "admin@123";

  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const existingUser = existing?.users?.find((u: any) => u.email === email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Administrador ANA" },
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    userId = data.user.id;
  }

  // Assign all roles
  const roles = ["gov", "cooperativa", "industria", "ponto_coleta"];
  for (const role of roles) {
    await supabase.from("user_roles").upsert(
      { user_id: userId, role },
      { onConflict: "user_id,role" }
    );
  }

  return new Response(JSON.stringify({ success: true, userId, email }), {
    headers: { "Content-Type": "application/json" },
  });
});
