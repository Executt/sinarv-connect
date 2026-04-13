import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Catadores Associados ───
export const useCatadoresAssociados = (cooperativaId?: string) =>
  useQuery({
    queryKey: ["v_catador_associado", cooperativaId],
    queryFn: async () => {
      let q = supabase
        .from("v_catador_associado" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (cooperativaId) q = q.eq("cooperativa_id", cooperativaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── Licenças ───
export const useLicencasCooperativa = (cooperativaId?: string) =>
  useQuery({
    queryKey: ["v_licenca_cooperativa", cooperativaId],
    queryFn: async () => {
      let q = supabase
        .from("v_licenca_cooperativa" as any)
        .select("*")
        .order("data_validade", { ascending: true });
      if (cooperativaId) q = q.eq("cooperativa_id", cooperativaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── Estoque ───
export const useEstoqueCooperativa = (cooperativaId?: string) =>
  useQuery({
    queryKey: ["v_estoque_cooperativa", cooperativaId],
    queryFn: async () => {
      let q = supabase
        .from("v_estoque_cooperativa" as any)
        .select("*")
        .order("tipo_material", { ascending: true });
      if (cooperativaId) q = q.eq("cooperativa_id", cooperativaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── Despachos para Indústria ───
export const useDespachosIndustria = (cooperativaId?: string) =>
  useQuery({
    queryKey: ["v_despacho_industria", cooperativaId],
    queryFn: async () => {
      let q = supabase
        .from("v_despacho_industria" as any)
        .select("*")
        .order("data_despacho", { ascending: false });
      if (cooperativaId) q = q.eq("cooperativa_id", cooperativaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── Mutation: Novo Despacho (com validação de balanço de massa) ───
export const useNovoDespacho = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      cooperativa_id: string;
      industria_destino_cnpj: string;
      industria_destino_nome?: string;
      tipo_material: string;
      peso_despachado_kg: number;
      numero_nota_fiscal: string;
      chave_nfe?: string;
    }) => {
      // 1. Validate balance via RPC
      const { data: ok, error: rpcErr } = await supabase.rpc(
        "fn_validar_balanco_massa" as any,
        {
          p_cooperativa_id: payload.cooperativa_id,
          p_tipo_material: payload.tipo_material,
          p_peso_kg: payload.peso_despachado_kg,
        }
      );
      if (rpcErr) throw rpcErr;
      if (!ok)
        throw new Error(
          `Estoque insuficiente de ${payload.tipo_material}. O balanço de massa não permite este despacho.`
        );

      // 2. Insert
      const { data, error } = await supabase
        .from("v_despacho_industria" as any)
        .insert({
          cooperativa_id: payload.cooperativa_id,
          industria_destino_cnpj: payload.industria_destino_cnpj,
          industria_destino_nome: payload.industria_destino_nome || null,
          tipo_material: payload.tipo_material,
          peso_despachado_kg: payload.peso_despachado_kg,
          numero_nota_fiscal: payload.numero_nota_fiscal,
          chave_nfe: payload.chave_nfe || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["v_estoque_cooperativa"] });
      qc.invalidateQueries({ queryKey: ["v_despacho_industria"] });
    },
  });
};
