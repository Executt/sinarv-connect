-- Lei 12.305/2010, art. 54 (redação da Lei 14.026/2020):
-- I  – 02/08/2021: capitais e municípios de Região Metropolitana/RIDE de capitais
-- II – 02/08/2022: população > 100 mil (Censo 2010) ou sede a < 20 km de fronteira internacional
-- III– 02/08/2023: população entre 50 mil e 100 mil
-- IV – 02/08/2024: população < 50 mil
ALTER TABLE public.lixoes
  ADD COLUMN IF NOT EXISTS capital_ou_rm BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fronteira_20km BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.lixoes.capital_ou_rm IS 'Capital ou município de RM/RIDE de capital (inciso I, art. 54 PNRS)';
COMMENT ON COLUMN public.lixoes.fronteira_20km IS 'Sede municipal a menos de 20 km de fronteira internacional (inciso II, art. 54 PNRS)';

CREATE OR REPLACE FUNCTION public.fn_prazo_pnrs_art54(
  _populacao integer, _capital_ou_rm boolean, _fronteira_20km boolean
) RETURNS date
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(_capital_ou_rm, false) THEN DATE '2021-08-02'
    WHEN COALESCE(_fronteira_20km, false) THEN DATE '2022-08-02'
    WHEN _populacao IS NULL THEN NULL
    WHEN _populacao > 100000 THEN DATE '2022-08-02'
    WHEN _populacao >= 50000 THEN DATE '2023-08-02'
    ELSE DATE '2024-08-02'
  END;
$$;

CREATE OR REPLACE FUNCTION public.fn_faixa_pnrs_art54(
  _populacao integer, _capital_ou_rm boolean, _fronteira_20km boolean
) RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(_capital_ou_rm, false) THEN 'capital_rm'
    WHEN COALESCE(_fronteira_20km, false) THEN 'fronteira'
    WHEN _populacao IS NULL THEN 'nao_informada'
    WHEN _populacao > 100000 THEN 'acima_100k'
    WHEN _populacao >= 50000 THEN '50k_100k'
    ELSE 'ate_50k'
  END;
$$;

DROP VIEW IF EXISTS public.vw_lixoes_pnrs;
CREATE VIEW public.vw_lixoes_pnrs
WITH (security_invoker = true) AS
SELECT
  l.id, l.nome, l.uf, l.municipio, l.municipio_ibge, l.tipo, l.status,
  l.populacao_municipio, l.catadores_estimados, l.possui_coleta_seletiva,
  l.possui_plano_municipal, l.consorcio_publico, l.fonte_verificacao, l.data_ultima_verificacao,
  l.capital_ou_rm, l.fronteira_20km,
  public.fn_faixa_pnrs_art54(l.populacao_municipio, l.capital_ou_rm, l.fronteira_20km) AS faixa_populacional,
  public.fn_prazo_pnrs_art54(l.populacao_municipio, l.capital_ou_rm, l.fronteira_20km) AS prazo_legal_pnrs,
  CASE
    WHEN l.status IN ('encerrado','recuperado') THEN 'conforme'
    WHEN l.tipo = 'aterro_sanitario' THEN 'conforme'
    WHEN public.fn_prazo_pnrs_art54(l.populacao_municipio, l.capital_ou_rm, l.fronteira_20km) IS NULL THEN 'sem_dados'
    WHEN CURRENT_DATE > public.fn_prazo_pnrs_art54(l.populacao_municipio, l.capital_ou_rm, l.fronteira_20km) THEN 'prazo_vencido'
    ELSE 'no_prazo'
  END AS situacao_pnrs,
  COALESCE(et.total, 0) AS etapas_total,
  COALESCE(et.concluidas, 0) AS etapas_concluidas,
  CASE WHEN COALESCE(et.total, 0) = 0 THEN 0
       ELSE ROUND(100.0 * et.concluidas / et.total, 1) END AS progresso_encerramento_pct
FROM public.lixoes l
LEFT JOIN (
  SELECT lixao_id, COUNT(*) AS total,
         COUNT(*) FILTER (WHERE situacao = 'concluida') AS concluidas
  FROM public.lixao_encerramento_etapas GROUP BY lixao_id
) et ON et.lixao_id = l.id;

GRANT SELECT ON public.vw_lixoes_pnrs TO authenticated;