import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const ibgeCodes = url.searchParams.get("ibge_codes");

    if (!ibgeCodes) {
      return new Response(
        JSON.stringify({
          error: "Parâmetro 'ibge_codes' é obrigatório. Ex: ?ibge_codes=3304557,3550308,4106902",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const codes = ibgeCodes.split(",").map((c) => c.trim()).slice(0, 10);

    if (codes.length === 0 || codes.some((c) => !/^\d{7}$/.test(c))) {
      return new Response(
        JSON.stringify({
          error: "Cada código IBGE deve conter exatamente 7 dígitos numéricos.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: municipios, error: munError } = await supabase
      .from("vw_comparativo_municipal")
      .select("*")
      .in("municipio_ibge", codes);

    if (munError) throw munError;

    const { data: selos, error: seloError } = await supabase
      .from("benchmark_selos")
      .select("tipo_selo, descricao, data_concessao, ano_referencia")
      .in("municipio_ibge", codes)
      .eq("ativo", true);

    if (seloError) throw seloError;

    // Build response grouped by municipality
    const result = (municipios || []).map((m: any) => ({
      municipio_ibge: m.municipio_ibge,
      nome_municipio: m.nome_municipio,
      uf: m.uf,
      populacao: m.populacao,
      metricas: {
        eficiencia_coleta_seletiva: Number(m.eficiencia_coleta_seletiva),
        engajamento_cidadao: Number(m.engajamento_cidadao),
        pontos_coleta_por_km2: Number(m.pontos_coleta_por_km2),
        taxa_desvio_aterro: Number(m.taxa_desvio_aterro),
        kg_per_capita: Number(m.kg_per_capita),
        volume_reciclado_ton: Number(m.volume_reciclado_ton),
        volume_coletado_ton: Number(m.volume_coletado_ton),
      },
      selos: (selos || [])
        .filter((s: any) => s.municipio_ibge === m.municipio_ibge)
        .map((s: any) => ({
          tipo_selo: s.tipo_selo,
          descricao: s.descricao,
          data_concessao: s.data_concessao,
        })),
      ano_referencia: m.ano_referencia,
    }));

    const notFound = codes.filter(
      (c) => !municipios?.some((m: any) => m.municipio_ibge === c)
    );

    return new Response(
      JSON.stringify({
        data: result,
        meta: {
          total: result.length,
          codigos_nao_encontrados: notFound,
          timestamp: new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("comparar-municipios error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor. Tente novamente mais tarde." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
