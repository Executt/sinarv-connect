
-- =========================================================
-- Enums
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.lixao_tipo AS ENUM ('lixao', 'aterro_controlado', 'aterro_sanitario', 'transbordo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lixao_status AS ENUM ('ativo', 'em_encerramento', 'encerrado', 'recuperado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- lixoes
-- =========================================================
CREATE TABLE public.lixoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  uf TEXT NOT NULL,
  municipio TEXT NOT NULL,
  latitude NUMERIC(10,6) NOT NULL,
  longitude NUMERIC(10,6) NOT NULL,
  tipo public.lixao_tipo NOT NULL DEFAULT 'lixao',
  status public.lixao_status NOT NULL DEFAULT 'ativo',
  area_ha NUMERIC(10,2),
  volume_estocado_m3_inicial NUMERIC(14,2),
  data_abertura DATE,
  data_encerramento_prevista DATE,
  data_encerramento_real DATE,
  fonte TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lixoes TO authenticated;
GRANT SELECT ON public.lixoes TO anon;
GRANT ALL ON public.lixoes TO service_role;

ALTER TABLE public.lixoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lixoes visíveis a todos autenticados"
  ON public.lixoes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas super_admin/gov gerenciam lixoes"
  ON public.lixoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'gov'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'gov'));

CREATE TRIGGER trg_lixoes_updated_at
  BEFORE UPDATE ON public.lixoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lixoes_uf ON public.lixoes(uf);
CREATE INDEX idx_lixoes_status ON public.lixoes(status);

-- =========================================================
-- lixao_volume_historico
-- =========================================================
CREATE TABLE public.lixao_volume_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lixao_id UUID NOT NULL REFERENCES public.lixoes(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  volume_estocado_m3 NUMERIC(14,2) NOT NULL,
  volume_removido_m3 NUMERIC(14,2) NOT NULL DEFAULT 0,
  volume_recuperado_m3 NUMERIC(14,2) NOT NULL DEFAULT 0,
  residuo_recuperavel_pct NUMERIC(5,2),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lixao_id, mes_referencia)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lixao_volume_historico TO authenticated;
GRANT SELECT ON public.lixao_volume_historico TO anon;
GRANT ALL ON public.lixao_volume_historico TO service_role;

ALTER TABLE public.lixao_volume_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Histórico de lixões visível a autenticados"
  ON public.lixao_volume_historico FOR SELECT TO authenticated USING (true);

CREATE POLICY "Apenas super_admin/gov gerenciam histórico"
  ON public.lixao_volume_historico FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'gov'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'gov'));

CREATE TRIGGER trg_lixao_hist_updated_at
  BEFORE UPDATE ON public.lixao_volume_historico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lixao_hist_lixao ON public.lixao_volume_historico(lixao_id);
CREATE INDEX idx_lixao_hist_mes ON public.lixao_volume_historico(mes_referencia);

-- =========================================================
-- View de correlação por UF
-- =========================================================
CREATE OR REPLACE VIEW public.vw_lixoes_correlacao
WITH (security_invoker = true) AS
WITH ult_med AS (
  SELECT DISTINCT ON (lixao_id)
    lixao_id, mes_referencia, volume_estocado_m3, volume_removido_m3, volume_recuperado_m3
  FROM public.lixao_volume_historico
  ORDER BY lixao_id, mes_referencia DESC
),
por_uf AS (
  SELECT
    l.uf,
    COUNT(*) FILTER (WHERE l.status = 'ativo')           AS lixoes_ativos,
    COUNT(*) FILTER (WHERE l.status = 'em_encerramento') AS lixoes_em_encerramento,
    COUNT(*) FILTER (WHERE l.status = 'encerrado')       AS lixoes_encerrados,
    COUNT(*) FILTER (WHERE l.status = 'recuperado')      AS lixoes_recuperados,
    COALESCE(SUM(u.volume_estocado_m3), 0)               AS volume_estocado_m3_total,
    COALESCE(SUM(u.volume_removido_m3), 0)               AS volume_removido_m3_total,
    COALESCE(SUM(u.volume_recuperado_m3), 0)             AS volume_recuperado_m3_total,
    COALESCE(SUM(l.volume_estocado_m3_inicial), 0)       AS volume_inicial_m3_total
  FROM public.lixoes l
  LEFT JOIN ult_med u ON u.lixao_id = l.id
  GROUP BY l.uf
)
SELECT
  p.uf,
  p.lixoes_ativos,
  p.lixoes_em_encerramento,
  p.lixoes_encerrados,
  p.lixoes_recuperados,
  p.volume_inicial_m3_total,
  p.volume_estocado_m3_total,
  p.volume_removido_m3_total,
  p.volume_recuperado_m3_total,
  CASE WHEN p.volume_inicial_m3_total > 0
    THEN ROUND(((p.volume_inicial_m3_total - p.volume_estocado_m3_total) / p.volume_inicial_m3_total) * 100, 2)
    ELSE 0 END AS taxa_reducao_pct,
  COALESCE(b.volume_reciclado_ton, 0) AS volume_reciclado_ton_uf,
  COALESCE(b.taxa_desvio_aterro, 0)   AS taxa_desvio_aterro_uf,
  -- correlação simples: % do volume reciclado vs volume removido convertido (1 ton ~ 4 m³ médio resíduo seco)
  CASE WHEN p.volume_removido_m3_total > 0
    THEN ROUND((COALESCE(b.volume_reciclado_ton, 0) * 4.0 / p.volume_removido_m3_total) * 100, 2)
    ELSE 0 END AS correlacao_reciclagem_pct,
  -- economia estimada: volume removido * R$110 (custo aterro evitado médio nacional)
  ROUND(p.volume_removido_m3_total * 0.25 * 110, 2) AS economia_estimada_rs
