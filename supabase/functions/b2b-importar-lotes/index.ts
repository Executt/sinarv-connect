import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const LoteSchema = z.object({
  cooperativa_cnpj: z.string().min(1),
  cooperativa_nome: z.string().optional(),
  tipo_material: z.string().min(1),
  peso_kg: z.number().positive(),
  numero_nota_fiscal: z.string().min(1),
  chave_nfe: z.string().optional(),
  token_rastreabilidade: z.string().uuid().optional(),
});

const BodySchema = z.object({
  industria_cnpj: z.string().min(1),
  lotes: z.array(LoteSchema).min(1).max(100),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth via API key header
    const apiKey = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "api_key_ausente", message: "Header Authorization com Bearer token é obrigatório" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate body
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "payload_invalido", details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { industria_cnpj, lotes } = parsed.data;

    // Lookup API credential
    const keyPrefix = apiKey.substring(0, 14);
    const { data: cred, error: credErr } = await supabase
      .from("v_api_credential")
      .select("*")
      .eq("api_key_prefix", keyPrefix)
      .eq("status", "Ativa")
      .single();

    if (credErr || !cred) {
      return new Response(
        JSON.stringify({ error: "api_key_invalida", message: "Chave de API não encontrada ou revogada" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const industriaId = (cred as any).industria_id;

    // Process each lote
    const results: any[] = [];
    const errors: any[] = [];

    for (const lote of lotes) {
      let tokenValidado = false;

      // Validate token if provided
      if (lote.token_rastreabilidade) {
        const { data: tokenData } = await supabase.rpc("fn_validar_token_rastreabilidade", {
          p_token: lote.token_rastreabilidade,
        });
        tokenValidado = tokenData?.[0]?.valido === true;
        if (!tokenValidado) {
          errors.push({
            nota_fiscal: lote.numero_nota_fiscal,
            error: "token_rastreabilidade_invalido",
            message: `Token ${lote.token_rastreabilidade} não encontrado nos despachos de cooperativas`,
          });
          continue;
        }
      }

      // Insert lote
      const { data: inserted, error: insertErr } = await supabase
        .from("v_lote_recebido")
        .insert({
          industria_id: industriaId,
          cooperativa_cnpj: lote.cooperativa_cnpj,
          cooperativa_nome: lote.cooperativa_nome || null,
          tipo_material: lote.tipo_material,
          peso_kg: lote.peso_kg,
          numero_nota_fiscal: lote.numero_nota_fiscal,
          chave_nfe: lote.chave_nfe || null,
          token_rastreabilidade: lote.token_rastreabilidade || null,
          token_validado: tokenValidado,
          status: "Pendente",
          origem_importacao: "API",
        })
        .select()
        .single();

      if (insertErr) {
        errors.push({
          nota_fiscal: lote.numero_nota_fiscal,
          error: "erro_insercao",
          message: insertErr.message,
        });
      } else {
        results.push({ id: (inserted as any).id, nota_fiscal: lote.numero_nota_fiscal, token_validado: tokenValidado });
      }
    }

    // Log the API call
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    await supabase.from("v_api_log").insert({
      industria_id: industriaId,
      credential_id: (cred as any).id,
      endpoint: "/api/v1/b2b/industria/importar-lotes",
      method: "POST",
      status_code: errors.length === lotes.length ? 422 : 200,
      request_summary: `${lotes.length} lotes, ${lotes.reduce((s, l) => s + l.peso_kg, 0)} kg total`,
      response_summary: JSON.stringify({ success: results.length, errors: errors.length }),
      ip_address: ip,
    });

    // Update last used
    await supabase
      .from("v_api_credential")
      .update({ ultimo_uso: new Date().toISOString() } as any)
      .eq("id", (cred as any).id);

    const statusCode = errors.length === lotes.length ? 422 : 200;
    return new Response(
      JSON.stringify({
        success: results.length > 0,
        lotes_criados: results.length,
        lotes_rejeitados: errors.length,
        resultados: results,
        erros: errors,
      }),
      { status: statusCode, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("B2B import error:", err);
    return new Response(
      JSON.stringify({ error: "erro_interno", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
