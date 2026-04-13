import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── sch_cooperativa (via public views) ───
export const useCooperativas = () =>
  useQuery({
    queryKey: ["v_cooperativa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_cooperativa" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useLotesEntrada = (cooperativaId?: string) =>
  useQuery({
    queryKey: ["v_lote_entrada", cooperativaId],
    queryFn: async () => {
      let q = supabase
        .from("v_lote_entrada" as any)
        .select("*")
        .order("data_recebimento", { ascending: false });
      if (cooperativaId) q = q.eq("cooperativa_id", cooperativaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

export const useLotesSaida = (cooperativaId?: string) =>
  useQuery({
    queryKey: ["v_lote_saida_faturado", cooperativaId],
    queryFn: async () => {
      let q = supabase
        .from("v_lote_saida_faturado" as any)
        .select("*")
        .order("data_despacho", { ascending: false });
      if (cooperativaId) q = q.eq("cooperativa_id", cooperativaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── sch_industria (via public views) ───
export const useIndustrias = () =>
  useQuery({
    queryKey: ["v_industria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_industria" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useMateriaPrima = (industriaId?: string) =>
  useQuery({
    queryKey: ["v_materia_prima_reciclada", industriaId],
    queryFn: async () => {
      let q = supabase
        .from("v_materia_prima_reciclada" as any)
        .select("*")
        .order("data_registro", { ascending: false });
      if (industriaId) q = q.eq("industria_id", industriaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

export const useCertificados = (industriaId?: string) =>
  useQuery({
    queryKey: ["v_certificado_logistica_reversa", industriaId],
    queryFn: async () => {
      let q = supabase
        .from("v_certificado_logistica_reversa" as any)
        .select("*")
        .order("data_emissao", { ascending: false });
      if (industriaId) q = q.eq("industria_id", industriaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── sch_ponto_coleta (via public views) ───
export const useEntidadesCredenciadas = () =>
  useQuery({
    queryKey: ["v_entidade_credenciada"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_entidade_credenciada" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useEstacoesColeta = (entidadeId?: string) =>
  useQuery({
    queryKey: ["v_estacao_coleta", entidadeId],
    queryFn: async () => {
      let q = supabase
        .from("v_estacao_coleta" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (entidadeId) q = q.eq("entidade_id", entidadeId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

export const useMetasOrgao = (entidadeId?: string) =>
  useQuery({
    queryKey: ["v_metas_orgao_publico", entidadeId],
    queryFn: async () => {
      let q = supabase
        .from("v_metas_orgao_publico" as any)
        .select("*")
        .order("ano_vigencia", { ascending: false });
      if (entidadeId) q = q.eq("entidade_id", entidadeId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── sch_governo (via public views) ───
export const useMetricasPlanares = () =>
  useQuery({
    queryKey: ["v_metrica_planares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_metrica_planares" as any)
        .select("*")
        .order("ano_referencia", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useTelemetriaConsolidada = () =>
  useQuery({
    queryKey: ["v_telemetria_consolidada"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_telemetria_consolidada" as any)
        .select("*")
        .order("data_referencia", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useAuditoriaInfracoes = () =>
  useQuery({
    queryKey: ["v_auditoria_infracoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_auditoria_infracoes" as any)
        .select("*")
        .order("data_autuacao", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

// ─── sch_ponto_coleta: registro_entrada & despacho_lote ───
export const useRegistrosEntrada = (entidadeId?: string) =>
  useQuery({
    queryKey: ["v_registro_entrada", entidadeId],
    queryFn: async () => {
      let q = supabase
        .from("v_registro_entrada" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (entidadeId) q = q.eq("entidade_id", entidadeId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

export const useDespachosLote = (entidadeId?: string) =>
  useQuery({
    queryKey: ["v_despacho_lote", entidadeId],
    queryFn: async () => {
      let q = supabase
        .from("v_despacho_lote" as any)
        .select("*")
        .order("data_despacho", { ascending: false });
      if (entidadeId) q = q.eq("entidade_id", entidadeId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
