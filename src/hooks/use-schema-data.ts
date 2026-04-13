import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── sch_cooperativa ───
export const useCooperativas = () =>
  useQuery({
    queryKey: ["sch_cooperativa", "cooperativa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cooperativa" as any)
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
      let q = supabase
        .from("lote_entrada" as any)
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
      let q = supabase
        .from("lote_saida_faturado" as any)
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
      const { data, error } = await supabase
        .from("industria" as any)
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
      let q = supabase
        .from("materia_prima_reciclada" as any)
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
      let q = supabase
        .from("certificado_logistica_reversa" as any)
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
      const { data, error } = await supabase
        .from("entidade_credenciada" as any)
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
      let q = supabase
        .from("estacao_coleta" as any)
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
      let q = supabase
        .from("metas_orgao_publico" as any)
        .select("*")
        .order("ano_vigencia", { ascending: false });
      if (entidadeId) q = q.eq("entidade_id", entidadeId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── sch_governo (extended) ───
export const useMetricasPlanares = () =>
  useQuery({
    queryKey: ["sch_governo", "metrica_planares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metrica_planares" as any)
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
      const { data, error } = await supabase
        .from("telemetria_consolidada" as any)
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
      const { data, error } = await supabase
        .from("auditoria_infracoes" as any)
        .select("*")
        .order("data_autuacao", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
