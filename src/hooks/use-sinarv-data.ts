import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTransacoes = () =>
  useQuery({
    queryKey: ["transacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useLotes = () =>
  useQuery({
    queryKey: ["lotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useAuditorias = () =>
  useQuery({
    queryKey: ["auditorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditorias")
        .select("*")
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useAlertas = () =>
  useQuery({
    queryKey: ["alertas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alertas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useIndicadores = () =>
  useQuery({
    queryKey: ["indicadores_sustentabilidade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indicadores_sustentabilidade")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

export const useEconomiaEstado = () =>
  useQuery({
    queryKey: ["vw_economia_estado"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("vw_economia_estado")
        .select("*")
        .order("economia_total_rs", { ascending: false });
      if (error) throw error;
      return data as Array<{
        estado_ibge: string;
        uf: string;
        nome_estado: string;
        populacao: number;
        volume_reciclado_ton: number;
        volume_reciclado_m3: number;
        economia_total_rs: number;
        economia_per_capita_rs: number;
        ano_referencia: number;
      }>;
    },
  });
