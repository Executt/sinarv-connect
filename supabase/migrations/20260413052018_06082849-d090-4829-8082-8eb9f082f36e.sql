
-- Ranking Estadual
CREATE TABLE public.benchmark_estados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estado_ibge text NOT NULL,
  uf char(2) NOT NULL,
  nome_estado text NOT NULL,
  populacao bigint NOT NULL DEFAULT 0,
  volume_reciclado_ton numeric NOT NULL DEFAULT 0,
  volume_coletado_ton numeric NOT NULL DEFAULT 0,
  taxa_desvio_aterro numeric NOT NULL DEFAULT 0,
  meta_pnrs_cumprida boolean NOT NULL DEFAULT false,
  ano_referencia integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (uf, ano_referencia)
);

ALTER TABLE public.benchmark_estados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read benchmark_estados" ON public.benchmark_estados FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert benchmark_estados" ON public.benchmark_estados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update benchmark_estados" ON public.benchmark_estados FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_benchmark_estados_updated_at
  BEFORE UPDATE ON public.benchmark_estados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comparativo Municipal
CREATE TABLE public.benchmark_municipios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_ibge text NOT NULL,
  nome_municipio text NOT NULL,
  uf char(2) NOT NULL,
  populacao bigint NOT NULL DEFAULT 0,
  eficiencia_coleta_seletiva numeric NOT NULL DEFAULT 0,
  engajamento_cidadao numeric NOT NULL DEFAULT 0,
  pontos_coleta_por_km2 numeric NOT NULL DEFAULT 0,
  volume_reciclado_ton numeric NOT NULL DEFAULT 0,
  volume_coletado_ton numeric NOT NULL DEFAULT 0,
  taxa_desvio_aterro numeric NOT NULL DEFAULT 0,
  ano_referencia integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (municipio_ibge, ano_referencia)
);

ALTER TABLE public.benchmark_municipios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read benchmark_municipios" ON public.benchmark_municipios FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert benchmark_municipios" ON public.benchmark_municipios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update benchmark_municipios" ON public.benchmark_municipios FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_benchmark_municipios_updated_at
  BEFORE UPDATE ON public.benchmark_municipios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Selos / Distintivos
CREATE TABLE public.benchmark_selos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_ibge text NOT NULL,
  nome_municipio text NOT NULL,
  uf char(2) NOT NULL,
  tipo_selo text NOT NULL,
  descricao text,
  data_concessao date NOT NULL DEFAULT CURRENT_DATE,
  ano_referencia integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.benchmark_selos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read benchmark_selos" ON public.benchmark_selos FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert benchmark_selos" ON public.benchmark_selos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update benchmark_selos" ON public.benchmark_selos FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_benchmark_selos_updated_at
  BEFORE UPDATE ON public.benchmark_selos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Views analíticas para performance

CREATE OR REPLACE VIEW public.vw_ranking_estadual AS
SELECT
  be.uf,
  be.nome_estado,
  be.populacao,
  be.volume_reciclado_ton,
  be.volume_coletado_ton,
  CASE WHEN be.populacao > 0
    THEN ROUND((be.volume_reciclado_ton * 1000) / be.populacao, 2)
    ELSE 0
  END AS kg_per_capita,
  be.taxa_desvio_aterro,
  be.meta_pnrs_cumprida,
  be.ano_referencia,
  RANK() OVER (
    PARTITION BY be.ano_referencia
    ORDER BY CASE WHEN be.populacao > 0 THEN (be.volume_reciclado_ton * 1000) / be.populacao ELSE 0 END DESC
  ) AS posicao_ranking
FROM public.benchmark_estados be;

CREATE OR REPLACE VIEW public.vw_comparativo_municipal AS
SELECT
  bm.municipio_ibge,
  bm.nome_municipio,
  bm.uf,
  bm.populacao,
  bm.eficiencia_coleta_seletiva,
  bm.engajamento_cidadao,
  bm.pontos_coleta_por_km2,
  bm.volume_reciclado_ton,
  bm.volume_coletado_ton,
  bm.taxa_desvio_aterro,
  CASE WHEN bm.populacao > 0
    THEN ROUND((bm.volume_reciclado_ton * 1000) / bm.populacao, 2)
    ELSE 0
  END AS kg_per_capita,
  bm.ano_referencia
FROM public.benchmark_municipios bm;
