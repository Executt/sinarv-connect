import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ─── Metas PNRS ───
export const useMetasPnrs = (industriaId?: string) =>
  useQuery({
    queryKey: ["v_meta_pnrs", industriaId],
    queryFn: async () => {
      let q = supabase
        .from("v_meta_pnrs" as any)
        .select("*")
        .order("ano_referencia", { ascending: false });
      if (industriaId) q = q.eq("industria_id", industriaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── API Credentials ───
export const useApiCredentials = (industriaId?: string) =>
  useQuery({
    queryKey: ["v_api_credential", industriaId],
    queryFn: async () => {
      let q = supabase
        .from("v_api_credential" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (industriaId) q = q.eq("industria_id", industriaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── Lotes Recebidos ───
export const useLotesRecebidos = (industriaId?: string) =>
  useQuery({
    queryKey: ["v_lote_recebido", industriaId],
    queryFn: async () => {
      let q = supabase
        .from("v_lote_recebido" as any)
        .select("*")
        .order("data_recebimento", { ascending: false });
      if (industriaId) q = q.eq("industria_id", industriaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── API Logs ───
export const useApiLogs = (industriaId?: string) =>
  useQuery({
    queryKey: ["v_api_log", industriaId],
    queryFn: async () => {
      let q = supabase
        .from("v_api_log" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (industriaId) q = q.eq("industria_id", industriaId);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });

// ─── Aprovar/Rejeitar lote ───
export const useAprovarLote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ loteId, status }: { loteId: string; status: "Aprovado" | "Rejeitado" }) => {
      const { error } = await supabase
        .from("v_lote_recebido" as any)
        .update({ status } as any)
        .eq("id", loteId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["v_lote_recebido"] });
      qc.invalidateQueries({ queryKey: ["v_meta_pnrs"] });
    },
  });
};
