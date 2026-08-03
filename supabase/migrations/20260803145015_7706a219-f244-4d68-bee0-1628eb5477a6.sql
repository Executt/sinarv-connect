ALTER TABLE public.lixoes
  ADD COLUMN IF NOT EXISTS municipio_ibge text,
  ADD COLUMN IF NOT EXISTS populacao_municipio integer,
  ADD COLUMN IF NOT EXISTS catadores_estimados integer,
  ADD COLUMN IF NOT EXISTS possui_coleta_seletiva boolean,
  ADD COLUMN IF NOT EXISTS possui_plano_municipal boolean,
  ADD COLUMN IF NOT EXISTS consorcio_publico boolean,
  ADD COLUMN IF NOT EXISTS fonte_verificacao text,
  ADD COLUMN IF NOT EXISTS data_ultima_verificacao date;

CREATE TABLE IF NOT EXISTS public.munic_diagnostico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_referencia integer NOT NULL DEFAULT 2023,
  regiao text NOT NULL,
  pct_lixao numeric NOT NULL,
  pct_aterro_controlado numeric,
  pct_aterro_sanitario numeric,
  pct_lixao_acima_50k numeric,
  pct_coleta_seletiva numeric,
  pct_instrumento_legal numeric,
  pct_catadores_informais numeric,
  pct_entidades_catadores numeric,
  fonte text NOT NULL DEFAULT 'IBGE MUNIC 2023 - Suplemento de Saneamento',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ano_referencia, regiao)
);

GRANT SELECT ON public.munic_diagnostico TO authenticated, anon;
GRANT ALL ON public.munic_diagnostico TO service_role;
ALTER TABLE public.munic_diagnostico ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "munic_diag_read" ON public.munic_diagnostico;
CREATE POLICY "munic_diag_read" ON public.munic_diagnostico FOR SELECT USING (true);
DROP POLICY IF EXISTS "munic_diag_write" ON public.munic_diagnostico;
CREATE POLICY "munic_diag_write" ON public.munic_diagnostico FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.munic_diagnostico
  (regiao, pct_lixao, pct_aterro_controlado, pct_aterro_sanitario, pct_lixao_acima_50k, pct_coleta_seletiva, pct_instrumento_legal, pct_catadores_informais, pct_entidades_catadores)
VALUES
  ('Brasil',       31.9, 18.7, 28.6, 21.5, 60.5, 56.7, 73.7, 27.0),
  ('Norte',        73.8, NULL, NULL, 57.7, 33.5, 42.2, 72.5, 16.7),
  ('Nordeste',     51.6, NULL, NULL, 38.3, 33.5, 38.2, 71.8, 18.7),
  ('Centro-Oeste', 52.9, NULL, NULL, 29.5, NULL, NULL, 75.3, 23.2),
  ('Sudeste',      12.1, NULL, NULL,  7.0, NULL, NULL, 78.0, 33.5),
  ('Sul',           5.7, NULL, NULL,  1.8, 81.9, 74.5, 70.2, 35.5)
ON CONFLICT (ano_referencia, regiao) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.lixao_encerramento_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lixao_id uuid NOT NULL REFERENCES public.lixoes(id) ON DELETE CASCADE,
  ordem integer NOT NULL,
  etapa text NOT NULL,
  descricao text,
  situacao text NOT NULL DEFAULT 'pendente',
  responsavel text,
  data_prevista date,
  data_conclusao date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lixao_id, ordem),
  CONSTRAINT lixao_etapa_situacao_chk CHECK (situacao IN ('pendente','em_andamento','concluida','nao_aplicavel'))
);

CREATE INDEX IF NOT EXISTS idx_lixao_etapas_lixao ON public.lixao_encerramento_etapas(lixao_id);

GRANT SELECT ON public.lixao_encerramento_etapas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lixao_encerramento_etapas TO authenticated;
GRANT ALL ON public.lixao_encerramento_etapas TO service_role;
ALTER TABLE public.lixao_encerramento_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lixao_etapas_read" ON public.lixao_encerramento_etapas;
CREATE POLICY "lixao_etapas_read" ON public.lixao_encerramento_etapas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "lixao_etapas_write" ON public.lixao_encerramento_etapas;
CREATE POLICY "lixao_etapas_write" ON public.lixao_encerramento_etapas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'gov') OR public.has_role(auth.uid(), 'super_admin'));

