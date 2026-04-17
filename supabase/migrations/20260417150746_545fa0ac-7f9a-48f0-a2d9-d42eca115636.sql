-- ============================================
-- FASE 3 — Sistema & Operacional
-- ============================================

-- Regras de negócio
CREATE TABLE public.app_regras_negocio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  escopo TEXT NOT NULL DEFAULT 'global',
  tipo TEXT NOT NULL DEFAULT 'string',
  valor JSONB NOT NULL DEFAULT '{}'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Listas suspensas
CREATE TABLE public.app_listas_suspensas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  codigo TEXT NOT NULL,
  rotulo TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(categoria, codigo)
);

-- Ações automáticas
CREATE TABLE public.app_acoes_automaticas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  evento TEXT NOT NULL,
  condicao JSONB NOT NULL DEFAULT '{}'::jsonb,
  acao_tipo TEXT NOT NULL,
  acao_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ultimo_disparo TIMESTAMPTZ,
  total_execucoes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Logs do sistema
CREATE TABLE public.app_logs_sistema (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nivel TEXT NOT NULL DEFAULT 'info',
  modulo TEXT NOT NULL,
  acao TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  contexto JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_id UUID,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_logs_sistema_created_at ON public.app_logs_sistema(created_at DESC);
CREATE INDEX idx_logs_sistema_modulo ON public.app_logs_sistema(modulo);
CREATE INDEX idx_logs_sistema_nivel ON public.app_logs_sistema(nivel);

-- Modelos de dispositivos IoT
CREATE TABLE public.iot_dispositivos_modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  fabricante TEXT NOT NULL,
  modelo TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'sensor',
  protocolo TEXT NOT NULL DEFAULT 'mqtt',
  capacidades JSONB NOT NULL DEFAULT '[]'::jsonb,
  config_padrao JSONB NOT NULL DEFAULT '{}'::jsonb,
  firmware_versao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instâncias físicas IoT
CREATE TABLE public.iot_dispositivos_instancias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID NOT NULL REFERENCES public.iot_dispositivos_modelos(id) ON DELETE RESTRICT,
  serial_number TEXT NOT NULL UNIQUE,
  apelido TEXT,
  contenedor_localizacao_id UUID REFERENCES public.contenedor_localizacoes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'inativo',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ultimo_heartbeat TIMESTAMPTZ,
  bateria_percent INTEGER,
  sinal_dbm INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_iot_instancias_status ON public.iot_dispositivos_instancias(status);

-- ============================================
-- FASE 4 — Identidade & Acesso
-- ============================================

-- Perfis de entidades
CREATE TABLE public.entidades_perfis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL DEFAULT '',
  tipo_entidade TEXT NOT NULL,
  permissoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dados extras por usuário
CREATE TABLE public.usuarios_perfis_extra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  telefone TEXT,
  cargo TEXT,
  departamento TEXT,
  entidade_tipo TEXT,
  entidade_id UUID,
  origem_cadastro TEXT NOT NULL DEFAULT 'manual',
  ldap_dn TEXT,
  ultimo_login TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configuração LDAP
CREATE TABLE public.ldap_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  host TEXT NOT NULL,
  porta INTEGER NOT NULL DEFAULT 389,
  use_ssl BOOLEAN NOT NULL DEFAULT false,
  use_tls BOOLEAN NOT NULL DEFAULT true,
  bind_dn TEXT NOT NULL,
  bind_password_secret_ref TEXT,
  base_dn TEXT NOT NULL,
  user_filter TEXT NOT NULL DEFAULT '(objectClass=person)',
  group_filter TEXT NOT NULL DEFAULT '(objectClass=group)',
  atributo_email TEXT NOT NULL DEFAULT 'mail',
  atributo_nome TEXT NOT NULL DEFAULT 'cn',
  atributo_login TEXT NOT NULL DEFAULT 'uid',
  atributo_grupo TEXT NOT NULL DEFAULT 'memberOf',
  mapeamento_grupos JSONB NOT NULL DEFAULT '{}'::jsonb,
  cadastro_automatico BOOLEAN NOT NULL DEFAULT false,
  intervalo_sync_min INTEGER NOT NULL DEFAULT 60,
  ultima_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log de sincronização LDAP
CREATE TABLE public.ldap_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ldap_config_id UUID NOT NULL REFERENCES public.ldap_config(id) ON DELETE CASCADE,
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  usuarios_criados INTEGER NOT NULL DEFAULT 0,
  usuarios_atualizados INTEGER NOT NULL DEFAULT 0,
  erros INTEGER NOT NULL DEFAULT 0,
  detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
  mensagem TEXT
);

