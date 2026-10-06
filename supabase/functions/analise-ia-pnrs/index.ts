import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText } from "npm:ai";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};
const json = (b: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, ...extra, "Content-Type": "application/json" } });

const INSTRUCOES = `Você é um analista ambiental do SINARV que apoia a fiscalização da PNRS (Lei 12.305/2010, Decreto 10.936/2022).
Recebe, em JSON, o histórico de metas PNRS de um município, o balanço de massa (entradas x saídas por material) e os MTR do período.
Responda em português, em Markdown, com exatamente estas seções:
## Tendências
## Anomalias
## Prioridades de fiscalização
(lista numerada, da mais urgente à menos, cada uma com justificativa baseada nos números)
## Limitações dos dados
Use apenas os dados fornecidos; não invente valores. Seja objetivo (máximo ~400 palavras).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Não autenticado." }, 401);
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "Não autenticado." }, 401);
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!(roles ?? []).some((r: any) => r.role === "gov" || r.role === "super_admin")) {
      return json({ error: "Recurso exclusivo para analistas do governo." }, 403);
    }

    const body = await req.json();
    if (!body?.municipio || !body?.periodo) return json({ error: "Informe município e período." }, 400);
    const payload = JSON.stringify(body).slice(0, 60000);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "Serviço de IA não configurado." }, 500);

    let runId: string | undefined;
    let upstreamStatus = 200;
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input, init) => {
        const h = new Headers(init?.headers);
        if (runId) h.set("X-Lovable-AIG-Run-ID", runId);
        const r = await fetch(input, { ...init, headers: h });
        runId ??= r.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
        if (!r.ok) upstreamStatus = r.status;
        return r;
      },
    });

    let erro: unknown = null;
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: INSTRUCOES,
      messages: [{ role: "user", content: `Dados para análise (JSON):\n${payload}` }],
      abortSignal: req.signal,
      onError: ({ error }) => { erro = error; },
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "medium",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    let texto = "";
    for await (const t of result.textStream) texto += t;
    const extra = runId ? { "X-Lovable-AIG-Run-ID": runId } : {};

    if (erro || !texto.trim()) {
      const status = upstreamStatus >= 400 ? upstreamStatus : 502;
      const msg =
        status === 429 ? "Muitas solicitações. Aguarde alguns instantes e tente novamente." :
        status === 402 ? "Créditos de IA esgotados. Adicione créditos ao workspace para continuar." :
        status === 403 ? "Acesso ao modelo de IA negado para este workspace." :
        "Não foi possível gerar a análise.";
      console.error("analise-ia-pnrs", status, erro);
      return json({ error: msg }, status, extra);
    }
    return json({ analise: texto, modelo: "Lovable AI", gerado_em: new Date().toISOString() }, 200, extra);
  } catch (e) {
    if (req.signal.aborted) return json({ error: "Cancelado." }, 499);
    console.error(e);
    return json({ error: "Erro interno ao gerar a análise." }, 500);
  }
});
