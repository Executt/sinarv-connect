
CREATE TABLE public.economia_fatores_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material TEXT NOT NULL,
  uf TEXT,
  densidade_ton_m3 NUMERIC(10,4) NOT NULL,
  custo_aterro_evitado_rs_ton NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_reciclado_rs_ton NUMERIC(12,2) NOT NULL DEFAULT 0,
  fonte TEXT,
  vigencia_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  vigencia_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (material, uf, vigencia_inicio)
);

GRANT SELECT ON public.economia_fatores_material TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.economia_fatores_material TO authenticated;
GRANT ALL ON public.economia_fatores_material TO service_role;

ALTER TABLE public.economia_fatores_material ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fatores econômicos são públicos"
  ON public.economia_fatores_material FOR SELECT
  USING (true);

CREATE POLICY "Apenas super_admin/gov gerenciam fatores"
  ON public.economia_fatores_material FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'gov'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'gov'));

CREATE TRIGGER trg_economia_fatores_updated_at
  BEFORE UPDATE ON public.economia_fatores_material
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.economia_fatores_material
  (material, uf, densidade_ton_m3, custo_aterro_evitado_rs_ton, valor_reciclado_rs_ton, fonte)
VALUES
  ('PET',       NULL, 0.0300, 110.00, 2800.00, 'CEMPRE/ABRELPE 2024'),
  ('PEAD',      NULL, 0.0400, 110.00, 2200.00, 'CEMPRE 2024'),
  ('Papelão',   NULL, 0.1000, 110.00,  650.00, 'ANAP/CEMPRE 2024'),
  ('Papel',     NULL, 0.0800, 110.00,  450.00, 'CEMPRE 2024'),
  ('Vidro',     NULL, 0.3000, 110.00,  220.00, 'CEMPRE/ABIVIDRO 2024'),
  ('Alumínio',  NULL, 0.0500, 110.00, 9500.00, 'ABAL/CEMPRE 2024'),
  ('Aço',       NULL, 0.2000, 110.00, 1100.00, 'INDA/CEMPRE 2024'),
  ('Orgânico',  NULL, 0.5000, 110.00,   80.00, 'ABRELPE/SNIS 2024');

CREATE OR REPLACE VIEW public.vw_economia_estado
WITH (security_invoker = true)
AS
WITH fatores_nacionais AS (
  SELECT
    AVG(densidade_ton_m3) AS densidade_media,
    AVG(custo_aterro_evitado_rs_ton + valor_reciclado_rs_ton) AS rs_por_ton_medio
  FROM public.economia_fatores_material
  WHERE ativo = true AND uf IS NULL
)
SELECT
  b.estado_ibge,
  b.uf,
  b.nome_estado,
  b.populacao,
  b.volume_reciclado_ton,
  ROUND((b.volume_reciclado_ton / NULLIF(f.densidade_media, 0))::numeric, 2) AS volume_reciclado_m3,
  ROUND((b.volume_reciclado_ton * f.rs_por_ton_medio)::numeric, 2) AS economia_total_rs,
  ROUND(((b.volume_reciclado_ton * f.rs_por_ton_medio) / NULLIF(b.populacao, 0))::numeric, 2) AS economia_per_capita_rs,
  b.ano_referencia
FROM public.benchmark_estados b
CROSS JOIN fatores_nacionais f;

GRANT SELECT ON public.vw_economia_estado TO anon, authenticated;