-- ============================================
-- Triggers de updated_at
-- ============================================
CREATE TRIGGER trg_app_regras_negocio_updated BEFORE UPDATE ON public.app_regras_negocio FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_app_listas_suspensas_updated BEFORE UPDATE ON public.app_listas_suspensas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_app_acoes_automaticas_updated BEFORE UPDATE ON public.app_acoes_automaticas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_iot_modelos_updated BEFORE UPDATE ON public.iot_dispositivos_modelos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_iot_instancias_updated BEFORE UPDATE ON public.iot_dispositivos_instancias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_entidades_perfis_updated BEFORE UPDATE ON public.entidades_perfis FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_usuarios_perfis_extra_updated BEFORE UPDATE ON public.usuarios_perfis_extra FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ldap_config_updated BEFORE UPDATE ON public.ldap_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS — restrito a super_admin/gov
-- ============================================
ALTER TABLE public.app_regras_negocio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_listas_suspensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_acoes_automaticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_logs_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_dispositivos_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_dispositivos_instancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entidades_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_perfis_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ldap_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ldap_sync_log ENABLE ROW LEVEL SECURITY;

-- Helper: macro de policies admin (SELECT/INSERT/UPDATE/DELETE) para tabelas administrativas
-- Aplicado tabela por tabela:

-- app_regras_negocio
CREATE POLICY "admin_select_regras" ON public.app_regras_negocio FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_regras" ON public.app_regras_negocio FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_update_regras" ON public.app_regras_negocio FOR UPDATE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_delete_regras" ON public.app_regras_negocio FOR DELETE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));

-- app_listas_suspensas
CREATE POLICY "admin_select_listas" ON public.app_listas_suspensas FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_listas" ON public.app_listas_suspensas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_update_listas" ON public.app_listas_suspensas FOR UPDATE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_delete_listas" ON public.app_listas_suspensas FOR DELETE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));

-- app_acoes_automaticas
CREATE POLICY "admin_select_acoes" ON public.app_acoes_automaticas FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_acoes" ON public.app_acoes_automaticas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_update_acoes" ON public.app_acoes_automaticas FOR UPDATE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_delete_acoes" ON public.app_acoes_automaticas FOR DELETE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));

-- app_logs_sistema (insert por authenticated, leitura/update/delete só admin)
CREATE POLICY "admin_select_logs" ON public.app_logs_sistema FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "auth_insert_logs" ON public.app_logs_sistema FOR INSERT TO authenticated WITH CHECK (true);

-- iot_dispositivos_modelos
CREATE POLICY "admin_select_iot_modelos" ON public.iot_dispositivos_modelos FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_iot_modelos" ON public.iot_dispositivos_modelos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_update_iot_modelos" ON public.iot_dispositivos_modelos FOR UPDATE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_delete_iot_modelos" ON public.iot_dispositivos_modelos FOR DELETE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));

-- iot_dispositivos_instancias
CREATE POLICY "admin_select_iot_instancias" ON public.iot_dispositivos_instancias FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_iot_instancias" ON public.iot_dispositivos_instancias FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_update_iot_instancias" ON public.iot_dispositivos_instancias FOR UPDATE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_delete_iot_instancias" ON public.iot_dispositivos_instancias FOR DELETE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));

-- entidades_perfis
CREATE POLICY "admin_select_ent_perfis" ON public.entidades_perfis FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_ent_perfis" ON public.entidades_perfis FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_update_ent_perfis" ON public.entidades_perfis FOR UPDATE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_delete_ent_perfis" ON public.entidades_perfis FOR DELETE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));

-- usuarios_perfis_extra (próprio usuário lê os seus + admin gerencia)
CREATE POLICY "user_select_own_extra" ON public.usuarios_perfis_extra FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_user_extra" ON public.usuarios_perfis_extra FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_update_user_extra" ON public.usuarios_perfis_extra FOR UPDATE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_delete_user_extra" ON public.usuarios_perfis_extra FOR DELETE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));

-- ldap_config
CREATE POLICY "admin_select_ldap" ON public.ldap_config FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_ldap" ON public.ldap_config FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_update_ldap" ON public.ldap_config FOR UPDATE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_delete_ldap" ON public.ldap_config FOR DELETE TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));

-- ldap_sync_log
CREATE POLICY "admin_select_ldap_log" ON public.ldap_sync_log FOR SELECT TO authenticated USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));
CREATE POLICY "admin_insert_ldap_log" ON public.ldap_sync_log FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'gov'));