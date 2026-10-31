ALTER TABLE public.fiscalizacao_acoes
  ADD COLUMN IF NOT EXISTS numero_processo text,
  ADD COLUMN IF NOT EXISTS enquadramento_legal text,
  ADD COLUMN IF NOT EXISTS tipo_documento text NOT NULL DEFAULT 'notificacao_previa',
  ADD COLUMN IF NOT EXISTS fase_tramitacao text NOT NULL DEFAULT 'instaurado',
  ADD COLUMN IF NOT EXISTS data_notificacao date,
  ADD COLUMN IF NOT EXISTS prazo_resposta_dias integer,
  ADD COLUMN IF NOT EXISTS hash_documento text,
  ADD COLUMN IF NOT EXISTS documento_emitido_em timestamptz;

ALTER TABLE public.fiscalizacao_acoes ADD CONSTRAINT fiscalizacao_tipo_doc_chk
  CHECK (tipo_documento IN ('notificacao_previa','auto_infracao','termo_ajustamento_conduta','oficio_diligencia'));
ALTER TABLE public.fiscalizacao_acoes ADD CONSTRAINT fiscalizacao_fase_chk
  CHECK (fase_tramitacao IN ('instaurado','notificado','defesa_apresentada','em_analise_juridica','saneado','executado'));

CREATE OR REPLACE FUNCTION public.fiscalizacao_auditar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.fase_tramitacao IS DISTINCT FROM OLD.fase_tramitacao
     OR NEW.status IS DISTINCT FROM OLD.status OR NEW.hash_documento IS DISTINCT FROM OLD.hash_documento
     OR NEW.numero_processo IS DISTINCT FROM OLD.numero_processo THEN
    INSERT INTO public.residuos_criticos_auditoria (entidade, entidade_id, acao, detalhes, user_id)
    VALUES ('fiscalizacao_acoes', NEW.id, CASE WHEN TG_OP='INSERT' THEN 'criado' ELSE 'tramitado' END,
      jsonb_build_object('municipio', NEW.municipio, 'uf', NEW.uf, 'processo', NEW.numero_processo,
        'fase_anterior', CASE WHEN TG_OP='UPDATE' THEN OLD.fase_tramitacao END, 'fase_nova', NEW.fase_tramitacao,
        'status', NEW.status, 'hash_documento', NEW.hash_documento), auth.uid());
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_fiscalizacao_auditar AFTER INSERT OR UPDATE ON public.fiscalizacao_acoes
  FOR EACH ROW EXECUTE FUNCTION public.fiscalizacao_auditar();

-- Balanço de massa estrito: despacho de cooperativa <= entrada auditada do mesmo material
CREATE OR REPLACE FUNCTION public.fn_validar_balanco_massa_estrito()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public','sch_cooperativa' AS $$
DECLARE v_entrada numeric; v_saida numeric;
BEGIN
  SELECT COALESCE(sum(peso_bruto_kg),0) INTO v_entrada FROM sch_cooperativa.lote_entrada
   WHERE cooperativa_id = NEW.cooperativa_id AND lower(tipo_material) = lower(NEW.tipo_material);
  SELECT COALESCE(sum(peso_despachado_kg),0) INTO v_saida FROM sch_cooperativa.despacho_industria
   WHERE cooperativa_id = NEW.cooperativa_id AND lower(tipo_material) = lower(NEW.tipo_material)
     AND id IS DISTINCT FROM NEW.id;
  IF v_saida + COALESCE(NEW.peso_despachado_kg,0) > v_entrada THEN
    INSERT INTO public.alertas (codigo, title, description, severity, status, source, module)
    VALUES ('BALANCO_MASSA', 'Despacho acima do estoque auditado',
      format('Cooperativa %s, material %s: entrada %s kg, saída pretendida %s kg', NEW.cooperativa_id, NEW.tipo_material, v_entrada, v_saida + COALESCE(NEW.peso_despachado_kg,0)),
      'critical', 'active', 'fn_validar_balanco_massa_estrito', 'balanco_massa');
    RAISE EXCEPTION 'BALANCO_MASSA_EXCEDIDO: despacho de % kg excede o estoque disponível de % kg para %',
      NEW.peso_despachado_kg, v_entrada - v_saida, NEW.tipo_material;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_balanco_massa_estrito BEFORE INSERT OR UPDATE OF peso_despachado_kg, tipo_material, cooperativa_id
  ON sch_cooperativa.despacho_industria FOR EACH ROW EXECUTE FUNCTION public.fn_validar_balanco_massa_estrito();

-- Varredura diária de licenças: bloqueia MTRs abertos de operadores com licença vencida
CREATE OR REPLACE FUNCTION public.fn_varrer_licencas_compliance()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_bloq int := 0; v_ops int := 0; v_alertas int := 0; r record;
BEGIN
  UPDATE public.operadores_logisticos o SET bloqueado = true, motivo_bloqueio = 'Nenhuma licença ambiental vigente'
   WHERE NOT o.bloqueado AND NOT EXISTS (SELECT 1 FROM public.licencas_ambientais l WHERE l.operador_id = o.id AND l.validade >= CURRENT_DATE);
  GET DIAGNOSTICS v_ops = ROW_COUNT;

  WITH alvo AS (
    SELECT m.id FROM public.mtr_solicitacoes m
    WHERE m.fluxo_status IN ('rascunho','enviado','em_analise')
      AND ((m.operador_id IS NOT NULL AND NOT public.fn_operador_licenca_vigente_em(m.operador_id, COALESCE(m.data_coleta, m.data_prevista, now())::date))
        OR (m.destinador_id IS NOT NULL AND NOT public.fn_operador_licenca_vigente_em(m.destinador_id, COALESCE(m.data_coleta, m.data_prevista, now())::date)))
  )
  UPDATE public.mtr_solicitacoes m SET fluxo_status = 'bloqueado',
    motivo_bloqueio = 'Bloqueio automático: sem licença ambiental vigente na data do transporte'
  FROM alvo WHERE m.id = alvo.id;
  GET DIAGNOSTICS v_bloq = ROW_COUNT;

  FOR r IN SELECT l.id, l.numero, l.validade, o.razao_social FROM public.licencas_ambientais l
    JOIN public.operadores_logisticos o ON o.id = l.operador_id
    WHERE l.validade - CURRENT_DATE IN (30, 15, 0) LOOP
    INSERT INTO public.alertas (codigo, title, description, severity, status, source, module)
    VALUES ('LICENCA_VENCENDO', format('Licença %s vence em %s', r.numero, to_char(r.validade,'DD/MM/YYYY')),
      format('Operador %s', r.razao_social),
      CASE WHEN r.validade = CURRENT_DATE THEN 'critical'::alert_severity WHEN r.validade - CURRENT_DATE = 15 THEN 'high'::alert_severity ELSE 'medium'::alert_severity END,
      'active', 'fn_varrer_licencas_compliance', 'licencas');
    v_alertas := v_alertas + 1;
  END LOOP;

  INSERT INTO public.app_logs_sistema (nivel, modulo, mensagem, detalhes)
  VALUES ('info', 'compliance', 'Varredura de licenças executada',
    jsonb_build_object('operadores_bloqueados', v_ops, 'mtr_bloqueados', v_bloq, 'alertas', v_alertas));
  RETURN jsonb_build_object('operadores_bloqueados', v_ops, 'mtr_bloqueados', v_bloq, 'alertas', v_alertas, 'executado_em', now());
END $$;
REVOKE ALL ON FUNCTION public.fn_varrer_licencas_compliance() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_varrer_licencas_compliance() TO service_role;