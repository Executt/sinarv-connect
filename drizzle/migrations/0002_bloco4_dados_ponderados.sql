ALTER TABLE public.economia_fatores_material
  ADD COLUMN IF NOT EXISTS participacao_mix NUMERIC;

UPDATE public.economia_fatores_material SET participacao_mix = v.p
FROM (VALUES
  ('Papel', 0.18), ('Papelão', 0.20), ('PET', 0.09), ('PEAD', 0.07),
  ('Vidro', 0.14), ('Alumínio', 0.03), ('Aço', 0.06), ('Orgânico', 0.23)
) AS v(m, p)
WHERE economia_fatores_material.material = v.m
  AND economia_fatores_material.participacao_mix IS NULL;

UPDATE public.economia_fatores_material
SET metodologia = COALESCE(metodologia, 'Fatores de CO2e, energia e água por tonelada reciclada; economia ponderada pela composição gravimétrica média do mix reciclável brasileiro (ABRELPE/SNIS).'),
    fonte_url = COALESCE(fonte_url, 'https://abrelpe.org.br/panorama/')
WHERE ativo = true;

DROP VIEW IF EXISTS public.vw_economia_estado;
CREATE VIEW public.vw_economia_estado AS
WITH fatores AS (
  SELECT
    SUM(participacao_mix) AS peso_total,
    SUM(densidade_ton_m3 * participacao_mix) AS densidade_pond,
    SUM((custo_aterro_evitado_rs_ton + valor_reciclado_rs_ton) * participacao_mix) AS rs_ton_pond,
    SUM(COALESCE(co2e_evitado_ton_por_ton, 0) * participacao_mix) AS co2e_pond,
    SUM(COALESCE(energia_evitada_mwh_por_ton, 0) * participacao_mix) AS energia_pond,
    SUM(COALESCE(agua_evitada_m3_por_ton, 0) * participacao_mix) AS agua_pond
  FROM public.economia_fatores_material
  WHERE ativo = true AND uf IS NULL AND COALESCE(participacao_mix, 0) > 0
), f AS (
  SELECT
    densidade_pond / NULLIF(peso_total, 0) AS densidade_media,
    rs_ton_pond / NULLIF(peso_total, 0) AS rs_por_ton_medio,
    co2e_pond / NULLIF(peso_total, 0) AS co2e_por_ton,
    energia_pond / NULLIF(peso_total, 0) AS energia_por_ton,
    agua_pond / NULLIF(peso_total, 0) AS agua_por_ton
  FROM fatores
)
SELECT
  b.estado_ibge,
  b.uf,
  b.nome_estado,
  b.populacao,
  b.volume_reciclado_ton,
  round(b.volume_reciclado_ton / NULLIF(f.densidade_media, 0), 2) AS volume_reciclado_m3,
  round(b.volume_reciclado_ton * f.rs_por_ton_medio, 2) AS economia_total_rs,
  round(b.volume_reciclado_ton * f.rs_por_ton_medio / NULLIF(b.populacao, 0)::numeric, 2) AS economia_per_capita_rs,
  round(b.volume_reciclado_ton * f.co2e_por_ton, 2) AS co2e_evitado_ton,
  round(b.volume_reciclado_ton * f.energia_por_ton, 2) AS energia_evitada_mwh,
  round(b.volume_reciclado_ton * f.agua_por_ton, 2) AS agua_evitada_m3,
  b.ano_referencia
FROM public.benchmark_estados b
CROSS JOIN f;

GRANT SELECT ON public.vw_economia_estado TO anon, authenticated;

DROP VIEW IF EXISTS public.vw_indicadores_ana;
CREATE VIEW public.vw_indicadores_ana AS
SELECT
  id, municipio_ibge, nome_municipio, uf, ano_referencia, fonte,
  massa_coletada_ton, massa_recuperada_ton, despesa_total_rs,
  despesa_coleta_seletiva_rs, receita_taxa_rs, possui_cobranca_especifica,
  CASE WHEN massa_coletada_ton > 0 THEN round(despesa_total_rs / massa_coletada_ton, 2) END AS custo_por_tonelada_rs,
  CASE WHEN massa_recuperada_ton > 0 AND despesa_coleta_seletiva_rs IS NOT NULL
       THEN round(despesa_coleta_seletiva_rs / massa_recuperada_ton, 2) END AS custo_seletiva_por_ton_recuperada_rs,
  CASE WHEN populacao_urbana > 0 THEN round(despesa_total_rs / populacao_urbana::numeric, 2) END AS custo_por_habitante_rs,
  CASE WHEN populacao_urbana > 0 THEN round(100.0 * COALESCE(populacao_atendida_seletiva, 0)::numeric / populacao_urbana::numeric, 2) END AS cobertura_seletiva_pct,
  CASE WHEN massa_coletada_ton > 0 THEN round(100.0 * massa_recuperada_ton / massa_coletada_ton, 2) END AS taxa_recuperacao_pct,
  CASE WHEN massa_coletada_ton > 0 THEN round(100.0 * (massa_coletada_ton - massa_disposta_aterro_ton) / massa_coletada_ton, 2) END AS taxa_desvio_aterro_pct,
  CASE WHEN despesa_total_rs > 0 THEN round(100.0 * receita_taxa_rs / despesa_total_rs, 2) END AS cobertura_receita_pct,
  CASE
    WHEN despesa_total_rs <= 0 THEN 'sem_dado'
    WHEN (receita_taxa_rs / despesa_total_rs) >= 1 THEN 'sustentavel'
    WHEN (receita_taxa_rs / despesa_total_rs) >= 0.7 THEN 'atencao'
    ELSE 'deficitario'
  END AS situacao_sustentabilidade
FROM public.financeiro_servico_municipal f;

GRANT SELECT ON public.vw_indicadores_ana TO anon, authenticated;