import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── sch_cooperativa ───
export const useCooperativas = () =>
  useQuery({
    queryKey: ["sch_cooperativa", "cooperativa"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).schema("sch_cooperativa")
        .from("cooperativa")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useLotesEntrada = (cooperativaId?: string) =>
  useQuery({
    queryKey: ["sch_cooperativa", "lote_entrada", cooperativaId],
    queryFn: async () => {
      let q = (supabase as any).schema("sch_cooperativa")
        .from("lote_entrada")
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
    queryKey: ["sch_cooperativa", "lote_saida_faturado", cooperativaId],
    queryFn: async () => {
      let q = (supabase as any).schema("sch_cooperativa")
        .from("lote_saida_faturado")
        .select("*")
        .order("data_despacho", { ascending: false });
      if (cooperativaId) q = q.eq("cooperativa_id", cooperativaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── sch_industria ───
export const useIndustrias = () =>
  useQuery({
    queryKey: ["sch_industria", "industria"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).schema("sch_industria")
        .from("industria")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useMateriaPrima = (industriaId?: string) =>
  useQuery({
    queryKey: ["sch_industria", "materia_prima_reciclada", industriaId],
    queryFn: async () => {
      let q = (supabase as any).schema("sch_industria")
        .from("materia_prima_reciclada")
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
    queryKey: ["sch_industria", "certificado_logistica_reversa", industriaId],
    queryFn: async () => {
      let q = (supabase as any).schema("sch_industria")
        .from("certificado_logistica_reversa")
        .select("*")
        .order("data_emissao", { ascending: false });
      if (industriaId) q = q.eq("industria_id", industriaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── sch_ponto_coleta ───
export const useEntidadesCredenciadas = () =>
  useQuery({
    queryKey: ["sch_ponto_coleta", "entidade_credenciada"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).schema("sch_ponto_coleta")
        .from("entidade_credenciada")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useEstacoesColeta = (entidadeId?: string) =>
  useQuery({
    queryKey: ["sch_ponto_coleta", "estacao_coleta", entidadeId],
    queryFn: async () => {
      let q = (supabase as any).schema("sch_ponto_coleta")
        .from("estacao_coleta")
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
    queryKey: ["sch_ponto_coleta", "metas_orgao_publico", entidadeId],
    queryFn: async () => {
      let q = (supabase as any).schema("sch_ponto_coleta")
        .from("metas_orgao_publico")
        .select("*")
        .order("ano_vigencia", { ascending: false });
      if (entidadeId) q = q.eq("entidade_id", entidadeId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── sch_governo ───
export const useMetricasPlanares = () =>
  useQuery({
    queryKey: ["sch_governo", "metrica_planares"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).schema("sch_governo")
        .from("metrica_planares")
        .select("*")
        .order("ano_referencia", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useTelemetriaConsolidada = () =>
  useQuery({
    queryKey: ["sch_governo", "telemetria_consolidada"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).schema("sch_governo")
        .from("telemetria_consolidada")
        .select("*")
        .order("data_referencia", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

export const useAuditoriaInfracoes = () =>
  useQuery({
    queryKey: ["sch_governo", "auditoria_infracoes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).schema("sch_governo")
        .from("auditoria_infracoes")
        .select("*")
        .order("data_autuacao", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
