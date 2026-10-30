import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function tentar(url: string) {
  const r = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  if (r.status === 404) return { notFound: true };
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return { data: await r.json() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!req.headers.get("Authorization")) return json({ error: "Não autenticado" }, 401);
  let cnpj = ""; let fonte = "";
  try { const b = await req.json(); cnpj = String(b.cnpj ?? "").replace(/\D/g, ""); fonte = String(b.fonte ?? ""); } catch { /* */ }
  if (!/^\d{14}$/.test(cnpj)) return json({ error: "CNPJ deve ter 14 dígitos" }, 400);

  // 1) OpenCNPJ  2) Minha Receita (fallback)
  if (fonte !== "minhareceita") try {
    const r = await tentar(`https://api.opencnpj.org/${cnpj}`);
    if (r.data) {
      const d = r.data;
      return json({ fonte: "OpenCNPJ", cnpj, razao_social: d.razao_social, nome_fantasia: d.nome_fantasia,
        situacao: d.situacao_cadastral, municipio: d.municipio, uf: d.uf,
        cnae: d.cnaes?.find((c: any) => c.is_principal)?.descricao ?? d.cnae_principal,
        email: d.email ?? null, telefone: d.telefones?.[0] ? `${d.telefones[0].ddd ?? ""}${d.telefones[0].numero ?? ""}` : null });
    }
  } catch (_) { /* fallback */ }
  try {
    const r = await tentar(`https://minhareceita.org/${cnpj}`);
    if (r.notFound) return json({ error: "CNPJ não encontrado na Receita Federal" }, 404);
    const d = r.data;
    return json({ fonte: "Minha Receita", cnpj, razao_social: d.razao_social, nome_fantasia: d.nome_fantasia,
      situacao: d.descricao_situacao_cadastral, municipio: d.municipio, uf: d.uf, cnae: d.cnae_fiscal_descricao,
      email: d.email ?? null, telefone: d.ddd_telefone_1 || null });
  } catch (e) {
    return json({ error: `Serviços de consulta indisponíveis: ${(e as Error).message}` }, 502);
  }
});
