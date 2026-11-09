import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const sb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u, error: ue } = await sb.auth.getUser(auth.slice(7));
  if (ue || !u?.user) return json({ error: "Sessão inválida" }, 401);
  const { data: isAdmin } = await sb.rpc("has_role", { _user_id: u.user.id, _role: "super_admin" });
  if (!isAdmin) return json({ error: "Apenas superadmin" }, 403);

  let id = "";
  try { id = String((await req.json()).id ?? ""); } catch { /* */ }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "id inválido" }, 400);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: cfg } = await admin.from("ai_proxy_config").select("*").eq("id", id).maybeSingle();
  if (!cfg) return json({ error: "Configuração não encontrada" }, 404);

  let ok = false; let msg = "";
  // Só lê secrets com prefixo AI_PROXY_ (garantido também por CHECK na tabela)
  const key = cfg.secret_name && /^AI_PROXY_[A-Z0-9_]+$/.test(cfg.secret_name) ? Deno.env.get(cfg.secret_name) : undefined;
  if (cfg.secret_name && !key) msg = `Chave ${cfg.secret_name} não cadastrada nos secrets`;
  else try {
    const base = String(cfg.base_url).replace(/\/+$/, "");
    const r = await fetch(`${base}/v1/models`, {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      ok = true; msg = `Conectado: ${Array.isArray(d?.data) ? d.data.length : 0} modelo(s) disponível(is)`;
    } else msg = `Proxy respondeu HTTP ${r.status}`;
  } catch (e) { msg = `Falha de conexão: ${(e as Error).message}`; }

  await admin.from("ai_proxy_config").update({ ultimo_teste_em: new Date().toISOString(), ultimo_teste_ok: ok, ultimo_teste_msg: msg }).eq("id", id);
  return json({ ok, msg });
});
