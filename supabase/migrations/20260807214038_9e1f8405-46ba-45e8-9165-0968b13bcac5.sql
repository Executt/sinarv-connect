-- 1. Fatores de carbono e ambientais por material
ALTER TABLE public.economia_fatores_material
  ADD COLUMN IF NOT EXISTS co2e_evitado_ton_por_ton numeric,
  ADD COLUMN IF NOT EXISTS energia_evitada_mwh_por_ton numeric,
  ADD COLUMN IF NOT EXISTS agua_evitada_m3_por_ton numeric,
  ADD COLUMN IF NOT EXISTS metodologia text,
  ADD COLUMN IF NOT EXISTS fonte_url text,
  ADD COLUMN IF NOT EXISTS ano_referencia_fator integer;

COMMENT ON COLUMN public.economia_fatores_material.co2e_evitado_ton_por_ton IS 'Toneladas de CO2e evitadas por tonelada reciclada. Exige metodologia e fonte preenchidas.';

-- 2. Camada financeira (Norma de Referencia ANA no 3/2022 / SNIS-SINISA)
CREATE TABLE public.financeiro_servico_municipal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  municipio_ibge text NOT NULL,
  nome_municipio text NOT NULL,
  uf char(2) NOT NULL,
  ano_referencia integer NOT NULL,
  populacao_urbana bigint,
  populacao_atendida_seletiva bigint,
  massa_coletada_ton numeric NOT NULL DEFAULT 0,
  massa_recuperada_ton numeric NOT NULL DEFAULT 0,
  massa_disposta_aterro_ton numeric NOT NULL DEFAULT 0,
  despesa_total_rs numeric NOT NULL DEFAULT 0,
  despesa_coleta_seletiva_rs numeric NOT NULL DEFAULT 0,
  receita_taxa_rs numeric NOT NULL DEFAULT 0,
  possui_cobranca_especifica boolean NOT NULL DEFAULT false,
  fonte text NOT NULL DEFAULT 'SNIS',
  fonte_url text,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT financeiro_municipio_ano_unico UNIQUE (municipio_ibge, ano_referencia)
);

CREATE INDEX idx_financeiro_uf_ano ON public.financeiro_servico_municipal (uf, ano_referencia);

GRANT SELECT ON public.financeiro_servico_municipal TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financeiro_servico_municipal TO authenticated;
GRANT ALL ON public.financeiro_servico_municipal TO service_role;

ALTER TABLE public.financeiro_servico_municipal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financeiro_leitura_publica"
  ON public.financeiro_servico_municipal FOR SELECT
  USING (true);

CREATE POLICY "financeiro_insert_gov"
  ON public.financeiro_servico_municipal FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "financeiro_update_gov"
  ON public.financeiro_servico_municipal FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "financeiro_delete_gov"
  ON public.financeiro_servico_municipal FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_financeiro_updated_at
  BEFORE UPDATE ON public.financeiro_servico_municipal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. View de indicadores ANA (formulas canonicas)
CREATE OR REPLACE VIEW public.vw_indicadores_ana
WITH (security_invoker = true) AS
SELECT
  f.id,
  f.municipio_ibge,
  f.nome_municipio,
  f.uf,
  f.ano_referencia,
  f.fonte,
  f.massa_coletada_ton,
  f.massa_recuperada_ton,
  f.despesa_total_rs,
  f.receita_taxa_rs,
  f.possui_cobranca_especifica,
  CASE WHEN f.massa_coletada_ton > 0
       THEN round(f.despesa_total_rs / f.massa_coletada_ton, 2) END AS custo_por_tonelada_rs,
  CASE WHEN f.populacao_urbana > 0
       THEN round(f.despesa_total_rs / f.populacao_urbana, 2) END AS custo_por_habitante_rs,
  CASE WHEN f.populacao_urbana > 0
       THEN round(100.0 * COALESCE(f.populacao_atendida_seletiva, 0) / f.populacao_urbana, 2) END AS cobertura_seletiva_pct,
  CASE WHEN f.massa_coletada_ton > 0
       THEN round(100.0 * f.massa_recuperada_ton / f.massa_coletada_ton, 2) END AS taxa_recuperacao_pct,
  CASE WHEN f.massa_coletada_ton > 0
       THEN round(100.0 * (f.massa_coletada_ton - f.massa_disposta_aterro_ton) / f.massa_coletada_ton, 2) END AS taxa_desvio_aterro_pct,
  CASE WHEN f.despesa_total_rs > 0
       THEN round(100.0 * f.receita_taxa_rs / f.despesa_total_rs, 2) END AS cobertura_receita_pct,
  CASE
    WHEN f.despesa_total_rs <= 0 THEN 'sem_dado'
    WHEN f.receita_taxa_rs / f.despesa_total_rs >= 1 THEN 'sustentavel'
    WHEN f.receita_taxa_rs / f.despesa_total_rs >= 0.7 THEN 'atencao'
    ELSE 'deficitario'
  END AS situacao_sustentabilidade
FROM public.financeiro_servico_municipal f;

GRANT SELECT ON public.vw_indicadores_ana TO anon, authenticated, service_role;