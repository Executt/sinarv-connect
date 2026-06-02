
-- public.alertas
DROP POLICY IF EXISTS "Public read alertas" ON public.alertas;
DROP POLICY IF EXISTS "Auth insert alertas" ON public.alertas;
DROP POLICY IF EXISTS "Auth update alertas" ON public.alertas;
CREATE POLICY "Gov read alertas" ON public.alertas FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert alertas" ON public.alertas FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update alertas" ON public.alertas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- public.auditorias
DROP POLICY IF EXISTS "Auth insert auditorias" ON public.auditorias;
DROP POLICY IF EXISTS "Auth update auditorias" ON public.auditorias;
CREATE POLICY "Gov insert auditorias" ON public.auditorias FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update auditorias" ON public.auditorias FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- benchmark_*
DROP POLICY IF EXISTS "Auth insert benchmark_estados" ON public.benchmark_estados;
DROP POLICY IF EXISTS "Auth update benchmark_estados" ON public.benchmark_estados;
DROP POLICY IF EXISTS "Auth insert benchmark_municipios" ON public.benchmark_municipios;
DROP POLICY IF EXISTS "Auth update benchmark_municipios" ON public.benchmark_municipios;
DROP POLICY IF EXISTS "Auth insert benchmark_selos" ON public.benchmark_selos;
DROP POLICY IF EXISTS "Auth update benchmark_selos" ON public.benchmark_selos;
CREATE POLICY "Gov insert benchmark_estados" ON public.benchmark_estados FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update benchmark_estados" ON public.benchmark_estados FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert benchmark_municipios" ON public.benchmark_municipios FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update benchmark_municipios" ON public.benchmark_municipios FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert benchmark_selos" ON public.benchmark_selos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update benchmark_selos" ON public.benchmark_selos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- configuracoes_integracoes
DROP POLICY IF EXISTS "Auth read configuracoes" ON public.configuracoes_integracoes;
DROP POLICY IF EXISTS "Auth insert configuracoes" ON public.configuracoes_integracoes;
DROP POLICY IF EXISTS "Auth update configuracoes" ON public.configuracoes_integracoes;
CREATE POLICY "Admin read configuracoes" ON public.configuracoes_integracoes FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Admin insert configuracoes" ON public.configuracoes_integracoes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Admin update configuracoes" ON public.configuracoes_integracoes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- cooperativas / industrias
DROP POLICY IF EXISTS "Auth insert cooperativas" ON public.cooperativas;
DROP POLICY IF EXISTS "Auth update cooperativas" ON public.cooperativas;
DROP POLICY IF EXISTS "Auth insert industrias" ON public.industrias;
DROP POLICY IF EXISTS "Auth update industrias" ON public.industrias;
CREATE POLICY "Gov insert cooperativas" ON public.cooperativas FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update cooperativas" ON public.cooperativas FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert industrias" ON public.industrias FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update industrias" ON public.industrias FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- indicadores_sustentabilidade
DROP POLICY IF EXISTS "Auth insert indicadores" ON public.indicadores_sustentabilidade;
DROP POLICY IF EXISTS "Auth update indicadores" ON public.indicadores_sustentabilidade;
CREATE POLICY "Gov insert indicadores" ON public.indicadores_sustentabilidade FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update indicadores" ON public.indicadores_sustentabilidade FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- lotes / transacoes
DROP POLICY IF EXISTS "Auth insert lotes" ON public.lotes;
DROP POLICY IF EXISTS "Auth update lotes" ON public.lotes;
DROP POLICY IF EXISTS "Auth insert transacoes" ON public.transacoes;
DROP POLICY IF EXISTS "Auth update transacoes" ON public.transacoes;
CREATE POLICY "Op insert lotes" ON public.lotes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'industria'::app_role)
    OR has_role(auth.uid(),'ponto_coleta'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Op update lotes" ON public.lotes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'industria'::app_role)
    OR has_role(auth.uid(),'ponto_coleta'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Op insert transacoes" ON public.transacoes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'industria'::app_role)
    OR has_role(auth.uid(),'ponto_coleta'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Op update transacoes" ON public.transacoes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'industria'::app_role)
    OR has_role(auth.uid(),'ponto_coleta'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));

-- logs
DROP POLICY IF EXISTS "auth_insert_logs" ON public.app_logs_sistema;
CREATE POLICY "admin_insert_logs" ON public.app_logs_sistema FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

DROP POLICY IF EXISTS "auth_insert_webhook_logs" ON public.integracao_webhook_logs;
CREATE POLICY "admin_insert_webhook_logs" ON public.integracao_webhook_logs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

DROP POLICY IF EXISTS "auth_insert_envios" ON public.notif_envios;
CREATE POLICY "admin_insert_envios" ON public.notif_envios FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.role_audit_logs;
CREATE POLICY "Admin insert audit logs" ON public.role_audit_logs FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Gov can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gov can delete roles" ON public.user_roles;
CREATE POLICY "Gov can insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'gov'::app_role)
    AND role IN ('gov'::app_role,'cooperativa'::app_role,'industria'::app_role,'ponto_coleta'::app_role)
  );
CREATE POLICY "Gov can delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(),'gov'::app_role)
    AND role IN ('gov'::app_role,'cooperativa'::app_role,'industria'::app_role,'ponto_coleta'::app_role)
  );
CREATE POLICY "Super admin insert roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Super admin delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin'::app_role));

