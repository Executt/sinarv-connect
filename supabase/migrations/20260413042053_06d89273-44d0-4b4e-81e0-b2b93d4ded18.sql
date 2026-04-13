
-- ============================================================
-- 1. Meta PNRS por indústria
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_industria.meta_pnrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industria_id UUID NOT NULL,
  ano_referencia INT NOT NULL,
  tipo_material TEXT NOT NULL,
  meta_peso_kg NUMERIC NOT NULL DEFAULT 0,
  atingido_peso_kg NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (industria_id, ano_referencia, tipo_material)
);

CREATE TRIGGER update_meta_pnrs_ts
  BEFORE UPDATE ON sch_industria.meta_pnrs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. Credenciais de API B2B
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_industria.api_credential (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industria_id UUID NOT NULL,
  nome TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  api_key_prefix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativa' CHECK (status IN ('Ativa','Revogada','Expirada')),
  scopes TEXT[] NOT NULL DEFAULT '{"lotes:write","lotes:read"}',
  data_expiracao TIMESTAMPTZ,
  ultimo_uso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_api_credential_ts
  BEFORE UPDATE ON sch_industria.api_credential
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. Lotes recebidos (staging area)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_industria.lote_recebido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industria_id UUID NOT NULL,
  cooperativa_cnpj TEXT NOT NULL,
  cooperativa_nome TEXT,
  tipo_material TEXT NOT NULL,
  peso_kg NUMERIC NOT NULL,
  numero_nota_fiscal TEXT NOT NULL,
  chave_nfe TEXT,
  token_rastreabilidade UUID,
  token_validado BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','Aprovado','Rejeitado','Consolidado')),
  origem_importacao TEXT NOT NULL DEFAULT 'Manual' CHECK (origem_importacao IN ('API','Upload','Manual')),
  data_recebimento TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_lote_recebido_ts
  BEFORE UPDATE ON sch_industria.lote_recebido
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 4. API Log (auditoria de chamadas B2B)
-- ============================================================
CREATE TABLE IF NOT EXISTS sch_industria.api_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industria_id UUID NOT NULL,
  credential_id UUID,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  status_code INT,
  request_summary TEXT,
  response_summary TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Função: validar token de rastreabilidade
-- ============================================================
CREATE OR REPLACE FUNCTION sch_industria.fn_validar_token_rastreabilidade(
  p_token UUID
) RETURNS TABLE (
  valido BOOLEAN,
  cooperativa_id UUID,
  tipo_material TEXT,
  peso_despachado_kg NUMERIC,
  numero_nota_fiscal TEXT,
  data_despacho TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = sch_industria, sch_cooperativa
AS $$
BEGIN
  RETURN QUERY
  SELECT
    true AS valido,
    d.cooperativa_id,
    d.tipo_material,
    d.peso_despachado_kg,
    d.numero_nota_fiscal,
    d.data_despacho
  FROM sch_cooperativa.despacho_industria d
  WHERE d.token_rastreabilidade = p_token
    AND d.status IN ('Em Trânsito','Entregue');

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, NULL::TEXT, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- ============================================================
-- 6. Trigger: ao aprovar lote → incrementar meta atingida
-- ============================================================
CREATE OR REPLACE FUNCTION sch_industria.fn_atualizar_meta_ao_aprovar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = sch_industria
AS $$
BEGIN
  IF NEW.status = 'Aprovado' AND (OLD.status IS NULL OR OLD.status != 'Aprovado') THEN
    INSERT INTO sch_industria.meta_pnrs (industria_id, ano_referencia, tipo_material, atingido_peso_kg)
    VALUES (NEW.industria_id, EXTRACT(YEAR FROM now())::INT, NEW.tipo_material, NEW.peso_kg)
    ON CONFLICT (industria_id, ano_referencia, tipo_material)
    DO UPDATE SET atingido_peso_kg = sch_industria.meta_pnrs.atingido_peso_kg + NEW.peso_kg,
                 updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_meta_ao_aprovar
  AFTER UPDATE ON sch_industria.lote_recebido
  FOR EACH ROW EXECUTE FUNCTION sch_industria.fn_atualizar_meta_ao_aprovar();

-- ============================================================
-- 7. Public views
-- ============================================================
CREATE OR REPLACE VIEW public.v_meta_pnrs
WITH (security_invoker = true) AS
SELECT * FROM sch_industria.meta_pnrs;

CREATE OR REPLACE VIEW public.v_api_credential
WITH (security_invoker = true) AS
SELECT id, industria_id, nome, api_key_prefix, status, scopes, data_expiracao, ultimo_uso, created_at, updated_at
FROM sch_industria.api_credential;

CREATE OR REPLACE VIEW public.v_lote_recebido
WITH (security_invoker = true) AS
SELECT * FROM sch_industria.lote_recebido;

CREATE OR REPLACE VIEW public.v_api_log
WITH (security_invoker = true) AS
SELECT * FROM sch_industria.api_log;

-- ============================================================
-- 8. RLS
-- ============================================================
ALTER TABLE sch_industria.meta_pnrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_industria.api_credential ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_industria.lote_recebido ENABLE ROW LEVEL SECURITY;
ALTER TABLE sch_industria.api_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read meta_pnrs" ON sch_industria.meta_pnrs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert meta_pnrs" ON sch_industria.meta_pnrs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update meta_pnrs" ON sch_industria.meta_pnrs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read api_credential" ON sch_industria.api_credential FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert api_credential" ON sch_industria.api_credential FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update api_credential" ON sch_industria.api_credential FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read lote_recebido" ON sch_industria.lote_recebido FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert lote_recebido" ON sch_industria.lote_recebido FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update lote_recebido" ON sch_industria.lote_recebido FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth read api_log" ON sch_industria.api_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert api_log" ON sch_industria.api_log FOR INSERT TO authenticated WITH CHECK (true);
