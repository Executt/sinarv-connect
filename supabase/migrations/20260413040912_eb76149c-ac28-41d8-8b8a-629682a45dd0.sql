
-- Registro de entrada de material no ponto de coleta
CREATE TABLE sch_ponto_coleta.registro_entrada (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estacao_id UUID NOT NULL REFERENCES sch_ponto_coleta.estacao_coleta(id),
  entidade_id UUID NOT NULL REFERENCES sch_ponto_coleta.entidade_credenciada(id),
  tipo_material TEXT NOT NULL,
  peso_kg NUMERIC NOT NULL,
  cpf_cidadao TEXT,
  origem_anonima BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  recibo_codigo TEXT NOT NULL DEFAULT ('REC-' || substr(gen_random_uuid()::text, 1, 8)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sch_ponto_coleta.registro_entrada ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read registro_entrada" ON sch_ponto_coleta.registro_entrada
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert registro_entrada" ON sch_ponto_coleta.registro_entrada
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update registro_entrada" ON sch_ponto_coleta.registro_entrada
  FOR UPDATE TO authenticated USING (true);

-- Despacho de lotes para cooperativas
CREATE TABLE sch_ponto_coleta.despacho_lote (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entidade_id UUID NOT NULL REFERENCES sch_ponto_coleta.entidade_credenciada(id),
  cooperativa_destino_nome TEXT NOT NULL,
  cooperativa_destino_cnpj TEXT,
  tipo_material TEXT NOT NULL,
  peso_total_kg NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente',
  observacoes TEXT,
  data_despacho TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sch_ponto_coleta.despacho_lote ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read despacho_lote" ON sch_ponto_coleta.despacho_lote
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert despacho_lote" ON sch_ponto_coleta.despacho_lote
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update despacho_lote" ON sch_ponto_coleta.despacho_lote
  FOR UPDATE TO authenticated USING (true);

-- Add creditos_fiscais column to entidade_credenciada for private entities
ALTER TABLE sch_ponto_coleta.entidade_credenciada
  ADD COLUMN IF NOT EXISTS creditos_fiscais NUMERIC NOT NULL DEFAULT 0;

-- Public views for frontend access
CREATE OR REPLACE VIEW public.v_registro_entrada AS
  SELECT * FROM sch_ponto_coleta.registro_entrada;

CREATE OR REPLACE VIEW public.v_despacho_lote AS
  SELECT * FROM sch_ponto_coleta.despacho_lote;

-- Triggers for updated_at
CREATE TRIGGER update_registro_entrada_updated_at
  BEFORE UPDATE ON sch_ponto_coleta.registro_entrada
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_despacho_lote_updated_at
  BEFORE UPDATE ON sch_ponto_coleta.despacho_lote
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
