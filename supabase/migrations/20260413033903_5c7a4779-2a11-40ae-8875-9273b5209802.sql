
-- Views in public schema pointing to custom schema tables

-- sch_governo
CREATE OR REPLACE VIEW public.v_metrica_planares WITH (security_invoker=on) AS SELECT * FROM sch_governo.metrica_planares;
CREATE OR REPLACE VIEW public.v_telemetria_consolidada WITH (security_invoker=on) AS SELECT * FROM sch_governo.telemetria_consolidada;
CREATE OR REPLACE VIEW public.v_auditoria_infracoes WITH (security_invoker=on) AS SELECT * FROM sch_governo.auditoria_infracoes;

-- sch_cooperativa
CREATE OR REPLACE VIEW public.v_cooperativa WITH (security_invoker=on) AS SELECT * FROM sch_cooperativa.cooperativa;
CREATE OR REPLACE VIEW public.v_lote_entrada WITH (security_invoker=on) AS SELECT * FROM sch_cooperativa.lote_entrada;
CREATE OR REPLACE VIEW public.v_lote_saida_faturado WITH (security_invoker=on) AS SELECT * FROM sch_cooperativa.lote_saida_faturado;

-- sch_industria
CREATE OR REPLACE VIEW public.v_industria WITH (security_invoker=on) AS SELECT * FROM sch_industria.industria;
CREATE OR REPLACE VIEW public.v_materia_prima_reciclada WITH (security_invoker=on) AS SELECT * FROM sch_industria.materia_prima_reciclada;
CREATE OR REPLACE VIEW public.v_certificado_logistica_reversa WITH (security_invoker=on) AS SELECT * FROM sch_industria.certificado_logistica_reversa;

-- sch_ponto_coleta
CREATE OR REPLACE VIEW public.v_entidade_credenciada WITH (security_invoker=on) AS SELECT * FROM sch_ponto_coleta.entidade_credenciada;
CREATE OR REPLACE VIEW public.v_estacao_coleta WITH (security_invoker=on) AS SELECT * FROM sch_ponto_coleta.estacao_coleta;
CREATE OR REPLACE VIEW public.v_metas_orgao_publico WITH (security_invoker=on) AS SELECT * FROM sch_ponto_coleta.metas_orgao_publico;

-- sch_cidadao
CREATE OR REPLACE VIEW public.v_usuario_app WITH (security_invoker=on) AS SELECT * FROM sch_cidadao.usuario_app;
CREATE OR REPLACE VIEW public.v_coleta_registro WITH (security_invoker=on) AS SELECT * FROM sch_cidadao.coleta_registro;
CREATE OR REPLACE VIEW public.v_carteira_creditos WITH (security_invoker=on) AS SELECT * FROM sch_cidadao.carteira_creditos;