-- Seed do roteiro oficial (Roteiro de Encerramento de Lixões - MCidades/ProteGEER) para lixões ainda não encerrados
INSERT INTO public.lixao_encerramento_etapas (lixao_id, ordem, etapa, descricao, situacao)
SELECT l.id, e.ordem, e.etapa, e.descricao,
       CASE
         WHEN l.status = 'recuperado' THEN 'concluida'
         WHEN l.status = 'encerrado' AND e.ordem <= 6 THEN 'concluida'
         WHEN l.status = 'em_encerramento' AND e.ordem <= 3 THEN 'concluida'
         WHEN l.status = 'em_encerramento' AND e.ordem = 4 THEN 'em_andamento'
         ELSE 'pendente'
       END
FROM public.lixoes l
CROSS JOIN (VALUES
  (1,'Diagnóstico da área','Caracterização física, ambiental e social da área degradada, incluindo levantamento topográfico e de catadores.'),
  (2,'Solução de destinação alternativa','Definição do destino adequado dos resíduos: aterro sanitário, consórcio intermunicipal ou unidade de transbordo.'),
  (3,'Inclusão socioprodutiva de catadores','Cadastramento, apoio e transição dos catadores para cooperativas ou centrais de triagem.'),
  (4,'Projeto de encerramento (PRAD)','Elaboração do Plano de Recuperação de Área Degradada e obtenção da licença ambiental.'),
  (5,'Isolamento e controle de acesso','Cercamento, portaria, sinalização e impedimento de novos descartes na área.'),
  (6,'Obras de conformação e cobertura','Reconformação geométrica do maciço, cobertura final e sistema de drenagem pluvial.'),
  (7,'Drenagem de gases e chorume','Implantação de drenos de biogás, sistema de coleta e tratamento de lixiviado.'),
  (8,'Monitoramento pós-encerramento','Monitoramento geotécnico, de águas subterrâneas e de gases por no mínimo 20 anos, com uso futuro da área.')
) AS e(ordem, etapa, descricao)
WHERE NOT EXISTS (
  SELECT 1 FROM public.lixao_encerramento_etapas x WHERE x.lixao_id = l.id AND x.ordem = e.ordem
);

CREATE OR REPLACE VIEW public.vw_lixoes_pnrs
WITH (security_invoker = true) AS
SELECT
  l.id,
  l.nome,
  l.uf,
  l.municipio,
  l.municipio_ibge,
  l.tipo,
  l.status,
  l.populacao_municipio,
  l.catadores_estimados,
  l.possui_coleta_seletiva,
  l.possui_plano_municipal,
  l.consorcio_publico,
  l.fonte_verificacao,
  l.data_ultima_verificacao,
  CASE
    WHEN l.populacao_municipio IS NULL THEN 'nao_informada'
    WHEN l.populacao_municipio > 100000 THEN 'acima_100k'
    WHEN l.populacao_municipio > 50000 THEN '50k_100k'
    WHEN l.populacao_municipio > 10000 THEN '10k_50k'
    ELSE 'ate_10k'
  END AS faixa_populacional,
  CASE
    WHEN l.populacao_municipio IS NULL THEN NULL
    WHEN l.populacao_municipio > 100000 THEN DATE '2021-08-02'
    WHEN l.populacao_municipio > 50000 THEN DATE '2022-08-02'
    WHEN l.populacao_municipio > 10000 THEN DATE '2023-08-02'
    ELSE DATE '2024-08-02'
  END AS prazo_legal_pnrs,
  CASE
    WHEN l.status IN ('encerrado','recuperado') THEN 'conforme'
    WHEN l.tipo = 'aterro_sanitario' THEN 'conforme'
    WHEN l.populacao_municipio IS NULL THEN 'sem_dados'
    WHEN CURRENT_DATE > (CASE
        WHEN l.populacao_municipio > 100000 THEN DATE '2021-08-02'
        WHEN l.populacao_municipio > 50000 THEN DATE '2022-08-02'
        WHEN l.populacao_municipio > 10000 THEN DATE '2023-08-02'
        ELSE DATE '2024-08-02' END) THEN 'prazo_vencido'
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