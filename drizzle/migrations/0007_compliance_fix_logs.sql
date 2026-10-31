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
    RAISE EXCEPTION 'BALANCO_MASSA_EXCEDIDO: despacho de % kg excede o estoque disponível de % kg para %',
      NEW.peso_despachado_kg, v_entrada - v_saida, NEW.tipo_material;
  END IF;
  RETURN NEW;
END $$;

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
    VALUES ('LIC-' || r.id::text || '-' || (r.validade - CURRENT_DATE), format('Licença %s vence em %s', r.numero, to_char(r.validade,'DD/MM/YYYY')),
      format('Operador %s', r.razao_social),
      CASE WHEN r.validade = CURRENT_DATE THEN 'critical'::alert_severity WHEN r.validade - CURRENT_DATE = 15 THEN 'high'::alert_severity ELSE 'medium'::alert_severity END,
      'active', 'varredura_licencas', 'licencas');
    v_alertas := v_alertas + 1;
  END LOOP;

  INSERT INTO public.app_logs_sistema (nivel, modulo, acao, mensagem, contexto)
  VALUES ('info', 'compliance', 'varredura_licencas', 'Varredura de licenças executada',
    jsonb_build_object('operadores_bloqueados', v_ops, 'mtr_bloqueados', v_bloq, 'alertas', v_alertas));
  RETURN jsonb_build_object('operadores_bloqueados', v_ops, 'mtr_bloqueados', v_bloq, 'alertas', v_alertas, 'executado_em', now());
END $$;
REVOKE ALL ON FUNCTION public.fn_varrer_licencas_compliance() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_varrer_licencas_compliance() TO service_role;