-- 1) Peso numérico em lotes e transacoes (aditivo + backfill)
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS peso_kg NUMERIC;
ALTER TABLE public.transacoes ADD COLUMN IF NOT EXISTS peso_kg NUMERIC;

UPDATE public.lotes
SET peso_kg = NULLIF(regexp_replace(replace(replace(peso, '.', ''), ',', '.'), '[^0-9.]', '', 'g'), '')::numeric
WHERE peso_kg IS NULL AND peso IS NOT NULL;

UPDATE public.transacoes
SET peso_kg = NULLIF(regexp_replace(replace(replace(peso, '.', ''), ',', '.'), '[^0-9.]', '', 'g'), '')::numeric
WHERE peso_kg IS NULL AND peso IS NOT NULL;

-- 2) Licença vigente na data efetiva do transporte
CREATE OR REPLACE FUNCTION public.fn_operador_licenca_vigente_em(_operador_id uuid, _data date)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE WHEN _operador_id IS NULL THEN true ELSE EXISTS (
    SELECT 1 FROM public.licencas_ambientais l
    WHERE l.operador_id = _operador_id
      AND l.validade >= COALESCE(_data, CURRENT_DATE)
      AND (l.emissao IS NULL OR l.emissao <= COALESCE(_data, CURRENT_DATE))
  ) END;
$$;

-- 3) Máquina de estado única do MTR: status textual derivado de fluxo_status
CREATE OR REPLACE FUNCTION public.mtr_validar_licencas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_msg text := NULL;
  v_data date := COALESCE(NEW.data_coleta, NEW.data_prevista, now())::date;
BEGIN
  IF NEW.operador_id IS NOT NULL AND NOT public.fn_operador_licenca_vigente_em(NEW.operador_id, v_data) THEN
    v_msg := 'Transportador sem licença ambiental vigente na data do transporte';
  ELSIF NEW.destinador_id IS NOT NULL AND NOT public.fn_operador_licenca_vigente_em(NEW.destinador_id, v_data) THEN
    v_msg := 'Destinador sem licença ambiental vigente na data do transporte';
  END IF;

  IF v_msg IS NOT NULL THEN
    IF NEW.fluxo_status IN ('enviado','em_analise','aprovado') THEN
      RAISE EXCEPTION '%', v_msg;
    END IF;
    NEW.fluxo_status := 'bloqueado';
    NEW.motivo_bloqueio := v_msg;
  ELSIF NEW.fluxo_status = 'bloqueado' AND COALESCE(NEW.motivo_bloqueio, '') LIKE '%licença ambiental vigente%' THEN
    NEW.fluxo_status := 'rascunho';
    NEW.motivo_bloqueio := NULL;
  END IF;

  IF NEW.fluxo_status = 'aprovado' AND (TG_OP = 'INSERT' OR OLD.fluxo_status IS DISTINCT FROM 'aprovado') THEN
    NEW.aprovado_por := COALESCE(NEW.aprovado_por, auth.uid());
    NEW.aprovado_em := COALESCE(NEW.aprovado_em, now());
  END IF;

  -- estado textual legado sempre derivado do enum (fonte única de verdade)
  NEW.status := CASE NEW.fluxo_status
    WHEN 'rascunho' THEN 'Rascunho'
    WHEN 'enviado' THEN 'Enviado'
    WHEN 'em_analise' THEN 'Em Análise'
    WHEN 'aprovado' THEN 'Aprovado'
    WHEN 'bloqueado' THEN 'Bloqueado'
    ELSE NEW.status END;

  RETURN NEW;
END;
$$;

-- 4) Balanço de massa validado também em UPDATE e DELETE de despachos
CREATE OR REPLACE FUNCTION sch_cooperativa.fn_atualizar_estoque_saida()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'sch_cooperativa'
AS $$
DECLARE
  v_delta NUMERIC;
  v_saldo NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE sch_cooperativa.estoque_cooperativa
      SET saldo_kg = saldo_kg + OLD.peso_despachado_kg, updated_at = now()
      WHERE cooperativa_id = OLD.cooperativa_id AND tipo_material = OLD.tipo_material;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND (OLD.cooperativa_id, OLD.tipo_material) IS DISTINCT FROM (NEW.cooperativa_id, NEW.tipo_material) THEN
    UPDATE sch_cooperativa.estoque_cooperativa
      SET saldo_kg = saldo_kg + OLD.peso_despachado_kg, updated_at = now()
      WHERE cooperativa_id = OLD.cooperativa_id AND tipo_material = OLD.tipo_material;
    v_delta := NEW.peso_despachado_kg;
  ELSIF TG_OP = 'UPDATE' THEN
    v_delta := NEW.peso_despachado_kg - OLD.peso_despachado_kg;
  ELSE
    v_delta := NEW.peso_despachado_kg;
  END IF;

  SELECT COALESCE(saldo_kg, 0) INTO v_saldo
    FROM sch_cooperativa.estoque_cooperativa
    WHERE cooperativa_id = NEW.cooperativa_id AND tipo_material = NEW.tipo_material;

  IF v_delta > 0 AND COALESCE(v_saldo, 0) < v_delta THEN
    RAISE EXCEPTION 'Estoque insuficiente de % (saldo %, necessário %)', NEW.tipo_material, COALESCE(v_saldo,0), v_delta;
  END IF;

  INSERT INTO sch_cooperativa.estoque_cooperativa (cooperativa_id, tipo_material, saldo_kg)
  VALUES (NEW.cooperativa_id, NEW.tipo_material, -v_delta)
  ON CONFLICT (cooperativa_id, tipo_material)
  DO UPDATE SET saldo_kg = sch_cooperativa.estoque_cooperativa.saldo_kg - v_delta, updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_estoque_saida ON sch_cooperativa.despacho_industria;
CREATE TRIGGER trg_estoque_saida
AFTER INSERT OR UPDATE OR DELETE ON sch_cooperativa.despacho_industria
FOR EACH ROW EXECUTE FUNCTION sch_cooperativa.fn_atualizar_estoque_saida();

-- 5) Meta PNRS idempotente: recalcula a partir dos lotes aprovados
CREATE OR REPLACE FUNCTION sch_industria.fn_atualizar_meta_ao_aprovar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'sch_industria'
AS $$
DECLARE
  v_row RECORD := COALESCE(NEW, OLD);
  v_ano INT;
  v_total NUMERIC;
BEGIN
  v_ano := EXTRACT(YEAR FROM COALESCE(v_row.created_at, now()))::INT;

  SELECT COALESCE(SUM(peso_kg), 0) INTO v_total
    FROM sch_industria.lote_recebido lr
   WHERE lr.industria_id = v_row.industria_id
     AND lr.tipo_material = v_row.tipo_material
     AND lr.status = 'Aprovado'
     AND EXTRACT(YEAR FROM COALESCE(lr.created_at, now()))::INT = v_ano;

  INSERT INTO sch_industria.meta_pnrs (industria_id, ano_referencia, tipo_material, atingido_peso_kg)
  VALUES (v_row.industria_id, v_ano, v_row.tipo_material, v_total)
  ON CONFLICT (industria_id, ano_referencia, tipo_material)
  DO UPDATE SET atingido_peso_kg = v_total, updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_meta_ao_aprovar ON sch_industria.lote_recebido;
CREATE TRIGGER trg_meta_ao_aprovar
AFTER INSERT OR UPDATE OR DELETE ON sch_industria.lote_recebido
FOR EACH ROW EXECUTE FUNCTION sch_industria.fn_atualizar_meta_ao_aprovar();