-- telemetria_historico
DROP POLICY IF EXISTS "Auth insert telemetria_historico" ON public.telemetria_historico;
CREATE POLICY "Admin insert telemetria_historico" ON public.telemetria_historico FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- sch_cidadao.usuario_app
DROP POLICY IF EXISTS "Auth read usuario_app" ON sch_cidadao.usuario_app;
DROP POLICY IF EXISTS "Auth insert usuario_app" ON sch_cidadao.usuario_app;
DROP POLICY IF EXISTS "Auth update usuario_app" ON sch_cidadao.usuario_app;
CREATE POLICY "Gov read usuario_app" ON sch_cidadao.usuario_app FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert usuario_app" ON sch_cidadao.usuario_app FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update usuario_app" ON sch_cidadao.usuario_app FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- sch_cidadao.carteira_creditos
DROP POLICY IF EXISTS "Auth read carteira" ON sch_cidadao.carteira_creditos;
DROP POLICY IF EXISTS "Auth insert carteira" ON sch_cidadao.carteira_creditos;
DROP POLICY IF EXISTS "Auth update carteira" ON sch_cidadao.carteira_creditos;
CREATE POLICY "Gov read carteira" ON sch_cidadao.carteira_creditos FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert carteira" ON sch_cidadao.carteira_creditos FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update carteira" ON sch_cidadao.carteira_creditos FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- sch_cidadao.coleta_registro
DROP POLICY IF EXISTS "Public read coleta_registro" ON sch_cidadao.coleta_registro;
DROP POLICY IF EXISTS "Auth insert coleta" ON sch_cidadao.coleta_registro;
CREATE POLICY "Gov read coleta_registro" ON sch_cidadao.coleta_registro FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert coleta" ON sch_cidadao.coleta_registro FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)
    OR has_role(auth.uid(),'ponto_coleta'::app_role));

-- sch_cooperativa.catador_associado
DROP POLICY IF EXISTS "Auth read catador" ON sch_cooperativa.catador_associado;
DROP POLICY IF EXISTS "Auth insert catador" ON sch_cooperativa.catador_associado;
DROP POLICY IF EXISTS "Auth update catador" ON sch_cooperativa.catador_associado;
CREATE POLICY "Coop or gov read catador" ON sch_cooperativa.catador_associado FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Coop or gov insert catador" ON sch_cooperativa.catador_associado FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Coop or gov update catador" ON sch_cooperativa.catador_associado FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));

-- sch_cooperativa.despacho_industria
DROP POLICY IF EXISTS "Auth insert despacho" ON sch_cooperativa.despacho_industria;
DROP POLICY IF EXISTS "Auth update despacho" ON sch_cooperativa.despacho_industria;
CREATE POLICY "Coop insert despacho" ON sch_cooperativa.despacho_industria FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Coop update despacho" ON sch_cooperativa.despacho_industria FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'cooperativa'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));

-- sch_governo
DROP POLICY IF EXISTS "Auth insert metrica" ON sch_governo.metrica_planares;
DROP POLICY IF EXISTS "Auth update metrica" ON sch_governo.metrica_planares;
DROP POLICY IF EXISTS "Auth insert telemetria" ON sch_governo.telemetria_consolidada;
DROP POLICY IF EXISTS "Auth update telemetria" ON sch_governo.telemetria_consolidada;
DROP POLICY IF EXISTS "Auth insert auditoria_inf" ON sch_governo.auditoria_infracoes;
DROP POLICY IF EXISTS "Auth update auditoria_inf" ON sch_governo.auditoria_infracoes;
CREATE POLICY "Gov insert metrica" ON sch_governo.metrica_planares FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update metrica" ON sch_governo.metrica_planares FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert telemetria" ON sch_governo.telemetria_consolidada FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update telemetria" ON sch_governo.telemetria_consolidada FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov insert auditoria_inf" ON sch_governo.auditoria_infracoes FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Gov update auditoria_inf" ON sch_governo.auditoria_infracoes FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- sch_industria.api_credential
DROP POLICY IF EXISTS "Auth read api_credential" ON sch_industria.api_credential;
DROP POLICY IF EXISTS "Auth insert api_credential" ON sch_industria.api_credential;
DROP POLICY IF EXISTS "Auth update api_credential" ON sch_industria.api_credential;
CREATE POLICY "Industria read api_credential" ON sch_industria.api_credential FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'industria'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Industria insert api_credential" ON sch_industria.api_credential FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'industria'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Industria update api_credential" ON sch_industria.api_credential FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'industria'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));

-- sch_industria.lote_recebido
DROP POLICY IF EXISTS "Auth insert lote_recebido" ON sch_industria.lote_recebido;
DROP POLICY IF EXISTS "Auth update lote_recebido" ON sch_industria.lote_recebido;
CREATE POLICY "Industria insert lote_recebido" ON sch_industria.lote_recebido FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'industria'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "Admin update lote_recebido" ON sch_industria.lote_recebido FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'gov'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

-- sch_ponto_coleta.registro_entrada
DROP POLICY IF EXISTS "Auth read registro_entrada" ON sch_ponto_coleta.registro_entrada;
DROP POLICY IF EXISTS "Auth insert registro_entrada" ON sch_ponto_coleta.registro_entrada;
DROP POLICY IF EXISTS "Auth update registro_entrada" ON sch_ponto_coleta.registro_entrada;
CREATE POLICY "PC or gov read registro_entrada" ON sch_ponto_coleta.registro_entrada FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'ponto_coleta'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "PC or gov insert registro_entrada" ON sch_ponto_coleta.registro_entrada FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'ponto_coleta'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
CREATE POLICY "PC or gov update registro_entrada" ON sch_ponto_coleta.registro_entrada FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'ponto_coleta'::app_role) OR has_role(auth.uid(),'gov'::app_role)
    OR has_role(auth.uid(),'super_admin'::app_role));