FROM por_uf p
LEFT JOIN public.benchmark_estados b ON b.uf = p.uf AND b.ano_referencia = (
  SELECT MAX(ano_referencia) FROM public.benchmark_estados WHERE uf = p.uf
);

GRANT SELECT ON public.vw_lixoes_correlacao TO authenticated, anon, service_role;

-- =========================================================
-- Seeds: 12 lixões/aterros conhecidos
-- =========================================================
INSERT INTO public.lixoes (nome, uf, municipio, latitude, longitude, tipo, status, area_ha, volume_estocado_m3_inicial, data_abertura, data_encerramento_real, fonte) VALUES
  ('Lixão da Estrutural',          'DF', 'Brasília',         -15.776700, -47.998600, 'lixao',             'em_encerramento', 200.00, 40000000, '1958-01-01', NULL,         'SLU-DF / ABRELPE 2024'),
  ('Aterro Jardim Gramacho',       'RJ', 'Duque de Caxias',  -22.752200, -43.260000, 'aterro_controlado', 'encerrado',       130.00, 60000000, '1976-01-01', '2012-06-03', 'COMLURB / ABRELPE'),
  ('Aterro Bandeirantes',          'SP', 'São Paulo',        -23.412800, -46.768900, 'aterro_sanitario',  'encerrado',       140.00, 35000000, '1979-01-01', '2007-03-01', 'Prefeitura SP / SNIS'),
  ('Aterro Caximba',               'PR', 'Curitiba',         -25.580000, -49.323000, 'aterro_controlado', 'encerrado',        72.00, 12000000, '1989-11-01', '2010-10-31', 'SMMA Curitiba'),
  ('Lixão do Jangurussu',          'CE', 'Fortaleza',        -3.831700,  -38.520000, 'lixao',             'recuperado',       64.00, 11000000, '1978-01-01', '1998-12-31', 'Prefeitura Fortaleza'),
  ('Aterro Aurá',                  'PA', 'Belém',            -1.421000,  -48.420000, 'lixao',             'em_encerramento',  77.00, 14000000, '1990-01-01', NULL,         'SNIS 2023'),
  ('Lixão de Itaoca',              'ES', 'Cariacica',        -20.272500, -40.418600, 'lixao',             'em_encerramento',  32.00,  2500000, '1976-01-01', NULL,         'Cesan / ABRELPE'),
  ('Lixão de Muribeca',            'PE', 'Jaboatão dos Guararapes', -8.196100, -34.940800, 'aterro_controlado', 'encerrado', 64.00,  9500000, '1985-01-01', '2009-06-30', 'CTR Pernambuco'),
  ('Aterro Salvador (Canabrava)',  'BA', 'Salvador',         -12.961100, -38.456800, 'aterro_controlado', 'encerrado',        45.00,  7000000, '1973-01-01', '1997-12-31', 'Limpurb Salvador'),
  ('Lixão de Manaus (Aterro Inajá)','AM','Manaus',           -3.030000,  -60.020000, 'aterro_controlado', 'ativo',           110.00, 12000000, '1986-01-01', NULL,         'SEMULSP / SNIS'),
  ('Aterro Gramacho de Porto Alegre','RS','Porto Alegre',    -30.062000, -51.158000, 'aterro_sanitario',  'em_encerramento',  62.00,  8500000, '1990-01-01', NULL,         'DMLU POA'),
  ('Lixão de Cuiabá',              'MT', 'Cuiabá',           -15.601100, -56.097600, 'lixao',             'em_encerramento',  48.00,  4500000, '1989-01-01', NULL,         'SNIS 2023');

-- Seeds de histórico (6 meses, simulando remoção progressiva)
INSERT INTO public.lixao_volume_historico (lixao_id, mes_referencia, volume_estocado_m3, volume_removido_m3, volume_recuperado_m3, residuo_recuperavel_pct)
SELECT
  l.id,
  (DATE '2026-06-01' - (i || ' months')::interval)::date,
  GREATEST(l.volume_estocado_m3_inicial * (1 - 0.005 * (6 - i)), 0),
  l.volume_estocado_m3_inicial * 0.005,
  l.volume_estocado_m3_inicial * 0.005 * 0.22,
  22.00
FROM public.lixoes l
CROSS JOIN generate_series(0, 5) AS i
WHERE l.status IN ('ativo','em_encerramento');
