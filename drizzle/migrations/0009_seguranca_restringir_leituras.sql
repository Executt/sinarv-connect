CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- Papéis: somente super_admin concede/revoga
DROP POLICY IF EXISTS "Gov can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gov can delete roles" ON public.user_roles;

-- Auditoria: só pode registrar em nome próprio
DROP POLICY IF EXISTS auditoria_rc_insert ON public.residuos_criticos_auditoria;
CREATE POLICY auditoria_rc_insert ON public.residuos_criticos_auditoria FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Dados de governo
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('ai_agente_skills','Authenticated read agente_skills'),
    ('ai_agentes','Authenticated read ai_agentes'),
    ('ai_base_conhecimento','Authenticated read ai_base'),
    ('ai_modelos','Authenticated read ai_modelos'),
    ('ai_skills','Authenticated read ai_skills'),
    ('auditorias','Public read auditorias'),
    ('financeiro_servico_municipal','financeiro_leitura_publica'),
    ('lixao_alertas_tratativas','Autenticados podem ver tratativas'),
    ('lixao_encerramento_etapas','lixao_etapas_read'),
    ('lixao_prazo_historico','Autenticados podem ver historico de prazos'),
    ('lixao_volume_historico','Histórico de lixões visível a autenticados'),
    ('lixoes','Lixoes visíveis a todos autenticados'),
    ('munic_diagnostico','munic_diag_read')
  ) AS t(tbl, pol) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol, r.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''gov''::app_role) OR public.has_role(auth.uid(), ''super_admin''::app_role))', 'gov_read_' || r.tbl, r.tbl);
  END LOOP;

  -- Dados operacionais: qualquer usuário com perfil atribuído
  FOR r IN SELECT * FROM (VALUES
    ('lotes','Public read lotes'),
    ('transacoes','Public read transacoes'),
    ('telemetria_historico','Public read telemetria_historico')
  ) AS t(tbl, pol) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.pol, r.tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_any_role(auth.uid()))', 'perfil_read_' || r.tbl, r.tbl);
  END LOOP;
END $$;