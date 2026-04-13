
-- ============================================================
-- 1. Catadores Associados
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_cooperativa.catador_associado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id UUID NOT NULL,
  nome TEXT NOT NULL,
  cpf_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo','Inativo','Suspenso')),
  data_associacao DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_catador_associado_ts
  BEFORE UPDATE ON sch_cooperativa.catador_associado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. Licenças da Cooperativa
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_cooperativa.licenca_cooperativa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Licença Ambiental','Alvará de Funcionamento','Outro')),
  numero TEXT NOT NULL,
  data_emissao DATE NOT NULL,
  data_validade DATE NOT NULL,
  arquivo_url TEXT,
  status TEXT NOT NULL DEFAULT 'Válida' CHECK (status IN ('Válida','Vencida','Revogada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_licenca_cooperativa_ts
  BEFORE UPDATE ON sch_cooperativa.licenca_cooperativa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. Estoque por material (saldo calculado)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_cooperativa.estoque_cooperativa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id UUID NOT NULL,
  tipo_material TEXT NOT NULL,
  saldo_kg NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cooperativa_id, tipo_material)
);

CREATE TRIGGER update_estoque_ts
  BEFORE UPDATE ON sch_cooperativa.estoque_cooperativa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. Despacho para Indústria (com token de rastreabilidade)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_cooperativa.despacho_industria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperativa_id UUID NOT NULL,
  industria_destino_cnpj TEXT NOT NULL,
  industria_destino_nome TEXT,
  tipo_material TEXT NOT NULL,
  peso_despachado_kg NUMERIC NOT NULL,
  numero_nota_fiscal TEXT NOT NULL,
  chave_nfe TEXT,
  token_rastreabilidade UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Em Trânsito','Entregue','Cancelado')),
  data_despacho TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_despacho_industria_ts
  BEFORE UPDATE ON sch_cooperativa.despacho_industria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 5. Função de validação de balanço de massa
-- ============================================================
CREATE OR REPLACE FUNCTION sch_cooperativa.fn_validar_balanco_massa(
  p_cooperativa_id UUID,
  p_tipo_material TEXT,
  p_peso_kg NUMERIC
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = sch_cooperativa
AS $$
DECLARE
  v_saldo NUMERIC;
BEGIN
  SELECT COALESCE(saldo_kg, 0) INTO v_saldo
  FROM sch_cooperativa.estoque_cooperativa
  WHERE cooperativa_id = p_cooperativa_id
    AND tipo_material = p_tipo_material;

  RETURN COALESCE(v_saldo, 0) >= p_peso_kg;
END;
$$;

-- ============================================================
-- 6. Trigger: ao inserir lote_entrada → incrementar estoque
-- ============================================================
CREATE OR REPLACE FUNCTION sch_cooperativa.fn_atualizar_estoque_entrada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sch_cooperativa
AS $$
BEGIN
  INSERT INTO sch_cooperativa.estoque_cooperativa (cooperativa_id, tipo_material, saldo_kg)
  VALUES (NEW.cooperativa_id, NEW.tipo_material, NEW.peso_bruto_kg)
  ON CONFLICT (cooperativa_id, tipo_material)
  DO UPDATE SET saldo_kg = sch_cooperativa.estoque_cooperativa.saldo_kg + NEW.peso_bruto_kg,
               updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_estoque_entrada
  AFTER INSERT ON sch_cooperativa.lote_entrada
  FOR EACH ROW EXECUTE FUNCTION sch_cooperativa.fn_atualizar_estoque_entrada();

-- ============================================================
-- 7. Trigger: ao inserir despacho_industria → decrementar estoque
-- ============================================================
CREATE OR REPLACE FUNCTION sch_cooperativa.fn_atualizar_estoque_saida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sch_cooperativa
AS $$
BEGIN
  UPDATE sch_cooperativa.estoque_cooperativa
  SET saldo_kg = saldo_kg - NEW.peso_despachado_kg,
      updated_at = now()
  WHERE cooperativa_id = NEW.cooperativa_id
    AND tipo_material = NEW.tipo_material;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_estoque_saida
  AFTER INSERT ON sch_cooperativa.despacho_industria
  FOR EACH ROW EXECUTE FUNCTION sch_cooperativa.fn_atualizar_estoque_saida();

-- ============================================================
-- 8. Public views
-- ============================================================
CREATE OR REPLACE VIEW public.v_catador_associado
WITH (security_invoker = true) AS
SELECT * FROM sch_cooperativa.catador_associado;

CREATE OR REPLACE VIEW public.v_licenca_cooperativa
WITH (security_invoker = true) AS
SELECT * FROM sch_cooperativa.licenca_cooperativa;

CREATE OR REPLACE VIEW public.v_estoque_cooperativa
WITH (security_invoker = true) AS
SELECT * FROM sch_cooperativa.estoque_cooperativa;

CREATE OR REPLACE VIEW public.v_despacho_industria
WITH (security_invoker = true) AS
SELECT * FROM sch_cooperativa.despacho_industria;

-- ============================================================
-- 9. RLS on new tables
-- ============================================================
ALTER TABLE sch_cooperativa.catador_associado ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_cooperativa.licenca_cooperativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_cooperativa.estoque_cooperativa ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_cooperativa.despacho_industria ENABLE ROW LEVEL SECURITY;

-- Read: authenticated
CREATE POLICY "Auth read catador" ON sch_cooperativa.catador_associado FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert catador" ON sch_cooperativa.catador_associado FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update catador" ON sch_cooperativa.catador_associado FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read licenca" ON sch_cooperativa.licenca_cooperativa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert licenca" ON sch_cooperativa.licenca_cooperativa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update licenca" ON sch_cooperativa.licenca_cooperativa FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read estoque" ON sch_cooperativa.estoque_cooperativa FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth read despacho" ON sch_cooperativa.despacho_industria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert despacho" ON sch_cooperativa.despacho_industria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update despacho" ON sch_cooperativa.despacho_industria FOR UPDATE TO authenticated USING (true);
